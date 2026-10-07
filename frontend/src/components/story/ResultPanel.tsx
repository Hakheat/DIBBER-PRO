import React, { useState, useEffect } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import type { ProcessStoryResponse, StoryStyle, VoiceInfo } from '../../types/index.js';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';
import { AudioPlayer } from '../audio/AudioPlayer.js';
import { ListenButton } from '../audio/ListenButton.js';
import { VoiceSelect } from '../audio/VoiceSelect.js';
import { StyleSelector } from './StyleSelector.js';
import { ErrorMessage } from '../ui/ErrorMessage.js';

interface ResultPanelProps {
  result: ProcessStoryResponse;
  voices: VoiceInfo[];
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  targetLanguage: string;
  initialStyle?: StoryStyle;
  onListen: (text: string, voiceId: string, language: string, style?: StoryStyle) => Promise<void>;
  audioUrl: string | null;
  isGeneratingAudio: boolean;
  audioError: Error | null;
  currentLang: UILanguage;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  voices,
  selectedVoiceId,
  onVoiceChange,
  targetLanguage,
  initialStyle = 'news',
  onListen,
  audioUrl,
  isGeneratingAudio,
  audioError,
  currentLang,
}) => {
  const [activeVoiceStyle, setActiveVoiceStyle] = useState<StoryStyle>(initialStyle);

  useEffect(() => {
    if (initialStyle) {
      setActiveVoiceStyle(initialStyle);
    }
  }, [initialStyle]);

  const hasSummary = Boolean(result.summary);
  const hasTranslation = Boolean(result.translation);

  // Active tab when both are present
  const [activeTab, setActiveTab] = useState<'summary' | 'translation'>(
    hasSummary ? 'summary' : 'translation',
  );

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const currentTextToSpeak =
    activeTab === 'summary' ? result.summary || '' : result.translation || '';

  const handleTriggerListen = () => {
    if (!currentTextToSpeak) return;
    onListen(currentTextToSpeak, selectedVoiceId, targetLanguage, activeVoiceStyle);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-6 shadow-xl dark:shadow-2xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {currentLang === 'km' ? 'លទ្ធផលរឿងដែលបានបង្កើត' : 'Generated Story Output'}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeVoiceStyle === 'news'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : activeVoiceStyle === 'horror'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : activeVoiceStyle === 'sponsor'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {activeVoiceStyle === 'news' && '📰 '}
                {activeVoiceStyle === 'horror' && '👻 '}
                {activeVoiceStyle === 'sponsor' && '📢 '}
                {activeVoiceStyle === 'general' && '📖 '}
                {t(
                  activeVoiceStyle === 'news'
                    ? 'styleNews'
                    : activeVoiceStyle === 'horror'
                    ? 'styleHorror'
                    : activeVoiceStyle === 'sponsor'
                    ? 'styleSponsor'
                    : 'styleGeneral',
                  currentLang,
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {result.usage
                ? `Tokens: ~${result.usage.totalTokens || (result.usage.promptTokens || 0) + (result.usage.completionTokens || 0)} total • Claude 3.5 Sonnet`
                : 'Claude 3.5 Sonnet'}
            </p>
          </div>
        </div>

        {/* Tab switcher if both summary & translation are present */}
        {hasSummary && hasTranslation && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('summaryHeading', currentLang)}
            </button>
            <button
              onClick={() => setActiveTab('translation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                activeTab === 'translation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('translationHeading', currentLang)}
            </button>
          </div>
        )}
      </div>

      {/* Content Display */}
      <div className="flex flex-col gap-4">
        {activeTab === 'summary' && result.summary && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t('summaryHeading', currentLang)}
              </span>
              <button
                onClick={() => handleCopy(result.summary!, 'summary')}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                {copiedSection === 'summary' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t('copied', currentLang)}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('copyText', currentLang)}</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 text-sm leading-khmer whitespace-pre-line font-sans font-normal selection:bg-indigo-500">
              {result.summary}
            </div>
          </div>
        )}

        {activeTab === 'translation' && result.translation && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {t('translationHeading', currentLang)}
              </span>
              <button
                onClick={() => handleCopy(result.translation!, 'translation')}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                {copiedSection === 'translation' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t('copied', currentLang)}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('copyText', currentLang)}</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 text-sm leading-khmer whitespace-pre-line font-sans font-normal selection:bg-cyan-500 max-h-[450px] overflow-y-auto">
              {result.translation}
            </div>
          </div>
        )}
      </div>

      {/* Audio Synthesis & Playback Section */}
      <div className="mt-4 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>
            {currentLang === 'km'
              ? (activeTab === 'summary' ? '🎧 ស្ដាប់សេចក្ដីសង្ខេបនេះ' : '🎧 ស្ដាប់ការបកប្រែនេះ')
              : `🎧 Listen to ${activeTab === 'summary' ? 'Summary' : 'Translation'}`}
          </span>
        </h4>

        {audioError && (
          <ErrorMessage
            title="Audio Generation Failed"
            message={audioError.message}
            code={(audioError as { code?: string }).code}
          />
        )}

        {/* Voice Delivery Style */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('ttsStyleLabel', currentLang)}
          </label>
          <StyleSelector
            value={activeVoiceStyle}
            onChange={setActiveVoiceStyle}
            currentLang={currentLang}
            disabled={isGeneratingAudio}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <VoiceSelect
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onChange={onVoiceChange}
              currentLang={currentLang}
              disabled={isGeneratingAudio}
            />
          </div>

          <div>
            <ListenButton
              onClick={handleTriggerListen}
              isLoading={isGeneratingAudio}
              disabled={!currentTextToSpeak || !selectedVoiceId}
              currentLang={currentLang}
            />
          </div>
        </div>

        {audioUrl && (
          <div className="mt-2">
            <AudioPlayer
              src={audioUrl}
              title={`Narration (${voices.find((v) => v.id === selectedVoiceId)?.name || 'Custom Voice'})`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
