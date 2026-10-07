import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import { logger } from '../../../utils/logger.js';

/**
 * Returns the path to the ffmpeg executable.
 */
export function getFfmpegPath(): string {
  if (ffmpegStatic && typeof ffmpegStatic === 'string') {
    return ffmpegStatic;
  }
  return 'ffmpeg';
}

/**
 * Executes an FFmpeg command as a Promise.
 */
export async function runFfmpeg(args: string[], onProgress?: (log: string) => void): Promise<void> {
  const binary = getFfmpegPath();

  return new Promise((resolve, reject) => {
    logger.info(`Executing FFmpeg: ${binary} ${args.slice(0, 8).join(' ')}...`);
    const proc = spawn(binary, args, { windowsHide: true });

    let stderrBuffer = '';

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString('utf-8');
      stderrBuffer += text;
      if (onProgress) {
        onProgress(text);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(`FFmpeg failed with exit code ${code}:`, { stderr: stderrBuffer.slice(-500) });
        reject(new Error(`FFmpeg process failed with exit code ${code}. ${stderrBuffer.slice(-300)}`));
      }
    });

    proc.on('error', (err) => {
      logger.error('FFmpeg process launch error:', err);
      reject(err);
    });
  });
}
