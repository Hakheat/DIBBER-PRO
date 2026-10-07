export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  azureVoice?: string;
  googleVoice?: string;
  elevenlabsSupported?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ភាសាខ្មែរ',
    azureVoice: 'km-KH-PisethNeural',
    googleVoice: 'km-KH-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    azureVoice: 'en-US-JennyNeural',
    googleVoice: 'en-US-Neural2-F',
    elevenlabsSupported: true,
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    azureVoice: 'th-TH-PremwadeeNeural',
    googleVoice: 'th-TH-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    azureVoice: 'vi-VN-HoaiMyNeural',
    googleVoice: 'vi-VN-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文',
    azureVoice: 'zh-CN-XiaoxiaoNeural',
    googleVoice: 'cmn-CN-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    azureVoice: 'fr-FR-DeniseNeural',
    googleVoice: 'fr-FR-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    azureVoice: 'es-ES-ElviraNeural',
    googleVoice: 'es-ES-Standard-A',
    elevenlabsSupported: true,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    azureVoice: 'ja-JP-NanamiNeural',
    googleVoice: 'ja-JP-Standard-A',
    elevenlabsSupported: true,
  },
];

export const DEFAULT_LANGUAGE = 'km';
