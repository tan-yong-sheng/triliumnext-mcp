/**
 * Search and Replace Operations
 * Handles content search and replace with regex support and validation
 */

import { prepareContentForApi } from '../../../utils/contentProcessor.js';
import { logVerbose } from '../../../utils/verboseUtils.js';
import { validateContentForNoteType } from '../validation/contentValidator.js';
import { validateBlobIdHash } from '../validation/hashValidator.js';
import { NoteOperation, NoteSearchReplaceResponse, RegexMatch } from '../noteManager.js';

/**
 * Strip HTML tags from content for text notes
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Filter flags based on search mode (regex vs literal)
 */
function filterFlagsForMode(flags: string, useRegex: boolean): string {
  const validFlags = new Set(flags.split(''));

  if (!useRegex) {
    // Remove regex-only flags for literal search
    validFlags.delete('s');  // dotall - no meaning for literal search
    validFlags.delete('y');  // sticky - limited utility for literal search
  }

  return Array.from(validFlags).join('');
}

/**
 * Escape special regex characters for literal string matching
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Execute unified search on content (supports both regex and literal search)
 */
export function executeUnifiedSearch(
  content: string,
  pattern: string,
  useRegex: boolean = true,
  flags: string = 'g'
): RegexMatch[] {
  try {
    // Filter flags based on search mode
    const effectiveFlags = filterFlagsForMode(flags, useRegex);

    let searchPattern: string;
    if (useRegex) {
      searchPattern = pattern;
    } else {
      // Escape special regex characters for literal search
      searchPattern = escapeRegExp(pattern);
    }

    const regex = new RegExp(searchPattern, effectiveFlags);
    const matches: RegexMatch[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
        length: match[0].length,
        groups: match.length > 1 ? match.slice(1) : undefined
      });
    }

    return matches;
  } catch (error) {
    const searchType = useRegex ? "regex" : "literal";
    throw new Error(`Invalid ${searchType} pattern: ${pattern}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute search and replace on content
 */
function executeSearchReplace(
  content: string,
  searchPattern: string,
  replacePattern: string,
  useRegex: boolean = true,
  flags: string = 'g'
): { newContent: string; replacements: number } {
  try {
    let newContent = content;
    let replacements = 0;

    if (useRegex) {
      // Regex-based replacement
      const regex = new RegExp(searchPattern, flags);
      replacements = (content.match(regex) || []).length;
      newContent = content.replace(regex, replacePattern);
    } else {
      // Literal string replacement
      const searchRegex = new RegExp(escapeRegExp(searchPattern), flags);
      replacements = (content.match(searchRegex) || []).length;
      newContent = content.replace(searchRegex, replacePattern);
    }

    return { newContent, replacements };
  } catch (error) {
    throw new Error(`Search and replace failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle search and replace operation
 */
export async function handleSearchReplaceNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteSearchReplaceResponse> {
  const {
    noteId,
    searchPattern,
    replacePattern,
    useRegex = true,
    searchFlags = 'g',
    revision = true,
    expectedHash
  } = args;

  if (!noteId) {
    throw new Error("noteId is required for search_and_replace operation.");
  }

  if (!searchPattern) {
    throw new Error("searchPattern is required for search_and_replace operation.");
  }

  if (!replacePattern) {
    throw new Error("replacePattern is required for search_and_replace operation.");
  }

  if (!expectedHash) {
    throw new Error("expectedHash is required for search_and_replace operation. You must call get_note first to retrieve the current blobId.");
  }

  let revisionCreated = false;

  try {
    // Step 1: Get current note state and content
    const currentNote = await axiosInstance.get(`/notes/${noteId}`);
    const currentContent = await axiosInstance.get(`/notes/${noteId}/content`, {
      responseType: 'text'
    });

    // Step 2: Hash validation
    const currentBlobId = currentNote.data.blobId;
    const hashValidation = validateBlobIdHash(currentBlobId, expectedHash, noteId);
    if (!hashValidation.valid) {
      return {
        noteId,
        message: hashValidation.message!,
        matchesFound: 0,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: true,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    const noteType = currentNote.data.type;
    const originalContent = currentContent.data;

    // Step 3: Execute search and replace
    const { newContent, replacements } = executeSearchReplace(
      originalContent,
      searchPattern,
      replacePattern,
      useRegex,
      searchFlags
    );

    // Step 4: Handle no matches case
    if (replacements === 0) {
      return {
        noteId,
        message: `No matches found for pattern "${searchPattern}" in note ${noteId}. No changes made.`,
        matchesFound: 0,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: false,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    // Step 5: Validate new content based on note type
    const validationResult = await validateContentForNoteType(
      newContent,
      noteType,
      originalContent
    );

    if (!validationResult.valid) {
      return {
        noteId,
        message: `CONTENT_TYPE_MISMATCH: ${validationResult.error}`,
        matchesFound: replacements,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: false,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    // Use validated/corrected content
    const finalContent = validationResult.content;

    // Step 6: Create revision if requested
    if (revision) {
      try {
        await axiosInstance.post(`/notes/${noteId}/revision`);
        revisionCreated = true;
      } catch (error) {
        console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
        // Continue with update even if revision creation fails
      }
    }

    // Step 7: Update content
    const contentResponse = await axiosInstance.put(`/notes/${noteId}/content`, finalContent, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (contentResponse.status !== 204) {
      throw new Error(`Unexpected response status: ${contentResponse.status}`);
    }

    // Step 8: Return success response
    const correctionMsg = (finalContent !== newContent) ? " (content auto-corrected)" : "";
    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";

    return {
      noteId,
      message: `Search and replace completed successfully for note ${noteId}. Found ${replacements} match(es) and made ${replacements} replacement(s).${correctionMsg}${revisionMsg}`,
      matchesFound: replacements,
      replacementsMade: replacements,
      revisionCreated,
      conflict: false,
      searchPattern,
      replacePattern,
      useRegex
    };

  } catch (error) {
    if ((error as any).response?.status === 404) {
      throw new Error(`Note ${noteId} not found`);
    }
    throw error;
  }
}