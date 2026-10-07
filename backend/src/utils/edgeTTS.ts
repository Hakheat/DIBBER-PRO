import WebSocket from 'ws';
import { createHash, randomBytes } from 'crypto';
import { logger } from './logger.js';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

/**
 * Generates the Sec-MS-GEC anti-abuse token required for Microsoft Edge Neural Speech
 */
function generateSecMsGec(): string {
  const unixSeconds = BigInt(Math.floor(Date.now() / 1000));
  const winEpoch = unixSeconds + 11644473600n;
  const rounded = winEpoch - (winEpoch % 300n);
  const fileTimeTicks = rounded * 10000000n;
  const strToHash = `${fileTimeTicks.toString()}${TRUSTED_CLIENT_TOKEN}`;
  return createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

function connectId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Enhances Khmer and multilingual text with natural human breathing pauses
 * and style-specific cadence.
 */
export function enhanceHumanSpeechSSML(
  text: string,
  style: string = 'general',
): string {
  // XML escaping
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Human breathing pauses based on punctuation
  const pauseKhan =
    style === 'horror' ? '550ms' : style === 'news' ? '300ms' : style === 'sponsor' ? '220ms' : '350ms';
  const pauseComma = style === 'horror' ? '280ms' : '180ms';

  escaped = escaped
    .replace(/([។.!?])/g, `$1<break time='${pauseKhan}'/>`)
    .replace(/([,،])/g, `$1<break time='${pauseComma}'/>`);

  return escaped;
}

/**
 * Resolves short voice IDs to Microsoft Server Speech Voice names
 */
export function resolveEdgeVoiceName(voiceId: string): string {
  if (voiceId.startsWith('Microsoft Server Speech')) {
    return voiceId;
  }

  // Common high-fidelity neural voices
  if (voiceId === 'km-KH-SreymomNeural' || voiceId.includes('female') || voiceId.includes('Sreymom')) {
    return 'Microsoft Server Speech Text to Speech Voice (km-KH, SreymomNeural)';
  }
  if (voiceId === 'km-KH-PisethNeural' || voiceId.includes('male') || voiceId.includes('Piseth')) {
    return 'Microsoft Server Speech Text to Speech Voice (km-KH, PisethNeural)';
  }
  if (voiceId === 'en-US-JennyNeural') {
    return 'Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)';
  }
  if (voiceId === 'en-US-GuyNeural') {
    return 'Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)';
  }

  const match = /^([a-z]{2,})-([A-Z]{2,})-(.+Neural)$/.exec(voiceId);
  if (match) {
    const [, lang, region, name] = match;
    return `Microsoft Server Speech Text to Speech Voice (${lang}-${region}, ${name})`;
  }

  return 'Microsoft Server Speech Text to Speech Voice (km-KH, PisethNeural)';
}

/**
 * Synthesizes 100% human-grade neural voice using Microsoft Edge Neural Speech
 */
export async function synthesizeEdgeNeural(
  text: string,
  voiceId: string = 'km-KH-PisethNeural',
  style: string = 'general',
  speed?: number,
  pitch?: number,
): Promise<Buffer> {
  // Check if voiceId corresponds to one of the 10 fine-tuned Khmer voice presets
  const { getKhmerVoicePreset } = await import('../constants/khmerVoices.js');
  const preset = getKhmerVoicePreset(voiceId);

  const effectiveStyle = style && style !== 'general' ? style : (preset?.style || style);
  const effectiveSpeed = typeof speed === 'number' ? speed : (preset?.speed ?? 1.0);
  const effectivePitch = typeof pitch === 'number' ? pitch : (preset?.pitch ?? 0);

  return new Promise((resolve, reject) => {
    const secMsGec = generateSecMsGec();
    const connId = connectId();
    const wssUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connId}`;

    const voiceName = resolveEdgeVoiceName(voiceId);

    // Style-driven human prosody
    let rateStr = '+0%';
    let pitchStr = '+0Hz';

    if (effectiveStyle === 'news') {
      rateStr = '+3%';
      pitchStr = '+0Hz';
    } else if (effectiveStyle === 'horror') {
      rateStr = '-14%';
      pitchStr = '-8Hz';
    } else if (effectiveStyle === 'sponsor') {
      rateStr = '+10%';
      pitchStr = '+5Hz';
    }

    if (typeof effectiveSpeed === 'number') {
      const pct = Math.round((effectiveSpeed - 1) * 100);
      rateStr = `${pct >= 0 ? '+' : ''}${pct}%`;
    }
    if (typeof effectivePitch === 'number') {
      const hz = Math.round(effectivePitch);
      pitchStr = `${hz >= 0 ? '+' : ''}${hz}Hz`;
    }

    const enhancedText = enhanceHumanSpeechSSML(text, style);
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='km-KH'><voice name='${voiceName}'><prosody pitch='${pitchStr}' rate='${rateStr}' volume='+0%'>${enhancedText}</prosody></voice></speak>`;

    const ws = new WebSocket(wssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
        Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    let isSettled = false;

    const timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      try {
        ws.terminate();
      } catch {
        // ignore
      }
      reject(new Error('Edge Neural TTS timeout after 3 seconds'));
    }, 3000);

    const audioChunks: Buffer[] = [];

    ws.on('unexpected-response', (_req, res) => {
      clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        try {
          ws.terminate();
        } catch {
          // ignore
        }
        reject(new Error(`Edge Neural unexpected HTTP response: ${res.statusCode}`));
      }
    });

    ws.on('open', () => {
      // 1. Send speech.config
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);

      // 2. Send SSML
      const reqId = connectId();
      const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (!isBinary) {
        const str = data.toString();
        if (str.includes('Path:turn.end')) {
          clearTimeout(timer);
          try {
            ws.close();
          } catch {
            // ignore
          }
          if (!isSettled) {
            isSettled = true;
            const combined = Buffer.concat(audioChunks);
            if (combined.length > 0) {
              resolve(combined);
            } else {
              reject(new Error('No audio data received from Edge Neural TTS'));
            }
          }
        }
      } else {
        const buf = Buffer.from(data as Buffer);
        if (buf.length > 2) {
          const headerLength = buf.readUInt16BE(0);
          const headerStr = buf.subarray(2, 2 + headerLength).toString('utf-8');
          if (headerStr.includes('Path:audio')) {
            const audioData = buf.subarray(2 + headerLength);
            if (audioData.length > 0) {
              audioChunks.push(audioData);
            }
          }
        }
      }
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        try {
          ws.terminate();
        } catch {
          // ignore
        }
        logger.warn('Edge Neural WebSocket error:', err);
        reject(err);
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        try {
          ws.terminate();
        } catch {
          // ignore
        }
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          logger.warn(`Edge Neural WebSocket closed without audio (code ${code}): ${reason?.toString() || ''}`);
          reject(new Error(`Edge Neural WebSocket closed without audio (code ${code})`));
        }
      }
    });
  });
}
