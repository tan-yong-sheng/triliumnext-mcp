/**
 * Tool Definition Module
 * Centralized tool schema definitions based on permissions
 */

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Generate write operation tools (CREATE, UPDATE, DELETE operations)
 */
export function createWriteTools(): any[] {
  return [
    {
      name: "create_note",
      description: "Create a new note in TriliumNext. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes.",
      inputSchema: {
        type: "object",
        properties: {
          parentNoteId: {
            type: "string",
            description: "ID of the parent note",
            default: "root"
          },
          title: {
            type: "string",
            description: "Title of the note",
          },
          type: {
            type: "string",
            enum: ["text", "code", "file", "image", "search", "book", "relationMap", "render"],
            description: "Type of note",
          },
          content: {
            type: "string",
            description: "Content of the note",
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes",
          },
        },
        required: ["parentNoteId", "title", "type", "content"],
      },
    },
    {
      name: "update_note",
      description: "Update the content of an existing note with optional revision creation. WARNING: This completely replaces the note's content. Consider using 'append_note' for adding content without replacement. STRONGLY RECOMMENDED: Keep revision=true (default) to create a backup before overwriting, unless explicitly instructed otherwise to prevent irreversible data loss.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to update"
          },
          content: {
            type: "string",
            description: "New content for the note"
          },
          revision: {
            type: "boolean",
            description: "Whether to create a revision before updating (default: true for safety)",
            default: true
          }
        },
        required: ["noteId", "content"]
      }
    },
    {
      name: "append_note",
      description: "Appends new content to an existing note without overwriting it. Use this instead of update_note when you want to add text below the existing content (e.g., logs, journals). For full content replacement, use update_note. By default, it avoids creating revisions (revision=false) to improve performance during frequent additions.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to append content to"
          },
          content: {
            type: "string",
            description: "Content to append to the existing note"
          },
          revision: {
            type: "boolean",
            description: "Whether to create a revision before appending (default: false for performance)",
            default: false
          }
        },
        required: ["noteId", "content"]
      }
    },
    {
      name: "delete_note",
      description: "Delete a note permanently. CAUTION: This action cannot be undone and will permanently remove the note and all its content.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to delete",
          },
        },
        required: ["noteId"],
      },
    },
    {
      name: "search_and_replace",
      description: "Search for text patterns and replace them in a specific note. Supports both exact string matching and regex patterns. Use dryRun=true to preview changes before applying them. Replacement text supports Markdown (automatically converted to HTML). IMPORTANT: When dryRun=false, STRONGLY RECOMMENDED to keep createRevision=true (default) to create a backup before making changes, unless user explicitly requests no revision.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to perform search and replace on"
          },
          searchPattern: {
            type: "string",
            description: "Text or regex pattern to search for"
          },
          replacement: {
            type: "string",
            description: "Replacement text (supports regex capture groups if useRegex=true). Markdown content is automatically converted to HTML."
          },
          useRegex: {
            type: "boolean",
            description: "Whether to treat searchPattern as regex (default: false)",
            default: false
          },
          dryRun: {
            type: "boolean",
            description: "Preview changes without applying them (default: true). When true, createRevision is automatically ignored.",
            default: true
          },
          createRevision: {
            type: "boolean",
            description: "Create backup revision before changes (default: true). STRONGLY RECOMMENDED to keep true when dryRun=false to prevent data loss. Only set to false if user explicitly requests no backup. Ignored when dryRun=true.",
            default: true
          }
        },
        required: ["noteId", "searchPattern", "replacement"]
      }
    }
  ];
}

/**
 * Generate read operation tools (GET, SEARCH, LIST operations)
 */
export function createReadTools(): any[] {
  const searchProperties = createSearchProperties();
  
  return [
    {
      name: "get_note",
      description: "Get a note and its content by ID",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to retrieve",
          },
          includeContent: {
            type: "boolean",
            description: "Whether to include the note's content in the response",
            default: true
          }
        },
        required: ["noteId"],
      },
    },
    {
      name: "resolve_note_id",
      description: "Resolves a note/folder name to its actual note ID for use with other tools. You MUST call this function before using 'search_notes' with hierarchyType when users provide note names instead of note IDs (e.g., 'wqd7006', 'My Project') UNLESS the user explicitly provides a note ID.",
      inputSchema: {
        type: "object",
        properties: {
          noteName: {
            type: "string",
            description: "Name or title of the note to find (e.g., 'wqd7006', 'My Project Folder')",
          },
          exactMatch: {
            type: "boolean",
            description: "Whether to require exact title match. RECOMMENDED: Use false (default) for best user experience - fuzzy search finds partial matches and handles typos, while still prioritizing exact matches when found. Only set to true when user explicitly requests exact matching.",
            default: false
          },
          maxResults: {
            type: "number",
            description: "Maximum number of results to return in topMatches array (default: 3)",
            default: 3,
            minimum: 1,
            maximum: 10
          }
        },
        required: ["noteName"],
      },
    },
    {
      name: "search_notes",
      description: "Unified search with comprehensive filtering capabilities. Supports full-text search, attributes, note properties, date ranges, and hierarchy navigation. For 'list all notes' requests: use hierarchyType='descendants' with parentNoteId='root'. For browsing specific folders: use hierarchyType='children'.",
      inputSchema: {
        type: "object",
        properties: searchProperties,
      },
    }
  ];
}

