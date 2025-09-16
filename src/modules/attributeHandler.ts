/**
 * Attribute Handler Module
 * Processes MCP requests for attribute management operations
 */

import { AxiosInstance } from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { PermissionChecker } from '../utils/permissionUtils.js';
import {
  manage_attributes,
  read_attributes,
  ManageAttributesParams,
  ReadAttributesParams,
  Attribute,
  AttributeOperationResult
} from './attributeManager.js';

export interface ManageAttributesRequest {
  noteId: string;
  operation: "create" | "update" | "delete" | "batch_create";
  attributes: Attribute[];
}

/**
 * Handle manage_attributes MCP request
 */
export async function handleManageAttributes(
  args: ManageAttributesRequest,
  axiosInstance: AxiosInstance,
  permissionChecker: PermissionChecker
): Promise<any> {
  try {
    // Validate required parameters
    if (!args.noteId) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing required parameter: noteId"
          }
        ],
        isError: true
      };
    }

    if (!args.operation) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing required parameter: operation"
          }
        ],
        isError: true
      };
    }

    // Check WRITE permission for all manage_attributes operations
    if (!permissionChecker.hasPermission("WRITE")) {
      throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to manage attributes.");
    }

    // Validate operation
    const validOperations = ["create", "update", "delete", "batch_create"];
    if (!validOperations.includes(args.operation)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid operation: ${args.operation}. Valid operations are: ${validOperations.join(", ")}`
          }
        ],
        isError: true
      };
    }

    // Validate attributes for write operations
    if (!args.attributes || !Array.isArray(args.attributes) || args.attributes.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing or invalid required parameter: attributes (must be a non-empty array for write operations)"
          }
        ],
        isError: true
      };
    }

    // For single operations, ensure only one attribute
    if (["create", "update", "delete"].includes(args.operation) && args.attributes.length !== 1) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Operation '${args.operation}' requires exactly one attribute, but ${args.attributes.length} were provided`
          }
        ],
        isError: true
      };
    }

    // Execute the attribute operation
    const params: ManageAttributesParams = {
      noteId: args.noteId,
      operation: args.operation as "create" | "update" | "delete" | "batch_create",
      attributes: args.attributes
    };

    const result = await manage_attributes(params, axiosInstance);
    return format_attribute_response(result, args.noteId, args.operation);

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Attribute operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle read_attributes MCP request
 */
export async function handleReadAttributes(
  args: ReadAttributesParams,
  axiosInstance: AxiosInstance,
  permissionChecker: PermissionChecker
): Promise<any> {
  try {
    // Validate required parameters
    if (!args.noteId) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Missing required parameter: noteId"
          }
        ],
        isError: true
      };
    }

    // Check READ permission
    if (!permissionChecker.hasPermission("READ")) {
      throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to read attributes.");
    }

    // Execute the read operation
    const result = await read_attributes(args, axiosInstance);
    return format_read_attribute_response(result, args.noteId);

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Attribute read operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Format read attribute operation result for MCP response
 */
