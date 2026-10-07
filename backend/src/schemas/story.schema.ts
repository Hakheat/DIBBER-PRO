import { z } from 'zod';
import { MAX_STORY_CHARS } from '../constants/limits.js';

export const StoryActionSchema = z.enum(['summarize', 'translate', 'both']);
export type StoryAction = z.infer<typeof StoryActionSchema>;

export const SummaryLengthSchema = z.enum(['short', 'medium', 'long']);
export type SummaryLength = z.infer<typeof SummaryLengthSchema>;

export const StoryStyleSchema = z.enum(['general', 'news', 'horror', 'sponsor']);
export type StoryStyle = z.infer<typeof StoryStyleSchema>;

export const ProcessStoryRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Story text cannot be empty')
    .max(MAX_STORY_CHARS, `Story text exceeds maximum limit of ${MAX_STORY_CHARS} characters`),
  action: StoryActionSchema,
  targetLanguage: z.string().optional().default('km'),
  length: SummaryLengthSchema.optional().default('medium'),
  style: StoryStyleSchema.optional().default('general'),
  model: z.string().optional().default('claude-3-5-sonnet-20241022'),
});

export type ProcessStoryRequest = z.infer<typeof ProcessStoryRequestSchema>;

export const ProcessStoryResponseSchema = z.object({
  summary: z.string().optional(),
  translation: z.string().optional(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export type ProcessStoryResponse = z.infer<typeof ProcessStoryResponseSchema>;
