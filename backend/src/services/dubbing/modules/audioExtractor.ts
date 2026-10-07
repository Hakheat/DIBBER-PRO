import path from 'path';
import fs from 'fs/promises';
import { runFfmpeg } from './ffmpegHelper.js';
import { logger } from '../../../utils/logger.js';

export interface ExtractedAudioInfo {
  audioWavPath: string;
  bgmAudioPath: string;
  durationSeconds: number;
}

/**
 * Extracts 16kHz mono audio for STT and separates/ducks background music.
 */
export async function extractAudioFromVideo(
  videoPath: string,
  workDir: string,
): Promise<ExtractedAudioInfo> {
  await fs.mkdir(workDir, { recursive: true });

  const audioWavPath = path.join(workDir, 'extracted_vocal_16k.wav');
  const bgmAudioPath = path.join(workDir, 'background_music.mp3');

  logger.info(`Extracting audio from ${videoPath} into ${audioWavPath}`);

  // 1. Extract 16kHz 16-bit Mono WAV for Whisper / STT processing
  // -vn: ignore video, -ac 1: mono, -ar 16000: 16kHz
  await runFfmpeg([
    '-y',
    '-i', videoPath,
    '-vn',
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    audioWavPath,
  ]);

  // 2. Extract background audio track with vocal attenuation (center channel suppression / bandpass)
  // to preserve background music and ambient sounds
  logger.info(`Extracting background audio into ${bgmAudioPath}`);
  try {
    await runFfmpeg([
      '-y',
      '-i', videoPath,
      '-vn',
      '-af', 'pan=stereo|c0=c0-c1|c1=c1-c0,volume=1.2',
      '-acodec', 'libmp3lame',
      '-b:a', '192k',
      bgmAudioPath,
    ]);
  } catch {
    // If stereo difference fails (e.g. mono source), extract raw audio as background
    await runFfmpeg([
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-b:a', '192k',
      bgmAudioPath,
    ]);
  }

  // 3. Probe duration from extracted WAV
  let durationSeconds = 30; // fallback default
  try {
    const stat = await fs.stat(audioWavPath);
    // 16000 samples/sec * 2 bytes/sample (16-bit) = 32000 bytes/sec
    durationSeconds = Math.max(1, Math.round(stat.size / 32000));
  } catch {
    // ignore
  }

  return {
    audioWavPath,
    bgmAudioPath,
    durationSeconds,
  };
}
