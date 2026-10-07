import React, { useState } from 'react';
import { Mic, Sparkles, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';
import { ConsentCheckbox } from '../components/voice/ConsentCheckbox.js';
import { VoiceList } from '../components/voice/VoiceList.js';
import { VoiceRecorder } from '../components/voice/VoiceRecorder.js';
import { VoiceUpload } from '../components/voice/VoiceUpload.js';
import { useCloneVoice } from '../hooks/useCloneVoice.js';
import type { UILanguage } from '../types/index.js';
import { t } from '../utils/format.js';

interface VoicesPageProps {
  currentLang: UILanguage;
}

export const VoicesPage: React.FC<VoicesPageProps> = ({ currentLang }) => {
  const [tab, setTab] = useState<'record' | 'upload'>('record');
  const [voiceName, setVoiceName] = useState('');
  const [consent, setConsent] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    clonedVoices,
    cloneVoiceAsync,
    isCloning,
    cloneError,
    deleteVoiceAsync,
  } = useCloneVoice();

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!voiceName.trim()) {
      setValidationError('Please provide a name for this voice.');
      return;
    }

    if (!consent) {
      setValidationError('You must agree to the consent statement regarding voice ownership.');
      return;
    }

    const audioPayload = tab === 'record' ? recordedBlob : uploadedFile;
    if (!audioPayload) {
      setValidationError(
        tab === 'record'
          ? 'Please record a voice sample first.'
          : 'Please select an audio file to upload.',
      );
      return;
    }

    const formData = new FormData();
    formData.append('name', voiceName.trim());
    formData.append('consent', 'true');

    if (tab === 'record' && recordedBlob) {
      formData.append('sample', recordedBlob, `${voiceName.trim().replace(/\s+/g, '_')}.webm`);
    } else if (tab === 'upload' && uploadedFile) {
      formData.append('sample', uploadedFile);
    }

    try {
      await cloneVoiceAsync(formData);
      // Reset form
      setVoiceName('');
      setConsent(false);
      setRecordedBlob(null);
      setUploadedFile(null);
    } catch {
      // Handled via cloneError
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cloned voice?')) return;
    setDeletingId(id);
    try {
      await deleteVoiceAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const hasAudioSample = tab === 'record' ? Boolean(recordedBlob) : Boolean(uploadedFile);

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Clean Page Intro */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-850">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>{t('voiceLabTitle', currentLang)}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('voiceLabSubtitle', currentLang)}
        </p>
      </div>

      {/* Cloning Form Card */}
      <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
        <form onSubmit={handleClone} className="flex flex-col gap-6">
          {/* Method tabs: Record vs Upload */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-80 mx-auto shadow-inner">
            <button
              type="button"
              onClick={() => setTab('record')}
              disabled={isCloning}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tab === 'record'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{t('recordTab', currentLang)}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              disabled={isCloning}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{t('uploadTab', currentLang)}</span>
            </button>
          </div>

          {/* Voice Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('voiceNameLabel', currentLang)}
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder={t('voiceNamePlaceholder', currentLang)}
              disabled={isCloning}
              maxLength={50}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-sans shadow-inner"
            />
          </div>

          {/* Method Input (Recorder or Uploader) */}
          <div>
            {tab === 'record' ? (
              <VoiceRecorder
                onRecordingComplete={setRecordedBlob}
                currentLang={currentLang}
                disabled={isCloning}
              />
            ) : (
              <VoiceUpload
                onFileSelect={setUploadedFile}
                selectedFile={uploadedFile}
                currentLang={currentLang}
                disabled={isCloning}
              />
            )}
          </div>

          {/* Mandatory Consent Checkbox */}
          <ConsentCheckbox
            checked={consent}
            onChange={setConsent}
            currentLang={currentLang}
            disabled={isCloning}
          />

          {/* Validation or API Errors */}
          {validationError && (
            <ErrorMessage title="Input Required" message={validationError} onDismiss={() => setValidationError(null)} />
          )}

          {cloneError && (
            <ErrorMessage
              title="Cloning Failed"
              message={cloneError.message}
              code={(cloneError as { code?: string }).code}
            />
          )}

          {/* Submit Clone Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isCloning}
              disabled={!voiceName.trim() || !consent || !hasAudioSample}
              leftIcon={<Sparkles className="w-4 h-4 text-cyan-200" />}
              className="w-full sm:w-auto min-w-0 sm:min-w-[200px]"
            >
              {isCloning ? t('cloning', currentLang) : t('cloneButton', currentLang)}
            </Button>
          </div>
        </form>
      </div>

      {/* Cloned Voices List */}
      <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl">
        <VoiceList
          voices={clonedVoices}
          onDelete={handleDelete}
          deletingId={deletingId}
          currentLang={currentLang}
        />
      </div>
    </div>
  );
};
