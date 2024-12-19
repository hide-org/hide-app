import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { Message } from '@anthropic-ai/sdk/src/resources/messages';

export class ClaudeService {
    private client: Anthropic;
    private chatModel = 'claude-3-5-sonnet-20241022';
    private titleModel = 'claude-3-5-haiku-20241022';

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async sendMessage(messages: MessageParam[]): Promise<Message> {
        try {
            const response = await this.client.messages.create({
                model: this.chatModel,
                max_tokens: 4096,
                messages: messages,
            });

            return response;
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
