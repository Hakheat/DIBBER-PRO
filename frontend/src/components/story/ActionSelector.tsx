import React from 'react';
import { AlignLeft, Globe, Layers } from 'lucide-react';
import type { StoryAction } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface ActionSelectorProps {
  value: StoryAction;
  onChange: (action: StoryAction) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  value,
  onChange,
  currentLang,
  disabled = false,
}) => {
  const options = [
    {
      id: 'summarize' as const,
      label: t('actionSummarize', currentLang),
      icon: AlignLeft,
      hint: currentLang === 'km' ? 'សង្ខេបចំណុចសំខាន់' : 'Key highlights',
    },
    {
      id: 'translate' as const,
      label: t('actionTranslate', currentLang),
      icon: Globe,
      hint: currentLang === 'km' ? 'បកប្រែពេញលេញ' : 'Full translation',
    },
    {
      id: 'both' as const,
      label: t('actionBoth', currentLang),
      icon: Layers,
      hint: currentLang === 'km' ? 'សង្ខេប & បកប្រែ' : 'Summary + Translation',
    },
  ];

  return (
    <div className="inline-flex flex-wrap sm:flex-nowrap p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
