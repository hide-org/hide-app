/**
 * LLM capabilities, e.g. thinking, vision, etc.
 */
export interface ModelCapabilities {
  thinking?: boolean;
}

export interface Model {
  id: string;        // Internal ID used for API calls (e.g., "claude-3-opus-20240229")
  name: string;      // Display name (e.g., "Claude 3 Opus")
  provider: string;  // Provider name (e.g., "anthropic", "openai")
  available: boolean; // Whether the model is available (API key present)
  capabilities?: ModelCapabilities;
}
