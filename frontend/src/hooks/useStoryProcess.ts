import { useMutation } from '@tanstack/react-query';
import type { ProcessStoryRequest, ProcessStoryResponse } from '../types/index.js';
import { storyApi } from '../api/story.api.js';

export function useStoryProcess() {
  const mutation = useMutation<ProcessStoryResponse, Error, ProcessStoryRequest>({
    mutationFn: (data: ProcessStoryRequest) => storyApi.processStory(data),
  });

  return {
    processStory: mutation.mutate,
    processStoryAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
