import { LLMService } from "@/main/services/llm";

/**
 * Manages LLM providers and services, handling provider selection based on model
 */
export class LLMServiceProvider {
  private providers: Map<string, LLMService> = new Map();
  private modelToProviderMap: Map<string, string> = new Map();

  constructor() { }

  /**
   * Registers an LLM service provider for use
   * @param provider The LLM service to register
   */
  public registerProvider(provider: LLMService): void {
    const providerName = provider.getProviderName();
    this.providers.set(providerName, provider);

    // Map each model to this provider
    for (const model of provider.getSupportedModels()) {
      this.modelToProviderMap.set(model, providerName);
    }

    // Initialize settings for this provider
    provider.loadSettings();
  }

  /**
   * Gets the appropriate LLM service for the specified model
   * @param model The model identifier
   * @returns The LLM service that supports the specified model, or null if no provider is found
   */
  public getServiceForModel(model: string): LLMService | null {
    // Get the provider name for this model
    const providerName = this.modelToProviderMap.get(model);

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
   * Gets all supported models from all providers
   * @returns Array of all supported model identifiers
   */
  public getAllSupportedModels(): string[] {
    return Array.from(this.modelToProviderMap.keys());
  }

  /**
   * Reloads settings for all registered providers
   */
  public reloadAllSettings(): void {
    for (const provider of this.providers.values()) {
      provider.loadSettings();
    }
  }
}
