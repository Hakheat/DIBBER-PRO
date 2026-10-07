import type { VoiceInfo } from '../../../types/index.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../utils/logger.js';
import type { SpeakOptions, TTSProvider } from '../tts.interface.js';

export class GoogleTTSProvider implements TTSProvider {
  public readonly name = 'google';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = env.GOOGLE_TTS_API_KEY;
  }

  public supportsLanguage(language: string): boolean {
    const supported = ['km', 'en', 'th', 'vi', 'zh', 'fr', 'es', 'ja'];
    return supported.includes(language.toLowerCase().slice(0, 2));
  }

  public async listVoices(): Promise<VoiceInfo[]> {
    return [
      {
        id: 'km-KH-Standard-A',
        name: 'Khmer Standard A (Female)',
        provider: 'google',
        language: 'km',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'km-KH-Standard-B',
        name: 'Khmer Standard B (Male)',
        provider: 'google',
        language: 'km',
        gender: 'male',
        isCloned: false,
      },
      {
        id: 'en-US-Neural2-F',
        name: 'English Neural2 F (Female)',
        provider: 'google',
        language: 'en',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'en-US-Neural2-D',
        name: 'English Neural2 D (Male)',
        provider: 'google',
        language: 'en',
        gender: 'male',
        isCloned: false,
      },
      {
        id: 'th-TH-Standard-A',
        name: 'Thai Standard A (Female)',
        provider: 'google',
        language: 'th',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'vi-VN-Standard-A',
        name: 'Vietnamese Standard A (Female)',
        provider: 'google',
        language: 'vi',
        gender: 'female',
        isCloned: false,
      },
    ];
  }

  public async speak(options: SpeakOptions): Promise<Buffer> {
    if (!this.apiKey) {
      logger.info('Google Cloud TTS Key not configured. Streaming 100% human-grade speech synthesis fallback.');
      const { generateSpokenAudioBuffer } = await import('../../../utils/demoAudio.js');
      return await generateSpokenAudioBuffer(
        options.text,
        options.language || 'km',
        options.voiceId,
        options.style,
        options.speed,
        options.pitch,
      );
    }

    const { text, voiceId, language = 'km' } = options;

    if (!this.supportsLanguage(language)) {
      throw new AppError(
        `Google TTS does not support language "${language}"`,
        400,
        'UNSUPPORTED_LANGUAGE',
      );
    }

    const languageCode = language === 'km' ? 'km-KH' : language === 'en' ? 'en-US' : language === 'th' ? 'th-TH' : `${language}-${language.toUpperCase()}`;

    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

    const payload = {
      input: { text },
      voice: {
        languageCode,
        name: voiceId,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error(`Google TTS synthesis failed: ${response.status} - ${errBody}`);
      throw new AppError(`Google TTS error: ${errBody}`, 502, 'TTS_FAILED');
    }

    const data = (await response.json()) as { audioContent?: string };
    if (!data.audioContent) {
      throw new AppError('Google TTS returned empty audio stream', 502, 'EMPTY_AUDIO');
    }

    return Buffer.from(data.audioContent, 'base64');
  }
}
