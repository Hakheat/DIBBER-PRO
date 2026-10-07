import { describe, expect, it } from 'vitest';
import { VideoService } from './video.service.js';

describe('VideoService', () => {
  const service = new VideoService();

  describe('detectPlatform', () => {
    it('detects YouTube from standard and short URLs', () => {
      // Access private method via any for unit testing
      const fn = (service as any).detectPlatform.bind(service);
      expect(fn('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
      expect(fn('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
      expect(fn('https://youtube.com/shorts/abc123xyz')).toBe('youtube');
    });

    it('detects Facebook from video links', () => {
      const fn = (service as any).detectPlatform.bind(service);
      expect(fn('https://www.facebook.com/watch/?v=123456789')).toBe('facebook');
      expect(fn('https://fb.watch/xyz123/')).toBe('facebook');
    });

    it('detects TikTok, Instagram, Twitter and Vimeo', () => {
      const fn = (service as any).detectPlatform.bind(service);
      expect(fn('https://www.tiktok.com/@user/video/1234567890')).toBe('tiktok');
      expect(fn('https://www.instagram.com/reel/C-xyz123/')).toBe('instagram');
      expect(fn('https://twitter.com/user/status/123456789')).toBe('twitter');
      expect(fn('https://x.com/user/status/123456789')).toBe('twitter');
      expect(fn('https://vimeo.com/123456789')).toBe('vimeo');
    });

    it('falls back to other for unknown web pages', () => {
      const fn = (service as any).detectPlatform.bind(service);
      expect(fn('https://example.com/media/sample.mp4')).toBe('other');
    });
  });

  describe('isKissKh and parseKissKhUrl', () => {
    it('detects kisskh domains and short links', () => {
      const fn = (service as any).isKissKh.bind(service);
      expect(fn('https://t.kisskh.id/Gve2')).toBe(true);
      expect(fn('https://kisskh.co/Drama/Martial-Master?id=1428')).toBe(true);
      expect(fn('https://youtube.com/watch?v=123')).toBe(false);
    });

    it('extracts drama ID from kisskh URL parameters', () => {
      const fn = (service as any).parseKissKhUrl.bind(service);
      const res = fn('https://kisskh.co/Drama/Martial-Master?id=1428&ep=40869');
      expect(res.dramaId).toBe(1428);
      expect(res.epId).toBe(40869);
    });
  });

  describe('formatDuration', () => {
    it('formats seconds into MM:SS or HH:MM:SS', () => {
      const fn = (service as any).formatDuration.bind(service);
      expect(fn(0)).toBe('0:00');
      expect(fn(45)).toBe('0:45');
      expect(fn(125)).toBe('2:05');
      expect(fn(3600)).toBe('1:00:00');
      expect(fn(3665)).toBe('1:01:05');
    });
  });

  describe('sanitizeFilename', () => {
    it('strips illegal characters from title for safe file saving', () => {
      const fn = (service as any).sanitizeFilename.bind(service);
      expect(fn('Hello: World? <Test> "Video" | 2026/09\\10*')).toBe('Hello World Test Video 20260910');
      expect(fn('   Khmer   Song   2026   ')).toBe('Khmer Song 2026');
    });
  });
});
