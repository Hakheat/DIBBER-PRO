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
  start: number;
  end: number;
  text: string;
  translatedText?: string;
  audioPath?: string;
  duration?: number;
}

export interface DubbingOptions {
  targetLanguage: string;
  voiceId?: string;
  style?: 'general' | 'news' | 'horror' | 'sponsor';
  duckingVolume?: number;
  burnSubtitles?: boolean;
  autoPacing?: boolean;
  model?: string;
}

export interface DubbingJob {
  id: string;
  originalFileName: string;
  originalFilePath: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  options: DubbingOptions;
  status: DubbingStage;
  progress: number;
  currentStage: string;
  logs: string[];
  segments?: TranscriptSegment[];
  outputVideoPath?: string;
  outputSubtitlesPath?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
