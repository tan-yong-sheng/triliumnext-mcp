/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { processContentArray } from '../utils/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../utils/verboseUtils.js';
import { getContentRequirements, validateContentForNoteType } from '../utils/hashUtils.js';
import { SearchOperation } from './searchManager.js';

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export type NoteType = 'text' | 'code' | 'render' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView';

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  attributes?: Attribute[];
  expectedHash?: string;
  forceCreate?: boolean;
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
  const { parentNoteId, title, type, content: rawContent, mime, attributes, forceCreate = false } = args;

  if (!parentNoteId || !title || !type || !rawContent) {
    throw new Error("parentNoteId, title, type, and content are required for create operation.");
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
  if (typeof rawContent !== 'string') {
    throw new Error("Content must be a string");
  }

  // Process content
  const processed = await processContentArray(rawContent, type);
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
    revision = true,
    expectedHash
  } = args;

  if (!noteId || !expectedHash) {
    throw new Error("noteId and expectedHash are required for update operation.");
  }

  // Check if this is a title-only update
  const isTitleOnlyUpdate = title && !rawContent;

  // Check if this is a multi-parameter update (title + content)
  const isMultiParamUpdate = title && rawContent;

  // For content updates (with or without title), validate required fields
  if (rawContent && !type) {
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

    // Handle title-only update (efficient PATCH operation)
    if (isTitleOnlyUpdate) {
      // For title-only updates, skip revision creation for efficiency
      const patchData: any = { title };

      // Add MIME type if provided
      if (mime) {
        patchData.mime = mime;
      }

      logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
      const response = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const mimeMessage = mime ? ` and MIME type updated to "${mime}"` : "";
      return {
        noteId,
        message: `Note ${noteId} title updated successfully to "${title}"${mimeMessage}`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Handle content updates (with optional title change)
    // Step 3: Content type validation (always enabled)
    let finalContent = rawContent;
    const validationResult = await validateContentForNoteType(
      rawContent as string,
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
    if (typeof finalContent !== 'string') {
      throw new Error("Content must be a string");
    }

    const processed = await processContentArray(finalContent, currentNote.data.type);
    if (processed.error) {
      throw new Error(`Content processing error: ${processed.error}`);
    }

    const contentResponse = await axiosInstance.put(`/notes/${noteId}/content`, processed.content, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (contentResponse.status !== 204) {
      throw new Error(`Unexpected response status: ${contentResponse.status}`);
    }

    // Step 6: Update title and MIME type if provided (multi-parameter update)
    if (isMultiParamUpdate && (title || mime)) {
      const patchData: any = {};

      if (title) {
        patchData.title = title;
      }

      if (mime) {
        patchData.mime = mime;
      }

      // Only make PATCH call if there's something to update
      if (Object.keys(patchData).length > 0) {
        logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
        const titleResponse = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (titleResponse.status !== 200) {
          throw new Error(`Unexpected response status for title/mime update: ${titleResponse.status}`);
        }
      }
    }

    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
    const correctionMsg = (finalContent !== rawContent) ? " (content auto-corrected)" : "";
    const titleMsg = (isMultiParamUpdate && title) ? ` (title updated to "${title}")` : "";
    const mimeMsg = (isMultiParamUpdate && mime) ? ` (MIME type updated to "${mime}")` : "";

    return {
      noteId,
      message: `Note ${noteId} updated successfully${revisionMsg}${correctionMsg}${titleMsg}${mimeMsg}`,
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

  // Process content to ETAPI format
  let processedContentToAppend: string;

  if (typeof contentToAppend !== 'string') {
    throw new Error("Content must be a string");
  }

  // Process content for append
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