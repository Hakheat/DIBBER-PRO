import { useState } from 'react';
import type { SpeakRequest } from '../types/index.js';
import { ttsApi } from '../api/tts.api.js';

export function useSpeak() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const speak = async (request: SpeakRequest): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await ttsApi.speak(request);
      
      // Revoke previous audio URL if existing
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const newUrl = URL.createObjectURL(blob);
      setAudioUrl(newUrl);
      return newUrl;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('TTS synthesis failed');
      setError(e);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError(null);
  };

  return {
    audioUrl,
    isGenerating,
    error,
    speak,
    clearAudio,
  };
}
