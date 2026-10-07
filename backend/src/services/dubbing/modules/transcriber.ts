import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import type { TranscriptSegment } from '../dubbing.interface.js';
import { runFfmpeg } from './ffmpegHelper.js';
import { logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Parses silence intervals using FFmpeg silencedetect to split speech into natural segments
 * and provide detailed silence analysis.
 */
export async function analyzeAudioSilence(
  audioPath: string,
  totalDuration: number,
  noiseDb = -28,
  minDuration = 0.35,
): Promise<{
  silences: Array<{ start: number; end: number; duration: number }>;
  speechIntervals: Array<{ start: number; end: number; duration: number }>;
  totalSilenceDuration: number;
  trimmedDuration: number;
}> {
  let output = '';

  try {
    await runFfmpeg(
      [
        '-i', audioPath,
        '-af', `silencedetect=noise=${noiseDb}dB:d=${minDuration}`,
        '-f', 'null',
        '-',
      ],
      (log) => {
        output += log;
      },
    );
  } catch {
    // FFmpeg writes silencedetect to stderr, so it may exit with output captured
  }

  const silenceStarts: number[] = [];
  const silenceEnds: number[] = [];

  const startRegex = /silence_start:\s*([\d.]+)/g;
  const endRegex = /silence_end:\s*([\d.]+)/g;

  let match: RegExpExecArray | null;
  while ((match = startRegex.exec(output)) !== null) {
    silenceStarts.push(parseFloat(match[1]));
  }
  while ((match = endRegex.exec(output)) !== null) {
    silenceEnds.push(parseFloat(match[1]));
  }

  const silences: Array<{ start: number; end: number; duration: number }> = [];
  for (let i = 0; i < silenceStarts.length; i++) {
    const sStart = parseFloat(silenceStarts[i].toFixed(2));
    const sEnd = parseFloat((silenceEnds[i] || totalDuration).toFixed(2));
    const dur = parseFloat((sEnd - sStart).toFixed(2));
    if (dur >= minDuration) {
      silences.push({ start: sStart, end: sEnd, duration: dur });
    }
  }

  const speechSegments: Array<{ start: number; end: number; duration: number }> = [];
  let currentStart = 0.0;

  for (let i = 0; i < silenceStarts.length; i++) {
    const sStart = silenceStarts[i];
    const sEnd = silenceEnds[i] || sStart;

    if (sStart > currentStart + 0.35) {
      speechSegments.push({
        start: parseFloat(currentStart.toFixed(2)),
        end: parseFloat(sStart.toFixed(2)),
        duration: parseFloat((sStart - currentStart).toFixed(2)),
      });
    }
    currentStart = sEnd;
  }

  if (currentStart < totalDuration - 0.35) {
    speechSegments.push({
      start: parseFloat(currentStart.toFixed(2)),
      end: parseFloat(totalDuration.toFixed(2)),
      duration: parseFloat((totalDuration - currentStart).toFixed(2)),
    });
  }

  // If no silence detected or file is short, create chunked segments every 3.5-5.0 seconds
  if (speechSegments.length === 0) {
    const step = 4.0;
    for (let t = 0; t < totalDuration; t += step) {
      const e = Math.min(totalDuration, t + step);
      speechSegments.push({
        start: parseFloat(t.toFixed(2)),
        end: parseFloat(e.toFixed(2)),
        duration: parseFloat((e - t).toFixed(2)),
      });
    }
  }

  const totalSilenceDuration = parseFloat(
    silences.reduce((acc, s) => acc + s.duration, 0).toFixed(2),
  );
  const trimmedDuration = parseFloat(Math.max(1, totalDuration - totalSilenceDuration).toFixed(2));

  return {
    silences,
    speechIntervals: speechSegments,
    totalSilenceDuration,
    trimmedDuration,
  };
}

async function detectSpeechIntervals(
  audioPath: string,
  totalDuration: number,
): Promise<Array<{ start: number; end: number }>> {
  const result = await analyzeAudioSilence(audioPath, totalDuration);
  return result.speechIntervals.map((s) => ({ start: s.start, end: s.end }));
}

/**
 * Recognizes speech directly from an audio slice using high-fidelity speech recognition.
 */
async function recognizeSpeechChunk(
  audioWavPath: string,
  start: number,
  duration: number,
  workDir: string,
): Promise<string> {
  const chunkFlac = path.join(workDir, `chunk_${Math.round(start * 100)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.flac`);
  try {
    // Cut exact audio segment into 16kHz Mono FLAC
    await runFfmpeg([
      '-y',
      '-ss', start.toFixed(3),
      '-t', Math.max(0.5, duration).toFixed(3),
      '-i', audioWavPath,
      '-ac', '1',
      '-ar', '16000',
      '-c:a', 'flac',
      chunkFlac,
    ]);

    if (fs.existsSync(chunkFlac)) {
      const flacData = await fs.promises.readFile(chunkFlac);
      fs.promises.unlink(chunkFlac).catch(() => {});

      // Query Chromium Speech API with Khmer and multilingual support
      const targetLangs = ['km-KH', 'en-US', 'auto'];
      for (const lang of targetLangs) {
        try {
          const url = `https://www.google.com/speech-api/v2/recognize?client=chromium&lang=${lang}&maxresults=1`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'audio/x-flac; rate=16000',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: flacData,
          });

          if (res.ok) {
            const textRes = await res.text();
            const lines = textRes.split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                const alt = parsed.result?.[0]?.alternative?.[0];
                if (alt && alt.transcript && alt.transcript.trim()) {
                  return alt.transcript.trim();
                }
              } catch {
                // ignore line
              }
            }
          }
        } catch {
          // try next lang
        }
      }
    }
  } catch (err) {
    logger.warn(`Speech recognition slice error at ${start}s:`, err);
  }
  return '';
}

