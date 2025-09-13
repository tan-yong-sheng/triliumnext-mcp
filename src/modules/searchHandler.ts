/**
 * Search Handler Module
 * Centralized request handling for search operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  SearchOperation,
  handleSearchNotes
} from "./searchManager.js";
import { formatNotesForListing } from "./noteFormatter.js";

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Handle search_notes tool requests
 */
export async function handleSearchNotesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to search notes.");
  }

  try {
    const searchOperation: SearchOperation = {
      text: args.text,
      searchCriteria: args.searchCriteria,
      limit: args.limit
    };

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

