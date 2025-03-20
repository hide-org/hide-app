import { LLMService } from "@/main/services/llm";
import { Model } from "@/types/model";
import { ipcMain } from "electron";

/**
 * Manages LLM providers and services, handling provider selection based on model
 */
export class LLMServiceProvider {
  private providers: Map<string, LLMService> = new Map();
  private modelToProviderMap: Map<string, string> = new Map();
  private models: Model[] = [];

  /**
   * Registers an LLM service provider for use
   * @param provider The LLM service to register
   */
  public registerProvider(provider: LLMService): void {
    const providerName = provider.getProviderName();
    this.providers.set(providerName, provider);

    // Get models from this provider
    const providerModels = provider.getSupportedModels();

    // Add models to the combined list
    this.models = [...this.models, ...providerModels];

    // Map each model ID to this provider
    for (const model of providerModels) {
      this.modelToProviderMap.set(model.id, providerName);
    }

    // Initialize settings for this provider
    provider.loadSettings();
  }

  /**
   * Gets the appropriate LLM service for the specified model
   * @param modelId The model identifier
   * @returns The LLM service that supports the specified model, or null if no provider is found
   */
  public getServiceForModel(modelId: string): LLMService | null {
    // Get the provider name for this model
    const providerName = this.modelToProviderMap.get(modelId);

    if (!providerName) {
      // No provider found
      return null;
    }

    return this.providers.get(providerName) || null;
  }

  /**
   * Gets all registered providers
   * @returns Array of registered LLM services
   */
  public getAllProviders(): LLMService[] {
    return Array.from(this.providers.values());
  }

  /**
   * Gets a provider by name
   * @param providerName The name of the provider to get
   * @returns The requested LLM service or undefined if not found
   */
  public getProviderByName(providerName: string): LLMService | undefined {
    return this.providers.get(providerName);
  }

  /**
   * Gets all supported models from all providers with their metadata
   * @returns Array of all supported models with metadata
   */
  public getAllSupportedModels(): Model[] {
    return this.models;
  }

  /**
   * Reloads settings for all registered providers
   */
  public reloadAllSettings(): void {
    // Clear existing models
    this.models = [];

    // Reload all providers which will update their models
    for (const provider of this.providers.values()) {
      provider.loadSettings();

      // Refresh models after settings update
      const providerModels = provider.getSupportedModels();
      this.models = [...this.models, ...providerModels];
    }
  }
}

export const setupLLMProviderHandlers = (llmServiceProvider: LLMServiceProvider) => {
  ipcMain.handle("models:getAll", () => {
    try {
      return llmServiceProvider.getAllSupportedModels();
    } catch (error) {
      console.error("Error getting models:", error);
      throw error;
    }
  });
};
