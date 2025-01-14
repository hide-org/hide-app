import { CoreMessage, CoreTool, generateText } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { isApiKeyConfigured, getAnthropicApiKey } from '../lib/config';
import Anthropic from '@anthropic-ai/sdk';
import { ImageBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources';
import { MessageParam, Tool as AnthropicTool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { CallToolResult as ToolResult } from '@modelcontextprotocol/sdk/types';
import { callTool, listTools } from './mcp';
import { mcpToAnthropicTool, mcpToAiSdkTool } from '../lib/mcp/adapters';
import { anthropic } from '@ai-sdk/anthropic';

class ClaudeService {
    // private client: Anthropic;
    private chatModel = 'claude-3-5-sonnet-20241022';
    private titleModel = 'claude-3-5-haiku-20241022';
    private tools: Record<string, CoreTool>;

    constructor(apiKey: string) {
        // this.client = new Anthropic({
        //     apiKey,
        //     maxRetries: 16,
        // });

        this.tools = {};
    }

    async initializeTools() {
        try {
            const mcpTools = await listTools();
            console.log('Loaded tools from MCP:', mcpTools);
            this.tools = mcpTools
                .map(tool => mcpToAiSdkTool(tool, callTool))
                .reduce((acc, tool) => ({ ...acc, ...tool }), {});
        } catch (error) {
            console.error('Error initializing tools:', error);
            this.tools = {};
        }
    }

    async sendMessage(messages: CoreMessage[], systemPrompt: string = '', onMessage: (message: CoreMessage) => void): Promise<CoreMessage[]> {
        try {
            const { response } = await generateText({
                model: anthropic(this.chatModel),
                messages,
                system: systemPrompt,
                tools: this.tools,
                maxSteps: 1024,
                maxTokens: 4096,
                onStepFinish({ text, toolCalls, toolResults, usage }) {
                    if (text) {
                        onMessage({ role: 'assistant', content: text });
                    }

                    toolCalls.map((call, i) => {
                        onMessage({ role: 'assistant', content: [call] });
                        onMessage({ role: 'tool', content: toolResults[i] });
                    });
                }
            })

            return [...messages, ...response.messages]
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

export const initializeClaudeService = async () => {
    const apiKey = getAnthropicApiKey();
    if (!isApiKeyConfigured()) {
        console.log('API key not configured. Claude service will not be initialized.');
        return;
    }

    try {
        claudeService = new ClaudeService(apiKey);
        await claudeService.initializeTools();
        console.log('Claude service initialized successfully');
    } catch (error) {
        console.error('Error initializing Claude service:', error);
    }
};

// IPC handlers
ipcMain.handle('claude:checkApiKey', () => {
    return isApiKeyConfigured();
});

ipcMain.handle('claude:sendMessage', async (_event, { messages, systemPrompt }: { messages: any[], systemPrompt?: string }) => {
    if (!claudeService) {
        throw new Error('Claude service not initialized. Please configure your API key.');
    }

    const messageGenerator = claudeService.sendMessage(messages, systemPrompt);
    const allMessages = [];

    for await (const message of messageGenerator) {
        // Send each message back to the renderer immediately
        BrowserWindow.getFocusedWindow()?.webContents.send('claude:messageUpdate', message);
        allMessages.push(message);
    }

    return allMessages;
});

ipcMain.handle('claude:generateTitle', async (_event, message: string) => {
    if (!claudeService) {
        throw new Error('Claude service not initialized. Please configure your API key.');
    }
    return await claudeService.generateTitle(message);
});
