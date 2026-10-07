import React from 'react';
import { BookOpen, Ghost, Megaphone, Newspaper } from 'lucide-react';
import type { StoryStyle } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface StyleSelectorProps {
  value: StoryStyle;
  onChange: (style: StoryStyle) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  currentLang,
  disabled = false,
}) => {
  const options = [
    {
      id: 'news' as const,
      label: t('styleNews', currentLang),
      icon: Newspaper,
      badge: currentLang === 'km' ? 'ព័ត៌មាន' : 'News',
      hint: currentLang === 'km' ? 'អានព័ត៌មាន ផ្លូវការ ច្បាស់ៗ' : 'Formal News Broadcast',
      activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      activeIconColor: 'text-blue-100',
    },
    {
      id: 'horror' as const,
      label: t('styleHorror', currentLang),
      icon: Ghost,
      badge: currentLang === 'km' ? 'រន្ធត់' : 'Horror',
      hint: currentLang === 'km' ? 'និទានរឿងខ្មោច រន្ធត់ ព្រឺព្រួច' : 'Spine-chilling Horror Story',
      activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      activeIconColor: 'text-rose-100',
    },
    {
      id: 'sponsor' as const,
      label: t('styleSponsor', currentLang),
      icon: Megaphone,
      badge: currentLang === 'km' ? 'Sponsor' : 'Promo',
      hint: currentLang === 'km' ? 'បញ្ចូលសម្លេង Sponsor ស្ពតពាណិជ្ជកម្ម' : 'Commercial Sponsor Ad Voiceover',
      activeClass: 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30',
      activeIconColor: 'text-slate-950',
    },
    {
      id: 'general' as const,
      label: t('styleGeneral', currentLang),
      icon: BookOpen,
      badge: currentLang === 'km' ? 'ទូទៅ' : 'General',
      hint: currentLang === 'km' ? 'និទានរឿងបែបធម្មជាតិ' : 'Natural Story Narration',
      activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      activeIconColor: 'text-indigo-100',
    },
  ];

  return (
    <div className="inline-flex flex-wrap sm:flex-nowrap p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner gap-0.5">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            title={opt.hint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none ${
              isSelected
                ? `${opt.activeClass} font-bold scale-[1.02]`
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? opt.activeIconColor : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
