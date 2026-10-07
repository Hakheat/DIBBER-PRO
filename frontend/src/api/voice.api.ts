import type { CloneVoiceResponse, ClonedVoice, DeleteVoiceResponse } from '../types/index.js';
import { apiClient } from './client.js';

export const voiceApi = {
  getClonedVoices: async (): Promise<ClonedVoice[]> => {
    return await apiClient<ClonedVoice[]>('/api/voice');
  },

  cloneVoice: async (formData: FormData): Promise<CloneVoiceResponse> => {
    return await apiClient<CloneVoiceResponse>('/api/voice/clone', {
      method: 'POST',
      body: formData,
    });
  },

  deleteVoice: async (id: string): Promise<DeleteVoiceResponse> => {
    return await apiClient<DeleteVoiceResponse>(`/api/voice/${id}`, {
      method: 'DELETE',
    });
  },
};
