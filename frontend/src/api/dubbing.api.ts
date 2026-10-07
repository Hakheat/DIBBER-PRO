import type { DubbingJob, DubbingOptions } from '../types/dubbing.types.js';
import { apiClient } from './client.js';

export const dubbingApi = {
  uploadBatch: async (
    files: File[],
    options: DubbingOptions,
  ): Promise<{ jobs: DubbingJob[] }> => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('videos', file);
    }
    formData.append('options', JSON.stringify(options));

    return await apiClient<{ jobs: DubbingJob[] }>('/api/dubbing/batch', {
      method: 'POST',
      body: formData,
    });
  },

  getJobs: async (): Promise<{ jobs: DubbingJob[] }> => {
    return await apiClient<{ jobs: DubbingJob[] }>('/api/dubbing/jobs');
  },

  getJob: async (id: string): Promise<{ job: DubbingJob }> => {
    return await apiClient<{ job: DubbingJob }>(`/api/dubbing/jobs/${id}`);
  },

  retryJob: async (id: string): Promise<{ job: DubbingJob }> => {
    return await apiClient<{ job: DubbingJob }>(`/api/dubbing/jobs/${id}/retry`, {
      method: 'POST',
    });
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient(`/api/dubbing/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  getVideoDownloadUrl: (id: string): string => {
    return `/api/dubbing/jobs/${id}/video`;
  },

  getSubtitlesDownloadUrl: (id: string): string => {
    return `/api/dubbing/jobs/${id}/subtitles`;
  },
};
