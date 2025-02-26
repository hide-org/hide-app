export interface ModelSettings {
    chat: string;
    title: string;
    thinking: boolean;
    [key: string]: string | boolean;  // Allow string indexing
}

export interface ProviderSettings {
    apiKey: string;
    models: ModelSettings;
    [key: string]: string | ModelSettings;  // Allow string indexing
}

export type Provider = 'anthropic'; //later add openai and google

export interface UserSettings {
    model_provider: Provider;
    provider_settings: {
        [key: string]: ProviderSettings;
    };
    created_at: number;
    updated_at: number;
}

export const defaultProviderSettings: ProviderSettings = {
    apiKey: "",
    models: {
        chat: '',
        title: '',
        thinking: false
    }
};

export const newUserSettings = (provider: Provider, settings: ProviderSettings): UserSettings => {
    return {
        model_provider: provider,
        provider_settings: {
            [provider]: settings
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
