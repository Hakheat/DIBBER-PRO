import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  code?: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An error occurred',
  message,
  code,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-sm backdrop-blur-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-semibold text-rose-300 flex items-center gap-2">
          <span>{title}</span>
          {code && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/40 text-rose-300">
              {code}
            </span>
          )}
        </div>
        <p className="mt-1 text-rose-200/90 leading-relaxed font-sans">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 transition-colors p-1 -mr-1"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
