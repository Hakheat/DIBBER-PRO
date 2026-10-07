import type { LLMProvider } from './llm.interface.js';
import { ClaudeProvider } from './providers/claude.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';

export type SupportedLLM = 'claude' | 'gemini';

export class LLMFactory {
  private static instance: LLMProvider | null = null;

  public static getProvider(type: SupportedLLM = 'gemini'): LLMProvider {
    if (this.instance && this.instance.name === type) {
      return this.instance;
    }

    switch (type) {
      case 'claude':
        this.instance = new ClaudeProvider();
        return this.instance;
      case 'gemini':
        this.instance = new GeminiProvider();
        return this.instance;
      default:
        // Default to Gemini as requested
        this.instance = new GeminiProvider();
        return this.instance;
    }
  }

  /**
   * For testing purposes to inject mock provider
   */
  public static setProvider(provider: LLMProvider): void {
    this.instance = provider;
  }

  public static reset(): void {
    this.instance = null;
  }
}
