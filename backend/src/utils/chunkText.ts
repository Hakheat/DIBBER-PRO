/**
 * Splits text into chunks of at most `maxChunkSize` characters,
 * respecting sentence and paragraph boundaries (including Khmer punctuation '។').
 */
export function chunkText(text: string, maxChunkSize = 500): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmed = text.trim();
  if (trimmed.length <= maxChunkSize) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let remaining = trimmed;

  // Delimiters in order of splitting preference
  // Includes Khmer full stop '។' and standard punctuation
  const sentenceEndPattern = /([.!?\n\r។]+\s*)/;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining.trim());
      break;
    }

    // Try finding the best split point before maxChunkSize
    const candidateSlice = remaining.slice(0, maxChunkSize);
    
    // Look for sentence endings
    let splitIndex = -1;
    
    // Search backward from candidateSlice end for a clean sentence or paragraph end
    const sentenceMatches = Array.from(candidateSlice.matchAll(new RegExp(sentenceEndPattern, 'g')));
    if (sentenceMatches.length > 0) {
      const lastMatch = sentenceMatches[sentenceMatches.length - 1];
      if (lastMatch.index !== undefined && lastMatch.index + lastMatch[0].length >= Math.floor(maxChunkSize * 0.3)) {
        splitIndex = lastMatch.index + lastMatch[0].length;
      }
    }

    // If no sentence end found, try commas or semicolons
    if (splitIndex === -1) {
      const commaMatch = candidateSlice.search(/[,;،]\s*(?=[^,;،]*$)/);
      if (commaMatch >= Math.floor(maxChunkSize * 0.3)) {
        splitIndex = commaMatch + 1;
      }
    }

    // If still no punctuation split, try spaces
    if (splitIndex === -1) {
      const spaceIndex = candidateSlice.lastIndexOf(' ');
      if (spaceIndex >= Math.floor(maxChunkSize * 0.3)) {
        splitIndex = spaceIndex + 1;
      }
    }

    // Fallback: hard cut at maxChunkSize if no delimiter found
    if (splitIndex <= 0) {
      splitIndex = maxChunkSize;
    }

    const chunk = remaining.slice(0, splitIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    remaining = remaining.slice(splitIndex).trim();
  }

  return chunks;
}
