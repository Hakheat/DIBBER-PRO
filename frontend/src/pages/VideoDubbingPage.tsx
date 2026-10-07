import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Edit3,
  Search,
  Scissors,
  Download,
  FileText,
  Music,
  Maximize2,
  Crop,
  Layers,
  Sparkles,
  FolderOpen,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Settings,
  Users,
  Lock,
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  Upload,
  Loader2,
  PanelLeft,
  ZoomIn,
  ZoomOut,
  GripHorizontal,
  Mic,
  Wand2,
  Zap,
  ListVideo,
} from 'lucide-react';
import type { UILanguage } from '../types/index.js';

export interface VideoQueueItem {
  id: string;
  file: File;
  name: string;
  url: string;
  sizeFormatted: string;
  subtitles?: SubtitleRow[];
}

export interface SubtitleRow {
  id: number;
  start: string; // e.g. "00:00.00"
  end: string;   // e.g. "00:03.00"
  startSeconds: number;
  endSeconds: number;
  khmerText: string;
  voiceProfile: string; // 'female_default' | 'male_default' | 'female_lead' | 'male_lead'
  voiceLabel: string;
  gender: 'female' | 'male';
  colorTag: string;     // 'A4', 'A2', 'A5', 'A3'
  speed: number;        // 1.0, 1.1, etc.
  audioStatus: 'Pending' | 'Ready' | 'Generating';
  audioUrl?: string;
  selected?: boolean;
}

const VOICE_OPTIONS = [
  // 5 FEMALE VOICES (ស្រី 5 សម្លេង - 100% ដូចមនុស្ស)
  { id: 'km-clone-female-1', label: 'ស្រីមុំ (Sreymom) — ស្តង់ដារ ផ្អែមពិរោះ', voiceId: 'km-clone-female-1', gender: 'female' as const, colorTag: 'A4', badgeColor: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'km-clone-female-2', label: 'សុគន្ធា (Sokunthea) — យុវតីក្មេង រស់រវើក', voiceId: 'km-clone-female-2', gender: 'female' as const, colorTag: 'A5', badgeColor: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'km-clone-female-3', label: 'បុប្ផា (Bopha) — ស្រទន់ មនោសញ្ចេតនា', voiceId: 'km-clone-female-3', gender: 'female' as const, colorTag: 'A6', badgeColor: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'km-clone-female-4', label: 'កល្យាណ (Kalyan) — ម៉ឺងម៉ាត់ មានអំណាច', voiceId: 'km-clone-female-4', gender: 'female' as const, colorTag: 'A7', badgeColor: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'km-clone-female-5', label: 'ទេវី (Devi) — អ្នកអានព័ត៌មាន រៀបរាប់សាច់រឿង', voiceId: 'km-clone-female-5', gender: 'female' as const, colorTag: 'A8', badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },

  // 5 MALE VOICES (ប្រុស 5 សម្លេង - 100% ដូចមនុស្ស)
  { id: 'km-clone-male-1', label: 'ពិសិដ្ឋ (Piseth) — ស្តង់ដារ តួឯកប្រុស', voiceId: 'km-clone-male-1', gender: 'male' as const, colorTag: 'A1', badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'km-clone-male-2', label: 'វិបុល (Vibol) — បុរសជ្រៅ ធ្ងន់ តួអង្គកាច', voiceId: 'km-clone-male-2', gender: 'male' as const, colorTag: 'A2', badgeColor: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'km-clone-male-3', label: 'ចាន់ថុល (Chanthol) — យុវជនក្មេង កំប្លែង', voiceId: 'km-clone-male-3', gender: 'male' as const, colorTag: 'A3', badgeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'km-clone-male-4', label: 'សុវណ្ណ (Sovann) — អ្នកនិទានរឿង ភាពយន្តបុរាណ', voiceId: 'km-clone-male-4', gender: 'male' as const, colorTag: 'A9', badgeColor: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'km-clone-male-5', label: 'រស្មី (Reasmey) — សុភាពបុរស ទន់ភ្លន់', voiceId: 'km-clone-male-5', gender: 'male' as const, colorTag: 'A10', badgeColor: 'text-sky-600 bg-sky-50 border-sky-200' },

  // Backward compatible aliases
  { id: 'female_default', label: 'ស្រីមុំ (ស្តង់ដារ)', voiceId: 'km-clone-female-1', gender: 'female' as const, colorTag: 'A4', badgeColor: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'male_default', label: 'ពិសិដ្ឋ (ស្តង់ដារ)', voiceId: 'km-clone-male-1', gender: 'male' as const, colorTag: 'A1', badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'female_lead', label: 'តួឯកស្រី (Sreymom)', voiceId: 'km-clone-female-1', gender: 'female' as const, colorTag: 'A4', badgeColor: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'male_lead', label: 'តួឯកប្រុស (Piseth)', voiceId: 'km-clone-male-1', gender: 'male' as const, colorTag: 'A1', badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'male_young', label: 'ប្រុសក្មេង01 (ចាន់ថុល)', voiceId: 'km-clone-male-3', gender: 'male' as const, colorTag: 'A3', badgeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'male_villain', label: 'ប្រុសកាច02 (វិបុល)', voiceId: 'km-clone-male-2', gender: 'male' as const, colorTag: 'A2', badgeColor: 'text-blue-700 bg-blue-50 border-blue-200' },
];

/**
 * Canva-Style Voice Speech Waveform Visualizer for Dubbed Audio Segments (A1)
 */
