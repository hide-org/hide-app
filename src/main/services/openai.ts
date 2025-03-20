import { getOrCreateUserId } from "@/lib/account";
import {
  convertAssistantMessageFromOpenAI,
  convertToOpenAI,
} from "@/lib/converters/openai";
import { mcpToOpenAIFunction } from "@/lib/mcp/adapters";
import { getUserSettings } from "@/main/db";
import { isAbortError } from "@/main/errors";
import { callTool } from "@/main/mcp";
import { AnalyticsService } from "@/main/services/analytics";
import { LLMService } from "@/main/services/llm";
import {
  Message,
  newToolResultMessage,
  ToolResultBlock,
} from "@/types/message";
import { Model } from "@/types/model";
import {
  getProviderApiKey,
  Provider,
  ProviderSettings,
} from "@/types/settings";
import type {
  CallToolResult as ToolResult,
  Tool,
} from "@modelcontextprotocol/sdk/types";
import { OpenAI } from "openai";
import { ChatCompletionTool } from "openai/resources";

export class OpenAIService implements LLMService {
  private client: OpenAI;
  private tools: ChatCompletionTool[];
  private analytics: AnalyticsService;
  private maxTokens: number;
  private supportedModels: Omit<Model, "provider" | "available">[] = [
    { id: "gpt-4.5-preview", name: "GPT-4.5 Preview" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "o1", name: "o1" },
    { id: "o3-mini", name: "o3-mini" },
  ];

  constructor(tools: Tool[], analytics: AnalyticsService, maxTokens = 4096) {
    this.tools = tools.map(mcpToOpenAIFunction);
    this.analytics = analytics;
    this.maxTokens = maxTokens;
  }

  getSupportedModels(): Model[] {
    const settings = getUserSettings();
    const hasApiKey = getProviderApiKey(settings, this.getProviderName());

    return this.supportedModels.map(({ id, name, capabilities }) => {
      return {
        id,
        name,
        provider: this.getProviderName(),
        available: !!hasApiKey,
        capabilities,
      };
    });
  }

  getProviderName(): Provider {
    return "openai";
  }

  async *sendMessage(
    messages: Message[],
    options: {
      model: string;
      thinking?: boolean;
      systemPrompt?: string;
    },
    abortSignal?: AbortSignal,
  ): AsyncGenerator<Message> {
    this.analytics.capture(getOrCreateUserId(), "openai.send_message.start", {
      message_count: messages.length,
      model: options.model,
    });

    try {
      const loopMessages = messages.flatMap(convertToOpenAI);

      // Add system prompt if provided
      if (options.systemPrompt) {
        loopMessages.unshift({
          role: "system",
          content: options.systemPrompt,
        });
      }

      while (true) {
        const response = await this.client.chat.completions.create(
          {
            model: options.model,
            messages: loopMessages,
            max_tokens: this.maxTokens,
            tools: this.tools,
            stream: false,
          },
          { signal: abortSignal },
        );

        const message = response.choices[0].message;
        const responseMessage = convertAssistantMessageFromOpenAI(message);

        yield responseMessage;

        // If there's no tool call, we're done
        if (!message.tool_calls) break;

        // Add the response to our messages array for the next iteration
        loopMessages.push(message);

        // Handle tool calls
        for (const toolCall of message.tool_calls) {
          const name = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          const result = await callTool(name, args);
          const toolResultMessage = newToolResultMessage([
            this.makeToolResultBlock(result, toolCall.id),
          ]);
          yield toolResultMessage;
          messages.push(toolResultMessage);
        }
      }

      this.analytics.capture(
        getOrCreateUserId(),
        "openai.send_message.success",
        {
          message_count: messages.length,
          model: options.model,
        },
      );
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Error sending message to OpenAI:", error);
        this.analytics.capture(
          getOrCreateUserId(),
          "openai.send_message.error",
          {
            message_count: messages.length,
            model: options.model,
          },
        );
      }
      throw error;
    }
  }

  async generateTitle(message: string, model: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: `Generate a very brief and concise title (maximum 40 characters) for a conversation that starts with this message: "${message}". Respond with just the title, no quotes or extra text.`,
          },
        ],
        max_tokens: 50,
      });

      return response.choices[0].message.content?.trim() || "New Chat";
    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat"; // Fallback title
    }
  }

  loadSettings(): { success: boolean; error?: string } {
    try {
      const settings = this.getProviderSettings();
      this.client = new OpenAI({
        apiKey: settings.apiKey,
        maxRetries: 16,
      });

      this.analytics.capture(getOrCreateUserId(), "openai_settings_reloaded");

      return { success: true };
    } catch (error) {
      this.analytics.capture(getOrCreateUserId(), "openai_settings_error", {
        error_type: error.name,
        error_message: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  private makeToolResultBlock(
    result: ToolResult,
    toolUseId: string,
  ): ToolResultBlock {
    return {
      type: "tool_result",
      toolUseId: toolUseId,
      isError: result.isError,
      content: result.content.map((c) => {
        if (c.type === "text") {
          return {
            type: "text",
            text: c.text,
          };
        }

        if (c.type === "image") {
          return {
            type: "image",
            data: c.data,
            mimeType: c.mimeType,
          };
        }

        if (c.type === "resource") {
          throw new Error("Embedded resources are not supported");
        }
      }),
    };
  }

  private getProviderSettings(): ProviderSettings {
    const settings = getUserSettings();
    if (!settings) {
      throw new Error("No settings found");
    }

    const providerSettings = settings.provider_settings["openai"];
    if (!providerSettings?.apiKey) {
      throw new Error("No API key found for OpenAI");
    }

    return providerSettings;
  }
}
