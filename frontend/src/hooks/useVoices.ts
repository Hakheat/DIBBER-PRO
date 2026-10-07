import { useQuery } from '@tanstack/react-query';
import type { VoiceInfo } from '../types/index.js';
import { ttsApi } from '../api/tts.api.js';

export function useVoices() {
  const query = useQuery<VoiceInfo[], Error>({
    queryKey: ['voices'],
    queryFn: async () => {
      const response = await ttsApi.getVoices();
      return response.voices;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    voices: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