function format_read_attribute_response(
  result: AttributeOperationResult,
  noteId: string
): any {
  const content: any[] = [];

  // Add status message
  if (result.success) {
    content.push({
      type: "text",
      text: `✅ ${result.message}`
    });
  } else {
    content.push({
      type: "text",
      text: `❌ ${result.message}`
    });

    // Add error details if available
    if (result.errors && result.errors.length > 0) {
      content.push({
        type: "text",
        text: `📋 Error details:\n${result.errors.map((err: string, i: number) => `${i + 1}. ${err}`).join('\n')}`
      });
    }
  }

  // Add attribute data for successful operations
  if (result.success && result.attributes && result.attributes.length > 0) {
    // Separate labels and relations for better organization
    const labels = result.attributes.filter(attr => attr.type === 'label');
    const relations = result.attributes.filter(attr => attr.type === 'relation');

    content.push({
      type: "text",
      text: format_attributes_for_display(result.attributes)
    });

    // Add structured summary if available
    if (result.summary) {
      content.push({
        type: "text",
        text: `📊 Summary: ${result.summary.total} total attributes (${result.summary.labels} labels, ${result.summary.relations} relations)`
      });
    }

    // Add detailed breakdown
    if (labels.length > 0) {
      content.push({
        type: "text",
        text: `🏷️  Labels (${labels.length}):\n${labels.map(attr => {
          const value = attr.value ? ` = "${attr.value}"` : "";
          return `  #${attr.name}${value}`;
        }).join('\n')}`
      });
    }

    if (relations.length > 0) {
      content.push({
        type: "text",
        text: `🔗 Relations (${relations.length}):\n${relations.map(attr => `  ~${attr.name} = "${attr.value}"`).join('\n')}`
      });
    }
  } else if (result.success) {
    content.push({
      type: "text",
      text: "📋 No attributes found for this note"
    });
  }

  return { content };
}

/**
 * Format attribute operation result for MCP response
 */
function format_attribute_response(
  result: AttributeOperationResult,
  noteId: string,
  operation: string
): any {
  const content: any[] = [];

  // Add status message
  if (result.success) {
    content.push({
      type: "text",
      text: `✅ ${result.message}`
    });
  } else {
    content.push({
      type: "text",
      text: `❌ ${result.message}`
    });

    // Add error details if available
    if (result.errors && result.errors.length > 0) {
      content.push({
        type: "text",
        text: `📋 Error details:\n${result.errors.map((err: string, i: number) => `${i + 1}. ${err}`).join('\n')}`
      });
    }
  }

  // Add attribute data for successful operations
  if (result.success && result.attributes && result.attributes.length > 0) {
    content.push({
      type: "text",
      text: format_attributes_for_display(result.attributes)
    });

    // For batch operations, add summary
    if (operation === "batch_create") {
      content.push({
        type: "text",
        text: `📊 Summary: ${result.attributes.length} attributes processed for note ${noteId}`
      });
    }
  }

  // Add guidance for template relations
  if (result.success && operation === "batch_create") {
    const templateRelations = result.attributes?.filter((attr: Attribute) =>
      attr.type === "relation" && attr.name === "template"
    );

    if (templateRelations && templateRelations.length > 0) {
      content.push({
        type: "text",
        text: `🎯 Template relation detected: ${templateRelations[0].value}\nNote: Template functionality depends on the target note existing in your Trilium instance.`
      });
    }
  }

  return { content };
}

/**
 * Format attributes for display in MCP response
 */
function format_attributes_for_display(attributes: Attribute[]): string {
  if (!attributes || attributes.length === 0) {
    return "📋 No attributes to display";
  }

  const format_single_attribute = (attr: Attribute): string => {
    const prefix = attr.type === "label" ? "#" : "~";
    const value = attr.value ? ` = "${attr.value}"` : "";
    const position = attr.position ? ` [position: ${attr.position}]` : "";
    const inheritable = attr.isInheritable ? " [inheritable]" : "";

    return `${prefix}${attr.name}${value}${position}${inheritable}`;
  };

  return `📋 Created attributes:\n${attributes.map(format_single_attribute).join('\n')}`;
}

/**
 * Get help text for attribute management
 */
export function get_attributes_help(): string {
  return `
🔧 Attribute Management Tools

📖 read_attributes: Read all attributes (labels and relations) for a note
🔧 manage_attributes: Create, update, delete attributes (write operations)

📝 Usage Examples:

📖 Read Attributes:
   - noteId: "abc123"

🔧 Create a single label:
   - noteId: "abc123"
   - operation: "create"
   - attributes: [{type: "label", name: "important", position: 10}]

🔧 Create a template relation:
   - noteId: "abc123"
   - operation: "create"
   - attributes: [{type: "relation", name: "template", value: "Board", position: 10}]

🔧 Create multiple attributes (batch):
   - noteId: "abc123"
   - operation: "batch_create"
   - attributes: [
       {type: "label", name: "project", value: "api", position: 10},
       {type: "label", name: "language", value: "python", position: 20},
       {type: "relation", name: "template", value: "Grid View", position: 30}
     ]

🔧 Update an attribute:
   - noteId: "abc123"
   - operation: "update"
   - attributes: [{type: "label", name: "important", position: 15}]

🔧 Delete an attribute:
   - noteId: "abc123"
   - operation: "delete"
   - attributes: [{type: "label", name: "important"}]

🏷️  Label Syntax: #tagname or #tagname = "value"
🔗 Relation Syntax: ~relationname = "target_value"

⚡ Performance Tips:
- Use "batch_create" for multiple attributes (faster than individual calls)
- Template relations require the target note to exist in your Trilium instance
- Position values control display order (lower numbers appear first)
- Use read_attributes to view existing attributes before making changes
`;
}