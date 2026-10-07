import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  Play,
  Pause,
  Loader2,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import type { ClonedVoice, UILanguage } from '../../types/index.js';
import { formatDate, t } from '../../utils/format.js';
import { Spinner } from '../ui/Spinner.js';

interface VoiceListProps {
  voices: ClonedVoice[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  currentLang: UILanguage;
}

export const VoiceList: React.FC<VoiceListProps> = ({
  voices,
  onDelete,
  deletingId,
  currentLang,
}) => {
  const [filter, setFilter] = useState<'all' | 'female' | 'male' | 'custom'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playClientFallback = (text: string, voice: ClonedVoice) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = voice.gender === 'female' ? 1.05 : 0.95;
        utterance.pitch = voice.gender === 'female' ? 1.1 : 0.9;

        utterance.onstart = () => {
          setPlayingVoiceId(voice.id);
        };
        utterance.onend = () => {
          setPlayingVoiceId(null);
        };
        utterance.onerror = () => {
          setPlayingVoiceId(null);
          playToneChime(voice);
        };

        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // ignore
    }
    playToneChime(voice);
  };

  const playToneChime = (voice: ClonedVoice) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const isFemale = voice.gender === 'female';
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFemale ? 587.33 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isFemale ? 880 : 659.25, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      setPlayingVoiceId(voice.id);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 1200);
    } catch {
      setPlayingVoiceId(null);
    }
  };

  const handleTogglePlay = async (voice: ClonedVoice) => {
    // If currently playing this voice, stop it
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setLoadingVoiceId(voice.id);
    try {
      const sampleText =
        voice.sampleText ||
        (voice.gender === 'female'
          ? 'ជម្រាបសួរ! ខ្ញុំជាសម្លេងធម្មជាតិស្តង់ដារ ផ្អែមពិរោះ និងរស់រវើក ១០០% ជាភាសាខ្មែរ។'
          : 'ជម្រាបសួរ! ខ្ញុំបាទជាសម្លេងតួឯកប្រុសស្តង់ដារ រឹងមាំ សង្ហា និងធម្មជាតិពិតៗ ១០០% ជាភាសាខ្មែរ។');

      // Abort after 5s so UI is guaranteed to never hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let blob: Blob | null = null;
      try {
        const res = await fetch('/api/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: sampleText,
            voiceId: voice.id,
            provider: 'azure',
            language: 'km',
            style: 'general',
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          blob = await res.blob();
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('Backend preview fetch error or timeout, falling back:', fetchErr);
      }

      if (blob && blob.size > 200) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
          URL.revokeObjectURL(url);
          playClientFallback(sampleText, voice);
        };

        try {
          await audio.play();
          setPlayingVoiceId(voice.id);
        } catch {
          playClientFallback(sampleText, voice);
        }
      } else {
        playClientFallback(sampleText, voice);
      }
    } catch (err: any) {
      console.error('Failed to preview voice:', err);
    } finally {
      setLoadingVoiceId(null);
    }
  };

  const femaleCount = voices.filter((v) => v.gender === 'female').length;
  const maleCount = voices.filter((v) => v.gender === 'male').length;
  const customCount = voices.filter((v) => !v.isDefault).length;

  const filteredVoices = voices.filter((v) => {
    if (filter === 'female') return v.gender === 'female';
    if (filter === 'male') return v.gender === 'male';
    if (filter === 'custom') return !v.isDefault;
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('clonedVoicesTitle', currentLang)} (10 សម្លេងខ្មែរដូចមនុស្ស 100%)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            សម្លេងស្តង់ដារកម្រិត Neural ដូចមនុស្ស ១០០% ស្រី ៥ សម្លេង និង ប្រុស ៥ សម្លេង
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ទាំងអស់ ({voices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('female')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'female'
                ? 'bg-rose-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
            }`}
          >
            👩 សម្លេងស្រី ({femaleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('male')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'male'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
            }`}
          >
            👨 សម្លេងប្រុស ({maleCount})
          </button>
          {customCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'custom'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              🎙️ ផ្ទាល់ខ្លួន ({customCount})
            </button>
          )}
        </div>
      </div>

      {/* Voice Grid */}
      {filteredVoices.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm">
          {t('noClonedVoices', currentLang)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredVoices.map((voice) => {
            const isDeleting = deletingId === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            const isLoading = loadingVoiceId === voice.id;
            const isFemale = voice.gender === 'female';

            return (
              <div
                key={voice.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col justify-between gap-3 ${
                  isPlaying
                    ? 'bg-gradient-to-r from-indigo-50/90 to-blue-50/60 dark:from-indigo-950/60 dark:to-blue-950/40 border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400/50'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Avatar & Voice Name & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Gender Avatar Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm ${
                        isFemale
                          ? 'bg-gradient-to-br from-rose-400 to-pink-600 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white'
                      }`}
                    >
                      {isFemale ? '👩' : '👨'}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {voice.name}
                        </span>
                        {voice.isDefault ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>១០០% ដូចមនុស្ស</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                            Custom Clone
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {voice.description || (isFemale ? 'សម្លេងស្ត្រីខ្មែរ ធម្មជាតិ' : 'សម្លេងបុរសខ្មែរ ធម្មជាតិ')}
                      </span>
                    </div>
                  </div>

                  {/* Delete button (only for custom clones) */}
                  {!voice.isDefault && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onDelete(voice.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                      title={t('deleteVoice', currentLang)}
                    >
                      {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Tags row */}
                {voice.tags && voice.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {voice.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Bar: Live Audio Preview & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(voice)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isPlaying ? 'ផ្អាក (Pause)' : 'សាកល្បងសម្លេង (Listen)'}</span>
                    </button>

                    {isPlaying && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        <span>កំពុងចាក់...</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {voice.isDefault ? 'Khmer Neural Pro' : formatDate(voice.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
