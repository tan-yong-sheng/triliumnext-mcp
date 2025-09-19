/**
 * Attribute Manage Handler Module
 * Processes MCP requests for attribute management operations
 */

import { AxiosInstance } from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { PermissionChecker } from '../../utils/permissionUtils.js';
import { manage_attributes, ManageAttributesParams, AttributeOperationResult } from './attributeManageManager.js';
import { Attribute, format_attributes_for_display } from '../../utils/attributeUtils.js';
import { ManageAttributesRequest } from '../../types/attributeTypes.js';

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

    // Add specific guidance for common errors
    if (result.errors && result.errors.some((err: string) => err.includes("already exists"))) {
      content.push({
        type: "text",
        text: `💡 **Attribute Already Exists**

The attribute you're trying to create already exists on this note. Here are your options:

1. **Update the existing attribute** (recommended):
   - Use operation: "update" instead of "create"
   - Only the value and position can be updated for labels
   - Only the position can be updated for relations

2. **Delete and recreate** (for inheritable changes):
   - First delete with operation: "delete"
   - Then recreate with operation: "create"
   - Use this when you need to change the 'isInheritable' property

3. **View current attributes**:
   - Use read_attributes to see all existing attributes
   - Check current values, positions, and inheritable settings

📋 **Example update operation**:
\`\`\`
{
  "noteId": "${noteId}",
  "operation": "update",
  "attributes": [{"type": "label", "name": "your_attribute", "value": "new_value"}]
}
\`\`\``
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

  // Add guidance for batch operations with conflicts
  if (result.success && operation === "batch_create" && result.errors && result.errors.length > 0) {
    const hasConflicts = result.errors.some((err: string) => err.includes("Skipping duplicate") || err.includes("already exist"));
    if (hasConflicts) {
      content.push({
        type: "text",
        text: `⚠️ **Batch Operation Summary**

Some attributes were skipped due to conflicts (already existing). This is normal behavior for batch operations:

✅ **Successfully created**: ${result.attributes?.length || 0} attributes
❌ **Skipped duplicates**: ${result.errors?.filter((err: string) => err.includes("Skipping duplicate") || err.includes("already exist")).length || 0} attributes

💡 **To manage skipped attributes**:
- Use \`read_attributes\` to view current attributes
- Use \`update\` operation to modify existing attributes
- Use \`delete\` operation to remove unwanted attributes first

This approach prevents accidental overwrites while allowing partial success for batch operations.`
      });
    }
  }

  return { content };
}

/**
 * Get help text for attribute management
 */
export function get_manage_attributes_help(): string {
  return `
🔧 Attribute Management Tools

manage_attributes: Create, update, delete attributes (write operations)

📝 Usage Examples:

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

🛡️ **Validation & Conflict Handling**:
- Create operations now validate against existing attributes to prevent duplicates
- If an attribute already exists, you'll get detailed error messages with guidance
- Batch operations skip duplicates and continue with valid attributes
- Use "update" to modify existing attributes, "create" for new ones only

🔒 **Security**: Requires WRITE permission to manage note attributes.
`;
}