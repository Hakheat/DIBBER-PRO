import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CloneVoiceResponse, ClonedVoice, DeleteVoiceResponse } from '../types/index.js';
import { voiceApi } from '../api/voice.api.js';

export function useCloneVoice() {
  const queryClient = useQueryClient();

  const listQuery = useQuery<ClonedVoice[], Error>({
    queryKey: ['clonedVoices'],
    queryFn: () => voiceApi.getClonedVoices(),
  });

  const cloneMutation = useMutation<CloneVoiceResponse, Error, FormData>({
    mutationFn: (formData: FormData) => voiceApi.cloneVoice(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      queryClient.invalidateQueries({ queryKey: ['clonedVoices'] });
    },
  });

  const deleteMutation = useMutation<DeleteVoiceResponse, Error, string>({
    mutationFn: (id: string) => voiceApi.deleteVoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      queryClient.invalidateQueries({ queryKey: ['clonedVoices'] });
    },
  });

  return {
    clonedVoices: listQuery.data || [],
    isLoadingVoices: listQuery.isLoading,
    cloneVoice: cloneMutation.mutate,
    cloneVoiceAsync: cloneMutation.mutateAsync,
    isCloning: cloneMutation.isPending,
    cloneError: cloneMutation.error,
    deleteVoice: deleteMutation.mutate,
    deleteVoiceAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
