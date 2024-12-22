import Anthropic from '@anthropic-ai/sdk';
import { ImageBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources';
import { MessageParam, Tool as AnthropicTool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { CallToolResult as ToolResult } from '@modelcontextprotocol/sdk/types';
import { callTool, listTools } from './mcp/client';
import { mcpToAnthropicTool } from './mcp/adapters';

export class ClaudeService {
    private client: Anthropic;
    private chatModel = 'claude-3-5-sonnet-20241022';
    private titleModel = 'claude-3-5-haiku-20241022';
    private tools: AnthropicTool[];

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });

        this.tools = [];
    }

    async initializeTools() {
        try {
            const mcpTools = await listTools();
            console.log('Loaded tools from MCP:', mcpTools);
            this.tools = mcpTools.map(mcpToAnthropicTool);
        } catch (error) {
            console.error('Error initializing tools:', error);
            this.tools = [];
        }
    }

    async *sendMessage(messages: MessageParam[]): AsyncGenerator<MessageParam> {
        try {
            let loopMessages = messages;
            while (true) {
                const response = await this.client.messages.create({
                    model: this.chatModel,
                    max_tokens: 4096,
                    messages: loopMessages,
                    tools: this.tools,
                });

                const responseMessage = {
                    role: response.role, // Always 'assistant'
                    content: response.content.map(block => {
                        if (block.type === 'text') {
                            return block as TextBlockParam
                        }

                        if (block.type === 'tool_use') {
                            return block as ToolUseBlockParam;
                        }

                        throw new Error('Unexpected response type from Claude');
                    }),
                };

                yield responseMessage;

                loopMessages = [...loopMessages, responseMessage];

                const toolUseBlocks = responseMessage.content.filter(block => block.type === 'tool_use') as ToolUseBlockParam[];

                if (toolUseBlocks.length === 0) {
                    // no tool_use blocks, exit loop
                    break;
                }

                for (const block of toolUseBlocks) {
                    console.log('Calling tool:', block.name, 'with input:', block.input);
                    const result = await callTool(block.name, block.input);
                    console.log('Got tool result:', result);
                    const toolResultMessage: MessageParam = {
                        role: 'user',
                        content: [this.makeToolResultBlock(result, block.id)],
                    };

                    yield toolResultMessage;

                    loopMessages = [...loopMessages, toolResultMessage];
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
                        content: `Generate a very brief and concise title (maximum 40 characters) for a conversation that starts with this message: "${message}". Respond with just the title, no quotes or extra text.`,
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
}

let claudeService: ClaudeService | null = null;

export const initializeClaudeService = async (apiKey: string) => {
    claudeService = new ClaudeService(apiKey);
    await claudeService.initializeTools();
    return claudeService;
};

export const getClaudeService = () => {
    if (!claudeService) {
        throw new Error('Claude service not initialized. Call initializeClaudeService first.');
    }
    return claudeService;
};
