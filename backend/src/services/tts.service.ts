import type { SpeakRequest, VoiceInfo } from '../types/index.js';
import { TTS_CHUNK_SIZE } from '../types/index.js';
import { voiceStore } from '../storage/voice.store.js';
import { AppError } from '../utils/AppError.js';
import { chunkText } from '../utils/chunkText.js';
import { logger } from '../utils/logger.js';
import { TTSFactory } from './tts/tts.factory.js';

export class TTSService {
  /**
   * Retrieves list of all built-in voices from providers plus user-cloned voices
   */
  public async listVoices(): Promise<VoiceInfo[]> {
    const voices: VoiceInfo[] = [];

    // 1. Gather voices from default provider + Azure & Google
    const providerNames = ['elevenlabs', 'azure', 'google'] as const;

    for (const name of providerNames) {
      try {
        const provider = TTSFactory.getProvider(name);
        const list = await provider.listVoices();
        voices.push(...list);
      } catch (err) {
        logger.warn(`Could not load voices from provider ${name}:`, err);
      }
    }

    // 2. Attach user cloned voices from voiceStore
    const clonedVoices = voiceStore.getAll();
    for (const cloned of clonedVoices) {
      // Avoid duplicate IDs if provider list already included it
      if (!voices.some((v) => v.id === cloned.id)) {
        voices.push({
          id: cloned.id,
          name: `${cloned.name} (Cloned Voice)`,
          provider: (cloned.provider as 'elevenlabs' | 'azure' | 'google') || 'elevenlabs',
          isCloned: true,
          previewUrl: cloned.previewUrl,
        });
      }
    }

    return voices;
  }

  /**
   * Synthesizes speech with text chunking and audio concatenation
   */
  public async speak(request: SpeakRequest): Promise<{ audio: Buffer; contentType: string }> {
    const { text, voiceId, language = 'km', style = 'general', speed, pitch } = request;

    if (!text || text.trim().length === 0) {
      throw new AppError('Text to speak cannot be empty', 400, 'EMPTY_TEXT');
    }

    // Determine target provider:
    // 1. Check if voiceId is a known cloned voice
    const cloned = voiceStore.getById(voiceId);
    let providerName = request.provider;

    // Smart auto-detection: Khmer neural & cloned voices route to azure/edge provider
    if (
      !providerName &&
      (voiceId.startsWith('km-clone') ||
        voiceId.includes('Neural') ||
        voiceId.startsWith('km-KH') ||
        voiceId.includes('Piseth') ||
        voiceId.includes('Sreymom'))
    ) {
      providerName = 'azure';
    } else if (!providerName && cloned) {
      providerName = (cloned.provider === 'edge-neural' ? 'azure' : cloned.provider) as any;
    }

    const provider = TTSFactory.getProvider(providerName || 'azure');

    function detectContentType(buffer: Buffer): string {
      if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'RIFF') {
        return 'audio/wav';
      }
      return 'audio/mpeg';
    }

    // Validate language support
    if (!provider.supportsLanguage(language)) {
      logger.warn(
        `Language "${language}" not directly supported by provider "${provider.name}". Using natural speech fallback.`,
      );
      const { generateSpokenAudioBuffer } = await import('../utils/demoAudio.js');
      const audio = await generateSpokenAudioBuffer(text, language, voiceId, style, speed, pitch);
      return { audio, contentType: detectContentType(audio) };
    }

    // Chunk text if it exceeds single-chunk limit
    const chunks = chunkText(text, TTS_CHUNK_SIZE);
    logger.info(
      `Synthesizing speech with provider=${provider.name}, voice=${voiceId}, language=${language}, style=${style}, chunks=${chunks.length}`,
    );

    try {
      if (chunks.length === 1) {
        const audio = await provider.speak({ text: chunks[0], voiceId, language, style, speed, pitch });
        return { audio, contentType: detectContentType(audio) };
      }

      // Process each chunk and concatenate buffers
      const audioBuffers: Buffer[] = [];
      for (let i = 0; i < chunks.length; i++) {
        logger.info(`Synthesizing TTS chunk ${i + 1}/${chunks.length}...`);
        const chunkAudio = await provider.speak({ text: chunks[i], voiceId, language, style, speed, pitch });
        audioBuffers.push(chunkAudio);
      }

      // Concatenate mp3 buffers
      const combinedBuffer = Buffer.concat(audioBuffers);
      return { audio: combinedBuffer, contentType: detectContentType(combinedBuffer) };
    } catch (err) {
      logger.warn(`TTS synthesis via provider "${provider.name}" failed, falling back to natural speech stream:`, {
        error: (err as Error).message,
      });
      const { generateSpokenAudioBuffer } = await import('../utils/demoAudio.js');
      const fallbackAudio = await generateSpokenAudioBuffer(text, language, voiceId, style, speed, pitch);
      return { audio: fallbackAudio, contentType: detectContentType(fallbackAudio) };
    }
  }
}

export const ttsService = new TTSService();
