import { Anthropic } from "@anthropic-ai/sdk";
import { TextBlockParam, ToolUseBlockParam } from "@anthropic-ai/sdk/resources";
import {
  RedactedThinkingBlockParam,
  ThinkingBlockParam,
  Tool as AnthropicTool,
} from "@anthropic-ai/sdk/resources/messages";
import type {
  CallToolResult as ToolResult,
  Tool,
} from "@modelcontextprotocol/sdk/types";
import { callTool } from "@/main/mcp";
import { mcpToAnthropicTool } from "@/lib/mcp/adapters";
import {
  Message,
  newToolResultMessage,
  ToolResultBlock,
} from "@/types/message";
import { ProviderSettings } from "@/types/settings";
import { getUserSettings } from "@/main/db";
import {
  convertToAnthropic,
  convertAssistantMessageFromAnthropic,
} from "@/lib/converters/anthropic";
import { AnalyticsService } from "./analytics";
import { getOrCreateUserId } from "@/lib/account";
import { isAbortError } from "../errors";
import { LLMService } from "./llm";

export class AnthropicService implements LLMService {
  private client: Anthropic;
  private tools: AnthropicTool[];
  private analytics: AnalyticsService;
  private maxTokens: number;
  private budgetTokens: number;
  private supportedModels: string[] = [
    "claude-3-opus-20240229", 
    "claude-3-sonnet-20240229", 
    "claude-3-haiku-20240307",
    "claude-2.1", 
    "claude-2.0"
  ];

  constructor(
    tools: Tool[],
    analytics: AnalyticsService,
    maxTokens = 4096,
    budgetTokens = 1024,
  ) {
    this.tools = tools.map(mcpToAnthropicTool);
    this.analytics = analytics;
    this.maxTokens = maxTokens;
    this.budgetTokens = budgetTokens;
  }
  
  getSupportedModels(): string[] {
    return this.supportedModels;
  }
  
  getProviderName(): string {
    return "anthropic";
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
    this.analytics.capture(
      getOrCreateUserId(),
      "anthropic.send_message.start",
      {
        message_count: messages.length,
        model: options.model,
      },
    );

    try {
      const loopMessages = messages.map((m) => convertToAnthropic(m));
      while (true) {
        const response = await this.client.messages.create(
          {
            model: options.model,
            max_tokens: this.maxTokens,
            system: options.systemPrompt,
            messages: loopMessages,
            tools: this.tools,
            thinking: options.thinking
              ? { type: "enabled", budget_tokens: this.budgetTokens }
              : undefined,
          },
          { signal: abortSignal },
        );

        const responseMessage = {
          role: response.role, // always 'assistant'
          content: response.content.map((block) => {
            if (block.type === "text") {
              return block as TextBlockParam;
            }

            if (block.type === "tool_use") {
              return block as ToolUseBlockParam;
            }

            if (block.type === "thinking") {
              return block as ThinkingBlockParam;
            }

            if (block.type === "redacted_thinking") {
              return block as RedactedThinkingBlockParam;
            }
          }),
        };

        yield convertAssistantMessageFromAnthropic(responseMessage);

        loopMessages.push(responseMessage);

        const toolUseBlocks = responseMessage.content.filter(
          (block) => block.type === "tool_use",
        ) as ToolUseBlockParam[];

        if (toolUseBlocks.length === 0) {
          // no tool_use blocks, exit loop
          break;
        }

        const toolResultBlocks: ToolResultBlock[] = [];

        for (const block of toolUseBlocks) {
          // TODO: make this async
          const result = await callTool(block.name, block.input);
          // const toolResultMessage: MessageParam = {
          //   role: 'user',
          //   content: [this.makeToolResultBlock(result, block.id)],
          // };
          //
          toolResultBlocks.push(this.makeToolResultBlock(result, block.id));

          // yield convertFromAnthropic(toolResultMessage);
          //
          // loopMessages.push(toolResultMessage);
        }

        const toolResultMessage = newToolResultMessage(toolResultBlocks);
        yield toolResultMessage;
        loopMessages.push(convertToAnthropic(toolResultMessage));
      }

      this.analytics.capture(
        getOrCreateUserId(),
        "anthropic.send_message.success",
        {
          message_count: messages.length,
          model: options.model,
        },
      );
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Error sending message to Claude:", error);
        this.analytics.capture(
          getOrCreateUserId(),
          "anthropic.send_message.error",
          {
            message_count: messages.length,
            model: options.model,
          },
        );
      }
      throw error;
    }
  }

  async generateTitle(message: string, model: string) {
    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: `Generate a very brief and concise title(maximum 40 characters) for a conversation that starts with this message: "${message}".Respond with just the title, no quotes or extra text.`,
          },
        ],
      });

      if (response.content[0].type === "text") {
        return response.content[0].text.trim();
      }
      throw new Error("Unexpected response type from Claude");
    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat"; // Fallback title
    }
  }

  loadSettings(): { success: boolean; error?: string } {
    try {
      const settings = this.getProviderSettings();
      this.client = new Anthropic({
        apiKey: settings.apiKey,
        maxRetries: 16,
      });

      this.analytics.capture(
        getOrCreateUserId(),
        "anthropic_settings_reloaded",
      );

      return { success: true };
    } catch (error) {
      this.analytics.capture(getOrCreateUserId(), "anthropic_settings_error", {
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

    if (settings.model_provider !== "anthropic") {
      throw new Error(
        `Provider ${settings.model_provider} is not supported.Use Anthropic instead.`,
      );
    }

    const providerSettings =
      settings.provider_settings[settings.model_provider];
    if (!providerSettings?.apiKey) {
      throw new Error(`No API key found for ${settings.model_provider}`);
    }

    return providerSettings;
  }
}
