import type { SpeakRequest, VoicesResponse } from '../types/index.js';
import { apiDownloadBlob, apiClient } from './client.js';

export const ttsApi = {
  getVoices: async (): Promise<VoicesResponse> => {
    return await apiClient<VoicesResponse>('/api/tts/voices');
  },

  speak: async (data: SpeakRequest): Promise<Blob> => {
    return await apiDownloadBlob('/api/tts/speak', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
