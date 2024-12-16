/**
 * Helper functions to handle environment variables and configuration in Electron
 */

// For development, we can fall back to environment variables
const DEV_API_KEY = process.env.ANTHROPIC_API_KEY;

export const getAnthropicApiKey = (): string => {
    // In a production app, you'd want to get this from a secure storage
    // like the system keychain or encrypted local storage
    return DEV_API_KEY || '';
};

export const isApiKeyConfigured = (): boolean => {
    return !!getAnthropicApiKey();
};