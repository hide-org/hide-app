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
