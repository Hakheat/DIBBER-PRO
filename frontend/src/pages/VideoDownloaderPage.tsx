import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  Film,
  FolderDown,
  Layers,
  Link as LinkIcon,
  Mic,
  Music,
  Search,
  Share2,
  Sparkles,
  Square,
  StopCircle,
  User,
  Video,
  Zap,
} from 'lucide-react';
import { downloadVideoWithProgress } from '../api/video.api.js';
import { Button } from '../components/ui/Button.js';
import { ErrorMessage } from '../components/ui/ErrorMessage.js';
import { Spinner } from '../components/ui/Spinner.js';
import { useVideoDownloader } from '../hooks/useVideoDownloader.js';
import type { DramaEpisode, UILanguage, VideoPlatform } from '../types/index.js';
import { t } from '../utils/format.js';

interface VideoDownloaderPageProps {
  currentLang: UILanguage;
  onNavigateToStudio?: (text: string) => void;
  onNavigateToVoiceLab?: () => void;
}

const PLATFORM_BADGES: Record<VideoPlatform, { label: string; color: string; border: string; bg: string }> = {
  youtube: { label: 'YouTube', color: 'text-red-500', border: 'border-red-500/20', bg: 'bg-red-500/10' },
  facebook: { label: 'Facebook', color: 'text-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  tiktok: { label: 'TikTok', color: 'text-teal-400', border: 'border-teal-500/20', bg: 'bg-teal-500/10' },
  instagram: { label: 'Instagram', color: 'text-pink-500', border: 'border-pink-500/20', bg: 'bg-pink-500/10' },
  twitter: { label: 'X / Twitter', color: 'text-sky-400', border: 'border-sky-500/20', bg: 'bg-sky-500/10' },
  vimeo: { label: 'Vimeo', color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/10' },
  other: { label: 'Web Video', color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
};

interface BatchItem {
  episodeNumber: number;
  title: string;
  url?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export const VideoDownloaderPage: React.FC<VideoDownloaderPageProps> = ({
  currentLang,
  onNavigateToStudio,
  onNavigateToVoiceLab,
}) => {
  const [url, setUrl] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState(false);

  // Series / Drama Batch Download State
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
  const [epSearch, setEpSearch] = useState('');
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [individualDownloadingEp, setIndividualDownloadingEp] = useState<number | null>(null);
  const [individualEpProgress, setIndividualEpProgress] = useState<Record<number, number>>({});

  const batchCancelRef = useRef<boolean>(false);

  const {
    fetchInfo,
    videoInfo,
    isFetchingInfo,
    infoError,
    downloadAsync,
    isDownloading,
    downloadProgress,
    downloadError,
    resetDownload,
  } = useVideoDownloader();

  // When videoInfo changes and it is a series, automatically select all episodes
  useEffect(() => {
    if (videoInfo?.isSeries && videoInfo.episodes && videoInfo.episodes.length > 0) {
      setSelectedEpisodes(videoInfo.episodes.map((e) => e.episodeNumber));
      setBatchItems(
        videoInfo.episodes.map((e) => ({
          episodeNumber: e.episodeNumber,
          title: e.title,
          url: e.url,
          status: 'pending',
          progress: 0,
        }))
      );
    } else {
      setSelectedEpisodes([]);
      setBatchItems([]);
    }
  }, [videoInfo]);

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setDownloadSuccessMessage(false);
    resetDownload();
    batchCancelRef.current = true;
    setIsBatchDownloading(false);
    fetchInfo(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setDownloadSuccessMessage(false);
        batchCancelRef.current = true;
        setIsBatchDownloading(false);
        fetchInfo(text.trim());
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  // Single video download handler
  const handleDownload = async () => {
    if (!videoInfo) return;
    try {
      setDownloadSuccessMessage(false);
      await downloadAsync({
        url: videoInfo.url,
        quality: selectedQuality,
        format: selectedFormat,
      });
      setDownloadSuccessMessage(true);
    } catch {
      // Handled by hook
    }
  };

  // Toggle selection for all episodes
  const handleToggleSelectAll = () => {
    if (!videoInfo?.episodes) return;
    if (selectedEpisodes.length === videoInfo.episodes.length) {
      setSelectedEpisodes([]);
    } else {
      setSelectedEpisodes(videoInfo.episodes.map((e) => e.episodeNumber));
    }
  };

  // Toggle selection for an individual episode
  const handleToggleEpisode = (epNum: number) => {
    setSelectedEpisodes((prev) =>
      prev.includes(epNum) ? prev.filter((n) => n !== epNum) : [...prev, epNum].sort((a, b) => a - b)
    );
  };

  // Batch download trigger (either all or selected)
  const handleStartBatchDownload = async (targetEpNumbers?: number[]) => {
    if (!videoInfo?.episodes || videoInfo.episodes.length === 0) return;

    const episodesToDownload = targetEpNumbers
      ? videoInfo.episodes.filter((e) => targetEpNumbers.includes(e.episodeNumber))
      : videoInfo.episodes;

    if (episodesToDownload.length === 0) return;

    batchCancelRef.current = false;
    setIsBatchDownloading(true);

    const queue: BatchItem[] = episodesToDownload.map((e) => ({
      episodeNumber: e.episodeNumber,
      title: e.title,
      url: e.url,
      status: 'pending',
      progress: 0,
    }));
    setBatchItems(queue);

    for (let i = 0; i < queue.length; i++) {
      if (batchCancelRef.current) {
        break;
      }

      const item = queue[i];
      setCurrentBatchIndex(i);

      setBatchItems((prev) =>
        prev.map((it) =>
          it.episodeNumber === item.episodeNumber
            ? { ...it, status: 'downloading', progress: 15 }
            : it
        )
      );

      try {
        await downloadVideoWithProgress(
          {
            url: item.url || videoInfo.url,
            quality: selectedQuality,
            format: selectedFormat,
          },
          (progress) => {
            setBatchItems((prev) =>
              prev.map((it) =>
                it.episodeNumber === item.episodeNumber
                  ? { ...it, progress: progress.progress }
                  : it
              )
            );
          }
        );

        setBatchItems((prev) =>
          prev.map((it) =>
            it.episodeNumber === item.episodeNumber
              ? { ...it, status: 'completed', progress: 100 }
              : it
          )
        );

        // Pause 1 second between batch downloads so browser does not block multiple downloads
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Download failed';
        setBatchItems((prev) =>
          prev.map((it) =>
            it.episodeNumber === item.episodeNumber
              ? { ...it, status: 'failed', error: errorMsg }
              : it
          )
        );
      }
    }

    setIsBatchDownloading(false);
  };

  // Stop batch download
  const handleStopBatchDownload = () => {
    batchCancelRef.current = true;
    setIsBatchDownloading(false);
  };

  // Download a single episode individually from its card
  const handleDownloadSingleEpisode = async (ep: DramaEpisode) => {
    if (!videoInfo) return;
    setIndividualDownloadingEp(ep.episodeNumber);
    setIndividualEpProgress((prev) => ({ ...prev, [ep.episodeNumber]: 15 }));

    try {
      await downloadVideoWithProgress(
        {
          url: ep.url || videoInfo.url,
          quality: selectedQuality,
          format: selectedFormat,
        },
        (p) => {
          setIndividualEpProgress((prev) => ({ ...prev, [ep.episodeNumber]: p.progress }));
        }
      );
      setIndividualEpProgress((prev) => ({ ...prev, [ep.episodeNumber]: 100 }));
    } catch {
      // Handled
    } finally {
      setTimeout(() => {
        setIndividualDownloadingEp(null);
      }, 1500);
    }
  };

  // Platform badges
  const rawBadge = videoInfo ? PLATFORM_BADGES[videoInfo.platform] : null;
  const platformBadge = videoInfo && videoInfo.uploader.includes('iQIYI')
    ? { label: 'iQIYI International', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/15' }
    : videoInfo && videoInfo.uploader.includes('KissKH')
    ? { label: 'KissKH Asian Drama', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/15' }
    : rawBadge;

  // Filtered episodes for the episode grid search
  const filteredEpisodes = (videoInfo?.episodes || []).filter((ep) => {
    if (!epSearch.trim()) return true;
    const q = epSearch.toLowerCase();
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.episodeNumber.toString().includes(q)
    );
  });

  // Batch stats
  const completedBatchCount = batchItems.filter((i) => i.status === 'completed').length;
  const failedBatchCount = batchItems.filter((i) => i.status === 'failed').length;
  const overallBatchPercent =
    batchItems.length > 0 ? Math.round((completedBatchCount / batchItems.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in w-full pb-16">
      {/* URL Input Form */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 md:p-6 shadow-sm">
        <form onSubmit={handleFetch} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {currentLang === 'km' ? 'តំណភ្ជាប់វីដេអូ ឬ Profile រឿង (Series / Drama Album)' : 'Video URL or Series Album Profile'}
            </label>
            <span className="text-[11px] font-medium text-primary-500 dark:text-primary-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {currentLang === 'km' ? 'គាំទ្រ iQIYI, KissKH, Facebook, TikTok, YouTube' : 'Supports iQIYI, KissKH, Facebook, TikTok, YouTube'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1 flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-slate-400 shrink-0">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={currentLang === 'km' ? 'បិទភ្ជាប់ Link រឿង (ឧ. https://www.iq.com/album/... ឬ KissKH)...' : 'Paste drama or video URL (e.g. https://www.iq.com/album/...)...'}
                className="w-full min-w-0 bg-transparent py-2.5 px-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors whitespace-nowrap"
                title={t('pasteFromClipboard', currentLang)}
              >
                {t('pasteFromClipboard', currentLang)}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isFetchingInfo || !url.trim()}
              leftIcon={isFetchingInfo ? undefined : <Film className="w-4 h-4" />}
              isLoading={isFetchingInfo}
              className="shrink-0 px-7 py-3 whitespace-nowrap font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {isFetchingInfo ? t('fetchingVideo', currentLang) : t('fetchVideoBtn', currentLang)}
            </Button>
          </div>
        </form>

        {infoError && (
          <div className="mt-4">
            <ErrorMessage message={infoError.message || t('invalidUrlError', currentLang)} />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CASE 1: DRAMA PROFILE & ALL EPISODES DOWNLOAD STATION */}
      {/* ======================================================== */}
      {videoInfo && videoInfo.isSeries && (
        <div className="space-y-6 animate-fade-in">
          {/* Drama Profile Banner Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
            {/* Background accent ambient glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Vertical Drama Poster */}
              <div className="relative shrink-0 w-36 sm:w-44 lg:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group bg-slate-950">
                {videoInfo.thumbnail ? (
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <Video className="w-12 h-12 mb-2 text-indigo-400" />
                    <span className="text-xs">Drama Cover</span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow">
                  Series
                </div>
              </div>

              {/* Drama Metadata & Overview */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  {platformBadge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${platformBadge.bg} ${platformBadge.border} ${platformBadge.color}`}>
                      {platformBadge.label}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    {videoInfo.totalEpisodes || videoInfo.episodes?.length || 24} {currentLang === 'km' ? 'ភាគ (Episodes)' : 'Episodes Total'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {videoInfo.title}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{videoInfo.uploader}</span>
                  </p>
                </div>

                {videoInfo.description && (
                  <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 leading-relaxed max-w-3xl bg-black/25 p-3 rounded-xl border border-white/5">
                    {videoInfo.description}
                  </p>
                )}

                {videoInfo.uploader.includes('iQIYI') && (
                  <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {currentLang === 'km'
                          ? 'ចំណាំ៖ ភាគមួយចំនួននៅលើ iQIYI អាចជាប់សិទ្ធិ VIP DRM Encryption។'
                          : 'Note: Certain iQIYI episodes may be VIP DRM protected by the platform.'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentLang === 'km'
                        ? 'ប្រសិនបើភាគណាទាញយកមិនបានដោយសារ DRM សូមស្វែងរកភាគនោះលើ KissKH ឬ YouTube ដើម្បីទាញយកវីដេអូពេញ Full HD គ្មាន DRM៖'
                        : 'If an episode is restricted by DRM, find this series on KissKH or YouTube for full unencrypted video:'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <a
                        href={`https://kisskh.co/Search?q=${encodeURIComponent(videoInfo.title.replace(/Episode \d+/i, '').trim())}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <span>🎬 ស្វែងរកលើ KissKH (Full Video)</span>
                      </a>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(videoInfo.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <span>▶️ ស្វែងរកលើ YouTube</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Quality & Format Switchers inside Header */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="inline-flex p-1 bg-slate-900/90 border border-slate-700/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat('mp4');
                        setSelectedQuality('best');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedFormat === 'mp4'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Video (MP4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat('mp3');
                        setSelectedQuality('audio');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedFormat === 'mp3'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Audio Only (MP3)</span>
                    </button>
                  </div>

                  {selectedFormat === 'mp4' && (
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'best', label: 'Best Quality' },
                        { id: '1080p', label: '1080p Full HD' },
                        { id: '720p', label: '720p HD' },
                        { id: '480p', label: '480p SD' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedQuality(opt.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            selectedQuality === opt.id
                              ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Master Action Bar */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
                >
                  {selectedEpisodes.length === (videoInfo.episodes?.length || 0) ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      <span>{currentLang === 'km' ? 'ដោះការជ្រើសរើសទាំងអស់' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>{currentLang === 'km' ? 'ជ្រើសរើសទាំងអស់' : 'Select All Episodes'}</span>
                    </>
                  )}
                </button>

                <span className="text-xs font-semibold text-slate-400">
                  {currentLang === 'km'
                    ? `បានជ្រើសរើស ${selectedEpisodes.length} ក្នុងចំណោម ${videoInfo.episodes?.length || 0} ភាគ`
                    : `Selected ${selectedEpisodes.length} / ${videoInfo.episodes?.length || 0} episodes`}
                </span>
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {isBatchDownloading ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={handleStopBatchDownload}
                    leftIcon={<StopCircle className="w-4 h-4" />}
                    className="w-full sm:w-auto px-6 py-3 font-bold shadow-lg shadow-red-500/20"
                  >
                    {currentLang === 'km' ? 'បញ្ឈប់ការទាញយក (Stop Batch)' : 'Stop Batch Download'}
                  </Button>
                ) : (
                  <>
                    {selectedEpisodes.length > 0 && selectedEpisodes.length < (videoInfo.episodes?.length || 0) && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => handleStartBatchDownload(selectedEpisodes)}
                        leftIcon={<Download className="w-4 h-4" />}
                        className="w-full sm:w-auto px-5 py-3 font-bold whitespace-nowrap"
                      >
                        {currentLang === 'km'
                          ? `ទាញយក ${selectedEpisodes.length} ភាគដែលបានជ្រើស`
                          : `Download Selected (${selectedEpisodes.length})`}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => handleStartBatchDownload()}
                      leftIcon={<Zap className="w-4 h-4 text-amber-300 animate-bounce" />}
                      className="w-full sm:w-auto px-8 py-3.5 font-black text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 shadow-xl shadow-indigo-500/30 whitespace-nowrap"
                    >
                      {currentLang === 'km'
                        ? `⚡ ទាញយកគ្រប់ភាគទាំងអស់ (${videoInfo.episodes?.length || 24} ភាគ)`
                        : `⚡ Download All Episodes (${videoInfo.episodes?.length || 24})`}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Live Batch Download Progress Station */}
          {(isBatchDownloading || batchItems.some((i) => i.status === 'completed' || i.status === 'failed')) && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 md:p-6 shadow-xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-content-primary">
                    {isBatchDownloading ? (
                      <>
                        <Spinner size="sm" />
                        <span>
                          {currentLang === 'km'
                            ? `កំពុងទាញយក: ភាគទី ${currentBatchIndex + 1} នៃ ${batchItems.length}`
                            : `Downloading: Episode ${currentBatchIndex + 1} of ${batchItems.length}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          {currentLang === 'km'
                            ? `ការទាញយកបានបញ្ចប់: ${completedBatchCount} / ${batchItems.length} ភាគ`
                            : `Batch Download Complete: ${completedBatchCount} / ${batchItems.length} episodes`}
                        </span>
                      </>
                    )}
                  </div>
                  {isBatchDownloading && batchItems[currentBatchIndex] && (
                    <p className="text-xs text-content-muted font-medium">
                      {batchItems[currentBatchIndex].title} ({selectedFormat.toUpperCase()} - {selectedQuality})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ {completedBatchCount} {currentLang === 'km' ? 'រួចរាល់' : 'Done'}
                  </span>
                  {failedBatchCount > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                      ✗ {failedBatchCount} {currentLang === 'km' ? 'បរាជ័យ' : 'Failed'}
                    </span>
                  )}
                  <span className="font-mono text-base font-black text-primary-500">
                    {overallBatchPercent}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-border h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${overallBatchPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Episode Browser Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <FolderDown className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-content-primary">
                {currentLang === 'km' ? 'បញ្ជីភាគទាំងអស់ (All Episodes)' : 'All Episodes List'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-elevated text-content-secondary border border-surface-border">
                {filteredEpisodes.length} {currentLang === 'km' ? 'ភាគ' : 'eps'}
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={epSearch}
                onChange={(e) => setEpSearch(e.target.value)}
                placeholder={currentLang === 'km' ? 'ស្វែងរកភាគ (ឧ. 1, 2, 10)...' : 'Search episode...'}
                className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Interactive Episode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredEpisodes.map((ep) => {
              const isSelected = selectedEpisodes.includes(ep.episodeNumber);
              const batchItem = batchItems.find((b) => b.episodeNumber === ep.episodeNumber);
              const isSingleDownloading = individualDownloadingEp === ep.episodeNumber;
              const singleProgress = individualEpProgress[ep.episodeNumber] || 0;

              return (
                <div
                  key={ep.episodeNumber}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-surface-card border-indigo-500/40 shadow-md shadow-indigo-500/5'
                      : 'bg-surface-elevated border-surface-border hover:border-surface-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Ep Tag */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleEpisode(ep.episodeNumber)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-400/50 bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        EP {ep.episodeNumber.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Status Pill */}
                    {batchItem?.status === 'downloading' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Spinner size="sm" />
                        {batchItem.progress}%
                      </span>
                    )}
                    {batchItem?.status === 'completed' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Done
                      </span>
                    )}
                    {batchItem?.status === 'failed' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        Failed
                      </span>
                    )}
                  </div>

                  {/* Title & Duration */}
                  <div className="my-3 space-y-1">
                    <h3 className="text-sm font-bold text-content-primary line-clamp-1">
                      {ep.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-content-muted">
                      <Clock className="w-3 h-3" />
                      <span>{ep.durationFormatted || '45:00'}</span>
                      <span>•</span>
                      <span className="uppercase font-semibold text-primary-400">
                        {selectedFormat.toUpperCase()} ({selectedQuality})
                      </span>
                    </div>
                  </div>

                  {/* Single Progress Indicator */}
                  {isSingleDownloading && (
                    <div className="mb-2 space-y-1">
                      <div className="w-full bg-surface-border h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-200"
                          style={{ width: `${singleProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono">
                        {singleProgress}% Downloading...
                      </span>
                    </div>
                  )}

                  {/* Action Buttons for Episode */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
                    <button
                      type="button"
                      disabled={isSingleDownloading || isBatchDownloading}
                      onClick={() => handleDownloadSingleEpisode(ep)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/25 transition-colors disabled:opacity-50"
                      title="Download this episode"
                    >
                      {isSingleDownloading ? (
                        <Spinner size="sm" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{currentLang === 'km' ? 'ទាញយក' : 'Download'}</span>
                    </button>

                    {onNavigateToStudio && (
                      <button
                        type="button"
                        onClick={() => onNavigateToStudio(`${videoInfo.title} - ${ep.title}`)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-border text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
                        title={currentLang === 'km' ? 'បញ្ចូលក្នុង Studio ដើម្បី Dub' : 'Dub in Studio'}
                      >
                        <Mic className="w-3.5 h-3.5 text-secondary-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CASE 2: SINGLE VIDEO DOWNLOAD STATION (YOUTUBE, FB, ETC) */}
      {/* ======================================================== */}
      {videoInfo && !videoInfo.isSeries && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 md:p-7 shadow-lg space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Thumbnail with overlay badges */}
            <div className="relative group w-full lg:w-80 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-surface-border shadow-md">
              {videoInfo.thumbnail ? (
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                  <Video className="w-12 h-12" />
                </div>
              )}

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-xs font-mono font-medium text-white flex items-center gap-1 shadow">
                <Clock className="w-3 h-3" />
                {videoInfo.durationFormatted}
              </div>

              {/* Platform badge */}
              {platformBadge && (
                <div
                  className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow ${platformBadge.bg} ${platformBadge.border} ${platformBadge.color} border`}
                >
                  {platformBadge.label}
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-content-muted">
                  <User className="w-3.5 h-3.5" />
                  <span>{videoInfo.uploader}</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-content-primary line-clamp-2 leading-snug">
                  {videoInfo.title}
                </h2>
                {videoInfo.uploader.includes('iQIYI') && (
                  <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {currentLang === 'km'
                          ? 'ចំណាំ៖ ភាគនេះនៅលើ iQIYI អាចជាប់សិទ្ធិ VIP DRM Encryption។'
                          : 'Note: Certain iQIYI episodes may be VIP DRM protected.'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentLang === 'km'
                        ? 'ប្រសិនបើតំណភ្ជាប់នេះទាញយកមិនបានដោយសារ DRM សូមស្វែងរកភាគនេះលើ KissKH ឬ YouTube ដើម្បីទាញយកវីដេអូពេញ Full HD គ្មាន DRM៖'
                        : 'If direct download is restricted by DRM, find this episode on KissKH or YouTube for full unencrypted video:'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <a
                        href={`https://kisskh.co/Search?q=${encodeURIComponent(videoInfo.title.replace(/Episode \d+/i, '').trim())}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <span>🎬 ស្វែងរកលើ KissKH (Full Video)</span>
                      </a>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(videoInfo.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <span>▶️ ស្វែងរកលើ YouTube</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Quality & Format Selection */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary">
                  {t('selectQuality', currentLang)}
                </label>

                {/* Video vs Audio Type selector */}
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('mp4');
                      setSelectedQuality('best');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedFormat === 'mp4'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-sm'
                        : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('mp3');
                      setSelectedQuality('audio');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedFormat === 'mp3'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-sm'
                        : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span>Audio Only (MP3)</span>
                  </button>
                </div>

                {/* Detailed resolutions if Video is selected */}
                {selectedFormat === 'mp4' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { id: 'best', label: 'Best Quality (Auto HD/4K)' },
                      { id: '1080p', label: '1080p Full HD' },
                      { id: '720p', label: '720p HD' },
                      { id: '480p', label: '480p SD' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedQuality(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selectedQuality === opt.id
                            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                            : 'bg-surface-elevated border-surface-border text-content-secondary hover:border-primary-500/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {onNavigateToStudio && (
                <button
                  type="button"
                  onClick={() => onNavigateToStudio(videoInfo.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-border text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary-400" />
                  <span>{t('sendToStudio', currentLang)}</span>
                </button>
              )}

              {onNavigateToVoiceLab && (
                <button
                  type="button"
                  onClick={onNavigateToVoiceLab}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-border text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-secondary-400" />
                  <span>{t('sendToVoiceLab', currentLang)}</span>
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={isDownloading}
              onClick={handleDownload}
              isLoading={isDownloading}
              leftIcon={isDownloading ? undefined : <Download className="w-4 h-4" />}
              className="w-full sm:w-auto py-3 px-8 text-sm font-bold shadow-lg shadow-indigo-500/25 whitespace-nowrap"
            >
              {isDownloading
                ? t('downloadingMedia', currentLang)
                : `${t('downloadVideoBtn', currentLang)} (${selectedFormat.toUpperCase()})`}
            </Button>
          </div>

          {/* Real-time Download Progress Bar */}
          {isDownloading && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-2.5 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  {downloadProgress?.message || t('downloadingMedia', currentLang)}
                </span>
                <span className="font-mono text-primary-500 font-bold">{downloadProgress?.progress || 15}%</span>
              </div>
              <div className="w-full bg-surface-border h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${downloadProgress?.progress || 15}%` }}
                />
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {downloadSuccessMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{t('downloadSuccess', currentLang)}</span>
            </div>
          )}

          {downloadError && (
            <div className="animate-fade-in">
              <ErrorMessage message={downloadError.message || 'Download failed. Please try another quality.'} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
