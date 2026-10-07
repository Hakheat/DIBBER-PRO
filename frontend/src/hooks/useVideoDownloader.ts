import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { downloadVideoWithProgress, fetchVideoInfo, type DownloadProgress } from '../api/video.api.js';
import type { VideoDownloadRequest, VideoInfo } from '../types/index.js';

export function useVideoDownloader() {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const infoMutation = useMutation<VideoInfo, Error, string>({
    mutationFn: (url: string) => fetchVideoInfo(url),
  });

  const downloadMutation = useMutation<void, Error, VideoDownloadRequest>({
    mutationFn: async (params: VideoDownloadRequest) => {
      setDownloadProgress({ status: 'processing', progress: 10, message: 'Starting download process...' });
      await downloadVideoWithProgress(params, (prog) => {
        setDownloadProgress(prog);
      });
    },
  });

  const resetDownload = () => {
    downloadMutation.reset();
    setDownloadProgress(null);
  };

  return {
    // Info
    fetchInfo: infoMutation.mutate,
    fetchInfoAsync: infoMutation.mutateAsync,
    videoInfo: infoMutation.data,
    isFetchingInfo: infoMutation.isPending,
    infoError: infoMutation.error,
    resetInfo: infoMutation.reset,

    // Download
    download: downloadMutation.mutate,
    downloadAsync: downloadMutation.mutateAsync,
    isDownloading: downloadMutation.isPending,
    downloadProgress,
    downloadError: downloadMutation.error,
    isDownloadSuccess: downloadMutation.isSuccess,
    resetDownload,
  };
}
