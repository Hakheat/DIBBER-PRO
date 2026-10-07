import React, { useEffect, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

interface AudioPlayerProps {
  src: string;
  title?: string;
  onEnded?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = 'Narration Audio',
  onEnded,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleAudioEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleAudioEnded);

    // Auto-play when new source is provided
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [src, onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    setIsPlaying(true);
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-white dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 shadow-lg dark:shadow-xl backdrop-blur-md ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-semibold text-sm truncate min-w-0">
          <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="truncate">{title}</span>
        </div>

        <a
          href={src}
          download="dubber-narration.mp3"
          className="text-xs text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm shrink-0"
          title="Download MP3"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download MP3</span>
        </a>
      </div>

      {/* Scrub bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 w-9 sm:w-10 text-right shrink-0">
          {formatDuration(Math.floor(currentTime))}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
        />

        <span className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 w-9 sm:w-10 shrink-0">
          {formatDuration(Math.floor(duration))}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={handleRestart}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Restart audio"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlay}
          className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
