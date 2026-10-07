import { z } from 'zod';

export const VideoInfoRequestSchema = z.object({
  url: z.string().url('Please enter a valid video URL').trim(),
});

export type VideoInfoRequest = z.infer<typeof VideoInfoRequestSchema>;

export const VideoDownloadRequestSchema = z.object({
  url: z.string().url('Please enter a valid video URL').trim(),
  quality: z.enum(['best', '1080p', '720p', '480p', '360p', 'audio']).default('best'),
  format: z.enum(['mp4', 'mp3', 'm4a']).default('mp4'),
});

export type VideoDownloadRequest = z.infer<typeof VideoDownloadRequestSchema>;
