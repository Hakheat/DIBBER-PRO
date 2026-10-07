import crypto from 'crypto';
import fs from 'fs/promises';
import type { DubbingJob, DubbingOptions } from './dubbing.interface.js';
import { runDubbingPipeline } from './dubbingPipeline.service.js';
import { logger } from '../../utils/logger.js';

export class DubbingQueueService {
  private jobs: Map<string, DubbingJob> = new Map();
  private isProcessing = false;
  private maxConcurrent = 1; // 1 job at a time for optimal local CPU/GPU stability
  private activeJobsCount = 0;

  /**
   * Adds a new video dubbing job to the queue.
   */
  public enqueueJob(
    originalFileName: string,
    originalFilePath: string,
    fileSizeBytes: number,
    options: DubbingOptions,
  ): DubbingJob {
    const id = crypto.randomUUID();

    const job: DubbingJob = {
      id,
      originalFileName,
      originalFilePath,
      fileSizeBytes,
      options,
      status: 'queued',
      progress: 0,
      currentStage: 'Waiting in queue...',
      logs: [`[${new Date().toLocaleTimeString()}] Job queued for processing.`],
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    logger.info(`[Queue] Added new dubbing job ${id} (${originalFileName}). Total in queue: ${this.jobs.size}`);

    // Trigger queue worker
    this.processNext();

    return job;
  }

  public getJob(id: string): DubbingJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): DubbingJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  public retryJob(id: string): DubbingJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;

    job.status = 'queued';
    job.progress = 0;
    job.currentStage = 'Retrying job...';
    job.error = undefined;
    job.logs.push(`[${new Date().toLocaleTimeString()}] Retrying job...`);

    this.processNext();
    return job;
  }

  public async deleteJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    // Clean up files if needed
    try {
      if (job.outputVideoPath) {
        await fs.unlink(job.outputVideoPath).catch(() => {});
      }
    } catch {
      // ignore
    }

    return this.jobs.delete(id);
  }

  /**
   * Worker loop that picks up queued jobs and runs the pipeline.
   */
  private async processNext(): Promise<void> {
    if (this.activeJobsCount >= this.maxConcurrent) {
      return;
    }

    // Find first queued job
    const queuedJob = Array.from(this.jobs.values()).find((j) => j.status === 'queued');
    if (!queuedJob) {
      return;
    }

    this.activeJobsCount++;
    logger.info(`[Queue] Processing job ${queuedJob.id} (${queuedJob.originalFileName})`);

    try {
      const result = await runDubbingPipeline(
        queuedJob,
        (stage, progress, stageText, logMsg) => {
          queuedJob.status = stage;
          queuedJob.progress = progress;
          queuedJob.currentStage = stageText;
          if (logMsg) {
            queuedJob.logs.push(`[${new Date().toLocaleTimeString()}] ${logMsg}`);
          }
        },
      );

      queuedJob.outputVideoPath = result.finalVideoPath;
      queuedJob.outputSubtitlesPath = result.srtPath;
      queuedJob.completedAt = new Date().toISOString();
      queuedJob.status = 'finished';
      queuedJob.progress = 100;
      queuedJob.currentStage = 'Dubbing completed!';
      queuedJob.logs.push(`[${new Date().toLocaleTimeString()}] Pipeline completed successfully.`);
    } catch (err) {
      const errMsg = (err as Error).message || 'Unknown pipeline error';
      logger.error(`[Queue] Job ${queuedJob.id} failed:`, err);
      queuedJob.status = 'failed';
      queuedJob.error = errMsg;
      queuedJob.currentStage = 'Processing failed';
      queuedJob.logs.push(`[${new Date().toLocaleTimeString()}] Error: ${errMsg}`);
    } finally {
      this.activeJobsCount--;
      // Process next in line
      this.processNext();
    }
  }
}

export const dubbingQueue = new DubbingQueueService();
