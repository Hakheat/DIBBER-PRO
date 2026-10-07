import type { StoryStyle, VoiceInfo } from '../../types/index.js';

export interface SpeakOptions {
  text: string;
  voiceId: string;
  language?: string;
  style?: StoryStyle;
  speed?: number;
  pitch?: number;
}

export interface TTSProvider {
  readonly name: string;
  supportsLanguage(language: string): boolean;
  listVoices(): Promise<VoiceInfo[]>;
  speak(options: SpeakOptions): Promise<Buffer>;
}

export interface VoiceCloneProvider {
  readonly name: string;
  cloneVoice(name: string, audioFilePath: string): Promise<{ id: string; name: string; provider: string }>;
  deleteClonedVoice(voiceId: string): Promise<boolean>;
}

export function isVoiceCloneProvider(provider: unknown): provider is VoiceCloneProvider {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'cloneVoice' in provider &&
    typeof (provider as VoiceCloneProvider).cloneVoice === 'function'
  );
}
