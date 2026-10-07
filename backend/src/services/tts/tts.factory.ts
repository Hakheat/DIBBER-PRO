import type { TTSProviderName } from '../../types/index.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { AzureProvider } from './providers/azure.provider.js';
import { ElevenLabsProvider } from './providers/elevenlabs.provider.js';
import { GoogleTTSProvider } from './providers/google.provider.js';
import { isVoiceCloneProvider, type TTSProvider, type VoiceCloneProvider } from './tts.interface.js';

export class TTSFactory {
  private static providers: Map<string, TTSProvider> = new Map();

  public static getProvider(type?: TTSProviderName | string): TTSProvider {
    const selected = (type || env.TTS_PROVIDER || 'elevenlabs') as TTSProviderName;

    if (this.providers.has(selected)) {
      return this.providers.get(selected)!;
    }

    let instance: TTSProvider;

    switch (selected as string) {
      case 'elevenlabs':
        instance = new ElevenLabsProvider();
        break;
      case 'azure':
      case 'edge-neural':
        instance = new AzureProvider();
        break;
      case 'google':
        instance = new GoogleTTSProvider();
        break;
      default:
        instance = new AzureProvider();
        break;
    }

    this.providers.set(selected, instance);
    return instance;
  }

  public static getVoiceCloneProvider(type?: TTSProviderName | string): VoiceCloneProvider {
    const provider = this.getProvider(type);

    if (!isVoiceCloneProvider(provider)) {
      throw new AppError(
        `Provider "${provider.name}" does not support voice cloning. Voice cloning requires a compatible provider like ElevenLabs.`,
        400,
        'CLONE_NOT_SUPPORTED',
      );
    }

    return provider;
  }

  public static setProvider(name: string, provider: TTSProvider): void {
    this.providers.set(name, provider);
  }

  public static reset(): void {
    this.providers.clear();
  }
}
