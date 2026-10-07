import type { ProcessStoryRequest, ProcessStoryResponse } from '../types/index.js';
import { apiClient } from './client.js';

export const storyApi = {
  processStory: async (data: ProcessStoryRequest): Promise<ProcessStoryResponse> => {
    return await apiClient<ProcessStoryResponse>('/api/story/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
