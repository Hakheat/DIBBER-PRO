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
import { prisma } from '../../../db/prisma.js';

async function getGeminiApiKey(): Promise<string> {
  // 1. Check Database settings (User configurations from UI)
  try {
    const dbSettings = await prisma.settings.findUnique({
      where: { key: 'geminiApiKey' },
    });
    if (dbSettings?.value) {
      return dbSettings.value;
    }
  } catch (err) {
    console.error('Error reading from DB:', err);
  }

  // 2. Check runtime environment variables (.env fallback)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (env.GEMINI_API_KEY) {
    return env.GEMINI_API_KEY;
  }
  
  return '';
}

async function getGeminiModel(): Promise<string> {
  try {
    const dbSettings = await prisma.settings.findUnique({
      where: { key: 'geminiModel' },
    });
    if (dbSettings?.value) {
      return dbSettings.value;
    }
  } catch (err) {
    console.error('Error reading model from DB:', err);
  }
  return env.GEMINI_MODEL || 'gemini-1.5-flash';
}

export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini';

  private async hasApiKey(): Promise<boolean> {
    const key = await getGeminiApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  private async resolveModel(requestedModel?: string): Promise<string> {
    const defaultModel = await getGeminiModel();
    if (!requestedModel || requestedModel === 'neural-engine') {
      return defaultModel;
    }
    if (requestedModel.includes('gemini')) {
      return requestedModel;
    }
    return defaultModel;
  }

  /**
   * Executes Gemini REST API request with retry
   */
  private async executeWithRetry(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    retries = 3,
    delay = 1000
  ): Promise<{ text: string; usage: any }> {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new AppError('Gemini API key is missing.', 503, 'API_KEY_MISSING');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    };

    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return {
            text: data.candidates[0].content.parts[0].text,
            usage: {
              promptTokens: data.usageMetadata?.promptTokenCount || 0,
              completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata?.totalTokenCount || 0,
            },
          };
        }
        throw new Error('Unexpected Gemini API response structure');
      } catch (err: unknown) {
        lastError = err;
        const errorMessage = (err as Error).message || '';

        if (errorMessage.includes('(429)') || errorMessage.includes('(500)') || errorMessage.includes('(503)')) {
          if (attempt < retries) {
            const waitTime = delay * Math.pow(2, attempt - 1);
            logger.warn(`Gemini API call failed (attempt ${attempt}/${retries}). Retrying in ${waitTime}ms...`);
            await new Promise((res) => setTimeout(res, waitTime));
            continue;
          }
        }
        break;
      }
    }

    logger.error('Gemini API call failed after retries:', lastError);
    throw new AppError(`Gemini LLM Error: ${(lastError as Error)?.message}`, 502, 'LLM_ERROR', lastError);
  }

  public async summarize(
    text: string,
    options: SummarizeOptions,
  ): Promise<{ summary: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    if (options.model === 'neural-engine' || !(await this.hasApiKey())) {
      logger.info('Using dynamic Universal Khmer Engine for summarize (Gemini).', { style: options.style, length: options.length });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const summary = summarizeDynamic(translated, options.length, options.style);
      return {
        summary,
        usage: { promptTokens: text.length, completionTokens: summary.length, totalTokens: text.length + summary.length },
      };
    }

    try {
      const modelToUse = await this.resolveModel(options.model);
      const prompt = buildSummarizePrompt(text, options.length, options.targetLanguage, options.style);

      const result = await this.executeWithRetry(SYSTEM_PROMPT_SUMMARIZE, prompt, modelToUse);
      return {
        summary: result.text.trim(),
        usage: result.usage,
      };
    } catch (err) {
      logger.warn('Gemini API summarize failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
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
    if (options.model === 'neural-engine' || !(await this.hasApiKey())) {
      logger.info('Using dynamic Universal Khmer Engine for translate (Gemini).', { style: options.style, targetLanguage: options.targetLanguage });
      const translated = await translateUniversal(text, options.targetLanguage || 'km');
      const styledTranslation = formatKhmerStyle(translated, options.style);
      return {
        translation: styledTranslation,
        usage: { promptTokens: text.length, completionTokens: styledTranslation.length, totalTokens: text.length + styledTranslation.length },
      };
    }

    try {
      const modelToUse = await this.resolveModel(options.model);
      const prompt = buildTranslatePrompt(text, options.targetLanguage, options.style);

      const result = await this.executeWithRetry(SYSTEM_PROMPT_TRANSLATE, prompt, modelToUse);
      return {
        translation: result.text.trim(),
        usage: result.usage,
      };
    } catch (err) {
      logger.warn('Gemini API translate failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
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
    if (options.model === 'neural-engine' || !(await this.hasApiKey())) {
      logger.info('Using dynamic Universal Khmer Engine for summarizeAndTranslate (Gemini).', { style: options.style, length: options.length });
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
      const modelToUse = await this.resolveModel(options.model);
      const prompt = buildSummarizeTranslatePrompt(text, options.length, options.targetLanguage, options.style);

      const result = await this.executeWithRetry(SYSTEM_PROMPT_SUMMARIZE_TRANSLATE, prompt, modelToUse);
      const rawText = result.text.trim();

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
        logger.warn('Failed to parse Gemini JSON response directly, attempting regex extraction.');
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
        usage: result.usage,
      };
    } catch (err) {
      logger.warn('Gemini API summarizeAndTranslate failed, falling back to dynamic Universal Khmer Engine:', { error: (err as Error).message });
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