/**
 * Create shared search properties for reuse across search tools
 */
function createSearchProperties() {
  return {
    text: {
      type: "string",
      description: "Simple text search token for full-text search (NOT a query string - just plain text like 'kubernetes')",
    },
    attributes: {
      type: "array",
      description: "Array of attribute-based search conditions for Trilium labels and relations (e.g., #book, #author, ~authorNote). User-defined metadata attached to notes. Use OR logic between items for 'either/or' searches (e.g., '#book OR #article' → set logic:'OR' on first item). Use single search_notes call instead of multiple separate searches.",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["label", "relation"],
            description: "Type of attribute: 'label' for #tags, 'relation' for ~relations"
          },
          name: {
            type: "string",
            description: "Name of the label or relation (e.g., 'book', 'author', 'archived')"
          },
          op: {
            type: "string",
            enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with", "regex"],
            description: "Attribute operator - 'exists'/'not_exists' for presence checks, others for value comparisons",
            default: "exists"
          },
          value: {
            type: "string",
            description: "Value to compare against (optional for exists/not_exists)"
          },
          logic: {
            type: "string",
            enum: ["AND", "OR"],
            description: "Logic operator to combine with next attribute. REQUIRED: Always specify 'AND' or 'OR' for every item. The system will automatically ignore logic on the last item (no next item to combine with).",
            default: "AND"
          }
        },
        required: ["type", "name", "logic"]
      }
    },
    noteProperties: {
      type: "array",
      description: "Array of note property conditions for built-in note metadata and content searches (e.g., note.isArchived, note.type, note.title, note.content). System-level properties with note.* prefix. For title/content: use 'contains', 'starts_with', 'ends_with', 'not_equal' operators. For other properties: use comparison operators. Use OR logic between items for 'either/or' searches (e.g., 'created OR modified in last 7 days' → set logic:'OR' on first item). Use single search_notes call instead of multiple separate searches. IMPORTANT: For date properties (dateCreated, dateModified, dateCreatedUtc, dateModifiedUtc), you MUST use exact ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ). DO NOT use smart expressions like 'TODAY-7' or 'MONTH-1'.",
      items: {
        type: "object",
        properties: {
          property: {
            type: "string",
            enum: ["isArchived", "isProtected", "type", "title", "content", "dateCreated", "dateModified", "dateCreatedUtc", "dateModifiedUtc", "labelCount", "ownedLabelCount", "attributeCount", "relationCount", "parentCount", "childrenCount", "contentSize", "revisionCount"],
            description: "Note property name"
          },
          op: {
            type: "string",
            enum: ["=", "!=", ">", "<", ">=", "<=", "contains", "starts_with", "ends_with", "not_equal", "regex"],
            description: "Comparison operator. For title/content: use 'contains', 'starts_with', 'ends_with', 'not_equal'. For date properties: use '>=', '<=', '>', '<', '=', '!='. For other properties: use comparison operators.",
            default: "="
          },
          value: {
            type: "string",
            description: "Value to compare against. For date properties (dateCreated, dateModified, dateCreatedUtc, dateModifiedUtc): MUST use ISO date format only - either 'YYYY-MM-DD' (e.g., '2024-01-01') or full ISO datetime 'YYYY-MM-DDTHH:mm:ss.sssZ' (e.g., '2024-01-01T00:00:00.000Z'). For title/content: any string value. For boolean properties: 'true' or 'false'. For numeric properties: numeric string (e.g., '5', '10')."
          },
          logic: {
            type: "string",
            enum: ["AND", "OR"],
            description: "Logic operator to combine with next property. REQUIRED: Always specify 'AND' or 'OR' for every item. The system will automatically ignore logic on the last item (no next item to combine with).",
            default: "AND"
          }
        },
        required: ["property", "value", "logic"]
      }
    },
    limit: {
      type: "number",
      description: "Maximum number of results to return",
    },
    hierarchyType: {
      type: "string",
      enum: ["children", "descendants"],
      description: "Hierarchy navigation: 'descendants' lists ALL notes recursively (like Unix 'find') - PREFERRED for 'list all notes' requests. 'children' lists direct children only (like Unix 'ls') - use for browsing specific folders. Requires parentNoteId parameter."
    },
    parentNoteId: {
      type: "string", 
      description: "Parent note ID for hierarchy searches. Use 'root' for top-level. Only used when hierarchyType is specified.",
      default: "root"
    },
  };
}

/**
 * Generate all tools based on permissions
 */
export function generateTools(permissionChecker: PermissionChecker): any[] {
  const tools: any[] = [];

  // Add write tools if WRITE permission
  if (permissionChecker.hasPermission("WRITE")) {
    tools.push(...createWriteTools());
  }

  // Add read tools if READ permission  
  if (permissionChecker.hasPermission("READ")) {
    tools.push(...createReadTools());
  }

  return tools;
}