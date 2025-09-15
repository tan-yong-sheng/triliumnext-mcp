/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { processContent } from "../utils/contentProcessor.js";

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