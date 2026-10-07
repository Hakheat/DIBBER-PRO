import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { MAX_STORY_CHARS } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface StoryInputProps {
  value: string;
  onChange: (value: string) => void;
  currentLang: UILanguage;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const StoryInput: React.FC<StoryInputProps> = ({
  value,
  onChange,
  currentLang,
  disabled = false,
  onKeyDown,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onChange(text.slice(0, MAX_STORY_CHARS));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const charCount = value.length;
  const isOverLimit = charCount > MAX_STORY_CHARS;

  return (
    <div className="flex-1 flex flex-col relative w-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.md"
        className="hidden"
        disabled={disabled}
      />

      {/* Main Clean Textarea */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('storyInputPlaceholder', currentLang)}
          disabled={disabled}
          className="w-full flex-1 bg-transparent p-4 sm:p-6 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm sm:text-base leading-khmer transition-all resize-y min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] font-sans"
        />
      </div>

      {/* Textarea Bottom Action Strip */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800/60"
            title="Upload .txt file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('uploadStoryFile', currentLang)}</span>
            <span className="sm:hidden">.txt</span>
          </button>

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800/60"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Character Count */}
        <span
          className={`font-mono text-xs ${
            isOverLimit ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {charCount.toLocaleString()} / {MAX_STORY_CHARS.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
