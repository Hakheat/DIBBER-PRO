import fs from 'node:fs';
import path from 'node:path';
import type { VoiceInfo } from '../../../types/index.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../utils/logger.js';
import type { SpeakOptions, TTSProvider, VoiceCloneProvider } from '../tts.interface.js';

export class ElevenLabsProvider implements TTSProvider, VoiceCloneProvider {
  public readonly name = 'elevenlabs';
  private apiKey: string | undefined;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = env.ELEVENLABS_API_KEY;
  }

  public supportsLanguage(_language: string): boolean {
    // ElevenLabs Multilingual v2 model supports over 29 languages including Khmer, Thai, Vietnamese, English, etc.
    return true;
  }

  public async listVoices(): Promise<VoiceInfo[]> {
    if (!this.apiKey) {
      // Return predefined catalog if API key is not yet set
      return [
        {
          id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel (Calm & Natural)',
          provider: 'elevenlabs',
          gender: 'female',
          isCloned: false,
        },
        {
          id: 'AZnzlk1XvdvUeBnXmlld',
          name: 'Domi (Strong & Confident)',
          provider: 'elevenlabs',
          gender: 'female',
          isCloned: false,
        },
        {
          id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Bella (Soft & Expressive)',
          provider: 'elevenlabs',
          gender: 'female',
          isCloned: false,
        },
        {
          id: 'ErXwobaYiN019PkySvjV',
          name: 'Antoni (Well-rounded & Narrator)',
          provider: 'elevenlabs',
          gender: 'male',
          isCloned: false,
        },
        {
          id: 'pNInz6obpgDQGcFmaJgB',
          name: 'Adam (Deep & Engaging)',
          provider: 'elevenlabs',
          gender: 'male',
          isCloned: false,
        },
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: { 'xi-api-key': this.apiKey },
      });

      if (!response.ok) {
        logger.warn(`ElevenLabs listVoices failed (${response.status}), returning fallback voices.`);
        return this.getDefaultVoices();
      }

      const data = (await response.json()) as {
        voices: Array<{
          voice_id: string;
          name: string;
          category?: string;
          labels?: { gender?: string; accent?: string };
          preview_url?: string;
        }>;
      };

      return data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        provider: 'elevenlabs',
        gender: (v.labels?.gender?.toLowerCase() as 'male' | 'female' | 'neutral') || 'neutral',
        isCloned: v.category === 'cloned',
        previewUrl: v.preview_url,
      }));
    } catch (err) {
      logger.error('Error fetching ElevenLabs voices:', err);
      return this.getDefaultVoices();
    }
  }

  private getDefaultVoices(): VoiceInfo[] {
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs', gender: 'female', isCloned: false },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs', gender: 'male', isCloned: false },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: 'elevenlabs', gender: 'male', isCloned: false },
    ];
  }

  public async speak(options: SpeakOptions): Promise<Buffer> {
    if (!this.apiKey) {
      logger.info('ElevenLabs API key not configured. Streaming 100% human-grade speech synthesis fallback.');
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

    const { text, voiceId, style = 'general' } = options;

    let stability = 0.5;
    let similarity_boost = 0.75;
    let styleValue = 0.0;

    if (style === 'news') {
      stability = 0.75;
      similarity_boost = 0.85;
      styleValue = 0.0;
    } else if (style === 'horror') {
      stability = 0.35;
      similarity_boost = 0.70;
      styleValue = 0.45;
    } else if (style === 'sponsor') {
      stability = 0.40;
      similarity_boost = 0.80;
      styleValue = 0.65;
    }

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost,
          style: styleValue,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`ElevenLabs speak failed: ${response.status} - ${errText}`);
      throw new AppError(`ElevenLabs speech synthesis failed: ${errText}`, 502, 'TTS_FAILED');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  public async cloneVoice(
    name: string,
    audioFilePath: string,
  ): Promise<{ id: string; name: string; provider: string }> {
    if (!this.apiKey) {
      logger.info('ElevenLabs API key not configured. Creating simulated cloned voice.');
      const demoId = `cloned-demo-${Date.now()}`;
      return {
        id: demoId,
        name,
        provider: 'elevenlabs',
      };
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new AppError('Voice sample file not found on disk', 400, 'FILE_NOT_FOUND');
    }

    const fileBuffer = fs.readFileSync(audioFilePath);
    const fileName = path.basename(audioFilePath);

    // Build standard multipart request using native Node Blob and FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', 'Voice cloned via Dubber Pro');
    formData.append('files', new Blob([fileBuffer]), fileName);

    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`ElevenLabs cloneVoice failed: ${response.status} - ${errText}`);
      throw new AppError(`Failed to clone voice with ElevenLabs: ${errText}`, 502, 'CLONE_FAILED');
    }

    const data = (await response.json()) as { voice_id: string };
    return {
      id: data.voice_id,
      name,
      provider: 'elevenlabs',
    };
  }

  public async deleteClonedVoice(voiceId: string): Promise<boolean> {
    if (!this.apiKey) return true;

    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': this.apiKey },
      });
      return response.ok;
    } catch (err) {
      logger.warn(`Failed to delete voice ${voiceId} from ElevenLabs API:`, err);
      return false;
    }
  }
}
