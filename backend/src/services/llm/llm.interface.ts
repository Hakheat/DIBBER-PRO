import type { StoryStyle, SummaryLength, TokenUsage } from '../../types/index.js';

export interface SummarizeOptions {
  length: SummaryLength;
  targetLanguage?: string;
  style?: StoryStyle;
  model?: string;
}

export interface TranslateOptions {
  targetLanguage: string;
  style?: StoryStyle;
  model?: string;
}

export interface SummarizeAndTranslateOptions {
  length: SummaryLength;
  targetLanguage: string;
  style?: StoryStyle;
  model?: string;
}

export interface LLMProvider {
  readonly name: string;

  summarize(
    text: string,
    options: SummarizeOptions,
  ): Promise<{ summary: string; usage?: TokenUsage }>;

  translate(
    text: string,
    options: TranslateOptions,
  ): Promise<{ translation: string; usage?: TokenUsage }>;

  summarizeAndTranslate(
    text: string,
    options: SummarizeAndTranslateOptions,
  ): Promise<{ summary: string; translation: string; usage?: TokenUsage }>;
}
