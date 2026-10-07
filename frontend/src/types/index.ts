import { z } from 'zod';

// ==========================================
// Language Constants & Types
// ==========================================
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  azureVoice?: string;
  googleVoice?: string;
  elevenlabsSupported?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ភាសាខ្មែរ',
    azureVoice: 'km-KH-PisethNeural',
    googleVoice: 'km-KH-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    azureVoice: 'en-US-JennyNeural',
    googleVoice: 'en-US-Neural2-F',
    elevenlabsSupported: true,
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    azureVoice: 'th-TH-PremwadeeNeural',
    googleVoice: 'th-TH-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    azureVoice: 'vi-VN-HoaiMyNeural',
    googleVoice: 'vi-VN-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文',
    azureVoice: 'zh-CN-XiaoxiaoNeural',
    googleVoice: 'cmn-CN-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    azureVoice: 'fr-FR-DeniseNeural',
    googleVoice: 'fr-FR-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    azureVoice: 'es-ES-ElviraNeural',
    googleVoice: 'es-ES-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    azureVoice: 'ja-JP-NanamiNeural',
    googleVoice: 'ja-JP-Standard-A',
    elevenlabsSupported: true,
  },
];

export const DEFAULT_LANGUAGE = 'km';

// ==========================================
// Limits & MIME Types
// ==========================================
export const MAX_STORY_CHARS = 50000;
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/x-pn-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
] as const;

export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac'] as const;

export const MAX_TTS_TEXT_CHARS = 10000;
export const TTS_CHUNK_SIZE = 500;

// ==========================================
// Story Processing Schemas & Types
// ==========================================
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

// ==========================================
// TTS Schemas & Types
// ==========================================
export const TTSProviderNameSchema = z.enum(['elevenlabs', 'azure', 'google']);
export type TTSProviderName = z.infer<typeof TTSProviderNameSchema>;

export const SpeakRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Text to speak cannot be empty')
    .max(MAX_TTS_TEXT_CHARS, `Text exceeds limit of ${MAX_TTS_TEXT_CHARS} characters`),
  provider: TTSProviderNameSchema.optional(),
  voiceId: z.string().min(1, 'Voice ID is required'),
  language: z.string().optional().default('km'),
  style: StoryStyleSchema.optional().default('general'),
  speed: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(-50).max(50).optional(),
});

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

// ==========================================
// Voice Cloning Schemas & Types
// ==========================================
export const CloneVoiceRequestSchema = z.object({
  name: z.string().trim().min(2, 'Voice name must be at least 2 characters').max(50),
  consent: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .refine((val) => val === true, {
      message: 'You must provide consent acknowledging voice ownership or permission.',
    }),
});

export type CloneVoiceRequest = z.infer<typeof CloneVoiceRequestSchema>;

export const ClonedVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  createdAt: z.string(),
  previewUrl: z.string().optional(),
  gender: z.enum(['female', 'male']).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  sampleText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ClonedVoice = z.infer<typeof ClonedVoiceSchema>;

export const CloneVoiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
});

export type CloneVoiceResponse = z.infer<typeof CloneVoiceResponseSchema>;

export const DeleteVoiceResponseSchema = z.object({
  deleted: z.literal(true),
});

export type DeleteVoiceResponse = z.infer<typeof DeleteVoiceResponseSchema>;

// ==========================================
// API & UI State Types
// ==========================================
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export type UILanguage = 'en' | 'km';

export interface StoryFormState {
  text: string;
  action: StoryAction;
  targetLanguage: string;
  length: SummaryLength;
}

// ==========================================
// Video Downloader Types
// ==========================================
export type VideoPlatform = 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'twitter' | 'vimeo' | 'other';

export interface VideoFormatOption {
  formatId: string;
  quality: string;
  extension: string;
  hasVideo: boolean;
  hasAudio: boolean;
  filesize?: number;
  label: string;
}

export interface DramaEpisode {
  episodeNumber: number;
  title: string;
  url?: string;
  durationFormatted?: string;
  thumbnail?: string;
  episodeId?: string | number;
}

export interface VideoInfo {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  uploader: string;
  platform: VideoPlatform;
  formats: VideoFormatOption[];
  isSeries?: boolean;
  totalEpisodes?: number;
  description?: string;
  episodes?: DramaEpisode[];
}

export interface VideoDownloadRequest {
  url: string;
  quality: string;
  format: 'mp4' | 'mp3' | 'm4a';
}
