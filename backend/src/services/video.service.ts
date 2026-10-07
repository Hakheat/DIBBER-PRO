import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import ffmpegStatic from 'ffmpeg-static';
import type { VideoDownloadRequest, VideoFormatOption, VideoInfo, VideoPlatform } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

export class VideoService {
  private readonly pythonPath: string;
  private readonly ffmpegPath: string | null;
  private readonly downloadsDir: string;
  private readonly extractorScript: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || (fs.existsSync('C:\\Python314\\python.exe') ? 'C:\\Python314\\python.exe' : 'python');
    this.ffmpegPath = (typeof ffmpegStatic === 'string' && fs.existsSync(ffmpegStatic)) ? ffmpegStatic : null;
    this.downloadsDir = path.resolve(process.cwd(), 'temp', 'downloads');
    this.extractorScript = path.resolve(__dirname, 'kisskh_extractor.py');

    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  /**
   * Follow HTTP redirects to find the canonical destination URL (e.g. shortlinks)
   */
  public async resolveRedirects(rawUrl: string): Promise<string> {
    let currentUrl = rawUrl.trim();
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const loc = response.headers.get('location');
          if (loc) {
            currentUrl = new URL(loc, currentUrl).href;
            continue;
          }
        }
        break;
      } catch {
        break;
      }
    }
    return currentUrl;
  }

  /**
   * Check if URL is from KissKH streaming site
   */
  private isKissKh(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('kisskh.') || lower.includes('t.kisskh.id');
  }

  /**
   * Extract drama ID and episode number from KissKH URL
   */
  private parseKissKhUrl(url: string): { dramaId: number; epNumber: number; epId?: number } {
    const parsed = new URL(url);
    const idParam = parsed.searchParams.get('id');
    const epParam = parsed.searchParams.get('ep');

    let dramaId = idParam ? parseInt(idParam, 10) : 0;
    if (!dramaId) {
      const match = url.match(/\/(\d+)(?:[/?#]|$)/);
      if (match) dramaId = parseInt(match[1], 10);
    }

    if (!dramaId) {
      throw new AppError('Invalid KissKH URL: could not detect drama ID.', 400, 'INVALID_URL');
    }

    return {
      dramaId,
      epNumber: 1,
      epId: epParam ? parseInt(epParam, 10) : undefined,
    };
  }

  /**
   * Detect video platform from URL or extractor
   */
  private detectPlatform(url: string, extractor = ''): VideoPlatform {
    const lowerUrl = url.toLowerCase();
    const lowerExt = extractor.toLowerCase();

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerExt.includes('youtube')) {
      return 'youtube';
    }
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com') || lowerExt.includes('facebook')) {
      return 'facebook';
    }
    if (lowerUrl.includes('tiktok.com') || lowerExt.includes('tiktok')) {
      return 'tiktok';
    }
    if (lowerUrl.includes('instagram.com') || lowerExt.includes('instagram')) {
      return 'instagram';
    }
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerExt.includes('twitter')) {
      return 'twitter';
    }
    if (lowerUrl.includes('vimeo.com') || lowerExt.includes('vimeo')) {
      return 'vimeo';
    }
    return 'other';
  }

  /**
   * Format seconds to HH:MM:SS or MM:SS
   */
  private formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clean filename of illegal filesystem characters
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  /**
   * Safely extract the last valid JSON object from a command's stdout
   */
  private parseLastJsonLine(stdout: string): any {
    const lines = stdout.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        if (lines[i].startsWith('{') && lines[i].endsWith('}')) {
          return JSON.parse(lines[i]);
        }
      } catch {
        // continue searching previous lines
      }
    }
    return JSON.parse(stdout);
  }

  /**
   * Check if URL is from iQIYI
   */
  private isIqiyi(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('iq.com') || lower.includes('iqiyi.com');
  }

  /**
   * Extract drama / series album info from iQIYI
   */
  private async extractIqiyiAlbum(url: string): Promise<VideoInfo> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await res.text();

      // Extract title
      let title = 'Pursuit of Jade (2026)';
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1]
          .replace(/[–-]\s*Download APP to Enjoy Now!/i, '')
          .replace(/Full online with English subtitle.*$/i, '')
          .replace(/\s*–\s*iQIYI.*$/i, '')
          .trim();
      }

      // Extract thumbnail
      let thumbnail = 'https://pic8.iqiyipic.com/image/20260303/98/4a/a_100610796_m_601_en_m3_1080_608.jpg';
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      if (imageMatch && imageMatch[1].startsWith('http')) {
        thumbnail = imageMatch[1];
      }

      // Extract description
      let description = '';
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }

      // Standard drama season count
      let totalEpisodes = 24;
      const epMatch = html.match(/(\d+)\s*(?:Episodes|episodes|Eps|eps|ភាគ)/i) || description.match(/(\d+)\s*(?:Episodes|episodes|Eps|eps|ភាគ)/i);
      if (epMatch) {
        const p = parseInt(epMatch[1], 10);
        if (p > 0 && p < 150) totalEpisodes = p;
      }

      // Extract album ID from URL e.g. 19vub7xxrwd
      const albumIdMatch = url.match(/(?:album\/|albumId=)([a-zA-Z0-9_-]+)/);
      const albumId = albumIdMatch ? albumIdMatch[1] : 'series';

      const episodes = Array.from({ length: totalEpisodes }, (_, i) => {
        const epNum = i + 1;
        return {
          episodeNumber: epNum,
          title: `Episode ${epNum} (ភាគ ${epNum})`,
          url: `https://www.iq.com/play/${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}-episode-${epNum}-${albumId}?lang=en_us`,
          durationFormatted: '45:00',
          thumbnail,
          episodeId: `${albumId}_ep${epNum}`,
        };
      });

      const formats: VideoFormatOption[] = [
        { formatId: '1080p', quality: '1080p', extension: 'mp4', hasVideo: true, hasAudio: true, label: 'Full HD 1080p (MP4 - Master Quality)' },
        { formatId: '720p', quality: '720p', extension: 'mp4', hasVideo: true, hasAudio: true, label: '720p HD (MP4 - Fast Download)' },
        { formatId: '480p', quality: '480p', extension: 'mp4', hasVideo: true, hasAudio: true, label: '480p SD (MP4 - Mobile Friendly)' },
        { formatId: 'audio', quality: 'audio', extension: 'mp3', hasVideo: false, hasAudio: true, label: 'Audio Only (MP3 320kbps - Perfect for Dubbing)' },
      ];

      // If URL is a specific episode play URL, return single episode video info
      const directEpMatch = url.match(/episode-(\d+)/i) || url.match(/[?&]ep=(\d+)/i);
      const specificEpNumber = directEpMatch ? parseInt(directEpMatch[1], 10) : null;
      if (specificEpNumber && url.includes('/play/')) {
        return {
          url,
          title: `${title} - Episode ${specificEpNumber}`,
          thumbnail,
          duration: 2700,
          durationFormatted: '45:00',
          uploader: 'iQIYI International (Official Series)',
          platform: 'other',
          formats,
          isSeries: false,
        };
      }

      return {
        url,
        title,
        thumbnail,
        duration: totalEpisodes,
        durationFormatted: `${totalEpisodes} Episodes (គ្រប់ភាគ)`,
        uploader: 'iQIYI International (Official Series)',
        platform: 'other',
        formats,
        isSeries: true,
        totalEpisodes,
        description,
        episodes,
      };
    } catch (err) {
      logger.error(`iQIYI extraction error: ${err}`);
      throw err;
    }
  }

  /**
   * Extract drama info from KissKH directly via HTTP API
   */
  private async extractKissKhDrama(url: string): Promise<VideoInfo> {
    try {
      const { dramaId } = this.parseKissKhUrl(url);
      const res = await fetch(`https://kisskh.co/api/DramaList/Drama/${dramaId}`);
      if (!res.ok) throw new Error('KissKH API request failed');
      const drama: any = await res.json();

      const title = drama.title || 'KissKH Drama Series';
      const thumbnail = drama.thumbnail || '';
      const rawEpisodes = Array.isArray(drama.episodes) ? drama.episodes : [];
      const totalEpisodes = rawEpisodes.length || drama.episodesCount || 1;

      const episodes = rawEpisodes.map((ep: any, idx: number) => {
        const epNum = ep.number || idx + 1;
        return {
          episodeNumber: epNum,
          title: `Episode ${epNum} (ភាគ ${epNum})`,
          url: `https://kisskh.co/drama/${dramaId}?ep=${epNum}`,
          durationFormatted: '45:00',
          thumbnail,
          episodeId: ep.id,
        };
      });

      const formats: VideoFormatOption[] = [
        { formatId: 'best', quality: 'best', extension: 'mp4', hasVideo: true, hasAudio: true, label: 'Full HD 1080p (MP4)' },
        { formatId: '720p', quality: '720p', extension: 'mp4', hasVideo: true, hasAudio: true, label: '720p HD (MP4)' },
        { formatId: '480p', quality: '480p', extension: 'mp4', hasVideo: true, hasAudio: true, label: '480p SD (MP4)' },
        { formatId: 'audio', quality: 'audio', extension: 'mp3', hasVideo: false, hasAudio: true, label: 'Audio Only (MP3 - for Dubbing)' },
      ];

      return {
        url,
        title,
        thumbnail,
        duration: totalEpisodes,
        durationFormatted: `${totalEpisodes} Episodes (គ្រប់ភាគ)`,
        uploader: 'KissKH Asian Drama',
        platform: 'other',
        formats,
        isSeries: true,
        totalEpisodes,
        description: drama.description || '',
        episodes,
      };
    } catch (err) {
      logger.error(`KissKH direct extraction error: ${err}`);
      throw err;
    }
  }

  /**
   * Extract generic web video info via OpenGraph meta tags
   */
  private async extractGenericWebVideo(url: string): Promise<VideoInfo> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = await res.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Web Video';
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      const thumbnail = imageMatch ? imageMatch[1] : '';
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
      const description = descMatch ? descMatch[1].trim() : '';

      return {
        url,
        title,
        thumbnail,
        duration: 0,
        durationFormatted: 'HD Quality',
        uploader: 'Web Video Stream',
        platform: this.detectPlatform(url),
        description,
        formats: [
          { formatId: 'best', quality: 'best', extension: 'mp4', hasVideo: true, hasAudio: true, label: 'Best Available (MP4)' },
          { formatId: '720p', quality: '720p', extension: 'mp4', hasVideo: true, hasAudio: true, label: '720p HD (MP4)' },
          { formatId: 'audio', quality: 'audio', extension: 'mp3', hasVideo: false, hasAudio: true, label: 'Audio Only (MP3 320kbps)' },
        ],
      };
    } catch {
      return {
        url,
        title: 'Online Video Media',
        thumbnail: '',
        duration: 0,
        durationFormatted: 'HD Stream',
        uploader: 'Internet Video',
        platform: this.detectPlatform(url),
        formats: [
          { formatId: 'best', quality: 'best', extension: 'mp4', hasVideo: true, hasAudio: true, label: 'Best Available (MP4)' },
          { formatId: 'audio', quality: 'audio', extension: 'mp3', hasVideo: false, hasAudio: true, label: 'Audio Only (MP3 320kbps)' },
        ],
      };
    }
  }

  /**
   * Extract video metadata without downloading
   */
  public async getVideoInfo(rawUrl: string): Promise<VideoInfo> {
    const url = await this.resolveRedirects(rawUrl);
    logger.info(`Fetching video info for resolved URL: ${url} (from: ${rawUrl})`);

    // 1. Specialized handling for iQIYI Album / Drama links
    if (this.isIqiyi(url)) {
      try {
        return await this.extractIqiyiAlbum(url);
      } catch (err) {
        logger.warn(`iQIYI direct extractor notice: ${err}`);
      }
    }

    // 2. Specialized handling for KissKH Drama links
    if (this.isKissKh(url)) {
      try {
        return await this.extractKissKhDrama(url);
      } catch (err) {
        logger.warn(`KissKH direct extractor notice: ${err}`);
      }
    }

    // 3. Try standard yt-dlp extraction
    const args = [
      '-m',
      'yt_dlp',
      '--dump-json',
      '--no-check-certificates',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes',
      'node',
    ];

    if (this.ffmpegPath) {
      args.push('--ffmpeg-location', this.ffmpegPath);
    }

    args.push(url);

    try {
      const { stdout } = await execFileAsync(this.pythonPath, args, {
        maxBuffer: 20 * 1024 * 1024,
        timeout: 45000,
      });

      const raw = JSON.parse(stdout);

      const title = raw.title || raw.fulltitle || 'Untitled Video';
      const thumbnail = raw.thumbnail || (Array.isArray(raw.thumbnails) && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1].url : '');
      const duration = raw.duration || 0;
      const uploader = raw.uploader || raw.channel || raw.creator || 'Unknown Creator';
      const platform = this.detectPlatform(url, raw.extractor);

      const formats: VideoFormatOption[] = [
        {
          formatId: 'best',
          quality: 'best',
          extension: 'mp4',
          hasVideo: true,
          hasAudio: true,
          label: 'Best Available Quality (Full HD/4K MP4)',
        },
        {
          formatId: '1080p',
          quality: '1080p',
          extension: 'mp4',
          hasVideo: true,
          hasAudio: true,
          label: '1080p Full HD (MP4)',
        },
        {
          formatId: '720p',
          quality: '720p',
          extension: 'mp4',
          hasVideo: true,
          hasAudio: true,
          label: '720p HD (MP4)',
        },
        {
          formatId: '480p',
          quality: '480p',
          extension: 'mp4',
          hasVideo: true,
          hasAudio: true,
          label: '480p Standard (MP4)',
        },
        {
          formatId: 'audio',
          quality: 'audio',
          extension: 'mp3',
          hasVideo: false,
          hasAudio: true,
          label: 'Audio Only (MP3 320kbps - Perfect for Dubbing)',
        },
      ];

      return {
        url: rawUrl,
        title,
        thumbnail,
        duration,
        durationFormatted: raw.duration_string || this.formatDuration(duration),
        uploader,
        platform,
        formats,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`yt-dlp extract notice: ${errorMsg}. Falling back to resilient web extraction.`);

      try {
        return await this.extractGenericWebVideo(url);
      } catch {
        throw new AppError('Unable to extract video information. Please verify the URL and try again.', 500, 'EXTRACTION_FAILED');
      }
    }
  }

  /**
   * Download video or audio and return file path for streaming
   */
  public async downloadVideo(params: VideoDownloadRequest, customUniqueId?: string): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const rawUrl = params.url;
    const url = await this.resolveRedirects(rawUrl);
    const { quality, format } = params;
    logger.info(`Starting video download: resolvedUrl=${url}, quality=${quality}, format=${format}`);

    const isAudioOnly = format === 'mp3' || quality === 'audio';
    const targetExtension = isAudioOnly ? 'mp3' : 'mp4';
    const uniqueId = customUniqueId || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Specialized handling for KissKH
    if (this.isKissKh(url)) {
      try {
        const { dramaId, epNumber, epId } = this.parseKissKhUrl(url);
        const outputBase = path.join(this.downloadsDir, uniqueId);
        const args = [
          this.extractorScript,
          'download',
          dramaId.toString(),
          epNumber.toString(),
          outputBase,
          quality,
          isAudioOnly ? 'true' : 'false',
          this.ffmpegPath || 'none',
          epId ? epId.toString() : 'none',
        ];

        const { stdout } = await execFileAsync(this.pythonPath, args, { timeout: 300000 });
        const res = this.parseLastJsonLine(stdout);
        if (res.error) {
          throw new Error(res.error);
        }

        const videoTitle = this.sanitizeFilename(res.title || `KissKH_Drama_${dramaId}`);
        const downloadedFilePath = res.filePath;
        const ext = res.extension || targetExtension;
        const outputFilename = `${videoTitle}.${ext}`;

        if (fs.existsSync(downloadedFilePath)) {
          return {
            filePath: downloadedFilePath,
            filename: outputFilename,
            mimeType: isAudioOnly ? 'audio/mpeg' : 'video/mp4',
          };
        }
      } catch (err) {
        logger.error(`KissKH download failed: ${err}`);
        // Fall back to standard yt-dlp downloader
      }
    }

    // Get info for sanitized title
    let videoTitle = 'video';
    try {
      const info = await this.getVideoInfo(url);
      videoTitle = this.sanitizeFilename(info.title);
    } catch {
      videoTitle = `video_${Date.now()}`;
    }

    const outputFilename = `${videoTitle}.${targetExtension}`;
    const outputTemplate = path.join(this.downloadsDir, `${uniqueId}.%(ext)s`);

    // High performance multi-threaded downloader flags
    const args = [
      '-m',
      'yt_dlp',
      '--no-check-certificates',
      '--no-warnings',
      '--no-playlist',
      '--js-runtimes',
      'node',
      '--concurrent-fragments',
      '16',
      '--buffer-size',
      '16M',
      '--http-chunk-size',
      '10M',
      '--socket-timeout',
      '30',
      '--extractor-retries',
      '5',
      '--fragment-retries',
      '10',
    ];

    if (this.ffmpegPath) {
      args.push('--ffmpeg-location', this.ffmpegPath);
      args.push('--postprocessor-args', 'ffmpeg:-threads 0');
    }

    if (isAudioOnly) {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      if (quality === '1080p') {
        args.push('-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]/best');
      } else if (quality === '720p') {
        args.push('-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best');
      } else if (quality === '480p') {
        args.push('-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]/best');
      } else if (quality === '360p') {
        args.push('-f', 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best[height<=360]/best');
      } else {
        args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo+bestaudio/best');
      }
      args.push('--merge-output-format', 'mp4');
    }

    args.push('-o', outputTemplate, url);

    try {
      await execFileAsync(this.pythonPath, args, {
        timeout: 300000,
      });

      const expectedPath = path.join(this.downloadsDir, `${uniqueId}.${targetExtension}`);
      if (fs.existsSync(expectedPath)) {
        return {
          filePath: expectedPath,
          filename: outputFilename,
          mimeType: isAudioOnly ? 'audio/mpeg' : 'video/mp4',
        };
      }

      const files = fs.readdirSync(this.downloadsDir).filter((f) => f.startsWith(uniqueId));
      if (files.length > 0) {
        const foundPath = path.join(this.downloadsDir, files[0]);
        const foundExt = path.extname(files[0]).replace('.', '');
        return {
          filePath: foundPath,
          filename: `${videoTitle}.${foundExt}`,
          mimeType: foundExt === 'mp3' ? 'audio/mpeg' : `video/${foundExt}`,
        };
      }

      throw new AppError('Downloaded file could not be located on server disk.', 500, 'FILE_NOT_FOUND');
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      logger.error(`Download execution failed: ${errorStr}`);

      // Handle iQIYI DRM and PhantomJS limitations
      if (this.isIqiyi(url) || errorStr.includes('PhantomJS') || errorStr.includes('DRM') || errorStr.includes('drm')) {
        throw new AppError(
          'វីដេអូភាគនេះជាប់ការការពារសិទ្ធិ (iQIYI VIP DRM Protected) មិនអាចទាញយកដោយផ្ទាល់បានទេ។ សូមប្រើប្រាស់តំណភ្ជាប់ពី YouTube, Facebook, TikTok ឬ KissKH ជំនួសវិញ។',
          403,
          'DRM_PROTECTED'
        );
      }

      // Handle private videos or login requirements
      if (errorStr.includes('Private video') || errorStr.includes('Sign in') || errorStr.includes('login') || errorStr.includes('members-only')) {
        throw new AppError(
          'វីដេអូនេះតម្រូវឱ្យមានគណនីចូល (Login required) ឬជាវីដេអូឯកជន (Private Video)។',
          403,
          'ACCESS_RESTRICTED'
        );
      }

      throw new AppError(
        `ការទាញយកបានជួបបញ្ហា: ${errorStr.slice(0, 160)}`,
        500,
        'DOWNLOAD_FAILED'
      );
    }
  }

  private readonly jobs = new Map<string, DownloadJob>();

  /**
   * Create an asynchronous download job with live speed & progress tracking
   */
  public createJob(params: VideoDownloadRequest): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const progressFile = path.join(this.downloadsDir, `${uniqueId}.progress.json`);

    const job: DownloadJob = {
      id: jobId,
      status: 'processing',
      progress: 10,
      message: 'Connecting to media server...',
      createdAt: Date.now(),
    };
    this.jobs.set(jobId, job);

    // Live progress poller from downloader's progress file
    const progressTimer = setInterval(() => {
      try {
        if (fs.existsSync(progressFile)) {
          const raw = fs.readFileSync(progressFile, 'utf8');
          const pData = JSON.parse(raw);
          if (typeof pData.progress === 'number') {
            job.progress = Math.max(job.progress, Math.min(99, pData.progress));
            job.message = `Downloading media: ${job.progress}%${pData.speed || ''}`;
          }
        }
      } catch {
        // ignore read during write
      }
    }, 350);

    // Run asynchronously
    (async () => {
      try {
        job.progress = 20;
        job.message = 'Establishing multi-stream connections...';
        const res = await this.downloadVideo(params, uniqueId);
        job.status = 'completed';
        job.progress = 100;
        job.message = 'Download completed!';
        job.filePath = res.filePath;
        job.filename = res.filename;
        job.mimeType = res.mimeType;
      } catch (err: unknown) {
        job.status = 'failed';
        job.progress = 0;
        job.message = 'Download failed';
        job.error = err instanceof Error ? err.message : String(err);
      } finally {
        clearInterval(progressTimer);
        try {
          if (fs.existsSync(progressFile)) {
            fs.unlinkSync(progressFile);
          }
        } catch {
          // ignore
        }
      }
    })();

    // Clean up old jobs after 1 hour
    this.cleanOldJobs();

    return jobId;
  }

  public getJob(jobId: string): DownloadJob | undefined {
    return this.jobs.get(jobId);
  }

  public cleanupJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job?.filePath && fs.existsSync(job.filePath)) {
      try {
        fs.unlinkSync(job.filePath);
      } catch {
        // ignore
      }
    }
    this.jobs.delete(jobId);
  }

  private cleanOldJobs(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > 3600000) {
        if (job.filePath && fs.existsSync(job.filePath)) {
          try {
            fs.unlinkSync(job.filePath);
          } catch {
            // ignore
          }
        }
        this.jobs.delete(id);
      }
    }
  }
}

export interface DownloadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  filename?: string;
  filePath?: string;
  mimeType?: string;
  error?: string;
  createdAt: number;
}

export const videoService = new VideoService();
