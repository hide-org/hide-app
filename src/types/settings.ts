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
