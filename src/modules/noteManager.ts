/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { processContent } from "./contentProcessor.js";
import { smartConvertToMarkdown } from "./htmlToMarkdownConverter.js";

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  returnMarkdown?: boolean;
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
  returnMarkdown?: boolean;
  replaceAll?: boolean;
}

export interface ReplacementDetail {
  match: string;
  replacement: string;
  position: number;
  lineNumber: number;
  lineText: string;
}

export interface SearchAndReplaceResponse {
  noteId: string;
  matched: boolean;
  matchCount: number;
  replacements?: ReplacementDetail[];
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
  const { noteId, includeContent = true, returnMarkdown = true } = args;

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

  // Convert to Markdown if requested (default: true for LLM-friendly format)
  const processedContent = returnMarkdown 
    ? await smartConvertToMarkdown(noteContent)
    : noteContent;

  return {
    note: noteResponse.data,
    content: processedContent
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
    createRevision = true,
    returnMarkdown = true,
    replaceAll = true
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
  const replacements: ReplacementDetail[] = [];

  try {
    // Process replacement text for Markdown conversion
    const processedReplacement = await processContent(replacement);
    
    if (useRegex) {
      // Use regex replacement with detailed tracking
      const regex = new RegExp(searchPattern, replaceAll ? 'g' : '');
      let match;
      let currentContent = originalContent;
      let offset = 0;
      
      // Find all matches first to track positions
      const globalRegex = new RegExp(searchPattern, 'g');
      while ((match = globalRegex.exec(originalContent)) !== null) {
        const matchText = match[0];
        const position = match.index;
        const lineNumber = getLineNumber(originalContent, position);
        const lineText = getLineText(originalContent, position);
        
        replacements.push({
          match: matchText,
          replacement: processedReplacement,
          position,
          lineNumber,
          lineText
        });
        
        matchCount++;
        
        // If not replacing all, break after first match
        if (!replaceAll) break;
      }
      
      // Perform the actual replacement
      updatedContent = replaceAll 
        ? originalContent.replace(regex, processedReplacement)
        : originalContent.replace(new RegExp(searchPattern), processedReplacement);
        
    } else {
      // Use simple string replacement with detailed tracking
      let searchIndex = 0;
      let currentContent = originalContent;
      updatedContent = originalContent;
      
      while ((searchIndex = originalContent.indexOf(searchPattern, searchIndex)) !== -1) {
        const position = searchIndex;
        const lineNumber = getLineNumber(originalContent, position);
        const lineText = getLineText(originalContent, position);
        
        replacements.push({
          match: searchPattern,
          replacement: processedReplacement,
          position,
          lineNumber,
          lineText
        });
        
        matchCount++;
        searchIndex += searchPattern.length;
        
        // If not replacing all, break after first match
        if (!replaceAll) break;
      }
      
      // Perform the actual replacement
      if (matchCount > 0) {
        if (replaceAll) {
          updatedContent = originalContent.split(searchPattern).join(processedReplacement);
        } else {
          // Replace only the first occurrence
          const firstIndex = originalContent.indexOf(searchPattern);
          updatedContent = originalContent.substring(0, firstIndex) + 
                          processedReplacement + 
                          originalContent.substring(firstIndex + searchPattern.length);
        }
      }
    }
  } catch (error) {
    throw new Error(`Search and replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const matched = matchCount > 0;
  const contentChanged = originalContent !== updatedContent;

  // If dry run or no matches, return without updating
  if (dryRun || !matched) {
    // Convert content to Markdown if requested for better LLM readability
    const processedOriginal = dryRun && returnMarkdown 
      ? await smartConvertToMarkdown(originalContent)
      : originalContent;
    const processedUpdated = dryRun && returnMarkdown 
      ? await smartConvertToMarkdown(updatedContent)
      : updatedContent;

    return {
      noteId,
      matched,
      matchCount,
      replacements: dryRun ? replacements : undefined,
      originalContent: dryRun ? processedOriginal : undefined,
      updatedContent: dryRun ? processedUpdated : undefined,
      message: dryRun 
        ? `Dry run: Found ${matchCount} match${matchCount !== 1 ? 'es' : ''} in note ${noteId}${returnMarkdown ? ' (content converted to Markdown for preview)' : ''}` 
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
    replacements,
    message: `Successfully replaced ${matchCount} occurrence${matchCount !== 1 ? 's' : ''} in note ${noteId}${revisionMsg}`,
    revisionCreated
  };
}

/**
 * Escape special regex characters for use in regex
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get line number for a given position in text
 */
function getLineNumber(content: string, position: number): number {
  return content.substring(0, position).split('\n').length;
}

/**
 * Get the text of the line containing the given position
 */
function getLineText(content: string, position: number): string {
  const lines = content.split('\n');
  const lineIndex = getLineNumber(content, position) - 1;
  return lines[lineIndex] || '';
}