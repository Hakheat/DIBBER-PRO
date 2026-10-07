import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { dubbingQueue } from '../services/dubbing/dubbingQueue.service.js';
import type { DubbingOptions } from '../services/dubbing/dubbing.interface.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export class DubbingController {
  /**
   * Upload multiple video files and enqueue dubbing jobs
   */
  public async uploadBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No video files uploaded. Please upload at least one video.', 400, 'NO_FILES');
      }

      let options: DubbingOptions = {
        targetLanguage: 'km',
        voiceId: 'km-KH-PisethNeural',
        style: 'general',
        duckingVolume: 0.25,
        burnSubtitles: false,
        autoPacing: true,
      };

      if (req.body.options) {
        try {
          const parsed = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
          options = { ...options, ...parsed };
        } catch {
          // ignore parsing error
        }
      }

      // Enqueue all uploaded videos into the batch queue
      const createdJobs = files.map((file) => {
        return dubbingQueue.enqueueJob(file.originalname, file.path, file.size, options);
      });

      logger.info(`Successfully enqueued ${createdJobs.length} video dubbing jobs.`);
      res.status(201).json({
        success: true,
        message: `Successfully enqueued ${createdJobs.length} video dubbing jobs.`,
        jobs: createdJobs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all dubbing jobs
   */
  public async getJobs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = dubbingQueue.getAllJobs();
      res.status(200).json({ jobs });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single job details
   */
  public async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = dubbingQueue.getJob(id);
      if (!job) {
        throw new AppError(`Dubbing job ${id} not found`, 404, 'JOB_NOT_FOUND');
      }
      res.status(200).json({ job });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stream or download the completed dubbed video
   */
  public async downloadVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = dubbingQueue.getJob(id);
      if (!job || !job.outputVideoPath || !fs.existsSync(job.outputVideoPath)) {
        throw new AppError('Dubbed video is not ready or does not exist.', 404, 'FILE_NOT_READY');
      }

      const fileName = path.basename(job.outputVideoPath);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'video/mp4');

      const stream = fs.createReadStream(job.outputVideoPath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stream or download generated subtitle file (.srt)
   */
  public async downloadSubtitles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = dubbingQueue.getJob(id);
      if (!job || !job.outputSubtitlesPath || !fs.existsSync(job.outputSubtitlesPath)) {
        throw new AppError('Subtitles are not ready or do not exist.', 404, 'FILE_NOT_READY');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${id}_subtitles.srt"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');

      const stream = fs.createReadStream(job.outputSubtitlesPath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retry a failed job
   */
  public async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = dubbingQueue.retryJob(id);
      if (!job) {
        throw new AppError(`Dubbing job ${id} not found`, 404, 'JOB_NOT_FOUND');
      }
      res.status(200).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Directly transcribe an uploaded video into timestamped subtitle rows in Khmer
   */
  public async transcribeVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No video file provided for transcription.', 400, 'NO_FILE');
      }

      const targetLang = (req.body.targetLanguage as string) || 'km';
      const style = (req.body.style as string) || 'general';

      const workDir = path.join(process.cwd(), 'temp', 'transcribe', `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      await fs.promises.mkdir(workDir, { recursive: true });

      // 1. Check if video contains embedded subtitles (CC / subtitle track)
      const { extractEmbeddedSubtitles, transcribeAudioLocally } = await import('../services/dubbing/modules/transcriber.js');
      const { translateSegmentsLocally } = await import('../services/dubbing/modules/translator.js');
      const { extractAudioFromVideo } = await import('../services/dubbing/modules/audioExtractor.js');

      let rawSegments = await extractEmbeddedSubtitles(file.path, workDir);
      let durationSeconds = 30;

      if (!rawSegments || rawSegments.length === 0) {
        // 2. Extract audio from video directly
        let audioInfo: { audioWavPath: string; bgmAudioPath: string; durationSeconds: number };
        try {
          audioInfo = await extractAudioFromVideo(file.path, workDir);
          durationSeconds = audioInfo.durationSeconds;
        } catch (err) {
          logger.warn('Audio extraction warning, using fallback duration:', err);
          audioInfo = {
            audioWavPath: file.path,
            bgmAudioPath: file.path,
            durationSeconds: 30,
          };
        }

        // 3. Transcribe speech slices directly from the extracted audio
        rawSegments = await transcribeAudioLocally(audioInfo.audioWavPath, audioInfo.durationSeconds);
      } else {
        if (rawSegments.length > 0) {
          durationSeconds = Math.ceil(rawSegments[rawSegments.length - 1].end);
        }
      }

      // 4. Translate / Format into target language (Khmer)
      const translated = await translateSegmentsLocally(rawSegments, targetLang, style as any);

      // 4. Map to frontend SubtitleRow structure
      const formatMmSs = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 100);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
      };

      const rows = translated.map((seg, idx) => ({
        id: idx + 1,
        start: formatMmSs(seg.start),
        end: formatMmSs(seg.end),
        startSeconds: seg.start,
        endSeconds: seg.end,
        khmerText: seg.translatedText || seg.text || `ប្រយោគទី ${idx + 1}`,
        voiceProfile: idx % 2 === 0 ? 'female_default' : 'male_default',
        voiceLabel: idx % 2 === 0 ? 'Default Female' : 'Default Male',
        gender: idx % 2 === 0 ? 'female' : 'male',
        colorTag: idx % 2 === 0 ? 'A4' : 'A2',
        speed: 1.0,
        audioStatus: 'Ready',
      }));

      // Cleanup uploaded temp video
      fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
      fs.promises.unlink(file.path).catch(() => {});

      res.status(200).json({
        success: true,
        videoFileName: file.originalname,
        duration: durationSeconds,
        segments: rows,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Auto-Fit Silence Analysis: Detects silent periods in video audio using FFmpeg
   */
  public async detectSilence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No video file provided for silence detection', 400, 'NO_FILE_UPLOADED');
      }

      const noiseDb = req.body.noiseDb ? parseFloat(req.body.noiseDb) : -30;
      const minDuration = req.body.minDuration ? parseFloat(req.body.minDuration) : 0.35;

      const workDir = path.join(process.cwd(), 'temp', 'silence', `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      await fs.promises.mkdir(workDir, { recursive: true });

      const { extractAudioFromVideo } = await import('../services/dubbing/modules/audioExtractor.js');
      const { analyzeAudioSilence } = await import('../services/dubbing/modules/transcriber.js');

      let audioInfo: { audioWavPath: string; bgmAudioPath: string; durationSeconds: number };
      try {
        audioInfo = await extractAudioFromVideo(file.path, workDir);
      } catch (err) {
        audioInfo = {
          audioWavPath: file.path,
          bgmAudioPath: file.path,
          durationSeconds: 30,
        };
      }

      const analysis = await analyzeAudioSilence(audioInfo.audioWavPath, audioInfo.durationSeconds, noiseDb, minDuration);

      // Cleanup temp workDir and uploaded file
      fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
      fs.promises.unlink(file.path).catch(() => {});

      res.status(200).json({
        success: true,
        fileName: file.originalname,
        originalDuration: audioInfo.durationSeconds,
        trimmedDuration: analysis.trimmedDuration,
        totalSilenceDuration: analysis.totalSilenceDuration,
        silences: analysis.silences,
        speechIntervals: analysis.speechIntervals,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a job
   */
  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await dubbingQueue.deleteJob(id);
      if (!deleted) {
        throw new AppError(`Dubbing job ${id} not found`, 404, 'JOB_NOT_FOUND');
      }
      res.status(200).json({ success: true, message: `Job ${id} deleted.` });
    } catch (err) {
      next(err);
    }
  }
}

export const dubbingController = new DubbingController();
