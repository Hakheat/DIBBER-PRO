import React, { useState, useEffect } from 'react';
import { Cpu, Volume2, Wand2 } from 'lucide-react';
import type { ProcessStoryRequest, StoryAction, StoryStyle, SummaryLength } from '../types/index.js';
import { ActionSelector } from '../components/story/ActionSelector.js';
import { LanguageSelect } from '../components/story/LanguageSelect.js';
import { LengthSelector } from '../components/story/LengthSelector.js';
import { ResultPanel } from '../components/story/ResultPanel.js';
import { StoryInput } from '../components/story/StoryInput.js';
import { StyleSelector } from '../components/story/StyleSelector.js';
import { Button } from '../components/ui/Button.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';
import { useSpeak } from '../hooks/useSpeak.js';
import { useStoryProcess } from '../hooks/useStoryProcess.js';
import { useVoices } from '../hooks/useVoices.js';
import type { UILanguage } from '../types/index.js';
import { t } from '../utils/format.js';

interface HomePageProps {
  currentLang: UILanguage;
}

export const HomePage: React.FC<HomePageProps> = ({ currentLang }) => {
  const [text, setText] = useState('');
  const [action, setAction] = useState<StoryAction>('both');
  const [style, setStyle] = useState<StoryStyle>('news');
  const [targetLanguage, setTargetLanguage] = useState('km');
  const [length, setLength] = useState<SummaryLength>('medium');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('km-KH-PisethNeural');
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet-20241022');

  // Hooks
  const { processStoryAsync, data: storyResult, isLoading, error: storyError } =
    useStoryProcess();
  const { voices } = useVoices();
  const { speak, audioUrl, isGenerating: isGeneratingAudio, error: audioError } = useSpeak();

  // Ensure selectedVoiceId defaults sensibly when voices load
  useEffect(() => {
    if (voices.length > 0 && !voices.some((v) => v.id === selectedVoiceId)) {
      const khmerVoice = voices.find((v) => v.id.includes('km-KH') || v.language === 'km');
      setSelectedVoiceId(khmerVoice ? khmerVoice.id : voices[0].id);
    }
  }, [voices, selectedVoiceId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;

    const payload: ProcessStoryRequest = {
      text,
      action,
      targetLanguage,
      length,
      style,
      model: selectedModel,
    };

    await processStoryAsync(payload);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleListen = async (
    content: string,
    voiceId: string,
    language: string,
    voiceStyle?: StoryStyle,
  ) => {
    await speak({
      text: content,
      voiceId,
      language,
      style: voiceStyle || style,
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-6 w-full pb-8">
      {/* Unified Studio Workstation */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5 w-full">
        <div className="glass-panel rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col flex-1 focus-within:border-indigo-500/50 transition-colors">
          {/* Top Control Header: Organized 2-Tier Studio Control */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800/80 flex flex-col gap-2.5">
            {/* Tier 1: Action (What to do) & Target Language + Length */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ActionSelector
                value={action}
                onChange={setAction}
                currentLang={currentLang}
                disabled={isLoading}
              />

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <LanguageSelect
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  currentLang={currentLang}
                  disabled={isLoading}
                />

                {action !== 'translate' && (
                  <LengthSelector
                    value={length}
                    onChange={setLength}
                    currentLang={currentLang}
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>

            {/* Tier 2: Voice & Narration Delivery Style (TTS Style) */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('styleLabel', currentLang)}:</span>
                </span>
                <StyleSelector
                  value={style}
                  onChange={setStyle}
                  currentLang={currentLang}
                  disabled={isLoading}
                />
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Khmer Neural Voice Synthesis</span>
              </div>
            </div>
          </div>

          {/* Clean Story Input Canvas */}
          <StoryInput
            value={text}
            onChange={setText}
            currentLang={currentLang}
            disabled={isLoading}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom Execution Bar */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isLoading}
                  aria-label="ជ្រើសរើស AI Model"
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer border-none py-0.5"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Pro Engine)</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast Speed)</option>
                  <option value="neural-engine">Khmer Neural AI Engine (Universal)</option>
                </select>
              </div>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">Khmer Word Segmentation</span>
            </div>

            <Button
              type="submit"
              size="md"
              variant="primary"
              isLoading={isLoading}
              disabled={!text.trim() || text.length > 50000}
              leftIcon={<Wand2 className="w-4 h-4 text-indigo-100" />}
              className="w-full sm:w-auto min-w-[190px] font-bold shadow-lg shadow-indigo-600/30"
            >
              {isLoading ? t('processing', currentLang) : t('processButton', currentLang)}
            </Button>
          </div>
        </div>

        {/* Story Error Display */}
        {storyError && (
          <ErrorMessage
            title="Processing Failed"
            message={storyError.message}
            code={(storyError as { code?: string }).code}
          />
        )}
      </form>

      {/* Result Panel */}
      {storyResult && (
        <div className="w-full animate-fade-in">
          <ResultPanel
            result={storyResult}
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            onVoiceChange={setSelectedVoiceId}
            targetLanguage={targetLanguage}
            initialStyle={style}
            onListen={handleListen}
            audioUrl={audioUrl}
            isGeneratingAudio={isGeneratingAudio}
            audioError={audioError}
            currentLang={currentLang}
          />
        </div>
      )}
    </div>
  );
};
