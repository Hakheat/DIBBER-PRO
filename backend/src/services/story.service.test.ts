import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_STORY_CHARS } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { LLMFactory } from './llm/llm.factory.js';
import type { LLMProvider } from './llm/llm.interface.js';
import { StoryService } from './story.service.js';

describe('StoryService', () => {
  let storyService: StoryService;
  let mockProvider: LLMProvider;

  beforeEach(() => {
    LLMFactory.reset();
    storyService = new StoryService();

    mockProvider = {
      name: 'claude',
      summarize: vi.fn().mockResolvedValue({
        summary: 'Mocked narrative summary',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      }),
      translate: vi.fn().mockResolvedValue({
        translation: 'Mocked narrative translation',
        usage: { promptTokens: 120, completionTokens: 110, totalTokens: 230 },
      }),
      summarizeAndTranslate: vi.fn().mockResolvedValue({
        summary: 'Mocked summary from both',
        translation: 'Mocked translation from both',
        usage: { promptTokens: 200, completionTokens: 180, totalTokens: 380 },
      }),
    };

    LLMFactory.setProvider(mockProvider);
  });

  it('throws AppError when text is empty', async () => {
    await expect(
      storyService.processStory({
        text: '   ',
        action: 'summarize',
        targetLanguage: 'km',
        length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
      }),
    ).rejects.toThrow(AppError);

    try {
      await storyService.processStory({
        text: '',
        action: 'summarize',
        targetLanguage: 'km',
        length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
      });
    } catch (err) {
      expect((err as AppError).code).toBe('EMPTY_TEXT');
    }
  });

  it('throws AppError when text exceeds maximum allowed characters', async () => {
    const hugeText = 'X'.repeat(MAX_STORY_CHARS + 10);
    await expect(
      storyService.processStory({
        text: hugeText,
        action: 'summarize',
        targetLanguage: 'km',
        length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
      }),
    ).rejects.toThrow(AppError);

    try {
      await storyService.processStory({
        text: hugeText,
        action: 'summarize',
        targetLanguage: 'km',
        length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
      });
    } catch (err) {
      expect((err as AppError).code).toBe('TEXT_TOO_LONG');
    }
  });

  it('processes a single-chunk summarize request successfully', async () => {
    const response = await storyService.processStory({
      text: 'A wandering monkey discovered a magic fruit in the jungle.',
      action: 'summarize',
      targetLanguage: 'km',
      length: 'short',
      style: 'general',
      model: 'gemini-1.5-flash',
    });

    expect(mockProvider.summarize).toHaveBeenCalledTimes(1);
    expect(response.summary).toBe('Mocked narrative summary');
    expect(response.usage?.totalTokens).toBe(150);
  });

  it('processes a single-chunk translate request successfully', async () => {
    const response = await storyService.processStory({
      text: 'The moon shone bright over the quiet pagoda.',
      action: 'translate',
      targetLanguage: 'km',
      length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
    });

    expect(mockProvider.translate).toHaveBeenCalledTimes(1);
    expect(response.translation).toBe('Mocked narrative translation');
    expect(response.usage?.totalTokens).toBe(230);
  });

  it('processes a single-chunk both (summarize + translate) request', async () => {
    const response = await storyService.processStory({
      text: 'The villagers celebrated the annual water festival together.',
      action: 'both',
      targetLanguage: 'en',
      length: 'long',
      style: 'general',
      model: 'gemini-1.5-flash',
    });

    expect(mockProvider.summarizeAndTranslate).toHaveBeenCalledTimes(1);
    expect(response.summary).toBe('Mocked summary from both');
    expect(response.translation).toBe('Mocked translation from both');
  });

  it('chunks and processes very large stories exceeding LLM_CHUNK_LIMIT', async () => {
    // Generate text exceeding 15000 characters
    const paragraph = 'A gentle breeze whispered through the ancient trees of the sacred temple grounds.\n\n';
    const longStory = paragraph.repeat(250); // ~20,000 characters

    const response = await storyService.processStory({
      text: longStory,
      action: 'translate',
      targetLanguage: 'km',
      length: 'medium',
      style: 'general',
      model: 'gemini-1.5-flash',
    });

    // Should have chunked and called translate multiple times
    expect(mockProvider.translate).toHaveBeenCalled();
    expect((mockProvider.translate as any).mock.calls.length).toBeGreaterThan(1);
    expect(response.translation).toBeDefined();
  });
});
