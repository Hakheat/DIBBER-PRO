import { apiClient } from './client.js';
import type { VideoDownloadRequest, VideoInfo } from '../types/index.js';

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  return await apiClient<VideoInfo>('/api/video/info', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export interface DownloadProgress {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}

export async function downloadVideoWithProgress(
  params: VideoDownloadRequest,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  // 1. Initiate asynchronous download job
  const prepRes = await fetch('/api/video/download/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!prepRes.ok) {
    let errMsg = 'Failed to initiate download';
    try {
      const err = await prepRes.json();
      if (err.error?.message) errMsg = err.error.message;
    } catch {
      // fallback
    }
    throw new Error(errMsg);
  }

  const { jobId } = await prepRes.json();
  onProgress?.({ status: 'processing', progress: 15, message: 'Processing stream...' });

  // 2. Poll job status
  let attempts = 0;
  const maxAttempts = 300; // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 1200));
    attempts++;

    try {
      const statusRes = await fetch(`/api/video/download/status/${jobId}`);
      if (!statusRes.ok) continue;

      const data = await statusRes.json();

      if (data.status === 'processing') {
        onProgress?.({
          status: 'processing',
          progress: data.progress || 35,
          message: data.message || 'Downloading media...'
        });
      } else if (data.status === 'completed') {
        onProgress?.({
          status: 'completed',
          progress: 100,
          message: 'Download complete! Saving...'
        });

        // Trigger native browser download directly
        const a = document.createElement('a');
        a.href = data.downloadUrl || `/api/video/download/file/${jobId}`;
        a.setAttribute('download', data.filename || 'download.mp4');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } else if (data.status === 'failed') {
        throw new Error(data.error || 'Server failed to process the download.');
      }
    } catch (pollErr: unknown) {
      // Re-throw genuine errors immediately (e.g. DRM protection, download failures)
      if (pollErr instanceof Error && !pollErr.message.toLowerCase().includes('failed to fetch')) {
        throw pollErr;
      }
      // Temporary network fluctuation during polling, continue
    }
  }

  throw new Error('Download request timed out. Please try again.');
}

export async function downloadVideo(params: VideoDownloadRequest): Promise<void> {
  return await downloadVideoWithProgress(params);
}
