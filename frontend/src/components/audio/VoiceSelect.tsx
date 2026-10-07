import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import type { VoiceInfo } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface VoiceSelectProps {
  voices: VoiceInfo[];
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const VoiceSelect: React.FC<VoiceSelectProps> = ({
  voices,
  selectedVoiceId,
  onChange,
  currentLang,
  disabled = false,
}) => {
  const clonedVoices = voices.filter((v) => v.isCloned);
  const khmerVoices = voices.filter((v) => !v.isCloned && (v.id.includes('km-KH') || v.language === 'km'));
  const otherVoices = voices.filter((v) => !v.isCloned && !v.id.includes('km-KH') && v.language !== 'km');

  const getVoiceDisplayName = (v: VoiceInfo) => {
    if (v.id.startsWith('km-clone-female')) {
      return `🇰🇭 👩 [ស្រី] ${v.name} (១០០% ដូចមនុស្ស)`;
    }
    if (v.id.startsWith('km-clone-male')) {
      return `🇰🇭 👨 [ប្រុស] ${v.name} (១០០% ដូចមនុស្ស)`;
    }
    if (v.id === 'km-KH-PisethNeural') {
      return currentLang === 'km'
        ? '🇰🇭 👨 ពិសិដ្ឋ (Piseth) — សំឡេងប្រុសមនុស្សពិតៗ ១០០% ក្បោះក្បាយ'
        : '🇰🇭 Piseth (Khmer Male) — 100% Natural Human Voice';
    }
    if (v.id === 'km-KH-SreymomNeural') {
      return currentLang === 'km'
        ? '🇰🇭 👩 ស្រីមុំ (Sreymom) — សំឡេងស្រីមនុស្សពិតៗ ១០០% ស្រទន់ រស់រវើក'
        : '🇰🇭 Sreymom (Khmer Female) — 100% Natural Human Voice';
    }
    return `${v.name} • ${v.provider.toUpperCase()}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>
          {currentLang === 'km' ? 'ជ្រើសរើសសំឡេងមនុស្សពិតៗ (100% Human Voice)' : t('voiceSelectLabel', currentLang)}
        </span>
      </label>

      <div className="relative">
        <select
          value={selectedVoiceId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || voices.length === 0}
          className="w-full appearance-none rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm cursor-pointer disabled:opacity-50 shadow-inner font-medium"
        >
          {khmerVoices.length > 0 && (
            <optgroup label="🇰🇭 សំឡេងមនុស្សពិតៗជាភាសាខ្មែរ (100% Khmer Neural Voices)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
              {khmerVoices.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {getVoiceDisplayName(v)}
                </option>
              ))}
            </optgroup>
          )}

          {clonedVoices.length > 0 && (
            <optgroup label="✨ សំឡេងមនុស្សពិតៗ ១០០% (10 Khmer Voices + Custom Clones)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
              {clonedVoices.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {v.id.startsWith('km-clone-female')
                    ? `👩 [ស្រី] ${v.name} (១០០% ដូចមនុស្ស)`
                    : v.id.startsWith('km-clone-male')
                    ? `👨 [ប្រុស] ${v.name} (១០០% ដូចមនុស្ស)`
                    : `🎙️ ${v.name} (Custom Clone)`}
                </option>
              ))}
            </optgroup>
          )}

          {otherVoices.length > 0 && (
            <optgroup label="🌐 International Voices (English, Thai, etc.)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {otherVoices.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {getVoiceDisplayName(v)}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {clonedVoices.length > 0 && (
        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{clonedVoices.length} custom cloned voice(s) available</span>
        </div>
      )}
    </div>
  );
};
