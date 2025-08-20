/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { processContent } from "./contentProcessor.js";

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
}

export interface NoteCreateResponse {
  noteId: string;
  message: string;
}

export interface NoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
}

export interface NoteDeleteResponse {
  noteId: string;
  message: string;
}

export interface NoteGetResponse {
  note: any;
  content?: string;
}

export interface SearchAndReplaceOperation {
  noteId: string;
  searchPattern: string;
  replacement: string;
  useRegex?: boolean;
  dryRun?: boolean;
  createRevision?: boolean;
}

export interface SearchAndReplaceResponse {
  noteId: string;
  matched: boolean;
  matchCount: number;
  originalContent?: string;
  updatedContent?: string;
  message: string;
  revisionCreated?: boolean;
}

/**
 * Handle create note operation
 */
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse> {
  const { parentNoteId, title, type, content: rawContent, mime } = args;

  if (!parentNoteId || !title || !type || !rawContent) {
    throw new Error("parentNoteId, title, type, and content are required for create operation.");
  }

  // Process content and convert Markdown to HTML if detected
  const content = await processContent(rawContent);

  const response = await axiosInstance.post("/create-note", {
    parentNoteId,
    title,
    type,
    content,
    mime,
  });

  return {
    noteId: response.data.note.noteId,
    message: `Created note: ${response.data.note.noteId}`
  };
}

/**
 * Handle update note operation
 */
export async function handleUpdateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteUpdateResponse> {
  const { noteId, content: rawContent, revision = true } = args;

  if (!noteId || !rawContent) {
    throw new Error("noteId and content are required for update operation.");
  }

  let revisionCreated = false;

  // Create revision if requested (defaults to true for safety)
  if (revision) {
    try {
      await axiosInstance.post(`/notes/${noteId}/revision`);
      revisionCreated = true;
    } catch (error) {
      console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
      // Continue with update even if revision creation fails
    }
  }

  // Process content and convert Markdown to HTML if detected
  const content = await processContent(rawContent);

  const response = await axiosInstance.put(`/notes/${noteId}/content`, content, {
    headers: {
      "Content-Type": "text/plain"
    }
  });

  if (response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
  return {
    noteId,
    message: `Note ${noteId} updated successfully${revisionMsg}`,
    revisionCreated
  };
}

/**
 * Handle append note operation
 */
export async function handleAppendNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteUpdateResponse> {
  const { noteId, content: contentToAppend, revision = false } = args;

  if (!noteId || !contentToAppend) {
    throw new Error("noteId and content are required for append operation.");
  }

  let revisionCreated = false;

  // Create revision if requested (defaults to false for performance)
  if (revision) {
    try {
      await axiosInstance.post(`/notes/${noteId}/revision`);
      revisionCreated = true;
    } catch (error) {
      console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
      // Continue with append even if revision creation fails
    }
  }

  // Get current content
  const { data: currentContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Process the content to append and convert Markdown to HTML if detected
  const processedContentToAppend = await processContent(contentToAppend);

  // Concatenate current content with new content
  const newContent = currentContent + processedContentToAppend;

  // Update note content
  const response = await axiosInstance.put(`/notes/${noteId}/content`, newContent, {
    headers: {
      "Content-Type": "text/plain"
    }
  });

  if (response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
  return {
    noteId,
    message: `Content appended to note ${noteId} successfully${revisionMsg}`,
    revisionCreated
  };
}

/**
 * Handle delete note operation
 */
export async function handleDeleteNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteDeleteResponse> {
  const { noteId } = args;

  if (!noteId) {
    throw new Error("noteId is required for delete operation.");
  }

  await axiosInstance.delete(`/notes/${noteId}`);

  return {
    noteId,
    message: `Deleted note: ${noteId}`
  };
}

/**
 * Handle get note operation
 */
export async function handleGetNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteGetResponse> {
  const { noteId, includeContent = true } = args;

  if (!noteId) {
    throw new Error("noteId is required for get operation.");
  }

  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

  if (!includeContent) {
    return {
      note: noteResponse.data
    };
  }

  const { data: noteContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  return {
    note: noteResponse.data,
    content: noteContent
  };
}

/**
 * Handle search and replace operation
 */
export async function handleSearchAndReplace(
  args: SearchAndReplaceOperation,
  axiosInstance: any
): Promise<SearchAndReplaceResponse> {
  const { 
    noteId, 
    searchPattern, 
    replacement, 
    useRegex = false, 
    dryRun = true, 
    createRevision = true 
  } = args;

  if (!noteId || !searchPattern || replacement === undefined) {
    throw new Error("noteId, searchPattern, and replacement are required for search and replace operation.");
  }

  // Enforce rule: dry run never creates revisions
  const effectiveCreateRevision = dryRun ? false : createRevision;
  
  // Log warning if user passed conflicting parameters
  if (dryRun && createRevision) {
    console.warn(`Note: Ignoring createRevision=true because dryRun=true. Dry runs never create revisions.`);
  }

  // Get current note content
  const { data: originalContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  let updatedContent: string;
  let matchCount = 0;

  try {
    if (useRegex) {
      // Use regex replacement
      const regex = new RegExp(searchPattern, 'g');
      const matches = originalContent.match(regex);
      matchCount = matches ? matches.length : 0;
      updatedContent = originalContent.replace(regex, replacement);
    } else {
      // Use simple string replacement
      const beforeLength = originalContent.length;
      updatedContent = originalContent.split(searchPattern).join(replacement);
      const afterLength = updatedContent.length;
      const searchLength = searchPattern.length;
      const replacementLength = replacement.length;
      
      // Calculate match count based on length change
      if (searchLength !== replacementLength) {
        const lengthDiff = beforeLength - afterLength;
        const perReplacementDiff = searchLength - replacementLength;
        matchCount = perReplacementDiff !== 0 ? lengthDiff / perReplacementDiff : 0;
      } else {
        // Same length - count direct matches
        matchCount = (originalContent.match(new RegExp(escapeRegex(searchPattern), 'g')) || []).length;
      }
    }
  } catch (error) {
    throw new Error(`Search and replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const matched = matchCount > 0;
  const contentChanged = originalContent !== updatedContent;

  // If dry run or no matches, return without updating
  if (dryRun || !matched) {
    return {
      noteId,
      matched,
      matchCount,
      originalContent: dryRun ? originalContent : undefined,
      updatedContent: dryRun ? updatedContent : undefined,
      message: dryRun 
        ? `Dry run: Found ${matchCount} matches in note ${noteId}` 
        : `No matches found for pattern "${searchPattern}" in note ${noteId}`,
      revisionCreated: false
    };
  }

  // Perform actual update
  let revisionCreated = false;

  // Create revision if requested
  if (effectiveCreateRevision && contentChanged) {
    try {
      await axiosInstance.post(`/notes/${noteId}/revision`);
      revisionCreated = true;
    } catch (error) {
      console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
      // Continue with update even if revision creation fails
    }
  }

  // Update note content
  if (contentChanged) {
    const response = await axiosInstance.put(`/notes/${noteId}/content`, updatedContent, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (response.status !== 204) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  }

  const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
  return {
    noteId,
    matched,
    matchCount,
    message: `Replaced ${matchCount} occurrences in note ${noteId}${revisionMsg}`,
    revisionCreated
  };
}

/**
 * Escape special regex characters for use in regex
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}