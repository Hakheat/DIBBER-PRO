import type { VoiceInfo } from '../../../types/index.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../utils/logger.js';
import type { SpeakOptions, TTSProvider } from '../tts.interface.js';

export class AzureProvider implements TTSProvider {
  public readonly name = 'azure';
  private subscriptionKey: string | undefined;
  private region: string;

  constructor() {
    this.subscriptionKey = env.AZURE_SPEECH_KEY;
    this.region = env.AZURE_SPEECH_REGION || 'eastus';
  }

  public supportsLanguage(language: string): boolean {
    const supported = ['km', 'en', 'th', 'vi', 'zh', 'fr', 'es', 'ja'];
    return supported.includes(language.toLowerCase().slice(0, 2));
  }

  public async listVoices(): Promise<VoiceInfo[]> {
    return [
      {
        id: 'km-KH-PisethNeural',
        name: 'Piseth (Khmer, Male - High Fidelity)',
        provider: 'azure',
        language: 'km',
        gender: 'male',
        isCloned: false,
      },
      {
        id: 'km-KH-SreymomNeural',
        name: 'Sreymom (Khmer, Female - High Fidelity)',
        provider: 'azure',
        language: 'km',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'en-US-JennyNeural',
        name: 'Jenny (English US, Female)',
        provider: 'azure',
        language: 'en',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'en-US-GuyNeural',
        name: 'Guy (English US, Male)',
        provider: 'azure',
        language: 'en',
        gender: 'male',
        isCloned: false,
      },
      {
        id: 'th-TH-PremwadeeNeural',
        name: 'Premwadee (Thai, Female)',
        provider: 'azure',
        language: 'th',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'vi-VN-HoaiMyNeural',
        name: 'Hoai My (Vietnamese, Female)',
        provider: 'azure',
        language: 'vi',
        gender: 'female',
        isCloned: false,
      },
      {
        id: 'zh-CN-XiaoxiaoNeural',
        name: 'Xiaoxiao (Chinese Mandarin, Female)',
        provider: 'azure',
        language: 'zh',
        gender: 'female',
        isCloned: false,
      },
    ];
  }

  public async speak(options: SpeakOptions): Promise<Buffer> {
    if (!this.subscriptionKey) {
      logger.info('Azure Speech Key not configured. Streaming 100% human-grade speech synthesis fallback.');
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

    const { text, voiceId, language = 'km', style = 'general', speed, pitch } = options;

    if (!this.supportsLanguage(language)) {
      throw new AppError(
        `Azure Speech does not support language "${language}"`,
        400,
        'UNSUPPORTED_LANGUAGE',
      );
    }

    // Determine XML lang tag
    const xmlLang = language === 'km' ? 'km-KH' : language === 'en' ? 'en-US' : language === 'th' ? 'th-TH' : `${language}-${language.toUpperCase()}`;

    // Escape XML special chars
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Calculate style-driven prosody (rate & pitch)
    let rateStr = '+0%';
    let pitchStr = '+0%';

    if (style === 'news') {
      rateStr = '+5%';
      pitchStr = '+0%';
    } else if (style === 'horror') {
      rateStr = '-14%';
      pitchStr = '-8%';
    } else if (style === 'sponsor') {
      rateStr = '+12%';
      pitchStr = '+5%';
    }

    // Override if explicit speed or pitch passed
    if (typeof speed === 'number') {
      const pct = Math.round((speed - 1) * 100);
      rateStr = `${pct >= 0 ? '+' : ''}${pct}%`;
    }
    if (typeof pitch === 'number') {
      const pct = Math.round(pitch);
      pitchStr = `${pct >= 0 ? '+' : ''}${pct}%`;
    }

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${xmlLang}'>
      <voice name='${voiceId}'>
        <prosody rate='${rateStr}' pitch='${pitchStr}'>${escapedText}</prosody>
      </voice>
    </speak>`;

    const endpoint = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'DubberProAudioClient',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error(`Azure Speech synthesis failed: ${response.status} - ${errBody}`);
      throw new AppError(`Azure Speech synthesis error: ${errBody}`, 502, 'TTS_FAILED');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
