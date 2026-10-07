import path from 'path';
import fs from 'fs/promises';
import type { DubbingJob } from './dubbing.interface.js';
import { extractAudioFromVideo } from './modules/audioExtractor.js';
import { transcribeAudioLocally } from './modules/transcriber.js';
import { translateSegmentsLocally } from './modules/translator.js';
import { synthesizeSegmentsLocally } from './modules/synthesizer.js';
import { assembleDubbedVideo } from './modules/assembler.js';
import { logger } from '../../utils/logger.js';

/**
 * Executes the complete 5-step local AI video dubbing pipeline for a single job.
 */
export async function runDubbingPipeline(
  job: DubbingJob,
  onProgress: (stage: DubbingJob['status'], progress: number, stageText: string, logMsg?: string) => void,
): Promise<{ finalVideoPath: string; srtPath: string }> {
  const workDir = path.join(process.cwd(), 'temp', 'dubbing_jobs', job.id);
  await fs.mkdir(workDir, { recursive: true });

  logger.info(`[Job ${job.id}] Starting Dubbing Pipeline for: ${job.originalFileName}`);
  onProgress('extracting', 5, 'Extracting audio & separating tracks...', 'Starting FFmpeg extraction.');

  // Step 1: Audio Extraction & Separation
  const audioInfo = await extractAudioFromVideo(job.originalFilePath, workDir);
  job.durationSeconds = audioInfo.durationSeconds;
  onProgress('transcribing', 20, 'Transcribing speech & extracting timestamps...', `Extracted 16kHz audio (${audioInfo.durationSeconds}s).`);

  // Step 2: Speech-to-Text (STT) & Timestamping
  const rawSegments = await transcribeAudioLocally(
    audioInfo.audioWavPath,
    audioInfo.durationSeconds,
    (pct, msg) => {
      onProgress('transcribing', 20 + Math.round(pct * 0.2), msg);
    },
  );
  job.segments = rawSegments;
  onProgress('translating', 40, `Translating ${rawSegments.length} segments to ${job.options.targetLanguage.toUpperCase()}...`, `Identified ${rawSegments.length} dialogue segments.`);

  // Step 3: Local Translation
  const translatedSegments = await translateSegmentsLocally(
    rawSegments,
    job.options.targetLanguage,
    job.options.style || 'general',
    (pct, idx) => {
      onProgress('translating', 40 + Math.round(pct * 0.2), `Translating segment ${idx}/${rawSegments.length}...`);
    },
  );
  job.segments = translatedSegments;
  onProgress('generating_audio', 60, 'Generating human voiceovers & auto-pacing...', 'Translation completed.');

  // Step 4: Hyper-Realistic Voiceover Synthesis & Auto-Pacing
  const synthesizedSegments = await synthesizeSegmentsLocally(
    translatedSegments,
    workDir,
    {
      targetLanguage: job.options.targetLanguage,
      voiceId: job.options.voiceId,
      style: job.options.style,
      autoPacing: job.options.autoPacing,
    },
    (pct, idx) => {
      onProgress('generating_audio', 60 + Math.round(pct * 0.2), `Synthesizing voice ${idx}/${translatedSegments.length}...`);
    },
  );
  job.segments = synthesizedSegments;
  onProgress('editing', 80, 'Mixing audio tracks, burning subtitles & remuxing video...', 'Voice synthesis completed.');

  // Step 5: Video/Audio Assembly & Editing
  const outputFileName = `dubbed_${path.parse(job.originalFileName).name}.mp4`;
  const result = await assembleDubbedVideo(
    job.originalFilePath,
    audioInfo.bgmAudioPath,
    synthesizedSegments,
    workDir,
    {
      duckingVolume: job.options.duckingVolume,
      burnSubtitles: job.options.burnSubtitles,
      outputFileName,
    },
    (pct, msg) => {
      onProgress('editing', 80 + Math.round(pct * 0.2), msg);
    },
  );

  onProgress('finished', 100, 'Video dubbing completed successfully!', `Final video saved: ${result.finalVideoPath}`);
  return result;
}
