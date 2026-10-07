import path from 'path';
import fs from 'fs/promises';
import type { TranscriptSegment } from '../dubbing.interface.js';
import { runFfmpeg } from './ffmpegHelper.js';
import { logger } from '../../../utils/logger.js';

/**
 * Formats seconds into SRT timestamp (HH:MM:SS,mmm)
 */
function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Generates SubRip (.srt) subtitle file from segments.
 */
export async function generateSrtFile(
  segments: TranscriptSegment[],
  outputPath: string,
): Promise<string> {
  const lines: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const text = s.translatedText || s.text;
    lines.push(`${i + 1}`);
    lines.push(`${formatSrtTimestamp(s.start)} --> ${formatSrtTimestamp(s.end)}`);
    lines.push(text);
    lines.push('');
  }

  await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
  return outputPath;
}

/**
 * Builds the composite dubbed speech track and mixes it with ducked background audio.
 */
export async function assembleDubbedVideo(
  originalVideoPath: string,
  bgmAudioPath: string,
  segments: TranscriptSegment[],
  workDir: string,
  options: {
    duckingVolume?: number;
    burnSubtitles?: boolean;
    outputFileName?: string;
  },
  onProgress?: (progressPercent: number, stage: string) => void,
): Promise<{ finalVideoPath: string; srtPath: string }> {
  const validSegments = segments.filter((s) => Boolean(s.audioPath));
  const srtPath = path.join(workDir, 'subtitles.srt');
  await generateSrtFile(segments, srtPath);

  const finalVideoPath = path.join(
    workDir,
    options.outputFileName || 'dubbed_output.mp4',
  );

  if (validSegments.length === 0) {
    // If no audio segments, copy original video
    await fs.copyFile(originalVideoPath, finalVideoPath);
    return { finalVideoPath, srtPath };
  }

  // 1. Build complex FFmpeg filter to position each speech segment at its exact start timestamp
  // Example: [0:a]adelay=1500|1500[a0]; [1:a]adelay=6000|6000[a1]; [a0][a1]amix=inputs=2[speech]
  const inputArgs: string[] = [];
  const delayFilters: string[] = [];
  const mixInputs: string[] = [];

  for (let i = 0; i < validSegments.length; i++) {
    const seg = validSegments[i];
    inputArgs.push('-i', seg.audioPath!);

    const delayMs = Math.round(seg.start * 1000);
    delayFilters.push(`[${i}:a]adelay=${delayMs}|${delayMs}[a${i}]`);
    mixInputs.push(`[a${i}]`);
  }

  const mergedSpeechPath = path.join(workDir, 'merged_dubbed_speech.wav');
  const speechFilter = `${delayFilters.join(';')};${mixInputs.join('')}amix=inputs=${mixInputs.length}:dropout_transition=0:normalize=0[speech_out]`;

  logger.info(`Merging ${validSegments.length} speech segments into single timeline track...`);
  if (onProgress) onProgress(60, 'Stitching voice segments along timeline...');

  await runFfmpeg([
    '-y',
    ...inputArgs,
    '-filter_complex', speechFilter,
    '-map', '[speech_out]',
    mergedSpeechPath,
  ]);

  // 2. Mix dubbed speech track with background audio (with ducking) and video stream
  logger.info('Mixing dubbed speech with video and background track...');
  if (onProgress) onProgress(80, 'Mixing audio tracks & remuxing video...');

  const duckVol = options.duckingVolume !== undefined ? options.duckingVolume : 0.25;

  // Filter: duck bgm by duckVol (e.g. 0.25) and mix with speech at 1.0 volume
  // [1:a]volume=0.25[bgm];[2:a]volume=1.2[vox];[bgm][vox]amix=inputs=2:duration=first[aout]
  const remuxArgs: string[] = [
    '-y',
    '-i', originalVideoPath,     // [0:v], [0:a]
    '-i', bgmAudioPath,          // [1:a]
    '-i', mergedSpeechPath,      // [2:a]
  ];

  let filterComplex = `[1:a]volume=${duckVol}[bgm];[2:a]volume=1.2[vox];[bgm][vox]amix=inputs=2:duration=first:dropout_transition=0[aout]`;
  const mapArgs = ['-map', '0:v', '-map', '[aout]'];
  const codecArgs = ['-c:a', 'aac', '-b:a', '192k'];

  if (options.burnSubtitles) {
    const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplex = `[0:v]subtitles='${escapedSrt}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1'[vout];` + filterComplex;
    mapArgs[0] = '-map';
    mapArgs[1] = '[vout]';
    codecArgs.push('-c:v', 'libx264', '-preset', 'fast');
  } else {
    codecArgs.push('-c:v', 'copy');
  }

  remuxArgs.push(
    '-filter_complex', filterComplex,
    ...mapArgs,
    ...codecArgs,
    '-shortest',
    finalVideoPath,
  );

  await runFfmpeg(remuxArgs);

  logger.info(`Dubbed video generated successfully: ${finalVideoPath}`);
  if (onProgress) onProgress(100, 'Video dubbing completed!');

  return { finalVideoPath, srtPath };
}
