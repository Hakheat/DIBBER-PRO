import fs from 'node:fs';
import type { NextFunction, Request, Response } from 'express';
import { VideoDownloadRequestSchema, VideoInfoRequestSchema } from '../types/index.js';
import { videoService } from '../services/video.service.js';
import { logger } from '../utils/logger.js';

export class VideoController {
  /**
   * POST /api/video/info
   */
  public async getInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = await VideoInfoRequestSchema.parseAsync(req.body);
      const info = await videoService.getVideoInfo(url);
      res.status(200).json(info);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/download
   * Or GET /api/video/download?url=...&quality=...&format=...
   */
  public async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Allow parameters via body or query for direct browser download links
      const rawParams = req.method === 'GET' ? req.query : req.body;
      const parsed = await VideoDownloadRequestSchema.parseAsync(rawParams);

      const { filePath, filename } = await videoService.downloadVideo(parsed);

      res.download(filePath, filename, (err) => {
        // Always clean up downloaded temporary file once streamed or on error
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            logger.warn(`Failed to unlink temporary file: ${filePath}`);
          }
        });

        if (err && !res.headersSent) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/download/prepare
   * Start asynchronous download job to avoid browser fetch timeouts
   */
  public async prepare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await VideoDownloadRequestSchema.parseAsync(req.body);
      const jobId = videoService.createJob(parsed);
      res.status(202).json({ jobId, status: 'processing' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/video/download/status/:jobId
   */
  public async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = videoService.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Download job not found or expired.' } });
        return;
      }

      res.status(200).json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        filename: job.filename,
        error: job.error,
        downloadUrl: job.status === 'completed' ? `/api/video/download/file/${job.id}` : undefined,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/video/download/file/:jobId
   * Direct download link for completed job
   */
  public async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = videoService.getJob(jobId);
      if (!job || job.status !== 'completed' || !job.filePath || !fs.existsSync(job.filePath)) {
        res.status(404).send('Download file not found or expired. Please initiate download again.');
        return;
      }

      const stats = fs.statSync(job.filePath);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Accept-Ranges', 'bytes');

      res.download(job.filePath, job.filename || 'download.mp4', (err) => {
        if (!err) {
          // Delay cleanup slightly to ensure stream is finished
          setTimeout(() => {
            videoService.cleanupJob(jobId);
          }, 5000);
        } else if (!res.headersSent) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const videoController = new VideoController();
