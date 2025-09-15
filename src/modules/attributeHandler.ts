/**
 * Attribute Handler Module
 * Processes MCP requests for attribute management operations
 */

import { AxiosInstance } from 'axios';
import {
  manage_attributes,
  get_note_attributes,
  ManageAttributesParams,
  Attribute,
  AttributeOperationResult
} from './attributeManager.js';
import { hasWritePermission } from '../utils/permissionUtils.js';

export interface ManageAttributesRequest {
  noteId: string;
  operation: "create" | "update" | "delete" | "batch_create" | "read";
  attributes?: Attribute[];
}

/**
 * Handle manage_attributes MCP request
 */
export async function handleManageAttributes(
  args: ManageAttributesRequest,
  axiosInstance: AxiosInstance
): Promise<any> {
  // Check permissions
  if (!hasWritePermission()) {
    return {
      content: [
        {
          type: "text",
          text: "❌ Permission denied: WRITE permission required for attribute management operations"
        }
      ],
      isError: true
    };
  }

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

    // Validate operation
    const validOperations = ["create", "update", "delete", "batch_create", "read"];
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

    // Handle read operation
    if (args.operation === "read") {
      const result = await get_note_attributes(args.noteId, axiosInstance);
      return format_attribute_response(result, args.noteId, "read");
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
🔧 Attribute Management Tool (manage_attributes)

This tool manages note attributes (labels and relations) in TriliumNext.

📝 Usage Examples:

1. Create a single label:
   - noteId: "abc123"
   - operation: "create"
   - attributes: [{type: "label", name: "important", position: 10}]

2. Create a template relation:
   - noteId: "abc123"
   - operation: "create"
   - attributes: [{type: "relation", name: "template", value: "Board", position: 10}]

3. Create multiple attributes (batch):
   - noteId: "abc123"
   - operation: "batch_create"
   - attributes: [
       {type: "label", name: "project", value: "api", position: 10},
       {type: "label", name: "language", value: "python", position: 20},
       {type: "relation", name: "template", value: "Grid View", position: 30}
     ]

4. Read all attributes:
   - noteId: "abc123"
   - operation: "read"

5. Update an attribute:
   - noteId: "abc123"
   - operation: "update"
   - attributes: [{type: "label", name: "important", position: 15}]

6. Delete an attribute:
   - noteId: "abc123"
   - operation: "delete"
   - attributes: [{type: "label", name: "important"}]

🏷️  Label Syntax: #tagname or #tagname = "value"
🔗 Relation Syntax: ~relationname = "target_value"

⚡ Performance Tips:
- Use "batch_create" for multiple attributes (faster than individual calls)
- Template relations require the target note to exist in your Trilium instance
- Position values control display order (lower numbers appear first)
`;
}