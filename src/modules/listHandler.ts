/**
 * List Handler Module
 * Handles list_notes requests as a wrapper around search_notes functionality
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  SearchOperation,
  handleSearchNotes
} from "./searchManager.js";

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Handle list_notes tool requests - wrapper around search_notes for hierarchy navigation
 */
export async function handleListNotesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list notes.");
  }

  try {
    // Convert list_notes parameters to search_notes format
    const searchOperation: SearchOperation = {
      hierarchyType: args.hierarchyType,
      parentNoteId: args.parentNoteId,
      limit: args.limit
    };

    // Use existing search functionality
    const result = await handleSearchNotes(searchOperation, axiosInstance);
    const resultsText = JSON.stringify(result.results, null, 2);

    return {
      content: [{
        type: "text",
        text: `${result.debugInfo || ''}${resultsText}`
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}