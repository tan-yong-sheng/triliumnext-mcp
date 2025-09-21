/**
 * Note Recovery Utilities
 * Provides smart recovery mechanisms when notes are not found during update operations
 */

import { logVerbose } from '../system/verboseUtils.js';

/**
 * Extract a potential note name from a noteId
 * Handles various noteId formats and converts them to searchable names
 */
export function extractNoteNameFromId(noteId: string): string {
  logVerbose("extractNoteNameFromId", `Extracting name from noteId: ${noteId}`);

  // If noteId looks like a random ID (alphanumeric), return it as-is for search
  if (/^[a-zA-Z0-9]{8,}$/.test(noteId)) {
    return noteId;
  }

  // If noteId contains spaces or human-readable text, clean it up
  let cleanName = noteId
    .replace(/[_-]/g, ' ')  // Replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ')   // Normalize multiple spaces
    .trim();

  logVerbose("extractNoteNameFromId", `Extracted name: ${cleanName}`);
  return cleanName;
}

/**
 * Search for notes similar to the given name
 * Returns structured results with similarity scoring
 */
export async function searchForSimilarNotes(
  noteName: string,
  axiosInstance: any
): Promise<{
  exactMatches: Array<{
    noteId: string;
    title: string;
    type: string;
    similarity: number;
  }>;
  similarMatches: Array<{
    noteId: string;
    title: string;
    type: string;
    similarity: number;
  }>;
  totalMatches: number;
}> {
  logVerbose("searchForSimilarNotes", `Searching for notes similar to: ${noteName}`);

  // Build search criteria for fuzzy matching
  const searchCriteria = [
    {
      property: 'title',
      type: 'noteProperty' as const,
      op: 'contains' as const,
      value: noteName,
      logic: 'OR' as const
    }
  ];

  // If the name has multiple words, also search for individual words
  const words = noteName.split(' ').filter(word => word.length > 2);
  if (words.length > 1) {
    words.forEach((word, index) => {
      if (index < words.length - 1) {
        searchCriteria.push({
          property: 'title',
          type: 'noteProperty' as const,
          op: 'contains' as const,
          value: word,
          logic: 'OR' as const
        });
      }
    });
  }

  try {
    // Search for notes with similar titles
    const searchResponse = await axiosInstance.post('/search', {
      search: `note.title *=* '${noteName.replace(/'/g, "\\'")}' OR ${words.map(w => `note.title *=* '${w.replace(/'/g, "\\'")}'`).join(' OR ')}`,
      limit: 10
    });

    const results = searchResponse.data.results || [];

    // Categorize matches by similarity
    const exactMatches: any[] = [];
    const similarMatches: any[] = [];

    results.forEach((note: any) => {
      const similarity = calculateSimilarity(noteName, note.title);

      if (similarity === 1.0) {
        exactMatches.push({
          noteId: note.noteId,
          title: note.title,
          type: note.type,
          similarity
        });
      } else if (similarity >= 0.3) {
        similarMatches.push({
          noteId: note.noteId,
          title: note.title,
          type: note.type,
          similarity
        });
      }
    });

    // Sort similar matches by similarity score
    similarMatches.sort((a, b) => b.similarity - a.similarity);

    logVerbose("searchForSimilarNotes", `Found ${exactMatches.length} exact matches, ${similarMatches.length} similar matches`);

    return {
      exactMatches,
      similarMatches: similarMatches.slice(0, 5), // Limit to top 5 similar matches
      totalMatches: exactMatches.length + similarMatches.length
    };

  } catch (error) {
    logVerbose("searchForSimilarNotes", "Search failed, returning empty results", error);
    return {
      exactMatches: [],
      similarMatches: [],
      totalMatches: 0
    };
  }
}

/**
 * Calculate similarity between two strings (0.0 to 1.0)
 * Uses a simple but effective similarity algorithm
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // One is substring of the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }

  // Calculate Levenshtein distance-based similarity
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1.0 : (maxLength - distance) / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Generate a helpful recovery message with actionable suggestions
 */
export function generateRecoveryMessage(
  failedNoteId: string,
  searchResults: {
    exactMatches: Array<{
      noteId: string;
      title: string;
      type: string;
      similarity: number;
    }>;
    similarMatches: Array<{
      noteId: string;
      title: string;
      type: string;
      similarity: number;
    }>;
    totalMatches: number;
  },
  updateDetails: {
    title?: string;
    content?: string;
    type?: string;
  } = {}
): string {
  const extractedName = extractNoteNameFromId(failedNoteId);

  let message = `❌ Note "${failedNoteId}" not found\n\n`;

  if (searchResults.totalMatches === 0) {
    message += `🔍 No similar notes found for "${extractedName}".\n\n`;
    message += `💡 **Suggestions**:\n`;
    message += `1. **Check the note ID** - Verify you have the correct note identifier\n`;
    message += `2. **Create a new note** - Use create_note if this is a new note you want to ${updateDetails.content ? 'update' : 'create'}\n`;
    message += `3. **Search existing notes** - Use search_notes to find related content\n\n`;

    if (updateDetails.title || updateDetails.content) {
      message += `📝 **Your intended update**:\n`;
      if (updateDetails.title) message += `- Title: "${updateDetails.title}"\n`;
      if (updateDetails.content) message += `- Content: ${updateDetails.content ? `${updateDetails.content.toString().substring(0, 100)}...` : 'No content'}\n`;
      message += `\n`;
    }
  } else {
    message += `🔍 Found ${searchResults.totalMatches} similar note(s) for "${extractedName}":\n\n`;

    if (searchResults.exactMatches.length > 0) {
      message += `✅ **Exact Matches**:\n`;
      searchResults.exactMatches.forEach((match, index) => {
        message += `${index + 1}. "${match.title}" (ID: ${match.noteId}, Type: ${match.type})\n`;
      });
      message += `\n`;
    }

    if (searchResults.similarMatches.length > 0) {
      message += `🤔 **Similar Matches**:\n`;
      searchResults.similarMatches.forEach((match, index) => {
        const confidence = Math.round(match.similarity * 100);
        message += `${index + 1}. "${match.title}" (ID: ${match.noteId}, Type: ${match.type}, ${confidence}% similar)\n`;
      });
      message += `\n`;
    }

    message += `💡 **Next Steps**:\n`;
    message += `1. **Use one of the suggested notes above** - Copy the note ID and retry your update\n`;
    message += `2. **Create a new note** - If none of these match, use create_note with your intended content\n`;
    message += `3. **Search more broadly** - Use search_notes with different keywords\n\n`;
  }

  message += `🛠️ **Commands to try**:\n`;
  message += `- Get note details: \`get_note({ noteId: "CORRECT_NOTE_ID" })\`\n`;
  message += `- Create new note: \`create_note({ parentNoteId: "root", title: "${extractedName}", type: "text", content: "Your content here" })\`\n`;
  message += `- Search similar: \`search_notes({ text: "${extractedName}" })\`\n`;

  return message;
}