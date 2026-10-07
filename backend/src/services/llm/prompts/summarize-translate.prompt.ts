import type { StoryStyle, SummaryLength } from '../../../types/index.js';

export const SYSTEM_PROMPT_SUMMARIZE_TRANSLATE = `You are an elite literary scholar, voiceover writer, and translator fluent in Khmer and global languages.

Your task is to both:
1. Provide a faithful translation and stylistic adaptation of the original text into the requested target language.
2. Provide a compelling summary of the story in the requested target language according to the specified length.
3. If writing in Khmer, use authentic, grammatically pristine Khmer phrasing matched to the requested format style (news, horror, commercial sponsor promo, or general narration).

CRITICAL INSTRUCTION:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "summary": "The complete summary in the target language",
  "translation": "The full faithful translation in the target language"
}

Do NOT wrap in extra prose. You may format the output with or without markdown code fences (\`\`\`json ... \`\`\`), but the content must be valid JSON with escaped characters where necessary.`;

export function buildSummarizeTranslatePrompt(
  text: string,
  length: SummaryLength,
  targetLanguage: string,
  style?: StoryStyle,
): string {
  const lengthGuidelines = {
    short: 'Concise 1-2 paragraphs focusing on core plot.',
    medium: 'Balanced 3-5 paragraphs covering key scenes, character dynamics, and climax.',
    long: 'Comprehensive multi-paragraph deep narrative summary.',
  };

  let styleInstruction = '';
  if (targetLanguage === 'km' || !targetLanguage) {
    switch (style) {
      case 'news':
        styleInstruction = `\nStyle Format: NEWS BROADCAST (ទម្រង់អានព័ត៌មាន)
- Write both summary and translation in professional Cambodian news broadcast style (របៀបអានព័ត៌មានទូរទស្សន៍/វិទ្យុ).
- Use formal journalistic terminology, concise factual delivery, and clear authoritative pacing.`;
        break;

      case 'horror':
        styleInstruction = `\nStyle Format: HORROR & SUSPENSE (ទម្រង់និទានរឿងរន្ធត់ ព្រឺព្រួច)
- Write both summary and translation in spine-chilling horror story format (របៀបនិទានរឿងខ្មោច អាថ៌កំបាំង).
- Focus on scary sensory details, dark ominous tension, and dread suited for spine-tingling voiceovers.`;
        break;

      case 'sponsor':
        styleInstruction = `\nStyle Format: SPONSOR & PROMO (ទម្រង់បញ្ចូលសម្លេង Sponsor)
- Write both summary and translation as an energetic commercial advertisement voiceover (របៀបស្ពតពាណិជ្ជកម្ម Sponsor).
- Deliver an exciting hook, dynamic marketing highlights, and high-converting promotional energy.`;
        break;

      default:
        styleInstruction = `\nStyle Format: GENERAL NARRATION (ទម្រង់និទានទូទៅ)
- Use natural, fluid, expressive Khmer storytelling.`;
        break;
    }
  }

  return `Please perform BOTH summarization and full translation into target language "${targetLanguage}".

Summary Length Target: ${length.toUpperCase()} (${lengthGuidelines[length]})
Target Language: "${targetLanguage}"${styleInstruction}

Return strictly the JSON object with "summary" and "translation" keys.

STORY TEXT:
"""
${text}
"""`;
}
