import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  checked,
  onChange,
  currentLang,
  disabled = false,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs leading-relaxed text-amber-950 dark:text-amber-100/90 font-medium">
            {t('consentText', currentLang)}
          </span>
        </label>
      </div>
    </div>
  );
};
