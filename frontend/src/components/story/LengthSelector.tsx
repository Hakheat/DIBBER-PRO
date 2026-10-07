import React from 'react';
import type { SummaryLength } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface LengthSelectorProps {
  value: SummaryLength;
  onChange: (length: SummaryLength) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const LengthSelector: React.FC<LengthSelectorProps> = ({
  value,
  onChange,
  currentLang,
  disabled = false,
}) => {
  const options: Array<{ id: SummaryLength; label: string }> = [
    { id: 'short', label: t('lengthShort', currentLang) },
    { id: 'medium', label: t('lengthMedium', currentLang) },
    { id: 'long', label: t('lengthLong', currentLang) },
  ];

  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
