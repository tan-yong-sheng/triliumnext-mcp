/**
 * Attribute List Handler Module
 * Centralized request handling for attribute listing operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { handleListAttributes } from "./attributeListManager.js";

/**
 * Handle list_attributes tool requests
 */
export async function handleListAttributesRequest(args: any, axiosInstance: any, permissionChecker: any) {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list attributes.");
  }

  try {
    const listOperation = {
      noteId: args.noteId,
      hierarchyLevel: args.hierarchyLevel || 'immediate',
      limit: args.limit || 50
    };

    const result = await handleListAttributes(listOperation, axiosInstance);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}