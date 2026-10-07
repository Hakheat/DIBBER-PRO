import type { ProcessStoryRequest, ProcessStoryResponse, StoryStyle, SummaryLength } from '../types/index.js';
import { MAX_STORY_CHARS } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { chunkText } from '../utils/chunkText.js';
import { logger } from '../utils/logger.js';
import { LLMFactory } from './llm/llm.factory.js';

// Max characters per single LLM call to preserve context without exceeding token limits
const LLM_CHUNK_LIMIT = 15000;

export class StoryService {
  /**
   * Process a story for summarization, translation, or both
   */
  public async processStory(request: ProcessStoryRequest): Promise<ProcessStoryResponse> {
    const { text, action, targetLanguage = 'km', length = 'medium', style = 'general', model } = request;

    if (!text || text.trim().length === 0) {
      throw new AppError('Story text cannot be empty', 400, 'EMPTY_TEXT');
    }

    if (text.length > MAX_STORY_CHARS) {
      throw new AppError(
        `Story text exceeds maximum allowed limit of ${MAX_STORY_CHARS} characters`,
        400,
        'TEXT_TOO_LONG',
      );
    }

    logger.info(`Processing story with action="${action}", targetLanguage="${targetLanguage}", length="${length}", style="${style}", model="${model || 'default'}", lengthChars=${text.length}`);

    // If story is within standard LLM single-pass window
    if (text.length <= LLM_CHUNK_LIMIT) {
      return await this.processSingleChunk(text, action, targetLanguage, length, style, model);
    }

    // For very long stories: chunk, process, and merge
    return await this.processMultiChunk(text, action, targetLanguage, length, style, model);
  }

  private async processSingleChunk(
    text: string,
    action: ProcessStoryRequest['action'],
    targetLanguage: string,
    length: SummaryLength,
    style: StoryStyle,
    model?: string,
  ): Promise<ProcessStoryResponse> {
    const provider = LLMFactory.getProvider('claude');

    switch (action) {
      case 'summarize': {
        const result = await provider.summarize(text, { length, targetLanguage, style, model });
        return {
          summary: result.summary,
          usage: result.usage,
        };
      }

      case 'translate': {
        const result = await provider.translate(text, { targetLanguage, style, model });
        return {
          translation: result.translation,
          usage: result.usage,
        };
      }

      case 'both': {
        const result = await provider.summarizeAndTranslate(text, { length, targetLanguage, style, model });
        return {
          summary: result.summary,
          translation: result.translation,
          usage: result.usage,
        };
      }

      default:
        throw new AppError(`Unsupported story action: ${action}`, 400, 'INVALID_ACTION');
    }
  }

  /**
   * Chunks large story, processes segments, and synthesizes final output
   */
  private async processMultiChunk(
    text: string,
    action: ProcessStoryRequest['action'],
    targetLanguage: string,
    length: SummaryLength,
    style: StoryStyle,
    model?: string,
  ): Promise<ProcessStoryResponse> {
    const provider = LLMFactory.getProvider('claude');
    const chunks = chunkText(text, LLM_CHUNK_LIMIT);

    logger.info(`Splitting large story into ${chunks.length} chunks for processing.`);

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    const trackUsage = (usage?: { promptTokens?: number; completionTokens?: number }) => {
      if (usage) {
        totalPromptTokens += usage.promptTokens || 0;
        totalCompletionTokens += usage.completionTokens || 0;
      }
    };

    if (action === 'translate') {
      const translatedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        logger.info(`Translating chunk ${i + 1}/${chunks.length}...`);
        const res = await provider.translate(chunks[i], { targetLanguage, style, model });
        trackUsage(res.usage);
        translatedChunks.push(res.translation);
      }

      return {
        translation: translatedChunks.join('\n\n'),
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens: totalPromptTokens + totalCompletionTokens,
        },
      };
    }

    if (action === 'summarize') {
      // Step 1: Summarize each chunk
      const chunkSummaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        logger.info(`Summarizing chunk ${i + 1}/${chunks.length}...`);
        const res = await provider.summarize(chunks[i], { length: 'short', targetLanguage, style, model });
        trackUsage(res.usage);
        chunkSummaries.push(res.summary);
      }

      // Step 2: Synthesize combined summary into final requested length
      logger.info('Synthesizing combined multi-chunk summary...');
      const mergedText = chunkSummaries.join('\n\n');
      const finalRes = await provider.summarize(mergedText, { length, targetLanguage, style, model });
      trackUsage(finalRes.usage);

      return {
        summary: finalRes.summary,
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens: totalPromptTokens + totalCompletionTokens,
        },
      };
    }

    // action === 'both'
    const translatedChunks: string[] = [];
    const chunkSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      logger.info(`Processing chunk ${i + 1}/${chunks.length} for both summarize and translate...`);
      const res = await provider.summarizeAndTranslate(chunks[i], { length: 'short', targetLanguage, style, model });
      trackUsage(res.usage);
      chunkSummaries.push(res.summary);
      translatedChunks.push(res.translation);
    }

    const mergedSummaryInput = chunkSummaries.join('\n\n');
    const finalSummaryRes = await provider.summarize(mergedSummaryInput, { length, targetLanguage, style, model });
    trackUsage(finalSummaryRes.usage);

    return {
      summary: finalSummaryRes.summary,
      translation: translatedChunks.join('\n\n'),
      usage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      },
    };
  }
}

export const storyService = new StoryService();
