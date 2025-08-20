/**
 * Note Handler Module
 * Centralized request handling for note operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  NoteOperation,
  SearchAndReplaceOperation,
  handleCreateNote,
  handleUpdateNote,
  handleAppendNote,
  handleDeleteNote,
  handleGetNote,
  handleSearchAndReplace
} from "./noteManager.js";

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

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
      mime: args.mime
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

  try {
    const noteOperation: NoteOperation = {
      noteId: args.noteId,
      content: args.content,
      revision: args.revision !== false // Default to true (safe behavior)
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

/**
 * Handle search_and_replace tool requests
 */
export async function handleSearchAndReplaceRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to perform search and replace operations.");
  }

  try {
    const searchAndReplaceOperation: SearchAndReplaceOperation = {
      noteId: args.noteId,
      searchPattern: args.searchPattern,
      replacement: args.replacement,
      useRegex: args.useRegex ?? false,
      dryRun: args.dryRun ?? true,
      createRevision: args.createRevision ?? true
    };

    const result = await handleSearchAndReplace(searchAndReplaceOperation, axiosInstance);

    // Format response with detailed information
    let responseText = result.message;
    
    if (args.dryRun && result.matched) {
      responseText += `\n\nDry Run Results:`;
      responseText += `\n- Found ${result.matchCount} matches`;
      if (result.originalContent && result.updatedContent) {
        responseText += `\n- Original content length: ${result.originalContent.length} characters`;
        responseText += `\n- Updated content length: ${result.updatedContent.length} characters`;
        responseText += `\n\nSet dryRun=false to apply these changes.`;
      }
    }

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}