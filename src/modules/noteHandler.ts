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
  handleAppendNote,
  handleDeleteNote,
  handleGetNote
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
      parentNoteId: args.parentNoteId,
      title: args.title,
      type: args.type,
      content: args.content,
      mime: args.mime,
      attributes: args.attributes  // ✅ Add this line
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

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      content: args.content,
      revision: args.revision !== false, // Default to true (safe behavior)
      expectedHash: args.expectedHash,
      validateType: args.validateType !== false // Default to true
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
 * Handle append_note tool requests
 */
export async function handleAppendNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to append to notes.");
  }

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      content: args.content,
      revision: args.revision === true // Default to false (performance behavior)
    };

    const result = await handleAppendNote(noteOperation, axiosInstance);

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
      includeContent: args.includeContent !== false
    };

    const result = await handleGetNote(noteOperation, axiosInstance);

    const responseData = {
      ...result.note,
      ...(result.content && { content: result.content })
    };

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