import React from 'react';
import { Mic, RotateCcw, Square } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder.js';
import type { UILanguage } from '../../types/index.js';
import { formatDuration, t } from '../../utils/format.js';
import { Button } from '../ui/Button.js';
import { ErrorMessage } from '../ui/ErrorMessage.js';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
  currentLang: UILanguage;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  currentLang,
  disabled = false,
}) => {
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStop = () => {
    stopRecording();
  };

  React.useEffect(() => {
    onRecordingComplete(audioBlob);
  }, [audioBlob, onRecordingComplete]);

  const handleReset = () => {
    resetRecording();
    onRecordingComplete(null);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {t('recordInstructions', currentLang)}
        </span>
        {recordingDuration > 0 && (
          <span
            className={`font-mono text-xs px-2.5 py-1 rounded-full border ${
              isRecording
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800/80 animate-pulse'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            {formatDuration(recordingDuration)}
          </span>
        )}
      </div>

      {error && <ErrorMessage title="Microphone Error" message={error} />}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {!isRecording && !audioUrl && (
          <Button
            type="button"
            variant="primary"
            disabled={disabled}
            onClick={startRecording}
            leftIcon={<Mic className="w-4 h-4 text-rose-300" />}
            className="w-full sm:w-auto"
          >
            {t('startRecording', currentLang)}
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            variant="danger"
            onClick={handleStop}
            leftIcon={<Square className="w-4 h-4 fill-current" />}
            className="w-full sm:w-auto animate-pulse"
          >
            {t('stopRecording', currentLang)}
          </Button>
        )}

        {audioUrl && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <audio src={audioUrl} controls className="w-full h-10 rounded-xl" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {t('rerecord', currentLang)}
            </Button>
          </div>
        )}
      </div>

      {recordingDuration > 0 && recordingDuration < 15 && !isRecording && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Tip: Samples under 15 seconds may produce lower voice cloning accuracy. 30 seconds recommended.
        </p>
      )}
    </div>
  );
};
