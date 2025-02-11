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

export type Provider = 'anthropic' | 'openai' | 'google';

export interface UserSettings {
    model_provider: Provider;
    provider_settings: {
        [key: string]: ProviderSettings;
    };
    created_at: number;
    updated_at: number;
}

export const newUserSettings = (provider: Provider): UserSettings => {
    const defaultModels = {
        anthropic: {
            chat: 'claude-3-5-sonnet-20241022',
            title: 'claude-3-5-haiku-20241022'
        },
        openai: {
            chat: 'gpt-4o',
            title: 'gpt-4o-mini'
        },
        google: {
            chat: '',
            title: ''
        }
    };

    return {
        model_provider: provider,
        provider_settings: {
            [provider]: {
                apiKey: "",
                models: defaultModels[provider]
            }
        },
        created_at: Date.now(),
        updated_at: Date.now()
    };
};

export const getCurrentProviderSettings = (settings: UserSettings): ProviderSettings | undefined => {
    if (!settings.provider_settings[settings.model_provider]) {
        return undefined;
    }
    return settings.provider_settings[settings.model_provider];
};

export const getCurrentProviderApiKey = (settings: UserSettings): string | undefined => {
    const providerSettings = getCurrentProviderSettings(settings);
    if (!providerSettings) {
        return undefined;
    }
    return providerSettings.apiKey;
};
