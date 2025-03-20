import { getOrCreateUserId } from "@/lib/account";
import {
  convertAssistantMessageFromAnthropic,
  convertToAnthropic,
} from "@/lib/converters/anthropic";
import { mcpToAnthropicTool } from "@/lib/mcp/adapters";
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

export class AnthropicService implements LLMService {
  private client: Anthropic;
  private tools: AnthropicTool[];
  private analytics: AnalyticsService;
  private maxTokens: number;
  private budgetTokens: number;
  private supportedModels: Omit<Model, "provider" | "available">[] = [
    {
      id: "claude-3-7-sonnet-20250219",
      name: "Claude 3.7 Sonnet",
      capabilities: { thinking: true },
    },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet v2" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
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

    const providerSettings = settings.provider_settings["anthropic"];
    if (!providerSettings?.apiKey) {
      throw new Error("No API key found for Anthropic");
    }

    return providerSettings;
  }
}
