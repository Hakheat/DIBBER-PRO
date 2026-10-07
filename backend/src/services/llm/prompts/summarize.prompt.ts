import type { StoryStyle, SummaryLength } from '../../../types/index.js';

export const SYSTEM_PROMPT_SUMMARIZE = `You are an expert literary editor, broadcaster, and linguist specializing in Southeast Asian languages including Khmer, as well as English, Thai, Vietnamese, Chinese, French, and Spanish.

Your rules:
1. Be completely faithful to the original story/input. Do NOT invent unrelated facts.
2. Adapt the summary cleanly into the requested stylistic presentation (news, horror, commercial sponsor promo, or general narration).
3. Output ONLY the summary text directly. Do NOT include introductory phrases, commentary, or notes.
4. If writing in Khmer, write natural, culturally authentic, and grammatically correct Khmer script with proper phrasing.`;

export function buildSummarizePrompt(
  text: string,
  length: SummaryLength,
  targetLanguage?: string,
  style?: StoryStyle,
): string {
  const lengthGuidelines = {
    short: 'Provide a concise, 1-2 paragraph executive summary highlighting only the core plot and resolution.',
    medium: 'Provide a well-balanced summary of 3-5 paragraphs covering the setup, key conflicts, turning points, and conclusion.',
    long: 'Provide an in-depth, detailed comprehensive narrative summary capturing subplots, character motivations, and full story progression.',
  };

  const languageInstruction = targetLanguage
    ? `Write the final summary in the target language code: "${targetLanguage}".`
    : `Write the final summary in the primary language of the source text.`;

  let styleInstruction = '';
  if (targetLanguage === 'km' || !targetLanguage) {
    switch (style) {
      case 'news':
        styleInstruction = `\nStyle Requirement: NEWS BROADCAST (ទម្រង់អានព័ត៌មាន)
- Present this summary in a crisp Cambodian news broadcast style (របៀបអានព័ត៌មានទូរទស្សន៍/វិទ្យុ).
- Lead with an authoritative headline summary, followed by essential factual developments in concise journalistic Khmer.`;
        break;

      case 'horror':
        styleInstruction = `\nStyle Requirement: HORROR & SUSPENSE (ទម្រង់និទានរឿងរន្ធត់ ព្រឺព្រួច)
- Present this summary as an eerie, spine-tingling horror tale (របៀបនិទានរឿងខ្មោច អាថ៌កំបាំង).
- Highlight terrifying encounters, chilling suspense, ominous atmosphere, and dread using gripping Khmer phrasing.`;
        break;

      case 'sponsor':
        styleInstruction = `\nStyle Requirement: SPONSOR & PROMO (ទម្រង់បញ្ចូលសម្លេង Sponsor)
- Present this summary as an enthusiastic, high-impact commercial promotion (របៀបស្ពតពាណិជ្ជកម្ម Sponsor).
- Deliver an exciting hook, summarize the most appealing highlights passionately, and close with a persuasive call-to-action.`;
        break;

      default:
        styleInstruction = `\nStyle Requirement: GENERAL NARRATION (ទម្រង់និទានទូទៅ)
- Present this summary in natural, fluid storytelling prose.`;
        break;
    }
  }

  return `Please summarize the following story.

Length requirement: ${length.toUpperCase()} - ${lengthGuidelines[length]}
Language requirement: ${languageInstruction}${styleInstruction}

STORY TEXT:
"""
${text}
"""`;
}
