/**
 * Attribute Handler Module
 * Centralized request handling for manage_attributes operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  AttributeOperation,
  handleListAttributes,
  handleCreateAttribute,
  handleUpdateAttribute,
  handleDeleteAttribute,
  handleGetAttribute
} from "./attributeManager.js";

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Handle manage_attributes tool requests
 */
export async function handleAttributeRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const operation = args.operation;
  const attributeOperation: AttributeOperation = {
    operation: args.operation,
    attributeType: args.attributeType,
    noteId: args.noteId,
    attributeId: args.attributeId,
    name: args.name,
    value: args.value,
    position: args.position,
    isInheritable: args.isInheritable,
    includeValues: args.includeValues,
    sortBy: args.sortBy
  };

  try {
    let result: any;

    switch (operation) {
      case "list": {
        if (!permissionChecker.hasPermission("READ")) {
          throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list attributes.");
        }
        result = await handleListAttributes(attributeOperation, axiosInstance);
        break;
      }

      case "create": {
        if (!permissionChecker.hasPermission("WRITE")) {
          throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to create attributes.");
        }
        result = await handleCreateAttribute(attributeOperation, axiosInstance);
        break;
      }

      case "update": {
        if (!permissionChecker.hasPermission("WRITE")) {
          throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to update attributes.");
        }
        result = await handleUpdateAttribute(attributeOperation, axiosInstance);
        break;
      }

      case "delete": {
        if (!permissionChecker.hasPermission("WRITE")) {
          throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to delete attributes.");
        }
        result = await handleDeleteAttribute(attributeOperation, axiosInstance);
        break;
      }

      case "get": {
        if (!permissionChecker.hasPermission("READ")) {
          throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to get attribute details.");
        }
        result = await handleGetAttribute(attributeOperation, axiosInstance);
        break;
      }

      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown operation: ${operation}. Supported operations: list, create, update, delete, get`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    // Convert regular errors to McpErrors for consistency
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidRequest, error instanceof Error ? error.message : String(error));
  }
}