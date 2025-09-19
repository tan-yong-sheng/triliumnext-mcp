/**
 * Attribute Management Tool Definitions
 * Defines schemas for attribute-related tools (read and write operations)
 */

/**
 * Generate read-only attribute tools (READ permission only)
 */
export function createReadAttributeTools(): any[] {
  return [
    {
      name: "read_attributes",
      description: "Read all attributes (labels and relations) for a note. View existing labels (#tags), template relations (~template), and note metadata. This tool provides read-only access to inspect current attributes assigned to any note. Returns structured data with labels, relations, and summary information.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to read attributes from"
          }
        },
        required: ["noteId"]
      }
    },
    {
      name: "list_attributes",
      description: "List attributes from note hierarchy using search_notes internally. Explore attributes across immediate hierarchy (parents and children) or full hierarchy (ancestors and descendants). Returns comprehensive attribute information including note context, attribute details, and hierarchy relationships. Perfect for understanding template usage, label patterns, and relation networks across your note structure.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "Anchor note ID for hierarchy navigation"
          },
          hierarchyLevel: {
            type: "string",
            enum: ["immediate", "all"],
            description: "Hierarchy navigation depth: 'immediate' (direct parents and children only) or 'all' (include ancestors and descendants)",
            default: "immediate"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
            default: 50,
            minimum: 1,
            maximum: 200
          }
        },
        required: ["noteId"]
      }
    }
  ];
}

/**
 * Generate write-only attribute tools (WRITE permission only)
 */
export function createWriteAttributeTools(): any[] {
  return [
    {
      name: "manage_attributes",
      description: "Manage note attributes with write operations (create, update, delete). Create labels (#tags), template relations (~template), update existing attributes, and organize notes with metadata. ⚠️ PRIORITY: Use create_note with attributes parameter for template relations when possible - only use this tool for post-creation modifications or complex scenarios.\n\n✅ BEST PRACTICE: Most template relations (~template = 'Board', 'Calendar', etc.) should be added during create_note\n❌ USE THIS TOOL FOR: ~renderNote relations, custom note-to-note relations, post-creation label updates\n\nIMPORTANT: This tool only provides write access - use read_attributes to view existing attributes. Relations require values pointing to existing notes (e.g., template relations use human-readable names like 'Board', 'Calendar' which are automatically translated to system note IDs; author relations use target note titles or IDs). UPDATE LIMITATIONS: For labels, only value and position can be updated. For relations, only position can be updated. The isInheritable property cannot be changed via update - delete and recreate to modify inheritability. Supports single operations and efficient batch creation for better performance.\n\n🛡️ VALIDATION: Create operations automatically check for existing attributes to prevent duplicates. If an attribute already exists, you'll receive detailed error messages with guidance on using 'update' instead. Batch operations skip duplicates and continue processing valid attributes.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to manage attributes for"
          },
          operation: {
            type: "string",
            enum: ["create", "update", "delete", "batch_create"],
            description: "Operation type: 'create' (new attribute - validates against existing attributes to prevent duplicates), 'update' (modify existing - limited to label value/position and relation position only), 'delete' (remove attribute), 'batch_create' (multiple new attributes efficiently - skips duplicates and continues with valid attributes)"
          },
          attributes: {
            type: "array",
            description: "Array of attributes to create/update/delete. Required for all write operations. IMPORTANT: Update operations have limitations - only label values/positions and relation positions can be updated. To change isInheritable or other properties, delete and recreate the attribute.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["label", "relation"],
                  description: "Attribute type: 'label' for #tags (categories, metadata), 'relation' for ~connections (template, author, etc.)"
                },
                name: {
                  type: "string",
                  description: "Attribute name: for labels use descriptive tags like 'status', 'priority', 'project'; for relations use connection types that define relationships between notes (e.g., 'template' for built-in templates, 'author' for content creators, 'publisher' for publications). Relations connect notes and always require a target note value."
                },
                value: {
                  type: "string",
                  description: "Attribute value: REQUIRED for relations (relations must point to existing notes - use human-readable template names like 'Board', 'Calendar', 'Text Snippet' which are automatically translated to system note IDs, or use target note IDs/titles like 'Tolkien' or 'abc123def' for custom relations), optional for labels (e.g., status labels like 'In Progress', priority labels like 'High'). Relations always need values since they connect notes together."
                },
                position: {
                  type: "number",
                  description: "Display position (lower numbers appear first, default: 10)",
                  default: 10
                },
                isInheritable: {
                  type: "boolean",
                  description: "Whether attribute is inherited by child notes (default: false). NOTE: This property cannot be changed via update operations. To modify inheritability, delete and recreate the attribute.",
                  default: false
                }
              },
              required: ["type", "name"]
            }
          }
        },
        required: ["noteId", "operation"],
        dependencies: {
          operation: {
            oneOf: [
              {
                properties: {
                  operation: { enum: ["create", "update", "delete"] },
                  attributes: { minItems: 1, maxItems: 1 }
                }
              },
              {
                properties: {
                  operation: { enum: ["batch_create"] },
                  attributes: { minItems: 1 }
                }
              }
            ]
          }
        }
      }
    }
  ];
}