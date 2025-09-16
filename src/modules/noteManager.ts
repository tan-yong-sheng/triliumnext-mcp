/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { ContentItem } from '../types/contentTypes.js';
import { processContentArray, processContentItem } from '../utils/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../utils/verboseUtils.js';
import { generateContentHash, getContentRequirements, validateContentForNoteType } from '../utils/hashUtils.js';

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export type NoteType = 'text' | 'code' | 'render' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView' | 'shortcut' | 'doc' | 'contentWidget' | 'launcher';

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string | ContentItem[];
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  attributes?: Attribute[];
  expectedHash?: string;
}

export interface NoteCreateResponse {
  noteId: string;
  message: string;
}

export interface NoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  conflict?: boolean;
}

export interface NoteDeleteResponse {
  noteId: string;
  message: string;
}

export interface NoteGetResponse {
  note: any;
  content?: string | ContentItem[];
  contentHash?: string;
  contentRequirements?: {
    requiresHtml: boolean;
    description: string;
    examples: string[];
  };
}

/**
 * Handle create note operation
 */
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse> {
  const { parentNoteId, title, type, content: rawContent, mime, attributes } = args;

  if (!parentNoteId || !title || !type || !rawContent) {
    throw new Error("parentNoteId, title, type, and content are required for create operation.");
  }

  // Process content array to ETAPI format
  if (!Array.isArray(rawContent)) {
    throw new Error("Content must be a ContentItem array");
  }

  // Check for file/image items and reject them
  const fileItems = rawContent.filter(item => item.type === 'file' || item.type === 'image');
  if (fileItems.length > 0) {
    throw new Error('File and image note creation is currently disabled');
  }

  // Process content array
  const processed = await processContentArray(rawContent, type);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }

  const processedContent = processed.content;
  const finalMime = processed.mimeType || mime;

  // Create note with processed content (empty for file/image-only notes)
  const noteData: any = {
    parentNoteId,
    title,
    type,
    content: processedContent
  };

  // Add MIME type if specified
  if (finalMime) {
    noteData.mime = finalMime;
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
    message: `Created note: ${noteId}`
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
    type,
    content: rawContent,
    revision = true,
    expectedHash
  } = args;

  if (!noteId || !type || !rawContent) {
    throw new Error("noteId, type, and content are required for update operation.");
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

    // Step 3: Content type validation (always enabled)
    let finalContent = rawContent;
    const validationResult = await validateContentForNoteType(
      rawContent as ContentItem[],
      type as NoteType,
      currentContent.data
    );

    if (!validationResult.valid) {
      return {
        noteId,
        message: `CONTENT_TYPE_MISMATCH: ${validationResult.error}`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Use validated/corrected content
    finalContent = validationResult.content;

    // Step 4: Create revision if requested
    if (revision) {
      try {
        await axiosInstance.post(`/notes/${noteId}/revision`);
        revisionCreated = true;
      } catch (error) {
        console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
        // Continue with update even if revision creation fails
      }
    }

    // Step 5: Process and update content
    if (!Array.isArray(finalContent)) {
      throw new Error("Content must be a ContentItem array");
    }

    const processed = await processContentArray(finalContent, currentNote.data.type);
    if (processed.error) {
      throw new Error(`Content processing error: ${processed.error}`);
    }

    const response = await axiosInstance.put(`/notes/${noteId}/content`, processed.content, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (response.status !== 204) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
    const correctionMsg = (finalContent !== rawContent) ? " (content auto-corrected)" : "";

    return {
      noteId,
      message: `Note ${noteId} updated successfully${revisionMsg}${correctionMsg}`,
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

  // Process content array to ETAPI format
  let processedContentToAppend: string;

  if (!Array.isArray(contentToAppend)) {
    throw new Error("Content must be a ContentItem array");
  }

  // ContentItem[] array format - process first item only for append
  const processed = await processContentArray(contentToAppend);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }
  processedContentToAppend = processed.content;

  // Get current content
  const { data: currentContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

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

  const noteData = noteResponse.data;

  // Get note content (works for all note types including file/image)
  const { data: noteContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Get blobId (Trilium's built-in content hash) and content requirements
  const blobId = noteData.blobId;
  const contentRequirements = getContentRequirements(noteData.type);

  return {
    note: noteData,
    content: noteContent,
    contentHash: blobId, // Use blobId as content hash
    contentRequirements
  };
}