export interface ProviderSettings {
  apiKey: string;
}

export type Provider = "anthropic" | "openai";

export interface UserSettings {
  provider_settings: {
    [key: string]: ProviderSettings;
  };
  created_at: number;
  updated_at: number;
}

export const defaultProviderSettings: ProviderSettings = {
  apiKey: "",
};

export const newUserSettings = (
  provider: Provider,
  settings: ProviderSettings,
): UserSettings => {
  return {
    provider_settings: {
      [provider]: settings,
    },
    created_at: Date.now(),
    updated_at: Date.now(),
  };
};

export const getProviderApiKey = (
  settings: UserSettings,
  provider: Provider
): string | undefined => {
  return settings.provider_settings[provider]?.apiKey;
};
