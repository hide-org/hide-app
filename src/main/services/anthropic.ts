import Anthropic from '@anthropic-ai/sdk';
import { ImageBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources';
import { MessageParam, Tool as AnthropicTool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { CallToolResult as ToolResult, Tool } from '@modelcontextprotocol/sdk/types';
import { callTool } from '@/main/mcp';
import { mcpToAnthropicTool } from '@/lib/mcp/adapters';
import { Message } from '@/types/message';
import { ProviderSettings } from '@/types/settings';
import { getUserSettings } from '@/main/db';
import { convertToAnthropic, convertFromAnthropic } from '@/lib/converters/anthropic';

export class AnthropicService {
  private client: Anthropic;
  private chatModel: string;
  private titleModel: string;
  private tools: AnthropicTool[];

  constructor(tools: Tool[]) {
    this.tools = tools.map(mcpToAnthropicTool);
  }

  // TODO: add abort signal
  async *sendMessage(messages: Message[], systemPrompt: string = ''): AsyncGenerator<Message> {
    try {
      const loopMessages = messages.map(m => convertToAnthropic(m));
      while (true) {
        const response = await this.client.messages.create({
          model: this.chatModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: loopMessages,
          tools: this.tools,
        });

        const responseMessage = {
          role: response.role, // always 'assistant'
          content: response.content.map(block => {
            if (block.type === 'text') {
              return block as TextBlockParam
            }

            if (block.type === 'tool_use') {
              return block as ToolUseBlockParam;
            }
          }),
        };

        yield convertFromAnthropic(responseMessage);

        loopMessages.push(responseMessage);

        const toolUseBlocks = responseMessage.content.filter(block => block.type === 'tool_use') as ToolUseBlockParam[];

        if (toolUseBlocks.length === 0) {
          // no tool_use blocks, exit loop
          break;
        }

        for (const block of toolUseBlocks) {
          console.debug(`Calling tool ${block.name} with input ${block.input}`);
          const result = await callTool(block.name, block.input);
          console.debug('Got tool result:', result);
          const toolResultMessage: MessageParam = {
            role: 'user',
            content: [this.makeToolResultBlock(result, block.id)],
          };

          yield convertFromAnthropic(toolResultMessage);

          loopMessages.push(toolResultMessage);
        }
      }
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      throw error;
    }
  }

  async generateTitle(message: string) {
    try {
      const response = await this.client.messages.create({
        model: this.titleModel,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Generate a very brief and concise title(maximum 40 characters) for a conversation that starts with this message: "${message}".Respond with just the title, no quotes or extra text.`,
          },
        ],
      });

      if (response.content[0].type === 'text') {
        return response.content[0].text.trim();
      }
      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Chat'; // Fallback title
    }
  }

  loadSettings(): { success: boolean; error?: string } {
    try {
      const settings = this.getProviderSettings();
      if (!settings.models.chat) {
        throw new Error('Chat model is not set. Please select a model in Settings.');
      }
      if (!settings.models.title) {
        throw new Error('Title model is not set. Please select a model in Settings.');
      }

      this.chatModel = settings.models.chat;
      this.titleModel = settings.models.title;
      this.client = new Anthropic({
        apiKey: settings.apiKey,
        maxRetries: 16,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private makeToolResultBlock(
    result: ToolResult,
    toolUseId: string
  ): ToolResultBlockParam {
    return {
      type: 'tool_result',
      tool_use_id: toolUseId,
      is_error: result.isError,
      content: result.content
        .map(c => {
          if (c.type === 'text') {
            return c as TextBlockParam;
          }

          if (c.type === 'image') {
            return {
              type: 'image',
              source: {
                type: 'base64',
                data: c.data,
                media_type: c.mimeType,
              },
            } as ImageBlockParam;
          }

          if (c.type === 'resource') {
            throw new Error('Embedded resources are not supported');
          }
        })
    }
  }

  private getProviderSettings(): ProviderSettings {
    const settings = getUserSettings();
    if (!settings) {
      throw new Error('No settings found');
    }

    if (settings.model_provider !== 'anthropic') {
      throw new Error(`Provider ${settings.model_provider} is not supported.Use Anthropic instead.`);
    }

    const providerSettings = settings.provider_settings[settings.model_provider];
    if (!providerSettings?.apiKey) {
      throw new Error(`No API key found for ${settings.model_provider}`);
    }

    return providerSettings;
  }
}
