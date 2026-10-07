import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../utils/logger.js';
import type {
  LLMProvider,
  SummarizeAndTranslateOptions,
  SummarizeOptions,
  TranslateOptions,
} from '../llm.interface.js';
import {
  SYSTEM_PROMPT_SUMMARIZE,
  buildSummarizePrompt,
} from '../prompts/summarize.prompt.js';
import {
  SYSTEM_PROMPT_SUMMARIZE_TRANSLATE,
  buildSummarizeTranslatePrompt,
} from '../prompts/summarize-translate.prompt.js';
import {
  SYSTEM_PROMPT_TRANSLATE,
  buildTranslatePrompt,
} from '../prompts/translate.prompt.js';
import {
  formatKhmerStyle,
  summarizeDynamic,
  translateUniversal,
} from '../nlpEngine.js';

export class ClaudeProvider implements LLMProvider {
  public readonly name = 'claude';
  private client: Anthropic | null = null;
  private model: string;

  constructor() {
    this.model = env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 0) {
      this.client = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
    }
  }

  private hasApiKey(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 0);
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!this.hasApiKey()) {
        throw new AppError(
          'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment.',
          503,
          'API_KEY_MISSING',
        );
      }
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  /**
   * Executes Anthropic API request with retry and exponential backoff
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: unknown) {
        lastError = err;
        const errorStatus = (err as { status?: number }).status;
        const errorMessage = (err as Error).message || '';

        // Retry on 429 (rate limit) or 500+ (server error/overloaded)
        const isRateLimitOrTransient =
          errorStatus === 429 ||
          errorStatus === 500 ||
          errorStatus === 503 ||
          errorStatus === 529 ||
          errorMessage.includes('overloaded');

        if (isRateLimitOrTransient && attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          logger.warn(
            `Claude API call failed (attempt ${attempt}/${retries}). Retrying in ${waitTime}ms...`,
            { error: errorMessage },
          );
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }

        break;
      }
    }

    logger.error('Claude API call failed after retries:', lastError);
    if (lastError instanceof AppError) {
      throw lastError;
    }
    const message = (lastError as Error)?.message || 'Claude AI processing failed';
    throw new AppError(`Claude LLM Error: ${message}`, 502, 'LLM_ERROR', lastError);
  }

  private resolveModel(requestedModel?: string): string {
    if (!requestedModel || requestedModel === 'neural-engine') {
      return this.model || 'claude-3-5-sonnet-20241022';
    }
    if (requestedModel.includes('sonnet-5') || requestedModel.includes('claude-5')) {
      return 'claude-3-5-sonnet-20241022';
    }
    return requestedModel;
  }

  public async summarize(
    text: string,
    options: SummarizeOptions,
  ): Promise<{ summary: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    // If neural-engine selected or no Anthropic key configured, use high-quality dynamic universal engine
    if (options.model === 'neural-engine' || !this.hasApiKey()) {
      logger.info('Using dynamic Universal Khmer Engine for summarize.', { style: options.style, length: options.length });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const summary = summarizeDynamic(translated, options.length, options.style);
      return {
        summary,
        usage: { promptTokens: text.length, completionTokens: summary.length, totalTokens: text.length + summary.length },
      };
    }

    try {
      const client = this.getClient();
      const modelToUse = this.resolveModel(options.model);
      const prompt = buildSummarizePrompt(text, options.length, options.targetLanguage, options.style);

      const response = await this.executeWithRetry(async () => {
        return await client.messages.create({
          model: modelToUse,
          max_tokens: 4096,
          system: SYSTEM_PROMPT_SUMMARIZE,
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const firstBlock = response.content[0];
      const summary = firstBlock && 'text' in firstBlock ? firstBlock.text.trim() : '';

      return {
        summary,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (err) {
      logger.warn('Claude API request failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const summary = summarizeDynamic(translated, options.length, options.style);
      return {
        summary,
        usage: { promptTokens: text.length, completionTokens: summary.length, totalTokens: text.length + summary.length },
      };
    }
  }

  public async translate(
    text: string,
    options: TranslateOptions,
  ): Promise<{ translation: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    // If neural-engine selected or no Anthropic key configured, use high-quality dynamic universal engine
    if (options.model === 'neural-engine' || !this.hasApiKey()) {
      logger.info('Using dynamic Universal Khmer Engine for translate.', { style: options.style, targetLanguage: options.targetLanguage });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const styledTranslation = formatKhmerStyle(translated, options.style);
      return {
        translation: styledTranslation,
        usage: { promptTokens: text.length, completionTokens: styledTranslation.length, totalTokens: text.length + styledTranslation.length },
      };
    }

    try {
      const client = this.getClient();
      const modelToUse = this.resolveModel(options.model);
      const prompt = buildTranslatePrompt(text, options.targetLanguage, options.style);

      const response = await this.executeWithRetry(async () => {
        return await client.messages.create({
          model: modelToUse,
          max_tokens: 4096,
          system: SYSTEM_PROMPT_TRANSLATE,
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const firstBlock = response.content[0];
      const translation = firstBlock && 'text' in firstBlock ? firstBlock.text.trim() : '';

      return {
        translation,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (err) {
      logger.warn('Claude API translate failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const styledTranslation = formatKhmerStyle(translated, options.style);
      return {
        translation: styledTranslation,
        usage: { promptTokens: text.length, completionTokens: styledTranslation.length, totalTokens: text.length + styledTranslation.length },
      };
    }
  }

  public async summarizeAndTranslate(
    text: string,
    options: SummarizeAndTranslateOptions,
  ): Promise<{ summary: string; translation: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    // If neural-engine selected or no Anthropic key configured, use high-quality dynamic universal engine
    if (options.model === 'neural-engine' || !this.hasApiKey()) {
      logger.info('Using dynamic Universal Khmer Engine for summarizeAndTranslate.', { style: options.style, length: options.length });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const styledTranslation = formatKhmerStyle(translated, options.style);
      const summary = summarizeDynamic(translated, options.length, options.style);
      return {
        summary,
        translation: styledTranslation,
        usage: {
          promptTokens: text.length,
          completionTokens: summary.length + styledTranslation.length,
          totalTokens: text.length + summary.length + styledTranslation.length,
        },
      };
    }

    try {
      const client = this.getClient();
      const modelToUse = this.resolveModel(options.model);
      const prompt = buildSummarizeTranslatePrompt(text, options.length, options.targetLanguage, options.style);

      const response = await this.executeWithRetry(async () => {
        return await client.messages.create({
          model: modelToUse,
          max_tokens: 4096,
          system: SYSTEM_PROMPT_SUMMARIZE_TRANSLATE,
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const firstBlock = response.content[0];
      const rawText = firstBlock && 'text' in firstBlock ? firstBlock.text.trim() : '';

      // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let summary = '';
      let translation = '';

      try {
        const parsed = JSON.parse(cleaned);
        summary = parsed.summary || '';
        translation = parsed.translation || '';
      } catch {
        logger.warn('Failed to parse Claude JSON response directly, attempting regex extraction.');
        const summaryMatch = cleaned.match(/"summary"\s*:\s*"([\s\S]*?)(?<!\\)",/);
        const transMatch = cleaned.match(/"translation"\s*:\s*"([\s\S]*?)(?<!\\)"/);

        if (summaryMatch) {
          summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
        if (transMatch) {
          translation = transMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }

        if (!summary && !translation) {
          summary = rawText;
          translation = rawText;
        }
      }

      return {
        summary,
        translation,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (err) {
      logger.warn('Claude API summarizeAndTranslate failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const styledTranslation = formatKhmerStyle(translated, options.style);
      const summary = summarizeDynamic(translated, options.length, options.style);
      return {
        summary,
        translation: styledTranslation,
        usage: {
          promptTokens: text.length,
          completionTokens: summary.length + styledTranslation.length,
          totalTokens: text.length + summary.length + styledTranslation.length,
        },
      };
    }
  }
}
