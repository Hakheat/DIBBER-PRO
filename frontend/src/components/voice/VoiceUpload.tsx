import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_MB } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { formatFileSize, t } from '../../utils/format.js';
import { ErrorMessage } from '../ui/ErrorMessage.js';

interface VoiceUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const VoiceUpload: React.FC<VoiceUploadProps> = ({
  onFileSelect,
  selectedFile,
  currentLang,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateAndSetFile = (file: File) => {
    setError(null);

    // Check size
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Audio file exceeds ${MAX_UPLOAD_MB}MB limit.`);
      return;
    }

    // Set preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <ErrorMessage title="Upload Error" message={error} onDismiss={() => setError(null)} />}

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) validateAndSetFile(file);
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ALLOWED_AUDIO_EXTENSIONS.join(',')}
            disabled={disabled}
            className="hidden"
          />

          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {t('uploadInstructions', currentLang)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Accepts: {ALLOWED_AUDIO_EXTENSIONS.join(', ')} • Up to {MAX_UPLOAD_MB}MB
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {previewUrl && <audio src={previewUrl} controls className="w-full h-10 rounded-xl" />}
        </div>
      )}
    </div>
  );
};
