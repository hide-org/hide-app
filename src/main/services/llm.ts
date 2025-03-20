import { Message } from "@/types/message";

/**
 * LLMService interface for language model providers.
 * This interface abstracts the common operations needed for different LLM providers.
 * New providers can implement this interface to ensure compatibility with the app.
 */
export interface LLMService {
  /**
   * Sends messages to the LLM provider and yields response messages in a streaming fashion.
   * @param messages The conversation history
   * @param options Object containing model name and optional system prompt
   * @param abortSignal Optional abort signal to cancel the request
   * @returns An AsyncGenerator yielding the model's responses as they arrive
   */
  sendMessage(
    messages: Message[],
    // TODO: extract common parameters from options
    options: {
      model: string,
      thinking?: boolean,
      systemPrompt?: string,
    },
    abortSignal?: AbortSignal,
  ): AsyncGenerator<Message>;

  /**
   * Generates a title for a conversation based on the first message.
   * @param message The first message of the conversation
   * @param model The model to use for title generation
   * @returns Promise resolving to the generated title
   */
  generateTitle(message: string, model: string): Promise<string>;

  /**
   * Loads and applies provider-specific settings.
   * @returns Object indicating success status and optional error message
   */
  loadSettings(): { success: boolean; error?: string };
  
  /**
   * Gets the list of models supported by this provider.
   * @returns Array of model identifiers supported by this provider
   */
  getSupportedModels(): string[];
  
  /**
   * Gets the provider name.
   * @returns String identifier for the provider (e.g., "anthropic", "openai")
   */
  getProviderName(): string;
}
