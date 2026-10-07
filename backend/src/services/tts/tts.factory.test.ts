import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../utils/AppError.js';
import { AzureProvider } from './providers/azure.provider.js';
import { ElevenLabsProvider } from './providers/elevenlabs.provider.js';
import { GoogleTTSProvider } from './providers/google.provider.js';
import { TTSFactory } from './tts.factory.js';

describe('TTSFactory', () => {
  beforeEach(() => {
    TTSFactory.reset();
  });

  it('returns an ElevenLabsProvider when elevenlabs is requested', () => {
    const provider = TTSFactory.getProvider('elevenlabs');
    expect(provider).toBeInstanceOf(ElevenLabsProvider);
    expect(provider.name).toBe('elevenlabs');
  });

  it('returns an AzureProvider when azure is requested', () => {
    const provider = TTSFactory.getProvider('azure');
    expect(provider).toBeInstanceOf(AzureProvider);
    expect(provider.name).toBe('azure');
  });

  it('returns a GoogleTTSProvider when google is requested', () => {
    const provider = TTSFactory.getProvider('google');
    expect(provider).toBeInstanceOf(GoogleTTSProvider);
    expect(provider.name).toBe('google');
  });

  it('caches provider instances across requests', () => {
    const provider1 = TTSFactory.getProvider('azure');
    const provider2 = TTSFactory.getProvider('azure');
    expect(provider1).toBe(provider2);
  });

  it('throws AppError with UNSUPPORTED_PROVIDER for invalid provider name', () => {
    expect(() => TTSFactory.getProvider('invalid_provider' as any)).toThrow(AppError);
    try {
      TTSFactory.getProvider('invalid_provider' as any);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('UNSUPPORTED_PROVIDER');
    }
  });

  it('returns VoiceCloneProvider for providers that implement voice cloning (ElevenLabs)', () => {
    const cloneProvider = TTSFactory.getVoiceCloneProvider('elevenlabs');
    expect(cloneProvider).toBeDefined();
    expect(typeof cloneProvider.cloneVoice).toBe('function');
  });

  it('throws CLONE_NOT_SUPPORTED when requesting voice clone on Azure or Google', () => {
    expect(() => TTSFactory.getVoiceCloneProvider('azure')).toThrow(AppError);
    try {
      TTSFactory.getVoiceCloneProvider('azure');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('CLONE_NOT_SUPPORTED');
    }

    expect(() => TTSFactory.getVoiceCloneProvider('google')).toThrow(AppError);
    try {
      TTSFactory.getVoiceCloneProvider('google');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('CLONE_NOT_SUPPORTED');
    }
  });
});
