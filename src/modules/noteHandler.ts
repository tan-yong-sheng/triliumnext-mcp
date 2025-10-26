/**
 * Note Handler Module
 * Centralized request handling for note operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import {
  NoteOperation,
  handleCreateNote,
  handleUpdateNote,
  handleDeleteNote,
  handleGetNote,
  handleSearchReplaceNote
} from "./noteManager.js";

/**
 * Handle create_note tool requests
 */
export async function handleCreateNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to create notes.");
  }

  // Validate file upload requirements
  if (args.type === 'file' || args.type === 'image') {
    if (!args.fileUri) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Parameter 'fileUri' is required when type='${args.type}'.`
      );
    }
  }

  // For non-file/image notes, fileUri should not be provided
  if (args.fileUri && !['file', 'image'].includes(args.type)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Parameter 'fileUri' can only be used when type='file' or type='image'."
    );
  }

  // Validate file upload requirements
  if (args.type === 'file' || args.type === 'image') {
    if (!args.fileUri) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Parameter 'fileUri' is required when type='${args.type}'.`
      );
    }
  }

  // For non-file/image notes, fileUri should not be provided
  if (args.fileUri && !['file', 'image'].includes(args.type)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Parameter 'fileUri' can only be used when type='file' or type='image'."
    );
  }

  try {
    const noteOperation: NoteOperation = {
      parentNoteId: args.parentNoteId || "root", // Use default value if not provided
      title: args.title,
      type: args.type,
      content: args.content,
      mime: args.mime,
      fileUri: args.fileUri,
      attributes: args.attributes
    };

    const result = await handleCreateNote(noteOperation, axiosInstance);

    return {
      content: [{
        type: "text",
        text: result.message
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle update_note tool requests
 */
export async function handleUpdateNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to update notes.");
  }

  // Validate that expectedHash is provided (required for data integrity)
  if (!args.expectedHash) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter 'expectedHash'. You must call get_note first to retrieve the current blobId (content hash) before updating. This ensures data integrity by preventing overwriting changes made by other users."
    );
  }

  // Validate that either title, content, or fileUri is provided
  if (!args.title && !args.content && !args.fileUri) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Either 'title', 'content', or 'fileUri' (or any combination) must be provided for update operation."
    );
  }

  // Get current note for type validation
  let currentNote = null;
  try {
    const currentNoteResponse = await axiosInstance.get(`/notes/${args.noteId}`);
    currentNote = currentNoteResponse.data;
  } catch (error) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Failed to retrieve current note for validation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // SIMPLER RULE 1: Note type is immutable - cannot be changed after creation
  if (args.type && args.type !== currentNote.type) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Note type cannot be changed after creation. Current type: '${currentNote.type}', requested type: '${args.type}'. Create a new note instead of changing the type.`
    );
  }

  // SIMPLER RULE 2: MIME type is immutable - cannot be changed after creation
  if (args.mime && args.mime !== currentNote.mime) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `MIME type cannot be changed after creation. Current MIME type: '${currentNote.mime}', requested MIME type: '${args.mime}'. Create a new note instead of changing the MIME type.`
    );
  }

  // SIMPLER RULE 3: File type validation - file must match note type
  if (args.fileUri) {
    // Only file/image notes can have fileUri
    if (!['file', 'image'].includes(currentNote.type)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Parameter 'fileUri' can only be used with file or image notes. Current note type: '${currentNote.type}'.`
      );
    }

    // Validate that the new file matches the existing note type
    const { parseFileDataSource, detectNoteTypeFromMime } = await import('../utils/fileUtils.js');
    try {
      const fileData = parseFileDataSource(args.fileUri);
      const detectedType = detectNoteTypeFromMime(fileData.mimeType);

      if (!detectedType || detectedType !== currentNote.type) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `File type mismatch: Cannot replace ${currentNote.type} note content with ${detectedType || 'unsupported'} file. The file type must match the note type. Create a new note for different file types.`
        );
      }
    } catch (parseError) {
      if (parseError instanceof McpError) {
        throw parseError;
      }
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to parse or validate file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }
  }

  // SIMPLER RULE 4: Content updates must use current note type (no type parameter needed)
  if (args.content) {
    // Use current note type for content validation - args.type is not needed
    if (!currentNote.type) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Cannot determine current note type for content validation."
      );
    }
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      title: args.title,
      type: currentNote.type, // Always use current note type (immutable)
      content: args.content,
      mime: currentNote.mime, // Always use current MIME type (immutable)
      fileUri: args.fileUri,
      revision: args.revision !== false, // Default to true (safe behavior)
      expectedHash: args.expectedHash,
      mode: args.mode
    };

    const result = await handleUpdateNote(noteOperation, axiosInstance);

    return {
      content: [{
        type: "text",
        text: result.message
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}


/**
 * Handle delete_note tool requests
 */
export async function handleDeleteNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to delete notes.");
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId
    };

    const result = await handleDeleteNote(noteOperation, axiosInstance);

    return {
      content: [{
        type: "text",
        text: result.message
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle get_note tool requests
 */
export async function handleGetNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to get notes.");
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      includeContent: args.includeContent !== false,
      includeBinaryContent: args.includeBinaryContent || false,
      searchPattern: args.searchPattern,
      useRegex: args.useRegex !== false, // Default to true
      searchFlags: args.searchFlags || 'g'
    };

    const result = await handleGetNote(noteOperation, axiosInstance);

    // Build response data based on whether search was performed
    let responseData: any = {
      ...result.note,
      contentHash: result.contentHash
    };

    if (result.search) {
      // Search was performed, include search object but not content
      responseData.search = result.search;
    } else if (result.content) {
      // Standard response, include content but not search
      responseData.content = result.content;
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(responseData, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle search_and_replace_note tool requests
 */
export async function handleSearchReplaceNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to modify notes.");
  }

  // Validate that expectedHash is provided (required for data integrity)
  if (!args.expectedHash) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter 'expectedHash'. You must call get_note first to retrieve the current blobId (content hash) before performing search and replace. This ensures data integrity by preventing overwriting changes made by other users."
    );
  }

  // Validate required parameters
  if (!args.searchPattern) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter 'searchPattern'. The pattern to search for is required."
    );
  }

  if (!args.replacePattern) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter 'replacePattern'. The replacement pattern is required."
    );
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      searchPattern: args.searchPattern,
      replacePattern: args.replacePattern,
      useRegex: args.useRegex !== false, // Default to true
      searchFlags: args.searchFlags || 'g',
      revision: args.revision !== false, // Default to true for safety
      expectedHash: args.expectedHash
    };

    const result = await handleSearchReplaceNote(noteOperation, axiosInstance);

    return {
      content: [{
        type: "text",
        text: result.message
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}