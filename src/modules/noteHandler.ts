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

  try {
    const noteOperation: NoteOperation = {
      parentNoteId: args.parentNoteId || "root", // Use default value if not provided
      title: args.title,
      type: args.type,
      content: args.content,
      mime: args.mime,
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

  // Validate that either title or content is provided
  if (!args.title && !args.content) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Either 'title' or 'content' (or both) must be provided for update operation."
    );
  }

  // Validate that type is provided when content is being updated
  if (args.content && !args.type) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Parameter 'type' is required when updating content."
    );
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      title: args.title,
      type: args.type,
      content: args.content,
      mime: args.mime,
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