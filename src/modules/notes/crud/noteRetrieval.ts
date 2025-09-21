/**
 * Note Retrieval Operations
 * Handles note retrieval with content, hash validation, and search capabilities
 */

import { logVerbose } from '../../../modules/utils/core/verboseUtils.js';
import { getContentRequirements } from '../../../modules/utils/core/contentRules.js';
import { executeUnifiedSearch } from '../operations/searchReplace.js';
import { NoteOperation, NoteGetResponse, RegexMatch } from '../noteManager.js';

/**
 * Handle get note operation
 */
export async function handleGetNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteGetResponse> {
  const {
    noteId,
    includeContent = true,
    searchPattern,
    useRegex = true,
    searchFlags = 'g'
  } = args;

  if (!noteId) {
    throw new Error("noteId is required for get operation.");
  }

  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

  if (!includeContent) {
    return {
      note: noteResponse.data
    };
  }

  const noteData = noteResponse.data;

  // Get note content (works for all note types including file/image)
  const { data: noteContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Get blobId (Trilium's built-in content hash) and content requirements
  const blobId = noteData.blobId;
  const contentRequirements = getContentRequirements(noteData.type);

  // Handle search if pattern is provided
  if (searchPattern) {
    // Use original content directly (no HTML stripping)
    const searchContent = noteContent;

    // Execute unified search on original content
    const matches = executeUnifiedSearch(searchContent, searchPattern, useRegex, searchFlags);

    // Enhance matches with HTML context information
    const enhancedMatches = matches.map(match => ({
      ...match,
      htmlContext: {
        contentType: (contentRequirements.requiresHtml ? 'html' : 'plain') as 'html' | 'plain',
        isHtmlContent: contentRequirements.requiresHtml
      }
    }));

    return {
      note: noteData,
      contentHash: blobId,
      search: {
        pattern: searchPattern,
        flags: searchFlags,
        matches: enhancedMatches,
        totalMatches: enhancedMatches.length,
        searchMode: contentRequirements.requiresHtml ? 'html' : 'plain',
        useRegex
      }
    };
  }

  // Standard response without search
  return {
    note: noteData,
    content: noteContent,
    contentHash: blobId, // Use blobId as content hash
    contentRequirements
  };
}