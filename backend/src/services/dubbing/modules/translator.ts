import type { TranscriptSegment } from '../dubbing.interface.js';
import { translateUniversal, formatKhmerStyle } from '../../llm/nlpEngine.js';
import { logger } from '../../../utils/logger.js';

/**
 * Translates text using local Ollama model if running on machine (http://127.0.0.1:11434).
 */
async function translateWithLocalOllama(
  text: string,
  targetLang: string,
  model = 'llama3',
): Promise<string | null> {
  try {
    const prompt = `Translate the following speech into ${targetLang}. Only return the direct translation without explanation or notes:\n\n${text}`;
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { response?: string };
      if (data.response) {
        return data.response.trim();
      }
    }
  } catch {
    // Local Ollama is not active or not running on port 11434
  }
  return null;
}

/**
 * Translates all segments locally while preserving timestamps and structure.
 */
export async function translateSegmentsLocally(
  segments: TranscriptSegment[],
  targetLanguage: string,
  style: 'general' | 'news' | 'horror' | 'sponsor' = 'general',
  onProgress?: (progressPercent: number, segmentIndex: number) => void,
): Promise<TranscriptSegment[]> {
  logger.info(`Translating ${segments.length} segments to target language "${targetLanguage}" with style "${style}"`);

  const translatedSegments: TranscriptSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (onProgress) {
      const pct = Math.round(((i + 1) / segments.length) * 100);
      onProgress(pct, i + 1);
    }

    let translated = '';

    // 1. Try Local Ollama LLM first
    const ollamaResult = await translateWithLocalOllama(seg.text, targetLanguage);
    if (ollamaResult) {
      translated = ollamaResult;
    } else {
      // 2. Fast Universal Neural Translation Engine
      const rawTrans = await translateUniversal(seg.text, targetLanguage);
      translated = targetLanguage === 'km' ? formatKhmerStyle(rawTrans, style) : rawTrans;
    }

    translatedSegments.push({
      ...seg,
      translatedText: translated || seg.text,
    });
  }

  return translatedSegments;
}
