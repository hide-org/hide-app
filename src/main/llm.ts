import { CoreMessage, CoreTool, generateText, streamText, ToolResultPart, CoreToolResultUnion } from 'ai';
import { ipcMain } from 'electron';
import type { CallToolResult as ToolResult } from '@modelcontextprotocol/sdk/types';
import { callTool, listTools } from './mcp';
import { mcpToAiSdkTool } from '../lib/mcp/adapters';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { OpenAIProvider, createOpenAI } from '@ai-sdk/openai';
import { getUserSettings } from './db';
import { UserSettings } from '../types/settings';
import { isAbortError } from '@/main/errors';

type SupportedProvider = AnthropicProvider | OpenAIProvider;

export class LLMService {
    private tools: Record<string, CoreTool>;
    private provider: SupportedProvider | null;
    private settings: UserSettings | null;

    constructor() {
        this.tools = {};
        this.provider = null;
        this.settings = null;
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

    async initialize() {
        try {
            // Load settings from DB
            this.settings = getUserSettings();
            if (!this.settings) {
                throw new Error('No settings found');
            }

            // Initialize provider based on settings
            const providerSettings = this.settings.provider_settings[this.settings.model_provider];
            if (!providerSettings?.apiKey) {
                throw new Error(`No API key found for ${this.settings.model_provider}`);
            }

            // Clear existing provider
            this.provider = null;

            switch (this.settings.model_provider) {
                case 'anthropic':
                    this.provider = createAnthropic({ apiKey: providerSettings.apiKey });
                    break;
                case 'openai':
                    this.provider = createOpenAI({ apiKey: providerSettings.apiKey });
                    break;
                default:
                    throw new Error(`Unsupported provider: ${this.settings.model_provider}`);
            }

            await this.initializeTools();
            console.log('LLM service initialized successfully with provider:', this.settings.model_provider);
        } catch (error) {
            console.error('Error initializing LLM service:', error);
            this.provider = null;
            this.settings = null;
            throw error;
        }
    }

    async sendMessage(messages: CoreMessage[], systemPrompt: string = '', onMessage: (message: CoreMessage) => void, abortSignal: AbortSignal): Promise<string> {
        if (!this.provider || !this.settings) {
            throw new Error('LLM service not initialized. Please check your API key and provider settings.');
        }

        try {
            let currentMessage = '';
            const providerSettings = this.settings.provider_settings[this.settings.model_provider];

            // Validate API key and model before sending
            if (!providerSettings?.apiKey) {
                throw new Error(`No API key found for ${this.settings.model_provider}. Please check your settings.`);
            }
            if (!providerSettings.models?.chat) {
                throw new Error(`No chat model selected for ${this.settings.model_provider}. Please check your settings.`);
            }

            const result = streamText({
                model: this.provider(providerSettings.models.chat),
                messages,
                system: systemPrompt,
                tools: this.tools,
                maxRetries: 16,
                maxSteps: 1024,
                maxTokens: 4096,
                abortSignal,
            })

            for await (const part of result.fullStream) {
                switch (part.type) {
                    case 'text-delta': {
                        // append chunk to current message
                        currentMessage += part.textDelta;
                        break;
                    }
                    case 'tool-call': {
                        // emit current message if it's not empty
                        if (currentMessage.trim()) {
                            onMessage({ role: 'assistant', content: currentMessage });
                            currentMessage = '';
                        }

                        // emit tool call
                        onMessage({ role: 'assistant', content: [part] });
                        break;
                    }
                    // @ts-ignore
                    case 'tool-result': {
                        // emit tool result
                        onMessage({
                            role: 'tool',
                            content: this.makeToolResultParts(part)
                        });
                        break;
                    }
                    case 'finish': {
                        // emit current message if it's not empty
                        if (currentMessage.trim()) {
                            onMessage({ role: 'assistant', content: currentMessage });
                            currentMessage = '';
                        }
                        break;
                    }
                    case 'error': {
                        // handle error here
                        console.error(`\n\nSystem: Error: ${part.error}\n`);
                        break;
                    }
                    default: {
                        console.debug('Unknown message part:', part.type);
                    }
                }
            }

            return result.text;
        } catch (error) {
            if (!isAbortError(error)) {
                console.error('Error sending message to LLM:', error);
            }
            throw error;
        }
    }

    async generateTitle(message: string): Promise<string> {
        if (!this.provider || !this.settings) {
            throw new Error('LLM service not initialized');
        }

        try {
            const providerSettings = this.settings.provider_settings[this.settings.model_provider];
            const { text } = await generateText({
                model: this.provider(providerSettings.models.title),
                messages: [{ role: 'user', content: `Generate a very brief and concise title (maximum 40 characters) for a conversation that starts with this message: "${message}". Respond with just the title, no quotes or extra text.` }],
                maxTokens: 50,
            })

            if (text) {
                return text.trim();
            }

            throw new Error('Unexpected response type from LLM');
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

let llmService: LLMService | null = null;

export const initializeLLMService = async () => {
    try {
        llmService = new LLMService();
        await llmService.initialize();
    } catch (error) {
        console.error('Error initializing LLM service:', error);
        throw error;
    }
};

// IPC handlers
ipcMain.handle('llm:checkApiKey', async () => {
    try {
        const settings = getUserSettings();
        if (!settings) return false;

        const provider = settings.model_provider;
        return !!settings.provider_settings[provider]?.apiKey;
    } catch (error) {
        console.error('Error checking API key:', error);
        return false;
    }
});

