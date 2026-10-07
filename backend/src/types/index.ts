export * from '../constants/languages.js';
export * from '../constants/limits.js';
export * from '../schemas/story.schema.js';
export * from '../schemas/tts.schema.js';
export * from '../schemas/voice.schema.js';
export * from '../schemas/video.schema.js';

export interface VideoFormatOption {
  formatId: string;
  quality: string;
  extension: string;
  hasVideo: boolean;
  hasAudio: boolean;
  filesize?: number;
  label: string;
}

export type VideoPlatform = 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'twitter' | 'vimeo' | 'other';

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

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface StoryProcessResult {
  summary?: string;
  translation?: string;
  usage?: TokenUsage;
}
