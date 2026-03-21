/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { parse as parseHtml } from 'node-html-parser';
import { processContentArray } from '../utils/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../utils/verboseUtils.js';
import { getContentRequirements, validateContentForNoteType, extractTemplateRelation } from '../utils/contentRules.js';
import { SearchOperation } from './searchManager.js';

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export type NoteType = 'text' | 'code' | 'canvas' | 'render' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView' | 'file' | 'image';

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  fileUri?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  includeBinaryContent?: boolean;
  attributes?: Attribute[];
  expectedHash?: string;
  forceCreate?: boolean;
  // Search parameters
  searchPattern?: string;
  useRegex?: boolean;
  searchFlags?: string;
  mode?: 'overwrite' | 'append';
  // Search and replace parameters
  replacePattern?: string;
}

export interface NoteCreateResponse {
  noteId?: string;
  message: string;
  duplicateFound?: boolean;
  duplicateNoteId?: string;
  choices?: {
    skip: string;
    createAnyway: string;
    updateExisting: string;
  };
  nextSteps?: string;
}

export interface NoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  conflict?: boolean;
}

export interface NoteSearchReplaceResponse {
  noteId: string;
  message: string;
  matchesFound: number;
  replacementsMade: number;
  revisionCreated: boolean;
  conflict?: boolean;
  searchPattern?: string;
  replacePattern?: string;
  useRegex?: boolean;
}

export interface NoteDeleteResponse {
  noteId: string;
  message: string;
}

export interface NoteGetResponse {
  note: any;
  content?: string;
  contentHash?: string;
  contentRequirements?: {
    requiresHtml: boolean;
    description: string;
    examples: string[];
  };
  search?: {
    pattern: string;
    flags: string;
    matches: RegexMatch[];
    totalMatches: number;
    searchMode?: 'html' | 'plain';
    useRegex?: boolean;
    note?: string;
  };
}

export interface RegexMatch {
  match: string;
  index: number;
  length: number;
  groups?: string[];
  htmlContext?: {
    contentType: 'html' | 'plain';
    isHtmlContent: boolean;
  };
}

/**
 * Strip HTML tags from content for text notes
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Execute unified search on content (supports both regex and literal search)
 */
