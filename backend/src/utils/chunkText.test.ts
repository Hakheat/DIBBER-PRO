import { describe, expect, it } from 'vitest';
import { chunkText } from './chunkText.js';

describe('chunkText utility', () => {
  it('returns empty array for empty or whitespace-only text', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\t  ')).toEqual([]);
  });

  it('returns a single chunk if text is smaller than maxChunkSize', () => {
    const text = 'This is a short story about an owl.';
    const result = chunkText(text, 500);
    expect(result).toEqual([text]);
  });

  it('splits cleanly at sentence boundaries including Khmer khan (។)', () => {
    const khmerText =
      'កាលពីព្រេងនាយ មានកូនចាបមួយរស់នៅលើដើមឈើធំ។ ' +
      'រៀងរាល់ថ្ងៃ កូនចាបតែងតែហើរស្វែងរកចំណីយ៉ាងសប្បាយ។ ' +
      'ថ្ងៃមួយ ព្យុះសង្ឃរាបានបោកបក់មកដល់ព្រៃ។';

    // With chunkSize of 80 characters, it should split at sentence boundaries
    const chunks = chunkText(khmerText, 80);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(80);
    }
  });

  it('splits on punctuation or spaces when sentence boundaries exceed chunk size', () => {
    const longSentence =
      'In a distant land where dragons roamed the mountains and wizards cast spells in high towers, ' +
      'a young wanderer discovered a forgotten talisman that glowed with mysterious celestial energy.';

    const chunks = chunkText(longSentence, 60);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(60);
    }
    // All original words should be accounted for without missing text
    const reassembled = chunks.join(' ');
    expect(reassembled).toContain('dragons');
    expect(reassembled).toContain('talisman');
  });

  it('force splits long continuous strings with no spaces or punctuation', () => {
    const unbroken = 'A'.repeat(150);
    const chunks = chunkText(unbroken, 50);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe('A'.repeat(50));
    expect(chunks[1]).toBe('A'.repeat(50));
    expect(chunks[2]).toBe('A'.repeat(50));
  });
});
