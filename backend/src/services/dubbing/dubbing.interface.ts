export type DubbingStage =
  | 'queued'
  | 'extracting'
  | 'transcribing'
  | 'translating'
  | 'generating_audio'
  | 'editing'
  | 'finished'
  | 'failed';

export interface TranscriptSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  translatedText?: string;
  audioPath?: string;
  duration?: number;
}

export interface DubbingOptions {
  targetLanguage: string; // 'km', 'en', 'th', 'vi', etc.
  voiceId?: string;       // e.g. 'km-KH-PisethNeural', 'km-KH-SreymomNeural'
  style?: 'general' | 'news' | 'horror' | 'sponsor';
  duckingVolume?: number; // 0.0 to 1.0 (e.g. 0.2 = duck background by 80%)
  burnSubtitles?: boolean;
  autoPacing?: boolean;   // time-stretch audio to fit original timestamps
  model?: string;         // local translation model
}

export interface DubbingJob {
  id: string;
  originalFileName: string;
  originalFilePath: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  options: DubbingOptions;
  status: DubbingStage;
  progress: number; // 0 to 100
  currentStage: string;
  logs: string[];
  segments?: TranscriptSegment[];
  outputVideoPath?: string;
  outputSubtitlesPath?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateDubbingJobRequest {
  options: DubbingOptions;
}
