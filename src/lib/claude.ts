import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../types';

export class ClaudeService {
    private client: Anthropic;
    private model = 'claude-3-5-sonnet-20241022';

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async sendMessage(messages: Message[]) {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4096,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
            });

            if (response.content[0].type === 'text') {
                return response.content[0].text;
            }
            throw new Error('Unexpected response type from Claude');
        } catch (error) {
            console.error('Error sending message to Claude:', error);
            throw error;
        }
    }
}

let claudeService: ClaudeService | null = null;

export const initializeClaudeService = (apiKey: string) => {
    claudeService = new ClaudeService(apiKey);
    return claudeService;
};

export const getClaudeService = () => {
    if (!claudeService) {
        throw new Error('Claude service not initialized. Call initializeClaudeService first.');
    }
    return claudeService;
};
