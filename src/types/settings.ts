export interface ModelSettings {
    chat: string;
    title: string;
    [key: string]: string;  // Allow string indexing
}

export interface ProviderSettings {
    apiKey: string;
    models: ModelSettings;
    [key: string]: string | ModelSettings;  // Allow string indexing
}

export interface UserSettings {
    model_provider: 'anthropic' | 'openai' | 'google';
    provider_settings: {
        [key: string]: ProviderSettings;
    };
    created_at: number;
    updated_at: number;
}

// Default settings with Anthropic provider
export const DEFAULT_USER_SETTINGS: UserSettings = {
    model_provider: 'anthropic',
    provider_settings: {
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            models: {
                chat: 'claude-3-5-sonnet-20241022',
                title: 'claude-3-5-haiku-20241022'
            }
        }
    },
    created_at: Date.now(),
    updated_at: Date.now()
};