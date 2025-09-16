/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { ContentItem } from '../types/contentTypes.js';
import { processContentArray, processContentItem } from '../utils/contentProcessor.js';

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
  content?: string | ContentItem[];
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
      await createNoteAttributes(noteId, attributes, axiosInstance);
    } catch (attributeError) {
      console.warn(`Note created but attributes failed to apply: ${attributeError}`);
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
      type: attr.type,
      name: attr.name,
      value: attr.value || '',
      position: attr.position || 10,
      isInheritable: attr.isInheritable || false
    };

    return axiosInstance.post(`/notes/${noteId}/attributes`, attributeData);
  });

  await Promise.all(attributePromises);
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

  // Process content array to ETAPI format
  let processedContent: string;

  if (!Array.isArray(rawContent)) {
    throw new Error("Content must be a ContentItem array");
  }

  // ContentItem[] array format - process first item only for update
  const processed = await processContentArray(rawContent);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }
  processedContent = processed.content;

  const response = await axiosInstance.put(`/notes/${noteId}/content`, processedContent, {
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

  return {
    note: noteData,
    content: noteContent
  };
}