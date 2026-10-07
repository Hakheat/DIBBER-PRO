import { z } from 'zod';
import { MAX_TTS_TEXT_CHARS } from '../constants/limits.js';
import { StoryStyleSchema } from './story.schema.js';

export const TTSProviderNameSchema = z.enum(['elevenlabs', 'azure', 'google']);
export type TTSProviderName = z.infer<typeof TTSProviderNameSchema>;

export const SpeakRequestSchema = z
  .object({
    text: z
      .string()
      .min(1, 'Text to speak cannot be empty')
      .max(MAX_TTS_TEXT_CHARS, `Text exceeds limit of ${MAX_TTS_TEXT_CHARS} characters`),
    provider: TTSProviderNameSchema.optional(),
    voiceId: z.string().min(1, 'Voice ID is required'),
    language: z.string().optional().default('km'),
    style: z.string().optional().default('general'),
    speed: z.number().optional(),
    rate: z.number().optional(),
    pitch: z.number().optional(),
  })
  .transform((val) => ({
    ...val,
    style: (['general', 'news', 'horror', 'sponsor'].includes(val.style) ? val.style : 'general') as 'general' | 'news' | 'horror' | 'sponsor',
    speed: val.speed ?? val.rate ?? 1.0,
  }));

export type SpeakRequest = z.infer<typeof SpeakRequestSchema>;

export const VoiceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: TTSProviderNameSchema,
  language: z.string().optional(),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  isCloned: z.boolean().default(false),
  previewUrl: z.string().optional(),
});

export type VoiceInfo = z.infer<typeof VoiceInfoSchema>;

export const VoicesResponseSchema = z.object({
  voices: z.array(VoiceInfoSchema),
});

export type VoicesResponse = z.infer<typeof VoicesResponseSchema>;
