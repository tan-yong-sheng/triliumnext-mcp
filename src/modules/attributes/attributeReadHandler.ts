/**
 * Attribute Read Handler Module
 * Processes MCP requests for attribute read operations
 */

import { AxiosInstance } from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { PermissionChecker } from '../shared/index.js';
import { read_attributes, ReadAttributesParams, AttributeOperationResult } from './operations/attributeRead.js';
import { Attribute, format_attributes_for_display } from '../shared/index.js';

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
    const labels = result.attributes.filter((attr: Attribute) => attr.type === 'label');
    const relations = result.attributes.filter((attr: Attribute) => attr.type === 'relation');

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
        text: `🏷️  Labels (${labels.length}):\n${labels.map((attr: Attribute) => {
          const value = attr.value ? ` = "${attr.value}"` : "";
          return `  #${attr.name}${value}`;
        }).join('\n')}`
      });
    }

    if (relations.length > 0) {
      content.push({
        type: "text",
        text: `🔗 Relations (${relations.length}):\n${relations.map((attr: Attribute) => `  ~${attr.name} = "${attr.value}"`).join('\n')}`
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
 * Get help text for attribute reading
 */
export function get_read_attributes_help(): string {
  return `
📖 Attribute Reading Tools

read_attributes: Read all attributes (labels and relations) for a note

📝 Usage Examples:

📖 Read Attributes:
   - noteId: "abc123"

🏷️  Label Syntax: #tagname or #tagname = "value"
🔗 Relation Syntax: ~relationname = "target_value"

⚡ Tips:
- Use read_attributes to view existing attributes before making changes
- Returns structured summary with counts of labels and relations
- Shows both immediate and inherited attributes

🛡️ **Security**: Requires READ permission to access note attributes.
`;
}