function executeUnifiedSearch(
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
 * Escape special regex characters for literal string matching
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a note with the same title already exists in the same directory
 */
async function checkDuplicateTitleInDirectory(
  parentNoteId: string,
  title: string,
  axiosInstance: any
): Promise<{ found: boolean; duplicateNoteId?: string }> {
  // Search for notes with exact title in the same parent directory
  const searchParams: SearchOperation = {
    searchCriteria: [
      {
        property: "title",
        op: "=",
        value: title,
        logic: "AND"
      },
      {
        property: "parents.noteId",
        op: "=",
        value: parentNoteId,
        logic: "AND"
      }
    ]
  };

  try {
    // Use the search function to find duplicates
    const response = await axiosInstance.get(`/notes?search=note.title%20%3D%20%27${encodeURIComponent(title)}%27%20AND%20note.parents.noteId%20%3D%20%27${encodeURIComponent(parentNoteId)}%27&fastSearch=false&includeArchivedNotes=true`);
    const results = response.data.results || [];

    logVerbose("checkDuplicateTitleInDirectory", `Search for duplicate title "${title}" in parent ${parentNoteId} found ${results.length} results`);

    if (results.length > 0) {
      return { found: true, duplicateNoteId: results[0].noteId };
    }
    return { found: false };
  } catch (error) {
    logVerboseError("checkDuplicateTitleInDirectory", error);
    // If search fails, proceed cautiously (don't block creation)
    return { found: false };
  }
}

/**
 * Handle create note operation
 */
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse> {
  const { parentNoteId, title, type, content: rawContent, mime, fileUri, attributes, forceCreate = false } = args;

  // Validate required parameters
  if (!parentNoteId || !title || !type) {
    throw new Error("parentNoteId, title, and type are required for create operation.");
  }

  // Handle file uploads (both 'file' and 'image' types)
  if (type === 'file' || type === 'image') {
    // Import FileManager and utils only when needed
    const { FileManager } = await import('./fileManager.js');

    // Validate file if provided
    if (!fileUri) {
      throw new Error(`fileUri is required when type='${type}'.`);
    }

    // Use FileManager to handle the upload
    const fileManager = new FileManager(axiosInstance);

    try {
      const fileResult = await fileManager.createFileNote({
        parentNoteId,
        filePath: fileUri,
        title: title,
        mimeType: mime,
        attributes,
        noteType: type as 'file' | 'image'
      });

      return {
        noteId: fileResult.note.noteId,
        message: `Created file note: ${fileResult.note.noteId} (${fileResult.note.title})`,
        duplicateFound: false
      };
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check for duplicate title in the same directory (unless forceCreate is true)
  if (!forceCreate) {
    const duplicateCheck = await checkDuplicateTitleInDirectory(parentNoteId, title, axiosInstance);
    if (duplicateCheck.found) {
      return {
        message: `Found existing note with title "${title}" in this directory. Please choose how to proceed:`,
        duplicateFound: true,
        duplicateNoteId: duplicateCheck.duplicateNoteId,
        choices: {
          skip: "Skip creation - do nothing",
          createAnyway: "Create anyway - create duplicate note with same title (set forceCreate: true)",
          updateExisting: "Update existing - replace content of existing note with new content"
        },
        nextSteps: `Please specify your choice by calling create_note again with your preferred action. To update the existing note, use update_note with noteId: ${duplicateCheck.duplicateNoteId}`
      };
    }
  }

  // Process content to ETAPI format
  // Content is optional - if not provided, default to empty string
  const content = rawContent || "";

  // Extract template relation for content validation
  const templateRelation = extractTemplateRelation(attributes);

  // Validate content with template-aware rules
  const contentValidation = await validateContentForNoteType(
    content,
    type as NoteType,
    undefined,
    templateRelation
  );

  if (!contentValidation.valid) {
    return {
      message: `CONTENT_VALIDATION_ERROR: ${contentValidation.error}`,
      duplicateFound: false,
      nextSteps: "Please adjust your content according to the requirements and try again."
    };
  }

  // Use validated content (may have been auto-corrected)
  const validatedContent = contentValidation.content;

  // Process content to ETAPI format
  const processed = await processContentArray(validatedContent, type);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }

  const processedContent = processed.content;

  // Create note with processed content (empty for file/image-only notes)
  const noteData: any = {
    parentNoteId,
    title,
    type,
    content: processedContent
  };

  // Add MIME type if specified
  if (mime) {
    noteData.mime = mime;
  }

  const response = await axiosInstance.post("/create-note", noteData);
  const noteId = response.data.note.noteId;

  // Handle attributes if provided
  if (attributes && attributes.length > 0) {
    try {
      logVerbose("handleCreateNote", `Creating ${attributes.length} attributes for note ${noteId}`, attributes);
      await createNoteAttributes(noteId, attributes, axiosInstance);
      logVerbose("handleCreateNote", `Successfully created all attributes for note ${noteId}`);
    } catch (attributeError) {
      const errorMsg = `Note created but attributes failed to apply: ${attributeError instanceof Error ? attributeError.message : attributeError}`;
      logVerboseError("handleCreateNote", attributeError);
      console.warn(errorMsg);
    }
  }

  return {
    noteId: noteId,
    message: `Created note: ${noteId}`,
    duplicateFound: false
  };
}

/**
 * Create attributes for a note (helper function)
 */
async function createNoteAttributes(
  noteId: string,
  attributes: Attribute[],
  axiosInstance: any
): Promise<void> {
  const attributePromises = attributes.map(async (attr) => {
    const attributeData = {
      noteId: noteId,
      type: attr.type,
      name: attr.name,
      value: attr.value || '',
      position: attr.position || 10,
      isInheritable: attr.isInheritable || false
    };

    logVerboseApi("POST", `/attributes`, attributeData);
    const response = await axiosInstance.post(`/attributes`, attributeData);
    logVerbose("createNoteAttributes", `Created ${attr.type} '${attr.name}' for note ${noteId}`, response.data);
    return response;
  });

  const results = await Promise.all(attributePromises);
  logVerbose("createNoteAttributes", `Successfully created ${results.length} attributes for note ${noteId}`);
}

/**
 * Handle update note operation
 */
export async function handleUpdateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteUpdateResponse> {
  const {
    noteId,
    title,
    type,
    content: rawContent,
    mime,
    fileUri,
    revision = true,
    expectedHash,
    mode
  } = args;

  if (!noteId || !expectedHash) {
    throw new Error("noteId and expectedHash are required for update operation.");
  }

  // Mode is required only for content updates (non-file notes)
  if (type !== 'file' && !mode) {
    throw new Error("mode is required for update operation. Please specify either 'overwrite' or 'append'.");
  }

  // Handle file content updates (both 'file' and 'image' types)
  if (type === 'file' || type === 'image') {
    // Import FileManager only when needed
    const { FileManager } = await import('./fileManager.js');
    const { parseFileDataSource } = await import('../utils/fileUtils.js');

    // If fileUri is provided, update file content
    if (fileUri) {
      // Use FileManager to handle the file upload (supports file paths, base64, data URIs)
      const fileManager = new FileManager(axiosInstance);

      try {
        // First update metadata if title is provided (type and mime are not changeable)
        if (title) {
          const patchData: any = {};
          if (title) patchData.title = title;

          await axiosInstance.patch(`/notes/${noteId}`, patchData, {
            headers: { "Content-Type": "application/json" }
          });
        }

        // Then upload new file content using fileUri
        const fileData = parseFileDataSource(fileUri);
        await fileManager.uploadFileContentFromData(noteId, fileData, mime || fileData.mimeType);

        return {
          noteId,
          message: `File note updated: ${noteId} (${title || 'Title unchanged'})`,
          revisionCreated: false
        };
      } catch (error) {
        throw new Error(`File update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // File metadata-only update (title only, since type and mime are not changeable)
      if (title) {
        const patchData: any = {};
        if (title) patchData.title = title;

        try {
          await axiosInstance.patch(`/notes/${noteId}`, patchData, {
            headers: { "Content-Type": "application/json" }
          });

          return {
            noteId,
            message: `File note metadata updated: ${noteId} (title updated to "${title}")`,
            revisionCreated: false
          };
        } catch (error) {
          throw new Error(`File metadata update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        throw new Error("No changes specified for file note update. Provide title or fileUri.");
      }
    }
  }

  // Check if this is a metadata-only update (title only, since type and mime are not changeable)
  const isMetadataOnlyUpdate = title && !rawContent && !fileUri;

  // Check if this is a multi-parameter update (title + content)
  const isMultiParamUpdate = title && (rawContent || fileUri);

  // For content updates (with or without title), validate required fields
  if ((rawContent || fileUri) && !type) {
    throw new Error("type is required when updating content.");
  }

  let revisionCreated = false;

  // Step 1: Get current note state for validation
  try {
    const currentNote = await axiosInstance.get(`/notes/${noteId}`);
    const currentContent = await axiosInstance.get(`/notes/${noteId}/content`, {
      responseType: 'text'
    });

    // Step 2: Hash validation if provided
    if (expectedHash) {
      const currentBlobId = currentNote.data.blobId;
      if (currentBlobId !== expectedHash) {
        return {
          noteId,
          message: `CONFLICT: Note has been modified by another user. ` +
            `Current blobId: ${currentBlobId}, expected: ${expectedHash}. ` +
            `Please get the latest note content and retry.`,
          revisionCreated: false,
          conflict: true
        };
      }
    }

    // Handle metadata-only update (efficient PATCH operation)
    if (isMetadataOnlyUpdate) {
      // For metadata-only updates, skip revision creation for efficiency
      const patchData: any = { title };

      logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
      const response = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      return {
        noteId,
        message: `Note ${noteId} title updated successfully to "${title}"`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Handle content updates (with optional title change)
    // Step 3: Get existing template relations for content validation
    let existingTemplateRelation: string | undefined;
    try {
      // Check if the note has existing template relations
      const existingAttributes = currentNote.data.attributes || [];
      existingTemplateRelation = existingAttributes.find(
        (attr: any) => attr.type === 'relation' && attr.name === 'template'
      )?.value;
    } catch (error) {
      // If we can't read existing attributes, proceed without template validation
      logVerbose("handleUpdateNote", "Could not read existing attributes for template validation", error);
    }

    // Step 4: Content type validation with template awareness (always enabled)
    let finalContent = rawContent;
    const validationResult = await validateContentForNoteType(
      rawContent as string,
      type as NoteType,
      currentContent.data,
      existingTemplateRelation
    );

    if (!validationResult.valid) {
      return {
        noteId,
        message: `CONTENT_VALIDATION_ERROR: ${validationResult.error}`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Use validated/corrected content
    finalContent = validationResult.content;

    // Step 5: Create revision if requested
    if (revision) {
      try {
        await axiosInstance.post(`/notes/${noteId}/revision`);
        revisionCreated = true;
      } catch (error) {
        console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
        // Continue with update even if revision creation fails
      }
    }

    // Step 6: Process and update content based on mode
    // Content is optional - if not provided, default to empty string
    finalContent = finalContent || "";

    let processedContent: string;

    if (mode === 'append') {
      // For append mode, get current content and append new content
      const newProcessed = await processContentArray(finalContent, currentNote.data.type);
      if (newProcessed.error) {
        throw new Error(`New content processing error: ${newProcessed.error}`);
      }

      // Append new content to existing content (currentContent.data is already processed)
      processedContent = currentContent.data + newProcessed.content;
    } else if (mode === 'overwrite') {
      // For overwrite mode, replace entire content
      const processed = await processContentArray(finalContent, currentNote.data.type);
      if (processed.error) {
        throw new Error(`Content processing error: ${processed.error}`);
      }
      processedContent = processed.content;
    } else {
      throw new Error(`Invalid mode: ${mode}. Mode must be either 'overwrite' or 'append'.`);
    }

    const contentResponse = await axiosInstance.put(`/notes/${noteId}/content`, processedContent, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (contentResponse.status !== 204) {
      throw new Error(`Unexpected response status: ${contentResponse.status}`);
    }

    // Step 7: Update title if provided (multi-parameter update)
    if (isMultiParamUpdate && title) {
      const patchData: any = { title };

      logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
      const titleResponse = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (titleResponse.status !== 200) {
        throw new Error(`Unexpected response status for title update: ${titleResponse.status}`);
      }
    }

    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
    const correctionMsg = (finalContent !== rawContent) ? " (content auto-corrected)" : "";
    const modeMsg = mode === 'append' ? " (content appended)" : " (content overwritten)";
    const titleMsg = (isMultiParamUpdate && title) ? ` (title updated to "${title}")` : "";

    return {
      noteId,
      message: `Note ${noteId} updated successfully${revisionMsg}${correctionMsg}${modeMsg}${titleMsg}`,
      revisionCreated,
      conflict: false
    };

  } catch (error) {
    if ((error as any).response?.status === 404) {
      throw new Error(`Note ${noteId} not found`);
    }
    throw error;
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
    if (currentBlobId !== expectedHash) {
      return {
        noteId,
        message: `CONFLICT: Note has been modified by another user. ` +
          `Current blobId: ${currentBlobId}, expected: ${expectedHash}. ` +
          `Please get the latest note content and retry.`,
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
      noteType as NoteType,
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

// ─── get_children ────────────────────────────────────────────────────────────

export interface GetChildrenOperation {
  noteId: string;
}

export interface ChildNoteSummary {
  noteId: string;
  title: string;
  type: string;
  mime: string;
  dateModified: string;
}

export interface GetChildrenResponse {
  parentNoteId: string;
  totalChildCount: number;
  fetchedCount: number;
  failedCount: number;
  children: ChildNoteSummary[];
}

/**
 * Handle get_children operation – retrieve direct children of a note
 */
export async function handleGetChildren(
  args: GetChildrenOperation,
  axiosInstance: any
): Promise<GetChildrenResponse> {
  const { noteId } = args;

  if (!noteId) {
    throw new Error("noteId is required for get_children operation.");
  }

  logVerboseApi("GET", `/notes/${noteId}`);
  const parentNote = await axiosInstance.get(`/notes/${noteId}`);
  const childNoteIds: string[] = parentNote.data.childNoteIds || [];

  if (childNoteIds.length === 0) {
    return { parentNoteId: noteId, totalChildCount: 0, fetchedCount: 0, failedCount: 0, children: [] };
  }

  logVerbose("handleGetChildren", `Fetching ${childNoteIds.length} children for ${noteId}`);

  const results = await Promise.allSettled(
    childNoteIds.map((childId: string) => {
      logVerboseApi("GET", `/notes/${childId}`);
      return axiosInstance.get(`/notes/${childId}`);
    })
  );

  const children: ChildNoteSummary[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const note = result.value.data;
      children.push({
        noteId: note.noteId,
        title: note.title,
        type: note.type,
        mime: note.mime || '',
        dateModified: note.dateModified
      });
    } else {
      logVerboseError("handleGetChildren", result.reason);
    }
  }

  return {
    parentNoteId: noteId,
    totalChildCount: childNoteIds.length,
    fetchedCount: children.length,
    failedCount: childNoteIds.length - children.length,
    children
  };
}

// ─── move_note ────────────────────────────────────────────────────────────────

export interface MoveNoteOperation {
  noteId: string;
  newParentNoteId: string;
  branchId?: string;
}

export interface BranchInfo {
  branchId: string;
  parentNoteId?: string;  // absent when details could not be fetched
  notePosition?: number;
  error?: string;          // present when branch details could not be fetched
}

export interface MoveNoteResponse {
  noteId: string;
  oldParentNoteId: string;
  newParentNoteId: string;
  newBranchId: string;
  message: string;
}

export interface MoveNoteAmbiguousResponse {
  noteId: string;
  message: string;
  requiresBranchId: boolean;
  branches: BranchInfo[];
}

export type MoveNoteResult = MoveNoteResponse | MoveNoteAmbiguousResponse;

/**
 * Handle move_note operation – move a note to a new parent location.
 * Uses DELETE + POST branch pattern because PATCH /branches cannot change parentNoteId.
 */
export async function handleMoveNote(
  args: MoveNoteOperation,
  axiosInstance: any
): Promise<MoveNoteResult> {
  const { noteId, newParentNoteId, branchId: providedBranchId } = args;

  if (!noteId || !newParentNoteId) {
    throw new Error("noteId and newParentNoteId are required for move_note operation.");
  }

  logVerboseApi("GET", `/notes/${noteId}`);
  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
  const parentBranchIds: string[] = noteResponse.data.parentBranchIds || [];

  if (parentBranchIds.length === 0) {
    throw new Error(`Note ${noteId} has no parent branches and cannot be moved.`);
  }

  let targetBranchId: string;

  if (parentBranchIds.length === 1) {
    targetBranchId = parentBranchIds[0];
  } else if (providedBranchId) {
    if (!parentBranchIds.includes(providedBranchId)) {
      throw new Error(
        `Branch ${providedBranchId} does not belong to note ${noteId}. ` +
        `Valid branches: ${parentBranchIds.join(', ')}`
      );
    }
    targetBranchId = providedBranchId;
  } else {
    // Multiple branches, no branchId provided – ask user to choose
    const branchDetails = await Promise.allSettled(
      parentBranchIds.map((bid: string) => {
        logVerboseApi("GET", `/branches/${bid}`);
        return axiosInstance.get(`/branches/${bid}`);
      })
    );
    const branches: BranchInfo[] = branchDetails.map((r, idx) => {
      if (r.status === 'fulfilled') {
        return {
          branchId: r.value.data.branchId,
          parentNoteId: r.value.data.parentNoteId,
          notePosition: r.value.data.notePosition
        };
      }
      logVerboseError("handleMoveNote", r.reason);
      return {
        branchId: parentBranchIds[idx],
        error: `Could not fetch branch details: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`
      };
    });

    return {
      noteId,
      message:
        `Note ${noteId} exists in ${parentBranchIds.length} locations. ` +
        `Specify 'branchId' to indicate which parent link to move.`,
      requiresBranchId: true,
      branches
    };
  }

  // Get current branch to record old parent
  logVerboseApi("GET", `/branches/${targetBranchId}`);
  const branchResponse = await axiosInstance.get(`/branches/${targetBranchId}`);
  const oldParentNoteId: string = branchResponse.data.parentNoteId;

  // No-op check
  if (oldParentNoteId === newParentNoteId) {
    return {
      noteId,
      oldParentNoteId,
      newParentNoteId,
      newBranchId: targetBranchId,
      message: `Note ${noteId} is already a child of ${newParentNoteId}. No move performed.`
    };
  }

  // Check if note already has a branch to newParentNoteId via a different branch.
  // If so, reuse that branch rather than creating a duplicate link.
  const otherBranchIds = parentBranchIds.filter(bid => bid !== targetBranchId);
  let existingDestBranchId: string | null = null;
  if (otherBranchIds.length > 0) {
    const otherBranchDetails = await Promise.allSettled(
      otherBranchIds.map(bid => {
        logVerboseApi("GET", `/branches/${bid}`);
        return axiosInstance.get(`/branches/${bid}`);
      })
    );
    for (let i = 0; i < otherBranchDetails.length; i++) {
      const r = otherBranchDetails[i];
      if (r.status === 'fulfilled' && r.value.data.parentNoteId === newParentNoteId) {
        existingDestBranchId = r.value.data.branchId;
        break;
      }
    }
  }

  if (existingDestBranchId) {
    // Note is already a child of newParentNoteId via another branch — just remove the old link.
    logVerboseApi("DELETE", `/branches/${targetBranchId}`);
    try {
      await axiosInstance.delete(`/branches/${targetBranchId}`);
    } catch (deleteError: any) {
      if (deleteError?.response?.status === 404) {
        // Branch already gone — state is already correct.
      } else {
        logVerboseError("handleMoveNote", deleteError);
        throw new Error(
          `Move failed: note ${noteId} is already a child of ${newParentNoteId} (via ${existingDestBranchId}) ` +
          `but the old branch ${targetBranchId} could not be removed from ${oldParentNoteId}. ` +
          `Delete it manually.`
        );
      }
    }
    return {
      noteId,
      oldParentNoteId,
      newParentNoteId,
      newBranchId: existingDestBranchId,
      message: `Note ${noteId} moved from ${oldParentNoteId} to ${newParentNoteId} (existing branch ${existingDestBranchId} reused; old branch ${targetBranchId} removed)`
    };
  }

  // POST new branch first (note keeps old branch during transition, so it cannot be auto-deleted)
  const newBranchData = { noteId, parentNoteId: newParentNoteId };
  logVerboseApi("POST", `/branches`, newBranchData);
  const newBranchResponse = await axiosInstance.post(`/branches`, newBranchData);
  const newBranchId: string = newBranchResponse.data.branchId;

  // Delete old branch (note now has new branch, so it is safe to remove the old one)
  logVerboseApi("DELETE", `/branches/${targetBranchId}`);
  try {
    await axiosInstance.delete(`/branches/${targetBranchId}`);
  } catch (deleteError: any) {
    // 404 means the branch was already removed concurrently — the note is now only
    // accessible via the new branch, so the move is effectively complete.
    if (deleteError?.response?.status === 404) {
      return {
        noteId,
        oldParentNoteId,
        newParentNoteId,
        newBranchId,
        message: `Note ${noteId} moved from ${oldParentNoteId} to ${newParentNoteId} (old branch was already removed; branch: ${newBranchId})`
      };
    }
    logVerboseError("handleMoveNote", deleteError);
    logVerbose("handleMoveNote", `Failed to delete old branch ${targetBranchId}; attempting rollback of new branch ${newBranchId}`);
    // Rollback: remove the newly-created branch so the note is not left in both locations
    try {
      logVerboseApi("DELETE", `/branches/${newBranchId}`);
      await axiosInstance.delete(`/branches/${newBranchId}`);
      logVerbose("handleMoveNote", `Rollback successful: removed new branch ${newBranchId}`);
    } catch (rollbackError) {
      logVerboseError("handleMoveNote", rollbackError);
      throw new Error(
        `Move failed and rollback failed: note ${noteId} now exists in both ${oldParentNoteId} and ${newParentNoteId}. ` +
        `Manually delete one of the branches (old: ${targetBranchId}, new: ${newBranchId}).`
      );
    }
    throw new Error(
      `Move failed: could not delete old branch ${targetBranchId} from ${oldParentNoteId}. ` +
      `Rollback successful — note ${noteId} remains at ${oldParentNoteId}.`
    );
  }

  return {
    noteId,
    oldParentNoteId,
    newParentNoteId,
    newBranchId,
    message: `Note ${noteId} moved from ${oldParentNoteId} to ${newParentNoteId} (branch: ${newBranchId})`
  };
}

// ─── patch_note ───────────────────────────────────────────────────────────────

export type PatchOperation = 'replace' | 'insert_after' | 'delete';

export interface NotePatch {
  operation: PatchOperation;
  selector: string;
  content?: string;
}

export interface PatchNoteOperation {
  noteId: string;
  expectedHash: string;
  patches: NotePatch[];
}

export interface PatchResult {
  patchIndex: number;
  operation: PatchOperation;
  selector: string;
  applied: boolean;
  message: string;
}

export interface PatchNoteResponse {
  noteId: string;
  revisionCreated: boolean;
  patchResults: PatchResult[];
  appliedCount: number;
  failedCount: number;
  message: string;
  conflict?: boolean;
}

/**
 * Apply HTML patches to a note parsed as a DOM tree.
 * Returns the modified HTML string.
 */
function applyHtmlPatches(content: string, patches: NotePatch[]): { content: string; results: PatchResult[] } {
  const root = parseHtml(content, { lowerCaseTagName: false, comment: true });
  const results: PatchResult[] = [];

  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i];
    try {
      const elements = root.querySelectorAll(patch.selector);
      if (elements.length === 0) {
        results.push({ patchIndex: i, operation: patch.operation, selector: patch.selector, applied: false, message: `Selector '${patch.selector}' matched 0 elements` });
        continue;
      }
      if (elements.length > 1) {
        results.push({ patchIndex: i, operation: patch.operation, selector: patch.selector, applied: false, message: `Selector '${patch.selector}' matches ${elements.length} elements — selector must be unique` });
        continue;
      }
      const target = elements[0];
      switch (patch.operation) {
        case 'replace':
          target.replaceWith(patch.content ?? '');
          break;
        case 'insert_after':
          target.insertAdjacentHTML('afterend', patch.content ?? '');
          break;
        case 'delete':
          target.remove();
          break;
      }
      results.push({ patchIndex: i, operation: patch.operation, selector: patch.selector, applied: true, message: `Applied ${patch.operation} on '${patch.selector}'` });
    } catch (err) {
      results.push({ patchIndex: i, operation: patch.operation, selector: patch.selector, applied: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  return { content: root.toString(), results };
}

/**
 * Apply line-based patches to plain-text / code note content.
 * selector is either a 1-based line number string ("5") or a unique text fragment.
 */
function applyLinePatch(lines: string[], patch: NotePatch, patchIndex: number): { lines: string[]; result: PatchResult } {
  const selector = patch.selector;
  const asNum = parseInt(selector, 10);
  let lineIndex: number;

  if (/^\d+$/.test(selector)) {
    lineIndex = asNum - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      return { lines, result: { patchIndex, operation: patch.operation, selector, applied: false, message: `Line ${asNum} is out of range (note has ${lines.length} lines)` } };
    }
  } else {
    const matches = lines.reduce<number[]>((acc, line, idx) =>
      line.includes(selector) ? [...acc, idx] : acc, []);
    if (matches.length === 0) {
      return { lines, result: { patchIndex, operation: patch.operation, selector, applied: false, message: `No line contains '${selector}'` } };
    }
    if (matches.length > 1) {
      return { lines, result: { patchIndex, operation: patch.operation, selector, applied: false, message: `Fragment selector '${selector}' matches ${matches.length} lines — selector must be unique` } };
    }
    lineIndex = matches[0];
  }

  const newLines = [...lines];
  switch (patch.operation) {
    case 'replace':
      newLines.splice(lineIndex, 1, ...(patch.content ?? '').split('\n'));
      break;
    case 'insert_after':
      newLines.splice(lineIndex + 1, 0, ...(patch.content ?? '').split('\n'));
      break;
    case 'delete':
      newLines.splice(lineIndex, 1);
      break;
  }

  return { lines: newLines, result: { patchIndex, operation: patch.operation, selector, applied: true, message: `Applied ${patch.operation} at line ${lineIndex + 1}` } };
}

/**
 * Handle patch_note operation – apply targeted patches to note content.
 * Requires expectedHash (blobId from get_note) for conflict detection.
 * Creates a revision backup before writing.
 */
export async function handlePatchNote(
  args: PatchNoteOperation,
  axiosInstance: any
): Promise<PatchNoteResponse> {
  const { noteId, expectedHash, patches } = args;

  if (!noteId || !expectedHash || !patches?.length) {
    throw new Error("noteId, expectedHash, and at least one patch are required.");
  }

  // Step 1: Conflict detection via blobId
  logVerboseApi("GET", `/notes/${noteId}`);
  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
  const noteData = noteResponse.data;
  const currentBlobId: string = noteData.blobId;

  if (currentBlobId !== expectedHash) {
    return {
      noteId,
      revisionCreated: false,
      patchResults: [],
      appliedCount: 0,
      failedCount: patches.length,
      message: `CONFLICT: Note has been modified. Current blobId: ${currentBlobId}, expected: ${expectedHash}. Call get_note again to get the latest content.`,
      conflict: true
    };
  }

  // Step 2: Validate note type before any content fetch or side effects
  const PATCHABLE_TYPES = ['text', 'code', 'mermaid'];
  if (!PATCHABLE_TYPES.includes(noteData.type)) {
    throw new Error(
      `patch_note only supports text, code, and mermaid note types. Note ${noteId} is type '${noteData.type}'.`
    );
  }

  // Step 3: Fetch content
  // Note: there is an inherent TOCTOU window between the blobId check above and the
  // content PUT below — ETAPI does not support conditional writes (If-Match / ETag),
  // so a concurrent update that lands here will overwrite the other writer's changes.
  // This is the best optimistic-concurrency guarantee available with the current API.
  logVerboseApi("GET", `/notes/${noteId}/content`);
  const contentResponse = await axiosInstance.get(`/notes/${noteId}/content`, { responseType: 'text' });
  const originalContent: string = contentResponse.data;

  // Step 4: Create revision backup (best-effort)
  let revisionCreated = false;
  try {
    logVerboseApi("POST", `/notes/${noteId}/revision`);
    await axiosInstance.post(`/notes/${noteId}/revision`);
    revisionCreated = true;
  } catch (revErr) {
    logVerboseError("handlePatchNote", revErr);
  }

  // Step 5: Apply patches
  const isHtmlNote = noteData.type === 'text';
  let patchedContent: string;
  let patchResults: PatchResult[];

  if (isHtmlNote) {
    const result = applyHtmlPatches(originalContent, patches);
    patchedContent = result.content;
    patchResults = result.results;
  } else {
    let lines = originalContent.split('\n');
    patchResults = [];
    for (let i = 0; i < patches.length; i++) {
      const { lines: newLines, result } = applyLinePatch(lines, patches[i], i);
      lines = newLines;
      patchResults.push(result);
    }
    patchedContent = lines.join('\n');
  }

  const appliedCount = patchResults.filter(r => r.applied).length;
  const failedCount = patchResults.filter(r => !r.applied).length;

  // Step 6: Write only if something changed
  if (appliedCount > 0) {
    // Re-check blobId immediately before the PUT to narrow the TOCTOU window.
    logVerboseApi("GET", `/notes/${noteId}`);
    const recheckResponse = await axiosInstance.get(`/notes/${noteId}`);
    if (recheckResponse.data.blobId !== expectedHash) {
      return {
        noteId,
        revisionCreated,
        patchResults: [],
        appliedCount: 0,
        failedCount: patches.length,
        message: `CONFLICT: Note was modified after patches were computed. Current blobId: ${recheckResponse.data.blobId}, expected: ${expectedHash}. Call get_note again to get the latest content.`,
        conflict: true
      };
    }
    logVerboseApi("PUT", `/notes/${noteId}/content`);
    const putResponse = await axiosInstance.put(`/notes/${noteId}/content`, patchedContent, {
      headers: { 'Content-Type': 'text/plain' }
    });
    if (putResponse.status !== 204) {
      throw new Error(`Unexpected status from content PUT: ${putResponse.status}`);
    }
  }

  return {
    noteId,
    revisionCreated,
    patchResults,
    appliedCount,
    failedCount,
    message: `Applied ${appliedCount}/${patches.length} patches to note ${noteId}` + (failedCount > 0 ? ` (${failedCount} failed)` : '')
  };
}

// ─────────────────────────────────────────────────────────────────────────────

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
    includeBinaryContent = false,
    searchPattern,
    useRegex = true,
    searchFlags = 'g'
  } = args;

  if (!noteId) {
    throw new Error("noteId is required for get operation.");
  }

  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
  const noteData = noteResponse.data;

  if (!includeContent) {
    return {
      note: noteData
    };
  }

  // Smart content inclusion: skip binary content for file/image notes by default
  const isFileOrImageNote = noteData.type === 'file' || noteData.type === 'image';
  const shouldIncludeContent = !isFileOrImageNote || includeBinaryContent;

  if (!shouldIncludeContent) {
    // For file/image notes without explicit binary content request, return metadata only
    return {
      note: noteData,
      contentHash: noteData.blobId
    };
  }

  // Get note content (works for all note types including file/image when explicitly requested)
  const { data: noteContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Get blobId (Trilium's built-in content hash) and content requirements
  const blobId = noteData.blobId;
  const contentRequirements = getContentRequirements(noteData.type);

  // Handle search if pattern is provided
  if (searchPattern) {
    // For file/image notes without content, search is not available
    if (isFileOrImageNote && !includeBinaryContent) {
      return {
        note: noteData,
        contentHash: blobId,
        search: {
          pattern: searchPattern,
          flags: searchFlags,
          matches: [],
          totalMatches: 0,
          searchMode: contentRequirements.requiresHtml ? 'html' : 'plain',
          useRegex,
          note: "Search not available for file/image notes without binary content inclusion"
        }
      };
    }

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
  const response: any = {
    note: noteData,
    contentHash: blobId
  };

  // Include content only if it was actually retrieved
  if (shouldIncludeContent) {
    response.content = noteContent;
    response.contentRequirements = contentRequirements;
  }

  return response;
}