import type { StoryStyle, SummaryLength } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Free universal neural translation fallback using Google's public GTX API.
 * Accurately translates any language into authentic Khmer (or other targets) without API keys.
 */
export async function translateUniversal(text: string, targetLang = 'km'): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  try {
    const paragraphs = text.split(/\n+/);
    const translatedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const cleanPara = paragraph.trim();
      if (!cleanPara) continue;

      // Split large paragraphs into 500-char slices
      const slices: string[] = [];
      let remaining = cleanPara;
      while (remaining.length > 0) {
        if (remaining.length <= 500) {
          slices.push(remaining);
          break;
        }
        let breakIdx = remaining.lastIndexOf('. ', 500);
        if (breakIdx === -1) breakIdx = remaining.lastIndexOf(' ', 500);
        if (breakIdx === -1) breakIdx = 500;
        slices.push(remaining.slice(0, breakIdx + 1));
        remaining = remaining.slice(breakIdx + 1).trim();
      }

      const translatedSlices: string[] = [];
      for (const slice of slices) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
            targetLang,
          )}&dt=t&q=${encodeURIComponent(slice)}`;

          const response = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (response.ok) {
            const data = (await response.json()) as unknown;
            if (Array.isArray(data) && Array.isArray(data[0])) {
              const piece = data[0].map((item: unknown) => (Array.isArray(item) ? item[0] : '')).join('');
              translatedSlices.push(piece);
              continue;
            }
          }
        } catch (innerErr) {
          logger.warn('Failed slice translation, using original slice text:', innerErr);
        }
        translatedSlices.push(slice);
      }

      translatedParagraphs.push(translatedSlices.join(' '));
    }

    return translatedParagraphs.join('\n\n');
  } catch (err) {
    logger.warn('Universal translation failed, falling back to original text:', err);
    return text;
  }
}

/**
 * Adapt text into specific broadcast, storytelling, or sponsor advertising formats.
 */
export function formatKhmerStyle(text: string, style: StoryStyle = 'general'): string {
  const clean = text.trim();
  if (!clean) return '';

  switch (style) {
    case 'news': {
      const paragraphs = clean.split('\n\n').filter(Boolean);
      const headline = paragraphs[0]?.slice(0, 120) || 'ព្រឹត្តិការណ៍សំខាន់ប្រចាំថ្ងៃ';
      const body = paragraphs.slice(1).join('\n\n') || paragraphs[0];

      return `【 ព័ត៌មានទាន់ហេតុការណ៍ជាតិ & អន្តរជាតិ 】\n\n` +
        `ជម្រាបសួរលោកអ្នកនាងកញ្ញាជាទីមេត្រី! ព័ត៌មានសំខាន់ៗដែលទទួលបាននៅពេលនេះ៖\n\n` +
        `• ខ្លឹមសារសំខាន់៖ ${headline}\n\n` +
        `សេចក្តីលម្អិតនៃរបាយការណ៍៖\n${body}\n\n` +
        `ព័ត៌មានបន្ថែមយើងខ្ញុំនឹងបន្តជម្រាបជូននៅព្រឹត្តិបត្រព័ត៌មានបន្ទាប់ សូមអរគុណ និងសូមជម្រាបលា។`;
    }

    case 'horror': {
      return `【 និទានរឿងខ្មោច & អាថ៌កំបាំងព្រឺព្រួច 】\n\n` +
        `នៅរាត្រីដ៏ស្ងាត់ជ្រងំ ខ្យល់ត្រជាក់បានបក់កាត់យ៉ាងរន្ថើន... ដំណើររឿងដ៏រន្ធត់បានចាប់ផ្តើមឡើង៖\n\n` +
        `${clean}\n\n` +
        `សំឡេងខ្សឹបខ្សៀវដ៏អាថ៌កំបាំងនោះ នៅតែបន្លឺឡើងកណ្តាលភាពងងឹត ធ្វើឱ្យអ្នកដំណើរគ្រប់រូបព្រឺសម្បុរគីង្គក់រហូតមកដល់សព្វថ្ងៃ...`;
    }

    case 'sponsor': {
      const paragraphs = clean.split('\n\n').filter(Boolean);
      const mainPoint = paragraphs[0] || '';
      const supporting = paragraphs.slice(1).join('\n\n') || '';

      return `🎉【 ស្ពតពាណិជ្ជកម្ម & SPONSOR ពិសេស 】\n\n` +
        `ជំរាបសួរមិត្តៗទាំងអស់គ្នា! កុំឱ្យឱកាសចំណេញដ៏ពិសេសនេះកន្លងផុតទៅឱ្យសោះ!\n\n` +
        `✨ ចំណុចលេចធ្លោពិសេស៖\n${mainPoint}\n\n` +
        (supporting ? `💡 អត្ថប្រយោជន៍បន្ថែម៖\n${supporting}\n\n` : '') +
        `👉 ទាក់ទងជាវ ឬផ្ញើសារមកកាន់យើងឥឡូវនេះ ដើម្បីទទួលបានការផ្តល់ជូន និងកាដូពិសេសភ្លាមៗ!`;
    }

    case 'general':
    default:
      return clean;
  }
}

/**
 * Dynamic content summarizer extracting core plot and structuring by requested length.
 */
export function summarizeDynamic(text: string, length: SummaryLength = 'medium', style: StoryStyle = 'general'): string {
  const clean = text.trim();
  if (!clean) return '';

  const paragraphs = clean.split('\n\n').filter((p) => p.trim().length > 0);

  let summaryCore = '';
  if (paragraphs.length <= 1) {
    const sentences = clean.split(/(?<=[.!?។])/).filter((s) => s.trim().length > 0);
    if (length === 'short') {
      summaryCore = sentences.slice(0, 2).join(' ');
    } else if (length === 'medium') {
      summaryCore = sentences.slice(0, 4).join(' ');
    } else {
      summaryCore = sentences.join(' ');
    }
  } else {
    if (length === 'short') {
      summaryCore = paragraphs[0];
    } else if (length === 'medium') {
      const p1 = paragraphs[0];
      const pMid = paragraphs[Math.floor(paragraphs.length / 2)] || '';
      const pLast = paragraphs[paragraphs.length - 1];
      summaryCore = [p1, pMid, pLast].filter((p, i, arr) => p && arr.indexOf(p) === i).join('\n\n');
    } else {
      summaryCore = paragraphs.join('\n\n');
    }
  }

  return formatKhmerStyle(summaryCore, style);
}
