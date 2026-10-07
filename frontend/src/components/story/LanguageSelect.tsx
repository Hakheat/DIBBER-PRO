import React from 'react';
import { Globe2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';

interface LanguageSelectProps {
  value: string;
  onChange: (language: string) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="relative inline-flex items-center">
      <div className="absolute left-2.5 pointer-events-none text-indigo-600 dark:text-indigo-400">
        <Globe2 className="w-3.5 h-3.5" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 pl-8 pr-7 py-1.5 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-inner"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            {lang.name} ({lang.nativeName}) {lang.code === 'km' ? '★' : ''}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 text-slate-400 dark:text-slate-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