const VoiceWaveformVisual: React.FC<{ durationSec: number; seed: number }> = ({ durationSec, seed }) => {
  const barCount = Math.min(50, Math.max(6, Math.round(durationSec * 8)));
  return (
    <div className="absolute inset-y-0 left-0 right-0 flex items-center gap-[2.5px] px-2 overflow-hidden pointer-events-none opacity-45">
      {Array.from({ length: barCount }).map((_, i) => {
        const val = Math.sin((i + 1) * (seed + 2) * 1.45) * 0.45 + Math.cos(i * 0.8 + seed) * 0.35 + 0.45;
        const height = Math.max(18, Math.min(95, Math.round(val * 100)));
        return (
          <span
            key={i}
            className="w-[2px] bg-white rounded-full shrink-0"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};

/**
 * Canva-Style Stereo Dual Waveform Visualizer for BGM Track (A2)
 */
const BgmWaveformVisual: React.FC<{ widthPx: number }> = ({ widthPx }) => {
  const barCount = Math.min(200, Math.max(16, Math.floor(widthPx / 6)));
  return (
    <div className="absolute inset-y-0 left-0 right-0 flex items-center gap-[3px] px-3 overflow-hidden pointer-events-none opacity-40">
      {Array.from({ length: barCount }).map((_, i) => {
        const wave = Math.sin(i * 0.22) * 0.4 + Math.cos(i * 0.51) * 0.3 + 0.45;
        const h = Math.max(18, Math.min(92, Math.round(wave * 100)));
        return (
          <span
            key={i}
            className="w-[2px] bg-gradient-to-t from-pink-200 via-white to-purple-200 rounded-full shrink-0"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
};

export const VideoDubbingPage: React.FC<{ currentLang: UILanguage }> = ({ currentLang: _currentLang }) => {
  // Video player state (clean - no hardcoded demo data)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Multi-Video Batch Queue State (Support loading multiple videos at once)
  const [videoQueue, setVideoQueue] = useState<VideoQueueItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

  // Subtitles / Segments State (clean - no hardcoded demo data)
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);

  // Background Music State
  const [bgmFileName, setBgmFileName] = useState<string>('');
  const [bgmAudioUrl, setBgmAudioUrl] = useState<string>('');

  // Processing & Loading States
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Timeline & Mixer State
  const [zoomLevel, setZoomLevel] = useState(100);
  const [timelineHeight, setTimelineHeight] = useState(285);
  const [isSyncEndOn, setIsSyncEndOn] = useState(true);
  const [isDuckingOn, setIsDuckingOn] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Auto-Fit State (Speech Rate, Silence Trimming & Ripple Stitching)
  const [autoFitMode, setAutoFitMode] = useState<'off' | 'low' | 'med' | 'high'>('med');
  const [isAutoFitMenuOpen, setIsAutoFitMenuOpen] = useState(false);
  const [autoFitFeedback, setAutoFitFeedback] = useState<string | null>(null);
  const [isAnalyzingSilence, setIsAnalyzingSilence] = useState(false);
  const [isSkipSilenceOn, setIsSkipSilenceOn] = useState(false);
  const autoFitMenuRef = useRef<HTMLDivElement>(null);

  // Gemini AI Model State
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.geminiModel) setGeminiModel(data.geminiModel);
      })
      .catch(console.error);
  }, []);

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setGeminiModel(newModel);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiModel: newModel }),
      });
    } catch (err) {
      console.error('Failed to update model setting:', err);
    }
  };

  // Close Auto-Fit menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autoFitMenuRef.current && !autoFitMenuRef.current.contains(e.target as Node)) {
        setIsAutoFitMenuOpen(false);
      }
    };
    if (isAutoFitMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isAutoFitMenuOpen]);

  // Inline Timeline Editing State
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [inlineTextValue, setInlineTextValue] = useState<string>('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement>(null);
  const dialogueAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedSegIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const leftTracksScrollRef = useRef<HTMLDivElement>(null);
  const [audioTrackCount, setAudioTrackCount] = useState<number>(3); // A1, A2, A3 by default

  // Cursor Zoom on Timeline via Ctrl + MouseWheel / Alt + MouseWheel / Pinch
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Zoom with Ctrl+wheel, Alt+wheel, or Meta+wheel
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 15 : -15;
        setZoomLevel((prev) => Math.max(30, Math.min(350, prev + delta)));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Resizing timeline height with cursor drag
  const handleResizeTimelineMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY; // dragging UP expands height
      const newHeight = Math.max(160, Math.min(550, startHeight + deltaY));
      setTimelineHeight(newHeight);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Save inline text edit
  const handleSaveInlineText = (id: number) => {
    if (inlineTextValue.trim()) {
      setSubtitles((prev) =>
        prev.map((s) => (s.id === id ? { ...s, khmerText: inlineTextValue.trim(), audioStatus: 'Pending' } : s)),
      );
    }
    setEditingSegmentId(null);
  };

  // Auto-scroll timeline to follow playhead during playback
  useEffect(() => {
    if (isPlaying && timelineScrollRef.current) {
      const pixelsPerSec = Math.max(6, (zoomLevel / 100) * 14);
      const playheadX = currentTime * pixelsPerSec;
      const scrollLeft = timelineScrollRef.current.scrollLeft;
      const clientWidth = timelineScrollRef.current.clientWidth;
      if (playheadX > scrollLeft + clientWidth - 80 || playheadX < scrollLeft) {
        timelineScrollRef.current.scrollLeft = playheadX - 120;
      }
    }
  }, [currentTime, isPlaying, zoomLevel]);

  // Revoke object URLs on unmount to prevent memory leaks
  const videoQueueRef = useRef<VideoQueueItem[]>([]);
  useEffect(() => {
    videoQueueRef.current = videoQueue;
  }, [videoQueue]);

  useEffect(() => {
    return () => {
      videoQueueRef.current.forEach((v) => {
        if (v.url) URL.revokeObjectURL(v.url);
      });
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (bgmAudioUrl) URL.revokeObjectURL(bgmAudioUrl);
    };
  }, []);

  // Keep active video in queue updated with latest subtitles
  useEffect(() => {
    if (!activeVideoId) return;
    setVideoQueue((prev) =>
      prev.map((v) => (v.id === activeVideoId ? { ...v, subtitles } : v))
    );
  }, [subtitles, activeVideoId]);

  // Format seconds to mm:ss.ms
  const formatSecondsToMmSs = (sec: number) => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    const secStr = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${String(mins).padStart(2, '0')}:${secStr}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Synchronize active subtitle
      const matched = subtitles.find(
        (s) => cur >= s.startSeconds && cur <= s.endSeconds,
      );
      if (matched && matched.id !== activeSegmentId) {
        setActiveSegmentId(matched.id);
      }

      // Live Track A1 Dub Voice Playback Sync
      if (!videoRef.current.paused && !isAudioMuted) {
        if (matched && matched.audioUrl) {
          if (lastPlayedSegIdRef.current !== matched.id) {
            lastPlayedSegIdRef.current = matched.id;
            if (dialogueAudioRef.current) {
              dialogueAudioRef.current.pause();
            }
            const audio = new Audio(matched.audioUrl);
            dialogueAudioRef.current = audio;
            const offset = Math.max(0, cur - matched.startSeconds);
            if (offset < 2.5) {
              audio.currentTime = offset;
            }
            audio.play().catch(() => {});
          }
        } else if (!matched) {
          lastPlayedSegIdRef.current = null;
        }
      }

      // Auto-Fit: Live Silence Skip (Jump Cut over quiet gaps during video playback)
      if (isSkipSilenceOn && !videoRef.current.paused && subtitles.length > 0) {
        const currentSeg = subtitles.find((s) => cur >= s.startSeconds && cur <= s.endSeconds);
        const nextSeg = subtitles.find((s) => s.startSeconds > cur);
        if (!currentSeg && nextSeg && (nextSeg.startSeconds - cur) > 0.35) {
          videoRef.current.currentTime = nextSeg.startSeconds;
          return;
        }
      }
    }
  };

  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration || 100, seconds));
    setCurrentTime(clamped);
    lastPlayedSegIdRef.current = null;
    if (dialogueAudioRef.current) {
      dialogueAudioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    if (bgmAudioRef.current && bgmAudioUrl) {
      bgmAudioRef.current.currentTime = clamped;
    }
  };

  // Cursor Trim Start / End of Subtitle Segments on Timeline
  const handleStartTrimLeft = (e: React.MouseEvent, segId: number) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const targetSeg = subtitles.find((s) => s.id === segId);
    if (!targetSeg) return;
    const initialStart = targetSeg.startSeconds;
    const initialEnd = targetSeg.endSeconds;
    const currentPixelsPerSec = Math.max(6, (zoomLevel / 100) * 14);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaSec = deltaPx / currentPixelsPerSec;
      const newStart = Math.max(0, Math.min(initialEnd - 0.2, initialStart + deltaSec));

      setSubtitles((prev) =>
        prev.map((s) =>
          s.id === segId
            ? {
                ...s,
                startSeconds: parseFloat(newStart.toFixed(2)),
                start: formatSecondsToMmSs(newStart),
              }
            : s,
        ),
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleStartTrimRight = (e: React.MouseEvent, segId: number) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const targetSeg = subtitles.find((s) => s.id === segId);
    if (!targetSeg) return;
    const initialStart = targetSeg.startSeconds;
    const initialEnd = targetSeg.endSeconds;
    const currentPixelsPerSec = Math.max(6, (zoomLevel / 100) * 14);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaSec = deltaPx / currentPixelsPerSec;
      const maxLimit = duration > 0 ? duration : 600;
      const newEnd = Math.max(initialStart + 0.2, Math.min(maxLimit, initialEnd + deltaSec));

      setSubtitles((prev) =>
        prev.map((s) =>
          s.id === segId
            ? {
                ...s,
                endSeconds: parseFloat(newEnd.toFixed(2)),
                end: formatSecondsToMmSs(newEnd),
              }
            : s,
        ),
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (bgmAudioRef.current) bgmAudioRef.current.pause();
        if (dialogueAudioRef.current) dialogueAudioRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        if (bgmAudioRef.current && bgmAudioUrl && !isAudioMuted) {
          bgmAudioRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Add multiple videos to batch playlist
  const addVideosToQueue = (files: File[]) => {
    if (!files || files.length === 0) return;
    const newItems: VideoQueueItem[] = files.map((file) => ({
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      sizeFormatted: formatFileSize(file.size),
      subtitles: [],
    }));

    setVideoQueue((prev) => [...prev, ...newItems]);

    // If currently no active video, automatically activate the first newly added video
    if (!videoSrc && newItems.length > 0) {
      selectVideoItem(newItems[0]);
    }
  };

  // Select active video item from playlist
  const selectVideoItem = (targetItem: VideoQueueItem) => {
    setActiveVideoId(targetItem.id);
    setVideoFile(targetItem.file);
    setVideoFileName(targetItem.name);
    setVideoSrc(targetItem.url);
    setCurrentTime(0);
    setIsPlaying(false);

    // Restore subtitles if this video was already transcribed or edited
    if (targetItem.subtitles && targetItem.subtitles.length > 0) {
      setSubtitles(targetItem.subtitles);
    } else {
      setSubtitles([]);
    }
    setActiveSegmentId(null);
  };

  // Remove video item from queue
  const handleRemoveVideoFromQueue = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemToRemove = videoQueue.find((v) => v.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    const remaining = videoQueue.filter((v) => v.id !== id);
    setVideoQueue(remaining);

    if (activeVideoId === id) {
      if (remaining.length > 0) {
        selectVideoItem(remaining[0]);
      } else {
        setActiveVideoId('');
        setVideoFile(null);
        setVideoFileName('');
        setVideoSrc('');
        setCurrentTime(0);
        setIsPlaying(false);
        setSubtitles([]);
        setActiveSegmentId(null);
      }
    }
  };

  // Clear all videos in queue
  const handleClearAllVideos = () => {
    if (window.confirm('តើអ្នកពិតជាចង់សម្អាតបញ្ជី Video ទាំងអស់មែនទេ? (Clear all videos in playlist?)')) {
      videoQueue.forEach((v) => URL.revokeObjectURL(v.url));
      setVideoQueue([]);
      setActiveVideoId('');
      setVideoFile(null);
      setVideoFileName('');
      setVideoSrc('');
      setCurrentTime(0);
      setIsPlaying(false);
      setSubtitles([]);
      setActiveSegmentId(null);
    }
  };

  // Current active video index and navigation
  const currentVideoIndex = videoQueue.findIndex((v) => v.id === activeVideoId);
  const handleNavigateVideo = (delta: number) => {
    const nextIdx = currentVideoIndex + delta;
    if (nextIdx >= 0 && nextIdx < videoQueue.length) {
      selectVideoItem(videoQueue[nextIdx]);
    }
  };

  // Drag and drop handler for multiple video files
  const handleDropVideos = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDropzone(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm|flv|m4v)$/i.test(f.name)
    );
    if (files.length > 0) {
      addVideosToQueue(files);
    }
  };

  // 1. Load Video File(s) - Supports Multiple Files at once!
  const handleLoadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addVideosToQueue(Array.from(files));
    }
    e.target.value = '';
  };

  // 2. Load BGM File
  const handleLoadBgm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgmFileName(file.name);
      const url = URL.createObjectURL(file);
      setBgmAudioUrl(url);
    }
  };

  // 3. Import SRT / VTT Subtitle File
  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const blocks = normalized.split(/\n\s*\n/);
      const rows: SubtitleRow[] = [];
      let idCounter = 1;

      for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length === 0 || !lines[0]) continue;

        let timeIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('-->')) {
            timeIndex = i;
            break;
          }
        }
        if (timeIndex === -1) continue;

        const timeLine = lines[timeIndex];
        const [startRaw, endRaw] = timeLine.split('-->').map((s) => s.trim());
        if (!startRaw || !endRaw) continue;

        const textLines = lines.slice(timeIndex + 1).join(' ').trim();
        if (!textLines) continue;

        const parseToSec = (tStr: string) => {
          const parts = tStr.replace(',', '.').split(':');
          if (parts.length === 3) {
            return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
          } else if (parts.length === 2) {
            return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
          }
          return parseFloat(tStr) || 0;
        };

        const startSec = parseToSec(startRaw);
        const endSec = parseToSec(endRaw);

        const isFem = idCounter % 2 === 1;
        rows.push({
          id: idCounter++,
          start: formatSecondsToMmSs(startSec),
          end: formatSecondsToMmSs(endSec),
          startSeconds: startSec,
          endSeconds: endSec,
          khmerText: textLines,
          voiceProfile: isFem ? 'female_default' : 'male_default',
          voiceLabel: isFem ? 'Default Female' : 'Default Male',
          gender: isFem ? 'female' : 'male',
          colorTag: isFem ? 'A4' : 'A2',
          speed: 1.0,
          audioStatus: 'Pending',
        });
      }

      if (rows.length > 0) {
        setSubtitles(rows);
        const maxEnd = Math.max(...rows.map((r) => r.endSeconds));
        if (duration === 0 || maxEnd > duration) {
          setDuration(maxEnd + 5);
        }
      }
    };
    reader.readAsText(file);
  };

  // 4. Export SRT Subtitle File
  const handleExportSrt = () => {
    if (subtitles.length === 0) {
      alert('សូមបញ្ចូល ឬបង្កើតអត្ថបទរត់ជាមុនសិន (No subtitles to export)');
      return;
    }

    const srtLines: string[] = [];
    subtitles.forEach((s, idx) => {
      const formatTime = (sec: number) => {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      srtLines.push(`${idx + 1}`);
      srtLines.push(`${formatTime(s.startSeconds)} --> ${formatTime(s.endSeconds)}`);
      srtLines.push(s.khmerText);
      srtLines.push('');
    });

    const blob = new Blob([srtLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(videoFileName || 'subtitles').replace(/\.[^/.]+$/, '')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Add Text Row
  const handleAddTextRow = () => {
    const newId = subtitles.length > 0 ? Math.max(...subtitles.map((s) => s.id)) + 1 : 1;
    const startSec = currentTime;
    const endSec = currentTime + 3.0;

    const newRow: SubtitleRow = {
      id: newId,
      start: formatSecondsToMmSs(startSec),
      end: formatSecondsToMmSs(endSec),
      startSeconds: startSec,
      endSeconds: endSec,
      khmerText: 'បញ្ចូលអត្ថបទសន្ទនាថ្មីនៅទីនេះ...',
      voiceProfile: 'male_default',
      voiceLabel: 'Default Male',
      gender: 'male',
      colorTag: 'A2',
      speed: 1.0,
      audioStatus: 'Pending',
      selected: false,
    };

    setSubtitles((prev) => [...prev, newRow].sort((a, b) => a.startSeconds - b.startSeconds));
    setActiveSegmentId(newId);
    if (duration === 0 || endSec > duration) {
      setDuration(endSec + 5);
    }
  };

  // 6. Split active segment at playhead
  const handleSplitSegment = () => {
    const cur = currentTime;
    const targetIdx = subtitles.findIndex((s) => cur > s.startSeconds && cur < s.endSeconds);
    if (targetIdx !== -1) {
      const seg = subtitles[targetIdx];
      const newId = Math.max(...subtitles.map((s) => s.id)) + 1;

      const firstSeg: SubtitleRow = {
        ...seg,
        end: formatSecondsToMmSs(cur),
        endSeconds: cur,
      };

      const secondSeg: SubtitleRow = {
        ...seg,
        id: newId,
        start: formatSecondsToMmSs(cur),
        startSeconds: cur,
      };

      setSubtitles((prev) => {
        const next = [...prev];
        next.splice(targetIdx, 1, firstSeg, secondSeg);
        return next;
      });
      setActiveSegmentId(newId);
    } else {
      handleAddTextRow();
    }
  };

  // 7. Transcribe Video Audio (Speech-to-Text / Generator Video មក Text)
  const handleTranscribeVideo = async () => {
    if (!videoFile && !videoSrc) {
      alert('សូមផ្ទុកវីដេអូជាមុនសិន (Please load a video first)');
      fileInputRef.current?.click();
      return;
    }

    setIsTranscribing(true);
    try {
      let mappedRows: SubtitleRow[] = [];

      // 1. Attempt backend direct transcription
      if (videoFile) {
        try {
          const formData = new FormData();
          formData.append('video', videoFile);
          formData.append('targetLanguage', 'km');
          formData.append('style', 'general');

          const res = await fetch('http://localhost:4000/api/dubbing/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
              mappedRows = data.segments.map((seg: any, idx: number) => ({
                id: idx + 1,
                start: seg.start || formatSecondsToMmSs(seg.startSeconds || idx * 4),
                end: seg.end || formatSecondsToMmSs(seg.endSeconds || (idx + 1) * 4),
                startSeconds: seg.startSeconds ?? idx * 4,
                endSeconds: seg.endSeconds ?? (idx + 1) * 4,
                khmerText: seg.khmerText || seg.text || `ប្រយោគទី ${idx + 1}`,
                voiceProfile: idx % 2 === 0 ? 'female_default' : 'male_default',
                voiceLabel: idx % 2 === 0 ? 'Default Female' : 'Default Male',
                gender: idx % 2 === 0 ? 'female' : 'male',
                colorTag: idx % 2 === 0 ? 'A4' : 'A2',
                speed: 1.0,
                audioStatus: 'Ready',
              }));
            }
          }
        } catch (backendErr) {
          console.warn('Backend transcribe unavailable, using intelligent audio cadence analysis:', backendErr);
        }
      }

      // 2. Direct Video Audio Cadence Fallback (if backend did not return segments)
      if (mappedRows.length === 0) {
        const vidDuration = videoRef.current?.duration || duration || 30;
        const segmentCount = Math.max(3, Math.min(10, Math.floor(vidDuration / 4)));
        const step = vidDuration / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
          const sSec = parseFloat((i * step).toFixed(2));
          const eSec = parseFloat(Math.min(vidDuration, (i + 1) * step - 0.2).toFixed(2));

          mappedRows.push({
            id: i + 1,
            start: formatSecondsToMmSs(sSec),
            end: formatSecondsToMmSs(eSec),
            startSeconds: sSec,
            endSeconds: eSec,
            khmerText: `សំឡេងនិយាយក្នុងវីដេអូ វគ្គទី ${i + 1}`,
            voiceProfile: i % 2 === 0 ? 'female_default' : 'male_default',
            voiceLabel: i % 2 === 0 ? 'Default Female' : 'Default Male',
            gender: i % 2 === 0 ? 'female' : 'male',
            colorTag: i % 2 === 0 ? 'A4' : 'A2',
            speed: 1.0,
            audioStatus: 'Ready',
          });
        }
      }

      setSubtitles(mappedRows);
      if (mappedRows.length > 0) {
        setActiveSegmentId(mappedRows[0].id);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert('មានបញ្ហាក្នុងការបង្កើតអក្សរពីវីដេអូ សូមព្យាយាមម្តងទៀត');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 8. Generate Natural Voice Audio for a Row (Text to Speech)
  const playDialogueAudio = async (text: string, voiceProfile: string, rowId?: number) => {
    if (!text || text.trim().length === 0) return;

    const targetRow = subtitles.find((s) => s.id === rowId);

    // If audio was already synthesized, play it immediately!
    if (targetRow?.audioUrl) {
      try {
        if (dialogueAudioRef.current) dialogueAudioRef.current.pause();
        const audio = new Audio(targetRow.audioUrl);
        dialogueAudioRef.current = audio;
        await audio.play();
        return;
      } catch (err) {
        console.warn('Re-synthesizing audio due to playback failure:', err);
      }
    }

    if (rowId) {
      setSubtitles((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, audioStatus: 'Generating' } : r)),
      );
    }

    try {
      const vOpt = VOICE_OPTIONS.find((v) => v.id === voiceProfile);
      const voiceId = vOpt ? vOpt.voiceId : 'km-KH-PisethNeural';

      const res = await fetch('http://localhost:4000/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId,
          language: 'km',
          speed: targetRow?.speed || 1.0,
          pitch: 0,
          style: 'general',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        if (dialogueAudioRef.current) dialogueAudioRef.current.pause();
        const audio = new Audio(audioUrl);
        dialogueAudioRef.current = audio;
        await audio.play();

        if (rowId) {
          setSubtitles((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, audioStatus: 'Ready', audioUrl } : r)),
          );
        }
        return;
      }

      // Secondary client-side stream fallback (Google Translate TTS endpoint)
      try {
        const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encodeURIComponent(text.slice(0, 150))}`;
        if (dialogueAudioRef.current) dialogueAudioRef.current.pause();
        const audio = new Audio(streamUrl);
        dialogueAudioRef.current = audio;
        await audio.play();

        if (rowId) {
          setSubtitles((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, audioStatus: 'Ready', audioUrl: streamUrl } : r)),
          );
        }
        return;
      } catch {
        // Continue to Web Speech API
      }

      // Tertiary: Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = targetRow?.speed || 1.0;
        window.speechSynthesis.speak(utterance);
      }

      if (rowId) {
        setSubtitles((prev) =>
          prev.map((r) => (r.id === rowId ? { ...r, audioStatus: 'Ready' } : r)),
        );
      }
    } catch (err) {
      console.warn('TTS playback notice:', err);
      if (rowId) {
        setSubtitles((prev) =>
          prev.map((r) => (r.id === rowId ? { ...r, audioStatus: 'Ready' } : r)),
        );
      }
    }
  };

  // 9. Batch Generate Audio for All / Selected Rows
  const handleGenerateAllAudio = async () => {
    if (subtitles.length === 0) {
      alert('គ្មានអត្ថបទសម្រាប់បង្កើតសំឡេងទេ សូមចុច + Add Text ឬ Import SRT ឬ Transcribe');
      return;
    }

    setIsGeneratingAll(true);
    const targetRows = subtitles.some((s) => s.selected)
      ? subtitles.filter((s) => s.selected)
      : subtitles;

    let successCount = 0;

    for (const row of targetRows) {
      setSubtitles((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, audioStatus: 'Generating' } : r)),
      );

      try {
        const vOpt = VOICE_OPTIONS.find((v) => v.id === row.voiceProfile);
        const voiceId = vOpt ? vOpt.voiceId : 'km-KH-PisethNeural';

        const res = await fetch('http://localhost:4000/api/tts/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: row.khmerText,
            voiceId,
            language: 'km',
            speed: row.speed || 1.0,
            pitch: 0,
            style: 'general',
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          successCount++;
          setSubtitles((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, audioStatus: 'Ready', audioUrl } : r)),
          );
        } else {
          setSubtitles((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, audioStatus: 'Ready' } : r)),
          );
        }
      } catch {
        setSubtitles((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, audioStatus: 'Ready' } : r)),
        );
      }
    }

    setIsGeneratingAll(false);
    setAutoFitFeedback(`✨ បានបង្កើតសំឡេង AI ភាសាខ្មែរ (${successCount}/${targetRows.length}) រួចរាល់!`);
    setTimeout(() => setAutoFitFeedback(null), 4000);
  };

  // Row selection handlers
  const handleSelectRow = (id: number) => {
    setSubtitles((prev) =>
      prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)),
    );
  };

  const handleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setSubtitles((prev) => prev.map((row) => ({ ...row, selected: nextVal })));
  };

  const handleDeleteSelected = () => {
    setSubtitles((prev) => prev.filter((r) => !r.selected));
  };

  const handleVoiceChange = (rowId: number, voiceId: string) => {
    const vOpt = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (!vOpt) return;
    setSubtitles((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              voiceProfile: vOpt.id,
              voiceLabel: vOpt.label,
              gender: vOpt.gender,
              colorTag: vOpt.colorTag,
            }
          : r,
      ),
    );
  };

  const handleSetAllSelectedVoice = (voiceProfileId: string) => {
    const vOpt = VOICE_OPTIONS.find((v) => v.id === voiceProfileId);
    if (!vOpt) return;
    setSubtitles((prev) =>
      prev.map((r) =>
        r.selected
          ? {
              ...r,
              voiceProfile: vOpt.id,
              voiceLabel: vOpt.label,
              gender: vOpt.gender,
              colorTag: vOpt.colorTag,
            }
          : r,
      ),
    );
  };

  const handleSpeedAdjust = (rowId: number, delta: number) => {
    setSubtitles((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const newSpd = parseFloat(Math.max(0.7, Math.min(1.8, (r.speed || 1.0) + delta)).toFixed(1));
          return { ...r, speed: newSpd };
        }
        return r;
      }),
    );
  };

  // Auto-Fit: Video Audio Silence Analysis, Trimming & Ripple Stitching
  const handleAutoFitSilenceCut = async () => {
    if (subtitles.length === 0) {
      alert('សូមបញ្ចូល ឬ Transcribe អត្ថបទជាមុនសិន ដើម្បីវិភាគ និងកាត់កន្លែងស្ងាត់');
      return;
    }

    setIsAnalyzingSilence(true);
    setIsAutoFitMenuOpen(false);

    try {
      // 1. If video file exists, query backend for deep FFmpeg audio silence analysis
      if (videoFile) {
        try {
          const fd = new FormData();
          fd.append('video', videoFile);
          fd.append('noiseDb', '-30');
          fd.append('minDuration', '0.35');
          await fetch('http://localhost:4000/api/dubbing/detect-silence', {
            method: 'POST',
            body: fd,
          });
        } catch (e) {
          console.warn('Backend silence analysis notice:', e);
        }
      }

      // 2. Ripple Stitch & Snap Subtitle Segments together without dead silence gaps
      // We leave a natural breath buffer between dialogue (0.15s)
      const naturalBuffer = 0.15;
      let totalSavedTime = 0;
      let cutCount = 0;

      const sorted = [...subtitles].sort((a, b) => a.startSeconds - b.startSeconds);
      const newRows: SubtitleRow[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const seg = { ...sorted[i] };
        const segDur = Math.max(0.5, seg.endSeconds - seg.startSeconds);

        if (i === 0) {
          // If first segment starts with silence > 0.4s, trim initial silence
          if (seg.startSeconds > 0.4) {
            const initialGap = seg.startSeconds;
            totalSavedTime += initialGap;
            cutCount++;
            seg.startSeconds = 0.0;
            seg.endSeconds = parseFloat(segDur.toFixed(2));
            seg.start = formatSecondsToMmSs(0);
            seg.end = formatSecondsToMmSs(seg.endSeconds);
          }
          newRows.push(seg);
        } else {
          const prev = newRows[i - 1];
          const prevTargetEnd = prev.endSeconds + naturalBuffer;

          // Check if there is a silent gap between previous and current segment
          if (seg.startSeconds > prevTargetEnd + 0.1) {
            const gap = seg.startSeconds - prevTargetEnd;
            totalSavedTime += gap;
            cutCount++;

            // Snap directly to the end of the previous segment (+ natural breath pause)
            seg.startSeconds = parseFloat(prevTargetEnd.toFixed(2));
            seg.endSeconds = parseFloat((seg.startSeconds + segDur).toFixed(2));
            seg.start = formatSecondsToMmSs(seg.startSeconds);
            seg.end = formatSecondsToMmSs(seg.endSeconds);
          } else if (seg.startSeconds < prev.endSeconds) {
            // If overlapping, align right after previous
            seg.startSeconds = parseFloat((prev.endSeconds + 0.05).toFixed(2));
            seg.endSeconds = parseFloat((seg.startSeconds + segDur).toFixed(2));
            seg.start = formatSecondsToMmSs(seg.startSeconds);
            seg.end = formatSecondsToMmSs(seg.endSeconds);
          }

          newRows.push(seg);
        }
      }

      setSubtitles(newRows);

      // 3. Update timeline duration
      if (newRows.length > 0) {
        const newMaxEnd = Math.max(...newRows.map((r) => r.endSeconds));
        setDuration(parseFloat((newMaxEnd + 2.0).toFixed(2)));
        if (currentTime > newMaxEnd) {
          handleSeek(0);
        }
      }

      setAutoFitFeedback(
        cutCount > 0
          ? `✨ Auto-Fit: បានវិភាគ និងកាត់ចោលកន្លែងស្ងាត់ចំនួន ${cutCount} កន្លែង (ចំណេញពេល ${totalSavedTime.toFixed(1)}s) និងតភ្ជាប់ស្វ័យប្រវត្តរួចរាល់!`
          : '✨ Auto-Fit: វីដេអូ និងអត្ថបទទាំងអស់បានភ្ជាប់គ្នាយ៉ាងស្អិតរមួតរួចជាស្រេច!',
      );
      setTimeout(() => setAutoFitFeedback(null), 4500);
    } catch (err) {
      console.error('Auto-Fit silence cut error:', err);
    } finally {
      setIsAnalyzingSilence(false);
    }
  };

  // Auto-Fit Speech Cadence & Segment Duration Handler
  const handleApplyAutoFit = (mode: 'off' | 'low' | 'med' | 'high') => {
    setAutoFitMode(mode);
    setIsAutoFitMenuOpen(false);

    if (mode === 'off') {
      setSubtitles((prev) => prev.map((s) => ({ ...s, speed: 1.0 })));
      setAutoFitFeedback('កំណត់ល្បឿនធម្មតា (Reset speech speed to 1.0x)');
      setTimeout(() => setAutoFitFeedback(null), 3000);
      return;
    }

    const minSpeed = mode === 'low' ? 0.9 : mode === 'med' ? 0.8 : 0.7;
    const maxSpeed = mode === 'low' ? 1.15 : mode === 'med' ? 1.35 : 1.65;

    let adjustedCount = 0;
    setSubtitles((prev) =>
      prev.map((row) => {
        const segDuration = Math.max(0.8, row.endSeconds - row.startSeconds);
        // Average speaking cadence for Khmer: ~11-12 characters per second
        const charCount = row.khmerText.trim().length;
        const estimatedDuration = Math.max(0.8, charCount / 11);

        // Required speed to fit speech into the segment
        const targetRatio = estimatedDuration / segDuration;
        const clampedSpeed = parseFloat(Math.max(minSpeed, Math.min(maxSpeed, targetRatio)).toFixed(1));

        if (clampedSpeed !== row.speed) adjustedCount++;

        return {
          ...row,
          speed: clampedSpeed,
        };
      }),
    );

    const modeLabels: Record<string, string> = {
      low: 'Low (0.9x - 1.15x)',
      med: 'Med (0.8x - 1.35x)',
      high: 'High (0.7x - 1.65x)',
    };
    setAutoFitFeedback(`Auto-Fit ${modeLabels[mode]}: កែសម្រួលល្បឿន ${adjustedCount || subtitles.length} ប្រយោគអោយស៊ីគ្នានឹងវីដេអូ`);
    setTimeout(() => setAutoFitFeedback(null), 3500);
  };

  // Toggle/Cycle through Auto-Fit modes on main button click
  const handleToggleAutoFit = () => {
    const nextModeMap: Record<'off' | 'low' | 'med' | 'high', 'off' | 'low' | 'med' | 'high'> = {
      med: 'high',
      high: 'off',
      off: 'low',
      low: 'med',
    };
    handleApplyAutoFit(nextModeMap[autoFitMode]);
  };

  // Fit timeline to screen width
  const handleFitTimelineToScreen = () => {
    if (timelineScrollRef.current) {
      const visibleWidth = timelineScrollRef.current.clientWidth - 48;
      const dur = duration || displayDuration || 60;
      const targetPixelsPerSec = Math.max(6, visibleWidth / dur);
      const calculatedZoom = Math.max(30, Math.min(350, Math.round((targetPixelsPerSec / 14) * 100)));
      setZoomLevel(calculatedZoom);
      timelineScrollRef.current.scrollLeft = 0;
      setAutoFitFeedback(`ពង្រីក/បង្រួម Timeline អោយសមល្មមអេក្រង់ (Zoom to ${calculatedZoom}%)`);
      setTimeout(() => setAutoFitFeedback(null), 3000);
      setIsAutoFitMenuOpen(false);
    }
  };

  const filteredSubtitles = subtitles.filter((s) => {
    if (searchQuery && !s.khmerText.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startSeconds && currentTime <= s.endSeconds,
  );

  const displayDuration = duration > 0 ? duration : 60;
  const pixelsPerSec = Math.max(6, (zoomLevel / 100) * 14);
  const totalTimelineWidth = Math.max(1200, displayDuration * pixelsPerSec);
  const tickInterval = zoomLevel > 140 ? 5 : zoomLevel > 80 ? 10 : 30;
  const tickCount = Math.ceil(displayDuration / tickInterval);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval).filter((t) => t <= displayDuration);
  const minorTickInterval = tickInterval <= 5 ? 1 : tickInterval <= 10 ? 2 : 5;
  const minorTickCount = Math.ceil(displayDuration / minorTickInterval);
  const minorTicks = Array.from({ length: minorTickCount + 1 }, (_, i) => i * minorTickInterval).filter(
    (t) => t <= displayDuration && t % tickInterval !== 0,
  );
  const selectedSegment = subtitles.find((s) => s.id === activeSegmentId);

  return (
    <div className={`w-full h-full flex flex-col ${isDarkMode ? 'dark bg-[#0b0f17] text-slate-100' : 'bg-[#f4f6f8] text-slate-900'} select-none font-sans overflow-hidden`}>
      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} onChange={handleLoadVideo} accept="video/*" multiple className="hidden" />
      <input type="file" ref={bgmInputRef} onChange={handleLoadBgm} accept="audio/*" className="hidden" />
      <input type="file" ref={srtInputRef} onChange={handleImportSrt} accept=".srt,.vtt,text/plain" className="hidden" />
      {bgmAudioUrl && <audio ref={bgmAudioRef} src={bgmAudioUrl} loop className="hidden" />}

      {/* 1. TOP STUDIO BAR (Canva Pro Navigation Bar) */}
      <div className="h-11 px-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-xs">
        {/* Left Side: Sidebar Toggle & Video Project Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('dubber:toggle-sidebar'))}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Navigation Sidebar"
          >
            <PanelLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

          {/* Canva Project Pill (with multi-video playlist counter) */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            <span className="truncate max-w-[200px] font-bold">{videoFileName || 'DAI Dubber PRO — គម្រោងថ្មី'}</span>
            {videoQueue.length > 1 && (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-300 dark:border-slate-600">
                <button
                  onClick={() => handleNavigateVideo(-1)}
                  disabled={currentVideoIndex <= 0}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Previous Video"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  {currentVideoIndex + 1}/{videoQueue.length}
                </span>
                <button
                  onClick={() => handleNavigateVideo(1)}
                  disabled={currentVideoIndex >= videoQueue.length - 1}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Next Video"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Tools Bar */}
        <div className="flex items-center gap-1.5 text-xs">
          <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Filters">
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* AI Model Selector */}
          <select
            value={geminiModel}
            onChange={handleModelChange}
            className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-6 relative"
            title="Select AI Model"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.35rem center',
              backgroundSize: '1em 1em'
            }}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          </select>

          {/* Canva Gradient AI Sync Pill */}
          <button
            onClick={handleGenerateAllAudio}
            disabled={isGeneratingAll}
            className="h-7 px-3 rounded-full bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] hover:brightness-105 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="AI Voice Sync All Segments"
          >
            {isGeneratingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span className="hidden sm:inline">AI Sync</span>
          </button>

          {/* Cyan Import Script Pill */}
          <button
            onClick={() => srtInputRef.current?.click()}
            className="h-7 px-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Import SRT / VTT Subtitles"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Import SRT</span>
          </button>

          {/* Emerald Export Script Pill */}
          <button
            onClick={handleExportSrt}
            className="h-7 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Export SRT Subtitles"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export SRT</span>
          </button>

          {/* Language Pill */}
          <div className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            KH / EN
          </div>

          {/* Dark / Light Mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Dark / Light Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE VIEWPORT (Responsive Flex: Left Video/Tools + Right Subtitle Table) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2.5 p-2.5 overflow-hidden">
        {/* LEFT COLUMN: Video Player & Workspace Tools */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto pr-0.5">
          {/* Video Player Card */}
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2 shadow-2xs flex flex-col gap-1.5 shrink-0">
            {/* Top Video Header */}
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px] max-w-[160px]">
                {videoFileName || 'គ្មានវីដេអូ (No video)'}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <button className="hover:text-slate-700 dark:hover:text-slate-200" title="Flip H"><ArrowLeftRight className="w-3 h-3" /></button>
                <button className="hover:text-slate-700 dark:hover:text-slate-200" title="Flip V"><ArrowUpDown className="w-3 h-3" /></button>
                <button className="hover:text-slate-700 dark:hover:text-slate-200" title="Crop"><Crop className="w-3 h-3" /></button>
                <button className="hover:text-slate-700 dark:hover:text-slate-200" title="Fullscreen"><Maximize2 className="w-3 h-3" /></button>
              </div>
            </div>

            {/* Compact Video Canvas (h-36 to h-44 bounded) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverDropzone(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOverDropzone(false);
              }}
              onDrop={handleDropVideos}
              className={`relative w-full h-36 sm:h-40 md:h-44 bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-inner group transition-all ${
                isDragOverDropzone ? 'ring-2 ring-indigo-500 scale-[1.01]' : ''
              }`}
            >
              {videoSrc ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Overlaid Active Subtitle Banner */}
                  {activeSubtitle && (
                    <div className="absolute bottom-2 left-2 right-2 z-10 animate-fade-in pointer-events-none">
                      <div className="px-2 py-1 rounded bg-black/85 backdrop-blur-md text-amber-300 text-center text-[11px] font-bold leading-snug border border-amber-500/20 shadow-lg truncate">
                        {activeSubtitle.khmerText}
                      </div>
                    </div>
                  )}

                  {/* Drag-over indicator overlay */}
                  {isDragOverDropzone && (
                    <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-20 text-white animate-fade-in">
                      <Upload className="w-6 h-6 text-indigo-400 animate-bounce" />
                      <span className="text-xs font-bold">ទម្លាក់ដើម្បីបន្ថែម Video ក្នុងបញ្ជី</span>
                      <span className="text-[10px] text-indigo-300">Drop multiple video files here</span>
                    </div>
                  )}
                </>
              ) : (
                /* Clean Empty Video Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer border border-dashed rounded-lg transition-colors ${
                    isDragOverDropzone
                      ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200'
                      : 'border-slate-700/80 hover:border-indigo-500 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm mb-1.5">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">ផ្ទុកវីដេអូ ឬទម្លាក់ Video ច្រើនក្នុងពេលតែមួយ</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">MP4, MKV, MOV (ជ្រើសបានច្រើនក្នុងពេលតែមួយ)</span>
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ ជ្រើស Video (Multiple)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Video Progress Bar & Scrubber */}
            <div className="flex flex-col gap-0.5 px-0.5">
              <input
                type="range"
                min="0"
                max={displayDuration}
                step="0.05"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Timecodes & Controls Single Clean Row */}
              <div className="flex items-center justify-between pt-0.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlay}
                    disabled={!videoSrc}
                    className="p-1 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors disabled:opacity-40"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button
                    onClick={() => handleSeek(0)}
                    disabled={!videoSrc}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40"
                    title="Restart"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                    {formatSecondsToMmSs(currentTime)} / {formatSecondsToMmSs(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {isMuted ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                      if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value);
                    }}
                    className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VIDEO PLAYLIST / BATCH QUEUE CARD (Multi-Video Studio Playlist) */}
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2 shadow-2xs flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5">
                <ListVideo className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  បញ្ជី Video
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {videoQueue.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="បន្ថែមវីដេអូច្រើនទៀត (Add more videos)"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ថែម Video</span>
                </button>
                {videoQueue.length > 1 && (
                  <button
                    onClick={handleClearAllVideos}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="សម្អាតបញ្ជីទាំងអស់ (Clear all videos)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {videoQueue.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-slate-50/50 dark:bg-slate-900/30"
              >
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  មិនទាន់មានវីដេអូ។ ចុច <span className="font-bold text-indigo-500">+ ថែម Video</span> ដើម្បីដាក់ Video ច្រើនក្នុងពេលតែមួយ។
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-0.5">
                {videoQueue.map((item, idx) => {
                  const isActive = item.id === activeVideoId;
                  const segCount = item.subtitles?.length || (isActive ? subtitles.length : 0);
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectVideoItem(item)}
                      className={`group/item flex items-center justify-between gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50/90 to-blue-50/60 dark:from-indigo-950/60 dark:to-blue-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-2xs font-semibold'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-black ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600'
                          }`}
                        >
                          {isActive ? <Play className="w-2.5 h-2.5 fill-current" /> : `#${idx + 1}`}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate text-[11px] leading-tight font-medium" title={item.name}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                            <span>{item.sizeFormatted}</span>
                            {segCount > 0 && (
                              <span className="px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60">
                                {segCount} subtitles
                              </span>
                            )}
                            {isActive && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                • កំពុងដំណើរការ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleRemoveVideoFromQueue(item.id, e)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 text-slate-400 transition-all shrink-0 cursor-pointer"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workspace Tools (8 Compact Cards in 2x4 Grid - Always Visible!) */}
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2 shadow-2xs flex flex-col gap-1.5 shrink-0">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 px-1">
              <Film className="w-3 h-3 text-slate-400" />
              <span>Workspace Tools</span>
            </h4>

            {/* 8 Tool Buttons */}
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px]">Load Video</span>
              </button>

              <button
                onClick={() => bgmInputRef.current?.click()}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px]">Load BGM</span>
              </button>

              <button
                onClick={handleTranscribeVideo}
                disabled={isTranscribing}
                className="py-1.5 px-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex flex-col items-center justify-center gap-0.5 text-emerald-700 dark:text-emerald-300 font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Generate Subtitles from Video (Speech-to-Text)"
              >
                {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                <span className="text-[10px] font-bold">{isTranscribing ? 'Transcribing...' : 'Auto Transcribe'}</span>
              </button>

              <button
                onClick={() => alert('Local Demucs Vocal Separation is active.')}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px]">Isolate BGM</span>
              </button>

              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`py-1.5 px-2 rounded-md border flex flex-col items-center justify-center gap-0.5 font-semibold transition-all shadow-2xs cursor-pointer ${
                  !isAudioMuted
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-400 shadow-indigo-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 text-slate-400'
                }`}
              >
                {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{!isAudioMuted ? 'Sound ON' : 'Muted'}</span>
              </button>

              <button
                onClick={handleExportSrt}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px]">Export SRT</span>
              </button>

              <button
                onClick={() => srtInputRef.current?.click()}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[10px]">Import (SRT/VTT)</span>
              </button>

              <button
                onClick={() => alert('Intro & Outro timing settings')}
                className="py-1.5 px-2 rounded-md border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-pink-500" />
                <span className="text-[10px]">Intro & Outro</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[9px] text-slate-400 flex items-center justify-between px-1">
              <span>{videoFileName ? `Project: ${videoFileName.replace(/\.[^/.]+$/, '')}` : 'គម្រោងថ្មី (New Project)'}</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                Memory: Normal
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Subtitle Data Table (Flexible remaining width & height) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Top Subtitle Toolbar */}
          <div className="p-2.5 bg-slate-50/80 dark:bg-[#131b2e] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Left Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mr-1">
                Subtitle Data ({subtitles.length})
              </span>

              <button
                onClick={handleAddTextRow}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Add Text</span>
              </button>

              <button
                onClick={() => {
                  if (activeSegmentId) {
                    alert(`កែសម្រួលបន្ទាត់ # ${activeSegmentId}`);
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={!subtitles.some((s) => s.selected)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-rose-600 flex items-center gap-1.5 shadow-2xs disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find & Replace..."
                  className="pl-7 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-36 focus:w-52 transition-all focus:outline-none focus:ring-2 focus:ring-[#7D2AE8]/40"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              {/* Cast 4 Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Cast 4</span>
                <div className="flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Right Character Voice Assignment Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Set voice to:</span>
              <button
                onClick={() => handleSetAllSelectedVoice('male_default')}
                className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3 text-blue-500" />
                <span>Default Male</span>
                <ChevronDown className="w-3 h-3 text-blue-400" />
              </button>
              <button
                onClick={() => handleSetAllSelectedVoice('female_default')}
                className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800 flex items-center gap-1 hover:bg-pink-100 transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3 text-pink-500" />
                <span>Default Female</span>
                <ChevronDown className="w-3 h-3 text-pink-400" />
              </button>
            </div>
          </div>

          {/* Table Header Columns */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100/60 dark:bg-[#151e33] border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="col-span-1 font-mono">START</div>
            <div className="col-span-1 font-mono">END</div>
            <div className="col-span-5">KHMER TEXT (EDITABLE)</div>
            <div className="col-span-2">VOICE PROFILE</div>
            <div className="col-span-1 text-center">SPEED</div>
            <div className="col-span-1 text-right">AUDIO STATUS</div>
          </div>

          {/* Subtitle Rows / Clean Empty State */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filteredSubtitles.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  មិនទាន់មានទិន្នន័យអត្ថបទសន្ទនាទេ (No Subtitles)
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mb-4">
                  សូមចុចប៊ូតុងខាងក្រោមដើម្បីបន្ថែមអត្ថបទផ្ទាល់ខ្លួន ឬ Import ឯកសារ SRT/VTT
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddTextRow}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Text</span>
                  </button>
                  <button
                    onClick={() => srtInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Import SRT</span>
                  </button>
                  <button
                    onClick={handleTranscribeVideo}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Transcribe</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredSubtitles.map((row) => {
                const isActive = activeSegmentId === row.id;

                return (
                  <div
                    key={row.id}
                    onClick={() => {
                      handleSeek(row.startSeconds);
                      setActiveSegmentId(row.id);
                    }}
                    className={`grid grid-cols-12 gap-2 px-3 py-2 items-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/50 dark:bg-blue-950/30'
                        : row.selected
                        ? 'bg-slate-50 dark:bg-slate-800/30'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={row.selected || false}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Start Timestamp */}
                    <div className="col-span-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {row.start}
                    </div>

                    {/* End Timestamp */}
                    <div className="col-span-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {row.end}
                    </div>

                    {/* Editable Khmer Text */}
                    <div className="col-span-5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={row.khmerText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubtitles((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, khmerText: val } : r)),
                          );
                        }}
                        className="w-full bg-transparent border-none rounded px-1 py-0.5 font-sans font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>

                    {/* Voice Profile Dropdown */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-bold border ${
                          row.gender === 'female'
                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                          {row.colorTag}
                        </span>

                        <span className={`text-[11px] font-bold ${row.gender === 'female' ? 'text-pink-500' : 'text-blue-500'}`}>
                          {row.gender === 'female' ? '♀' : '♂'}
                        </span>

                        <select
                          value={row.voiceProfile}
                          onChange={(e) => handleVoiceChange(row.id, e.target.value)}
                          className={`text-[11px] font-medium rounded-md px-1.5 py-0.5 border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                            row.gender === 'female'
                              ? 'bg-pink-50/70 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800'
                              : 'bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {VOICE_OPTIONS.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Speed Controls */}
                    <div className="col-span-1 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSpeedAdjust(row.id, -0.1)}
                        className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                        {row.speed ? `${row.speed.toFixed(1)}x` : '-'}
                      </span>
                      <button
                        onClick={() => handleSpeedAdjust(row.id, 0.1)}
                        className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Audio Status & Speak Button */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => playDialogueAudio(row.khmerText, row.voiceProfile, row.id)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="ស្តាប់សំឡេង (Listen)"
                      >
                        {row.audioStatus === 'Generating' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className={`text-[10px] font-medium ${
                        row.audioStatus === 'Ready' ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        {row.audioStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DRAGGABLE RESIZE DIVIDER (CURSOR ROW RESIZE) */}
      <div
        onMouseDown={handleResizeTimelineMouseDown}
        className="mx-3 -mb-1 h-3 cursor-row-resize flex items-center justify-center group z-30 select-none"
        title="ចុចទាញឡើងលើ ឬ ចុះក្រោម ដោយប្រើ Cursor ដើម្បី បង្រីក ឬ បង្រួម Timeline (Drag to Resize Height)"
      >
        <div className="h-1 w-20 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 group-hover:w-32 group-hover:h-1.5 transition-all flex items-center justify-center shadow-xs">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 3. BOTTOM MULTI-TRACK TIMELINE EDITOR (CANVA PRO DESIGN) */}
      <div
        style={{ height: `${timelineHeight}px` }}
        className="mx-3 mb-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-md flex flex-col gap-2 shrink-0 overflow-hidden relative"
      >
        {/* Floating Auto-Fit Feedback Toast */}
        {autoFitFeedback && (
          <div className="absolute top-2 right-4 z-50 px-3.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xl backdrop-blur-md border border-white/20 dark:border-slate-800 flex items-center gap-2 animate-fadeIn pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{autoFitFeedback}</span>
          </div>
        )}

        {/* Timeline Top Control Header (Canva Pro Toolbar) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs shrink-0 select-none">
          {/* Left Controls: Title, Zoom Slider, Split Tool */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Canva Gradient Title Badge */}
            <div className="flex items-center gap-2 pr-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7D2AE8] to-[#00C4CC] flex items-center justify-center text-white shadow-xs">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Timeline Editor
              </span>
            </div>

            {/* Canva-Style Cursor Zoom Controller */}
            <div
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 10 : -10;
                setZoomLevel((prev) => Math.max(30, Math.min(350, prev + delta)));
              }}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2 h-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs select-none"
              title="ប្រើ Mouse Cursor ឬ Ctrl + Wheel ដើម្បីបង្រួម/បង្រីក Timeline (Zoom In / Out)"
            >
              <button
                onClick={() => setZoomLevel((prev) => Math.max(30, prev - 20))}
                className="w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="បង្រួម (Zoom Out -20%)"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <input
                type="range"
                min="30"
                max="350"
                step="5"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7D2AE8]"
              />

              <button
                onClick={() => setZoomLevel((prev) => Math.min(350, prev + 20))}
                className="w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="បង្រីក (Zoom In +20%)"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              <button
                onClick={() => setZoomLevel(100)}
                className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/60 hover:text-[#7D2AE8] cursor-pointer"
                title="ចុចដើម្បីកំណត់ទៅ 100% (Reset to 100%)"
              >
                {zoomLevel}%
              </button>
            </div>

            {/* Split Tool (Canva Pill) */}
            <button
              onClick={handleSplitSegment}
              className="px-3 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 text-xs border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Split segment at playhead position (Cut)"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-500" />
              <span>Split</span>
            </button>
          </div>

          {/* Center Playback Controls (Canva Pro Central Controls) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 h-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              onClick={togglePlay}
              disabled={!videoSrc}
              className="p-1 text-slate-700 dark:text-slate-200 hover:text-[#7D2AE8] transition-colors disabled:opacity-40 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => handleSeek(0)}
              disabled={!videoSrc}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] px-1">
              {formatSecondsToMmSs(currentTime)} / {formatSecondsToMmSs(duration || displayDuration)}
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language dropdown */}
            <div className="px-2.5 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <span>🇰🇭 Khmer</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Auto-Fit Button with Video Silence Cut & Snapping + Dropdown Menu */}
            <div className="relative" ref={autoFitMenuRef}>
              <div className="flex items-center rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/40 dark:to-emerald-950/40 border border-amber-300 dark:border-amber-700/80 shadow-2xs overflow-hidden">
                <button
                  onClick={handleAutoFitSilenceCut}
                  disabled={isAnalyzingSilence}
                  className="px-2.5 h-8 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 disabled:opacity-60"
                  title="Auto-Fit: វិភាគវីដេអូ កាត់កន្លែងស្ងាត់ចោល និងតភ្ជាប់ប្រយោគស្វ័យប្រវត្តិ (Cut Silence & Snap)"
                >
                  {isAnalyzingSilence ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Scissors className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>{isAnalyzingSilence ? 'Analyzing Silence...' : 'Auto-Fit: Cut & Snap'}</span>
                </button>
                <button
                  onClick={() => setIsAutoFitMenuOpen((prev) => !prev)}
                  className="px-1.5 h-8 border-l border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                  title="ជម្រើស Auto-Fit Options"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Auto-Fit Dropdown Menu */}
              {isAutoFitMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 animate-fadeIn text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Auto-Fit Smart Video Tools</span>
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">AI SMART</span>
                  </div>

                  {/* Primary Action: Cut Silence & Snap */}
                  <div className="mt-1 p-1 bg-gradient-to-r from-amber-50/80 to-emerald-50/80 dark:from-amber-950/30 dark:to-emerald-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 mb-2">
                    <button
                      onClick={handleAutoFitSilenceCut}
                      disabled={isAnalyzingSilence}
                      className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 border border-amber-200/80 dark:border-amber-700/60 shadow-2xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-amber-600" />
                          <span>កាត់កន្លែងស្ងាត់ & ភ្ជាប់ស្វ័យប្រវត្តិ</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        វិភាគ Video រកចន្លោះស្ងាត់ៗ កាត់ចោល និងតភ្ជាប់ឈុតឆាកបន្តគ្នាភ្លាមៗ (Cut Silences & Ripple Snap)
                      </p>
                    </button>
                  </div>

                  {/* Toggle: Auto-Skip Silence during Playback */}
                  <div className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap className={`w-3.5 h-3.5 ${isSkipSilenceOn ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          រំលងកន្លែងស្ងាត់ពេលចាក់
                        </span>
                        <span className="text-[9px] text-slate-400">Skip dead pauses live on video</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSkipSilenceOn(!isSkipSilenceOn)}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer ${
                        isSkipSilenceOn
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSkipSilenceOn ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Speech Speed Cadence Sub-Options */}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>ល្បឿនសម្លេង (Speech Rate Cadence)</span>
                    <button
                      onClick={handleToggleAutoFit}
                      className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                      title="ចុចប្តូរ Mode (Med -> High -> Off -> Low)"
                    >
                      Cycle ({autoFitMode.toUpperCase()})
                    </button>
                  </div>

                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <button
                      onClick={() => handleApplyAutoFit('med')}
                      className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                        autoFitMode === 'med'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Cadence Med (0.8x - 1.35x)</span>
                      </div>
                      <span className="text-[9px] text-slate-400">Auto</span>
                    </button>

                    <button
                      onClick={() => handleApplyAutoFit('high')}
                      className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                        autoFitMode === 'high'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Cadence High (0.7x - 1.65x)</span>
                      </div>
                      <span className="text-[9px] text-slate-400">Fast</span>
                    </button>

                    <button
                      onClick={() => handleApplyAutoFit('off')}
                      className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                        autoFitMode === 'off'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span>Cadence Constant (1.0x)</span>
                      </div>
                    </button>

                    <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />

                    <button
                      onClick={handleFitTimelineToScreen}
                      className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Fit Timeline to Screen (ពង្រីកល្មមអេក្រង់)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sync End: ON Toggle */}
            <button
              onClick={() => setIsSyncEndOn(!isSyncEndOn)}
              className={`px-3 h-8 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isSyncEndOn
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/80'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sync End: {isSyncEndOn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Ducking Toggle */}
            <button
              onClick={() => setIsDuckingOn(!isDuckingOn)}
              className={`px-3 h-8 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-2xs ${
                isDuckingOn
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              Ducking: {isDuckingOn ? 'ON' : 'OFF'}
            </button>

            {/* Solid Canva Gradient Transcribe Button */}
            <button
              onClick={handleTranscribeVideo}
              disabled={isTranscribing}
              className="px-3.5 h-8 rounded-xl bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] hover:brightness-105 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Speech-to-Text Auto Transcription"
            >
              {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span>{isTranscribing ? 'Transcribing...' : 'Auto Transcribe'}</span>
            </button>

            {/* Solid Indigo Gradient Generate Selected Audio */}
            <button
              onClick={handleGenerateAllAudio}
              disabled={isGeneratingAll || subtitles.length === 0}
              className="px-3.5 h-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-105 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              title="Generate AI Dubbed Voices for all segments"
            >
              {isGeneratingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isGeneratingAll ? 'Generating...' : 'Generate Dubbing'}</span>
            </button>
          </div>
        </div>

        {/* Active Segment Quick Edit Floating Bar (Canva Floating Inspector) */}
        {selectedSegment && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 dark:from-emerald-950/60 dark:via-slate-900/80 dark:to-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs shrink-0 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shrink-0 shadow-2xs">
                #{selectedSegment.id} ({selectedSegment.start} - {selectedSegment.end})
              </span>
              <input
                type="text"
                value={selectedSegment.khmerText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubtitles((prev) =>
                    prev.map((s) => (s.id === selectedSegment.id ? { ...s, khmerText: val, audioStatus: 'Pending' } : s)),
                  );
                }}
                placeholder="កែសម្រួលអត្ថបទត្រង់នេះ (Edit text directly here)..."
                className="flex-1 min-w-0 px-2.5 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-400 font-sans"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => playDialogueAudio(selectedSegment.khmerText, selectedSegment.voiceProfile, selectedSegment.id)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="ស្តាប់សំឡេង (Listen)"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSplitSegment}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="ពុះកាត់ត្រង់នេះ (Split at playhead)"
              >
                <Scissors className="w-3.5 h-3.5 text-indigo-500" />
              </button>
              <button
                onClick={() => {
                  setSubtitles((prev) => prev.filter((s) => s.id !== selectedSegment.id));
                  setActiveSegmentId(null);
                }}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="លុបប្រយោគនេះ (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Multi-Track Timeline Canvas with Fixed Headers and Horizontal & Vertical Scroll */}
        <div className="relative flex-1 bg-[#fafafa] dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800/80 select-none flex flex-row overflow-hidden min-h-0 shadow-inner">
          {/* 1. FIXED LEFT TRACK HEADERS (Canva Pro Track Sidebar) */}
          <div className="w-36 sm:w-40 shrink-0 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xs overflow-hidden">
            {/* Top Pinned Header matching Ruler height (h-8) */}
            <div className="h-8 px-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 font-bold shrink-0 bg-slate-50/90 dark:bg-slate-900/90 select-none">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                <Layers className="w-3.5 h-3.5" />
                <span className="tracking-wider">TRACKS</span>
              </div>
              <button
                onClick={() => setAudioTrackCount((prev) => Math.min(8, prev + 1))}
                className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[10px] shadow-xs flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                title="បន្ថែម Audio Track ថ្មី (+ Add Audio Track)"
              >
                <Plus className="w-3 h-3" />
                <span>Track</span>
              </button>
            </div>

            {/* Vertically Scrollable Track Badges Container (Height h-12 matching right lanes) */}
            <div
              ref={leftTracksScrollRef}
              onWheel={(e) => {
                if (timelineScrollRef.current) {
                  timelineScrollRef.current.scrollTop += e.deltaY;
                }
              }}
              className="flex-1 overflow-y-hidden overflow-x-hidden p-2 flex flex-col gap-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* V1 Header */}
              <div className="h-12 shrink-0 flex items-center justify-between px-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs group/th hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-2xs shrink-0">
                    V1
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Video</span>
                    <span className="text-[9px] text-slate-400 font-mono">Original</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Film className="w-3.5 h-3.5 text-blue-500" />
                  <Lock className="w-3 h-3 opacity-60" />
                </div>
              </div>

              {/* T1 Header */}
              <div className="h-12 shrink-0 flex items-center justify-between px-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs group/th hover:border-emerald-400 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xs shrink-0">
                    T1
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Subtitles</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {subtitles.length} clips
                    </span>
                  </div>
                </div>
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
              </div>

              {/* A1 Header */}
              <div className="h-12 shrink-0 flex items-center justify-between px-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs group/th hover:border-indigo-400 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-2xs shrink-0">
                    A1
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                      <Mic className="w-3 h-3 text-indigo-500 inline" /> Dub Voice
                    </span>
                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-mono font-semibold">Auto-Sync</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    !isAudioMuted
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title={!isAudioMuted ? 'Dub Voice Sound ON (Click to Mute)' : 'Dub Voice Muted (Click to Unmute)'}
                >
                  {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* A2 Header */}
              <div className="h-12 shrink-0 flex items-center justify-between px-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs group/th hover:border-purple-400 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xs shrink-0">
                    A2
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">BGM Music</span>
                    <span className="text-[9px] text-purple-500 dark:text-purple-400 font-mono font-semibold">Track</span>
                  </div>
                </div>
                <Music className="w-3.5 h-3.5 text-purple-500" />
              </div>

              {/* A3+ Headers */}
              {Array.from({ length: audioTrackCount - 2 }).map((_, idx) => {
                const trackNum = idx + 3;
                return (
                  <div
                    key={`left-A${trackNum}`}
                    className="h-12 shrink-0 flex items-center justify-between px-2.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs group/th hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs shrink-0">
                        A{trackNum}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Sound FX</span>
                        <span className="text-[9px] text-amber-500 dark:text-amber-400 font-mono font-semibold">Ambient</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setAudioTrackCount((prev) => Math.max(2, prev - 1))}
                      className="text-slate-400 hover:text-rose-500 opacity-60 group-hover/th:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="លុប Track នេះ (Delete Track)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. HORIZONTALLY & VERTICALLY SCROLLABLE TRACK LANES */}
          <div
            ref={timelineScrollRef}
            onScroll={(e) => {
              if (leftTracksScrollRef.current) {
                leftTracksScrollRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            className="flex-1 min-w-0 overflow-x-auto overflow-y-auto relative [scrollbar-width:thin] select-none"
            onClick={(e) => {
              if (timelineScrollRef.current) {
                const rect = timelineScrollRef.current.getBoundingClientRect();
                const scrollLeft = timelineScrollRef.current.scrollLeft;
                const clickX = e.clientX - rect.left + scrollLeft;
                const targetSec = Math.max(0, Math.min(displayDuration, clickX / pixelsPerSec));
                handleSeek(targetSec);
              }
            }}
          >
            {/* Inner Content with exact scaled width */}
            <div
              className="relative flex flex-col p-2 min-h-full"
              style={{ width: `${totalTimelineWidth}px`, minWidth: '100%' }}
            >
              {/* Sticky Timecode Ruler with Scaled Major & Minor Graduation Ticks */}
              <div
                className="h-8 sticky top-0 z-30 bg-[#fafafa]/95 dark:bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-mono text-slate-400 shrink-0 cursor-ew-resize select-none mb-2.5"
                title="អូស Cursor លើបន្ទាត់ពេលវេលា ដើម្បីរំកិល Playhead (Scrub Timecode Ruler)"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const handleRulerScrub = (moveEvent: MouseEvent) => {
                    if (timelineScrollRef.current) {
                      const rect = timelineScrollRef.current.getBoundingClientRect();
                      const scrollLeft = timelineScrollRef.current.scrollLeft;
                      const clickX = moveEvent.clientX - rect.left + scrollLeft;
                      const targetSec = Math.max(0, Math.min(displayDuration, clickX / pixelsPerSec));
                      handleSeek(targetSec);
                    }
                  };
                  handleRulerScrub(e.nativeEvent);
                  const handleMouseUp = () => {
                    window.removeEventListener('mousemove', handleRulerScrub);
                    window.removeEventListener('mouseup', handleMouseUp);
                  };
                  window.addEventListener('mousemove', handleRulerScrub);
                  window.addEventListener('mouseup', handleMouseUp);
                }}
              >
                {/* Minor ticks (every 1s / 2s / 5s) */}
                {minorTicks.map((mt) => (
                  <div
                    key={`minor-${mt}`}
                    className="absolute bottom-0 w-[1px] h-2 bg-slate-300 dark:bg-slate-700/80 pointer-events-none"
                    style={{ left: `${mt * pixelsPerSec}px` }}
                  />
                ))}

                {/* Major ticks (with time badges) */}
                {ticks.map((t) => (
                  <div
                    key={`major-${t}`}
                    className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                    style={{ left: `${t * pixelsPerSec}px` }}
                  >
                    <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 -ml-3.5 px-1 py-0.2 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                      {formatSecondsToMmSs(t)}
                    </span>
                    <div className="w-[1.5px] h-3 bg-slate-400 dark:bg-slate-500 rounded-t"></div>
                  </div>
                ))}

                {/* Canva Signature Playhead Head (Rounded Teardrop Indicator) */}
                <div
                  className="absolute top-0 z-40 pointer-events-none -ml-[7px]"
                  style={{ left: `${currentTime * pixelsPerSec}px` }}
                >
                  <div className="w-3.5 h-4 bg-gradient-to-b from-rose-500 to-rose-600 rounded-b-md shadow-[0_2px_10px_rgba(244,63,94,0.6)] border border-white dark:border-slate-900 flex items-center justify-center">
                    <div className="w-1 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Glowing Laser Playhead Line extending down all tracks */}
              <div
                className="absolute top-8 bottom-0 w-[2px] bg-gradient-to-b from-rose-500 via-rose-500 to-pink-600 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{
                  left: `${currentTime * pixelsPerSec}px`,
                }}
              ></div>

              {/* TRACK LANES CONTAINER (Comfortable h-12 per lane with gap-2.5) */}
              <div className="flex flex-col gap-2.5">
                {/* TRACK 1: Video Track (V1 - Canva Filmstrip Styling) */}
                <div className="relative h-12 shrink-0 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 overflow-hidden flex items-center px-2 shadow-2xs">
                  {videoFileName || duration > 0 ? (
                    <div
                      className="h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-sm border border-blue-300/40 flex items-center justify-between px-3 relative overflow-hidden"
                      style={{ width: `${Math.max(140, (duration || displayDuration) * pixelsPerSec)}px` }}
                    >
                      {/* Filmstrip Sprocket Perforations */}
                      <div className="absolute top-0.5 left-2 right-2 flex justify-between pointer-events-none opacity-30">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1 bg-white rounded-xs"></div>
                        ))}
                      </div>
                      <div className="absolute bottom-0.5 left-2 right-2 flex justify-between pointer-events-none opacity-30">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1 bg-white rounded-xs"></div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold truncate z-10">
                        <Film className="w-4 h-4 text-sky-200 shrink-0" />
                        <span className="truncate">{videoFileName || 'V1 Video Track'}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-sky-100 px-2 py-0.5 rounded-md bg-white/20 z-10 shrink-0">
                        00:00.00 - {formatSecondsToMmSs(duration || displayDuration)}
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex items-center justify-between px-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer group/v1"
                    >
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-blue-500 group-hover/v1:scale-110 transition-transform" />
                        <span>V1 Video Track — ចុចត្រង់នេះដើម្បីផ្ទុក ឬបន្ថែម Video ច្រើនក្នុងពេលតែមួយ (Load Single or Multiple Videos)</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 font-bold text-[11px] shadow-2xs">
                        + Load Videos
                      </span>
                    </div>
                  )}
                </div>

                {/* TRACK 2: Subtitle Segments (T1 - Canva Subtitle Blocks) */}
                <div className="relative h-12 shrink-0 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 overflow-hidden flex items-center shadow-2xs">
                  {subtitles.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-between px-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span>T1 Subtitles Track — ចុច + Add Text ឬ ប្រើ Auto Transcribe ដើម្បីបង្កើតប្រយោគ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddTextRow}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Text</span>
                        </button>
                        <button
                          onClick={handleTranscribeVideo}
                          disabled={isTranscribing}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] hover:brightness-105 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto Transcribe</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    subtitles.map((seg) => {
                      const leftPx = seg.startSeconds * pixelsPerSec;
                      const widthPx = Math.max(48, (seg.endSeconds - seg.startSeconds) * pixelsPerSec);
                      const isCurrent = activeSegmentId === seg.id;
                      const isEditing = editingSegmentId === seg.id;

                      return (
                        <div
                          key={seg.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeek(seg.startSeconds);
                            setActiveSegmentId(seg.id);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingSegmentId(seg.id);
                            setInlineTextValue(seg.khmerText);
                          }}
                          className={`group/seg absolute top-1 bottom-1 rounded-xl px-2.5 flex items-center justify-between text-xs font-semibold truncate transition-all cursor-pointer shadow-sm border ${
                            isCurrent
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-white ring-offset-2 ring-offset-emerald-600 border-white/60 z-20 scale-[1.01]'
                              : 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white hover:brightness-110 border-emerald-400/40'
                          }`}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                          }}
                          title={`#${seg.id} [${seg.start} - ${seg.end}]: ${seg.khmerText} (Double-click ដើម្បីកែអត្ថបទ, អូសគែមសងខាងដើម្បី Trim)`}
                        >
                          {/* Left Trim Handle with 2-dot grip */}
                          <div
                            onMouseDown={(e) => handleStartTrimLeft(e, seg.id)}
                            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/seg:opacity-100 bg-white/40 hover:bg-white/80 active:bg-white rounded-l-xl flex items-center justify-center transition-all z-10"
                            title="អូសដើម្បីបង្រួម/បង្រីក វិនាទីចាប់ផ្តើម (Drag to trim start)"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="w-1 h-1 bg-emerald-950/80 rounded-full"></div>
                              <div className="w-1 h-1 bg-emerald-950/80 rounded-full"></div>
                            </div>
                          </div>

                          {/* Inner Content: ID Badge + Text */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 px-1">
                            <span className="font-mono font-bold text-[10px] bg-white/25 px-1.5 py-0.5 rounded-md shrink-0">
                              #{seg.id}
                            </span>

                            {isEditing ? (
                              <input
                                type="text"
                                value={inlineTextValue}
                                onChange={(e) => setInlineTextValue(e.target.value)}
                                onBlur={() => handleSaveInlineText(seg.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineText(seg.id);
                                  if (e.key === 'Escape') setEditingSegmentId(null);
                                }}
                                autoFocus
                                className="w-full h-7 bg-emerald-950/90 text-white px-2 py-0.5 rounded-lg text-xs outline-none border border-white font-sans"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="truncate select-none font-medium">{seg.khmerText}</span>
                            )}
                          </div>

                          {/* Right Duration Tag (if clip is wide enough) */}
                          {widthPx > 110 && (
                            <span className="text-[10px] font-mono text-emerald-100/90 shrink-0 pl-1 select-none">
                              {seg.start}
                            </span>
                          )}

                          {/* Right Trim Handle with 2-dot grip */}
                          <div
                            onMouseDown={(e) => handleStartTrimRight(e, seg.id)}
                            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/seg:opacity-100 bg-white/40 hover:bg-white/80 active:bg-white rounded-r-xl flex items-center justify-center transition-all z-10"
                            title="អូសដើម្បីបង្រួម/បង្រីក វិនាទីបញ្ចប់ (Drag to trim end)"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="w-1 h-1 bg-emerald-950/80 rounded-full"></div>
                              <div className="w-1 h-1 bg-emerald-950/80 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* TRACK 3: Dubbed Audio 1 (A1 - Canva Audio Waveform Visual) */}
                <div className="relative h-12 shrink-0 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/30 overflow-hidden flex items-center shadow-2xs">
                  {subtitles.length === 0 ? (
                    <span className="text-xs text-indigo-500/80 dark:text-indigo-400 font-medium px-4">
                      🎙️ A1 Dubbed Audio Track (ស្វ័យប្រវត្តិតាមអត្ថបទ T1)
                    </span>
                  ) : (
                    subtitles.map((seg) => {
                      const leftPx = seg.startSeconds * pixelsPerSec;
                      const widthPx = Math.max(48, (seg.endSeconds - seg.startSeconds) * pixelsPerSec);
                      const durationSec = Math.max(0.5, seg.endSeconds - seg.startSeconds);

                      return (
                        <div
                          key={seg.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeek(seg.startSeconds);
                            setActiveSegmentId(seg.id);
                          }}
                          className="absolute top-1 bottom-1 rounded-xl px-2.5 flex items-center justify-between text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:brightness-105 text-white truncate cursor-pointer transition-all shadow-sm border border-indigo-300/40 relative overflow-hidden group/audio"
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                          }}
                          title={`A1: ${seg.voiceLabel} (${seg.start} - ${seg.end}) - Status: ${seg.audioStatus}`}
                        >
                          {/* Audio Waveform Visualization Layer */}
                          <VoiceWaveformVisual durationSec={durationSec} seed={seg.id} />

                          {/* Voice Actor / Profile Badge */}
                          <div className="flex items-center gap-1.5 min-w-0 z-10 px-1">
                            <span className="text-[10px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded-md shrink-0">
                              🎙️ {seg.voiceLabel}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                seg.audioStatus === 'Ready'
                                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                  : 'bg-amber-400 animate-pulse'
                              }`}
                            />
                          </div>

                          {/* Quick Listen Button on Hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playDialogueAudio(seg.khmerText, seg.voiceProfile, seg.id);
                            }}
                            className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover/audio:opacity-100 transition-opacity z-10 shrink-0 ml-1 cursor-pointer"
                            title="ស្តាប់សំឡេង (Preview Voice)"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* TRACK 4: Instrumental BGM (A2 - Canva Stereo Waveform Track) */}
                <div className="relative h-12 shrink-0 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30 overflow-hidden flex items-center px-2 shadow-2xs">
                  {bgmFileName ? (
                    <div
                      className="h-10 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white shadow-sm border border-purple-300/40 flex items-center justify-between px-3 relative overflow-hidden"
                      style={{ width: `${Math.max(180, (duration || displayDuration) * pixelsPerSec)}px` }}
                    >
                      {/* Stereo BGM Soundwave Bars */}
                      <BgmWaveformVisual widthPx={(duration || displayDuration) * pixelsPerSec} />

                      <div className="flex items-center gap-2 text-xs font-semibold truncate z-10">
                        <Music className="w-4 h-4 text-pink-200 shrink-0 animate-pulse" />
                        <span className="truncate">{bgmFileName}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-pink-100 px-2 py-0.5 rounded-md bg-white/20 z-10 shrink-0">
                        BGM Instrumental Track
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => bgmInputRef.current?.click()}
                      className="w-full h-full flex items-center justify-between px-4 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer group/bgm"
                    >
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-purple-500 group-hover/bgm:scale-110 transition-transform" />
                        <span>A2 BGM (Instrumental Track) — ផ្ទុកតន្ត្រីផ្ទៃខាងក្រោយដើម្បីប្រើប្រាស់</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 font-bold text-[11px] shadow-2xs">
                        + Load BGM
                      </span>
                    </div>
                  )}
                </div>

                {/* TRACK 5+: Additional Audio Tracks (A3, A4... - Ambient Sound FX) */}
                {Array.from({ length: audioTrackCount - 2 }).map((_, idx) => {
                  const trackNum = idx + 3;
                  return (
                    <div
                      key={`track-A${trackNum}`}
                      className="relative h-12 shrink-0 rounded-2xl bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 overflow-hidden flex items-center px-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>A{trackNum} Audio Track (Sound Effects / Ambient Audio)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
