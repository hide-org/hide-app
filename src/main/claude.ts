import { CoreMessage, CoreTool, generateText, ToolResultPart, CoreToolResultUnion } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { isApiKeyConfigured } from '../lib/config';
import type { CallToolResult as ToolResult } from '@modelcontextprotocol/sdk/types';
import { callTool, listTools } from './mcp';
import { mcpToAiSdkTool } from '../lib/mcp/adapters';
import { anthropic } from '@ai-sdk/anthropic';

class ClaudeService {
    private chatModel = 'claude-3-5-sonnet-20241022';
    private titleModel = 'claude-3-5-haiku-20241022';
    private tools: Record<string, CoreTool>;

    constructor() {
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
                maxRetries: 16,
                maxSteps: 1024,
                maxTokens: 4096,
                onStepFinish: ({ text, toolCalls, toolResults, usage }) => {
                    if (text) {
                        onMessage({ role: 'assistant', content: text });
                    }

                    toolCalls.map((call, i) => {
                        onMessage({ role: 'assistant', content: [call] });
                        onMessage({
                            role: 'tool',
                            content: this.makeToolResultParts(toolResults[i])
                        });
                    });
                }
            })

            return [...messages, ...response.messages]
        } catch (error) {
            console.error('Error sending message to Claude:', error);
            throw error;
        }
    }

    async generateTitle(message: string): Promise<string> {
        try {
            const { text } = await generateText({
                model: anthropic(this.titleModel),
                messages: [{ role: 'user', content: `Generate a very brief and concise title (maximum 40 characters) for a conversation that starts with this message: "${message}". Respond with just the title, no quotes or extra text.` }],
                maxTokens: 50,
            })

            if (text) {
                return text.trim();
            }

            throw new Error('Unexpected response type from Claude');
        } catch (error) {
            console.error('Error generating title:', error);
            return 'New Chat'; // Fallback title
        }
    }

    private makeToolResultParts<TOOLS extends Record<string, CoreTool>>(
        toolResult: CoreToolResultUnion<TOOLS>
    ): ToolResultPart[] {
        // TODO: type safety? never heard
        const result = toolResult.result as ToolResult;
        return result.content
            .map(c => {
                if (c.type === 'text') {
                    return {
                        type: 'tool-result',
                        toolCallId: toolResult.toolCallId,
                        toolName: toolResult.toolName,
                        result: c.text,
                        isError: result.isError,
                    }
                }

                if (c.type === 'image') {
                    return {
                        type: 'tool-result',
                        toolCallId: toolResult.toolCallId,
                        toolName: toolResult.toolName,
                        result: `The result is an image. Images are not supported yet`,
                        isError: result.isError,
                    }
                }

                if (c.type === 'resource') {
                    return {
                        type: 'tool-result',
                        toolCallId: toolResult.toolCallId,
                        toolName: toolResult.toolName,
                        result: `The result is a resource. Resources are not supported yet`,
                        isError: result.isError,
                    }
                }
            });
    }
}

let claudeService: ClaudeService | null = null;

export const initializeClaudeService = async () => {
    if (!isApiKeyConfigured()) {
        console.log('API key not configured. Claude service will not be initialized.');
        return;
    }

    try {
        claudeService = new ClaudeService();
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

    const onMessage = (message: CoreMessage) => BrowserWindow.getFocusedWindow()?.webContents.send('claude:messageUpdate', message);
    return await claudeService.sendMessage(messages, systemPrompt, onMessage);
});

ipcMain.handle('claude:generateTitle', async (_event, message: string) => {
    if (!claudeService) {
        throw new Error('Claude service not initialized. Please configure your API key.');
    }
    return await claudeService.generateTitle(message);
});
