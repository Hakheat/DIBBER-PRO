import fs from 'node:fs';
import type { CloneVoiceResponse, ClonedVoice, DeleteVoiceResponse } from '../types/index.js';
import { voiceStore } from '../storage/voice.store.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { TTSFactory } from './tts/tts.factory.js';

export interface CloneVoiceParams {
  name: string;
  consent: boolean;
  samplePath: string;
  providerName?: string;
}

export class VoiceService {
  /**
   * Clones a voice using an audio sample with mandatory consent verification
   */
  public async cloneVoice(params: CloneVoiceParams): Promise<CloneVoiceResponse> {
    const { name, consent, samplePath, providerName } = params;

    if (!consent) {
      throw new AppError(
        'Explicit consent is required to clone a voice. You must verify ownership or authorization.',
        400,
        'CONSENT_REQUIRED',
      );
    }

    if (!samplePath || !fs.existsSync(samplePath)) {
      throw new AppError('Voice sample file is missing or invalid.', 400, 'SAMPLE_MISSING');
    }

    try {
      const provider = TTSFactory.getVoiceCloneProvider(providerName || 'elevenlabs');
      logger.info(`Initiating voice clone for "${name}" using provider "${provider.name}"...`);

      const cloned = await provider.cloneVoice(name, samplePath);

      // Store ONLY metadata, never raw audio on disk permanently
      const record: ClonedVoice = {
        id: cloned.id,
        name: cloned.name,
        provider: cloned.provider,
        createdAt: new Date().toISOString(),
      };

      voiceStore.save(record);
      logger.info(`Voice "${name}" successfully cloned with ID ${cloned.id}`);

      return {
        id: cloned.id,
        name: cloned.name,
        provider: cloned.provider,
      };
    } finally {
      // Always delete temporary audio file
      try {
        if (fs.existsSync(samplePath)) {
          fs.unlinkSync(samplePath);
          logger.debug(`Cleaned up temporary sample file: ${samplePath}`);
        }
      } catch (cleanupErr) {
        logger.warn(`Failed to clean up temporary sample file: ${samplePath}`, cleanupErr);
      }
    }
  }

  /**
   * Retrieves list of all cloned voices
   */
  public getClonedVoices(): ClonedVoice[] {
    return voiceStore.getAll();
  }

  /**
   * Deletes a cloned voice from store and upstream provider
   */
  public async deleteClonedVoice(id: string): Promise<DeleteVoiceResponse> {
    const voice = voiceStore.getById(id);
    if (!voice) {
      throw new AppError('Cloned voice not found', 404, 'NOT_FOUND');
    }

    try {
      const provider = TTSFactory.getVoiceCloneProvider(voice.provider);
      await provider.deleteClonedVoice(id);
    } catch (err) {
      logger.warn(`Could not delete voice ${id} from provider upstream:`, err);
    }

    voiceStore.delete(id);
    return { deleted: true };
  }
}

export const voiceService = new VoiceService();