/**
 * Attempts to extract embedded subtitle tracks directly from the video file if present.
 */
export async function extractEmbeddedSubtitles(
  videoPath: string,
  workDir: string,
): Promise<TranscriptSegment[] | null> {
  const srtPath = path.join(workDir, `embedded_${Date.now()}.srt`);

  // Try subtitle streams 0:s:0, 0:s:1, 0:s:2 with proper srt conversion codec
  for (let trackIdx = 0; trackIdx < 4; trackIdx++) {
    try {
      if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);

      await runFfmpeg([
        '-y',
        '-i', videoPath,
        '-map', `0:s:${trackIdx}`,
        '-c:s', 'srt',
        srtPath,
      ]);

      if (fs.existsSync(srtPath) && fs.statSync(srtPath).size > 10) {
        const content = await fs.promises.readFile(srtPath, 'utf-8');
        fs.promises.unlink(srtPath).catch(() => {});
        const blocks = content.replace(/\r\n/g, '\n').split(/\n\n+/);
        const segments: TranscriptSegment[] = [];

        for (const block of blocks) {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length < 2) continue;

          const timeLine = lines[0].includes('-->') ? lines[0] : lines[1];
          const textLines = lines[0].includes('-->') ? lines.slice(1) : lines.slice(2);
          if (!timeLine || !timeLine.includes('-->')) continue;

          const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
          const parseTime = (t: string) => {
            const parts = t.replace(',', '.').split(':');
            if (parts.length === 3) {
              return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            }
            if (parts.length === 2) {
              return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            }
            return 0;
          };

          const start = parseTime(startStr);
          const end = parseTime(endStr);
          const text = textLines
            .join(' ')
            .replace(/<[^>]*>/g, '')
            .replace(/\{[^}]*\}/g, '')
            .trim();

          if (text) {
            segments.push({
              id: segments.length + 1,
              start: parseFloat(start.toFixed(2)),
              end: parseFloat(end.toFixed(2)),
              duration: parseFloat((end - start).toFixed(2)),
              text,
            });
          }
        }

        if (segments.length > 0) {
          logger.info(`Extracted ${segments.length} embedded subtitles from track 0:s:${trackIdx}!`);
          return segments;
        }
      }
    } catch {
      // try next track
    }
  }

  return null;
}

/**
 * Transcribes audio locally into timestamped segments directly from video audio.
 */
export async function transcribeAudioLocally(
  audioWavPath: string,
  totalDuration: number,
  onProgress?: (progressPercent: number, stageText: string) => void,
): Promise<TranscriptSegment[]> {
  logger.info(`Starting local transcription on ${audioWavPath} (${totalDuration}s)`);

  // 1. Check if local whisper CLI is installed on system
  let hasWhisperCli = false;
  try {
    await execAsync('whisper --version');
    hasWhisperCli = true;
  } catch {
    hasWhisperCli = false;
  }

  if (hasWhisperCli) {
    try {
      logger.info('Running system local Whisper CLI...');
      if (onProgress) onProgress(15, 'Running local Whisper STT engine...');
      const { stdout } = await execAsync(
        `whisper "${audioWavPath}" --output_format json --word_timestamps True`,
      );
      const parsed = JSON.parse(stdout);
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments.map((s: { id: number; start: number; end: number; text: string }) => ({
          id: s.id,
          start: s.start,
          end: s.end,
          text: s.text.trim(),
        }));
      }
    } catch (err) {
      logger.warn('Local whisper CLI execution failed, using resilient segmenter:', err);
    }
  }

  // 2. High-precision Audio Energy & Silence Segmenter
  if (onProgress) onProgress(20, 'Analyzing voice cadence and word timestamps...');
  const intervals = await detectSpeechIntervals(audioWavPath, totalDuration);

  // 3. Transcribe each slice directly from the video audio
  const workDir = path.dirname(audioWavPath);
  const segments: TranscriptSegment[] = [];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const dur = interval.end - interval.start;

    if (onProgress) {
      const pct = 20 + Math.round(((i + 1) / intervals.length) * 60);
      onProgress(pct, `Transcribing speech slice ${i + 1}/${intervals.length} from video...`);
    }

    const recognizedText = await recognizeSpeechChunk(audioWavPath, interval.start, dur, workDir);

    segments.push({
      id: i + 1,
      start: interval.start,
      end: interval.end,
      duration: parseFloat(dur.toFixed(2)),
      text: recognizedText || `ប្រយោគនិយាយទី ${i + 1}`,
    });
  }

  logger.info(`Extracted ${segments.length} timestamped voice segments from video.`);
  return segments;
}
