import fs from 'node:fs';
import path from 'node:path';
import type { ClonedVoice } from '../types/index.js';
import { KHMER_DEFAULT_VOICES } from '../constants/khmerVoices.js';
import { logger } from '../utils/logger.js';

const storageDir = path.resolve(process.cwd(), 'data');
const storageFile = path.resolve(storageDir, 'voices.json');

export class VoiceStore {
  private voices: Map<string, ClonedVoice> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(storageFile)) {
        const raw = fs.readFileSync(storageFile, 'utf-8');
        try {
          const list: ClonedVoice[] = JSON.parse(raw);
          for (const item of list) {
            this.voices.set(item.id, item);
          }
        } catch {
          // ignore corrupted file
        }
      }

      // Always ensure the 10 Khmer Default Human-Grade Voices are available
      for (const preset of KHMER_DEFAULT_VOICES) {
        this.voices.set(preset.id, {
          id: preset.id,
          name: preset.name,
          provider: preset.provider,
          createdAt: preset.createdAt,
          gender: preset.gender,
          description: preset.description,
          isDefault: true,
          sampleText: preset.sampleText,
          tags: preset.tags,
        });
      }

      this.saveToFile();
      logger.info(`Loaded ${this.voices.size} cloned voices (including 10 Khmer Default Human voices) from storage.`);
    } catch (err) {
      logger.error('Failed to initialize voice storage:', err);
    }
  }

  private saveToFile() {
    try {
      const list = Array.from(this.voices.values());
      fs.writeFileSync(storageFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Failed to save voices to file:', err);
    }
  }

  public getAll(): ClonedVoice[] {
    const all = Array.from(this.voices.values());
    const defaults = all.filter((v) => v.isDefault);
    const customs = all.filter((v) => !v.isDefault).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return [...defaults, ...customs];
  }

  public getById(id: string): ClonedVoice | undefined {
    return this.voices.get(id);
  }

  public save(voice: ClonedVoice): ClonedVoice {
    this.voices.set(voice.id, voice);
    this.saveToFile();
    return voice;
  }

  public delete(id: string): boolean {
    const target = this.voices.get(id);
    if (target?.isDefault) {
      return false; // Protect system defaults
    }
    const existed = this.voices.delete(id);
    if (existed) {
      this.saveToFile();
    }
    return existed;
  }
}

export const voiceStore = new VoiceStore();

