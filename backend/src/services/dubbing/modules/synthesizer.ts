import path from 'path';
import fs from 'fs/promises';
import type { TranscriptSegment } from '../dubbing.interface.js';
import { generateSpokenAudioBuffer } from '../../../utils/demoAudio.js';
import { runFfmpeg } from './ffmpegHelper.js';
import { logger } from '../../../utils/logger.js';

/**
 * Adjusts audio playback speed to match target duration using FFmpeg atempo filter.
 */
async function timeStretchAudio(
  inputAudioPath: string,
  outputAudioPath: string,
  targetDuration: number,
  currentDuration: number,
): Promise<void> {
  if (currentDuration <= 0 || targetDuration <= 0) {
    await fs.copyFile(inputAudioPath, outputAudioPath);
    return;
  }

  // Speed factor = current / target (e.g. 4s current / 3s target = 1.33x speed up)
  let speedRatio = currentDuration / targetDuration;

  // Clamp speed ratio between 0.7x and 1.8x for natural human sound
  speedRatio = Math.max(0.7, Math.min(1.8, speedRatio));

  // If very close to 1.0 (within 5%), avoid re-encoding
  if (Math.abs(speedRatio - 1.0) < 0.05) {
    await fs.copyFile(inputAudioPath, outputAudioPath);
    return;
  }

  logger.info(`Time-stretching audio: ${speedRatio.toFixed(2)}x to match target duration ${targetDuration}s`);

  // FFmpeg atempo supports 0.5 to 2.0
  await runFfmpeg([
    '-y',
    '-i', inputAudioPath,
    '-filter:a', `atempo=${speedRatio.toFixed(2)}`,
    '-vn',
    outputAudioPath,
  ]);
}

/**
 * Generates human voiceover for all segments and aligns their duration.
 */
export async function synthesizeSegmentsLocally(
  segments: TranscriptSegment[],
  workDir: string,
  options: {
    targetLanguage: string;
    voiceId?: string;
    style?: 'general' | 'news' | 'horror' | 'sponsor';
    autoPacing?: boolean;
  },
  onProgress?: (progressPercent: number, segmentIndex: number) => void,
): Promise<TranscriptSegment[]> {
  const audioDir = path.join(workDir, 'segments_audio');
  await fs.mkdir(audioDir, { recursive: true });

  const updatedSegments: TranscriptSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const textToSpeak = seg.translatedText || seg.text;
    const targetDuration = seg.end - seg.start;

    if (onProgress) {
      const pct = Math.round(((i + 1) / segments.length) * 100);
      onProgress(pct, i + 1);
    }

    const rawSegmentPath = path.join(audioDir, `seg_${seg.id}_raw.mp3`);
    const finalSegmentPath = path.join(audioDir, `seg_${seg.id}_aligned.mp3`);

    try {
      // 1. Synthesize 100% human-grade speech
      const audioBuffer = await generateSpokenAudioBuffer(
        textToSpeak,
        options.targetLanguage,
        options.voiceId,
        options.style || 'general',
      );
      await fs.writeFile(rawSegmentPath, audioBuffer);

      // Estimate duration from mp3 size (128kbps = 16000 bytes/sec)
      const stat = await fs.stat(rawSegmentPath);
      const estDuration = Math.max(0.5, stat.size / 16000);

      // 2. Auto-Pacing (Time-Stretch) if requested
      if (options.autoPacing !== false && targetDuration > 0.5) {
        await timeStretchAudio(rawSegmentPath, finalSegmentPath, targetDuration, estDuration);
      } else {
        await fs.copyFile(rawSegmentPath, finalSegmentPath);
      }

      updatedSegments.push({
        ...seg,
        audioPath: finalSegmentPath,
        duration: targetDuration,
      });
    } catch (err) {
      logger.error(`Synthesis error on segment ${seg.id}:`, err);
      updatedSegments.push(seg);
    }
  }

  return updatedSegments;
}
