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
            enum: ["text", "code", "mermaid", "canvas", "file", "image", "search", "book", "relationMap", "render"],
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
      description: "Complete content replacement with automatic backup. Ideal for major restructuring, complete rewrites, or final document organization after iterative building with append_note. SAFE: Creates revision backup by default (revision=true). WORKFLOW: Often used after building content with append_note when restructuring is needed.",
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
      description: "Append content without overwriting existing text. Perfect for iterative building (logs, drafts, sections). WORKFLOW: Build content incrementally, then use update_note for major restructuring when needed. Performance optimized with revision=false by default.",
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
      description: "Resolves a note/folder name to its actual note ID for use with other tools. You MUST call this function when users provide note names instead of note IDs (e.g., 'wqd7006', 'My Project') UNLESS the user explicitly provides a note ID. Simple title-based search with user choice when multiple matches found.",
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
          },
          autoSelect: {
            type: "boolean",
            description: "When multiple matches found: true = auto-select best match (current behavior), false = stop and ask user to choose from alternatives (default: false for better user experience)",
            default: false
          }
        },
        required: ["noteName"],
      },
    },
    {
      name: "search_notes",
      description: "Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation through unified searchCriteria structure. CRITICAL: When users want to search for 'docker OR kubernetes' or similar boolean logic, DO NOT use text parameter - instead use searchCriteria with fulltext type: [{property: 'fulltext', type: 'fulltext', value: 'docker', logic: 'OR'}, {property: 'fulltext', type: 'fulltext', value: 'kubernetes'}]. The 'text' parameter only supports single terms or exact phrases without boolean operators. IMPORTANT: The logic parameter connects the current item TO the next item - use logic:'OR' on the FIRST item when you want OR logic between items. For template search: use relation type with 'template.title' property and built-in template values like 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'Table', 'Geo Map'. For note type search: use noteProperty type with 'type' property and values like 'text', 'code', 'mermaid', 'canvas', 'book', 'image', 'file', 'search', 'relationMap', 'render'. For MIME type search: use noteProperty type with 'mime' property and MIME values like 'text/javascript', 'text/x-python', 'text/vnd.mermaid', 'application/json'. Use hierarchy properties like 'parents.noteId', 'children.noteId', or 'ancestors.noteId' for navigation.",
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
      description: "Simple keyword search for single terms or exact phrases (e.g., 'kubernetes', 'machine learning'). NEVER use for boolean logic like 'docker OR kubernetes' - this will search for the literal phrase 'docker OR kubernetes' instead of either term. For multiple term searches with OR/AND logic, use searchCriteria with type 'fulltext' instead: [{property: 'fulltext', type: 'fulltext', value: 'docker', logic: 'OR'}, {property: 'fulltext', type: 'fulltext', value: 'kubernetes'}]. Note: logic parameter connects current item TO next item.",
    },
    searchCriteria: {
      type: "array",
      description: "Unified search criteria array that supports all search types with complete boolean logic. Enables cross-type OR operations (e.g., 'relation OR dateCreated' searches). Supports labels, relations, note properties (including hierarchy navigation: parents.title, children.title, ancestors.title), note type filtering, MIME type filtering, and keyword searches with per-item logic control. Use OR logic between items for 'either/or' searches across ANY criteria types. Examples: Find mermaid diagrams: [{property: 'type', type: 'noteProperty', op: '=', value: 'mermaid'}]. Find JavaScript code: [{property: 'type', type: 'noteProperty', op: '=', value: 'code'}, {property: 'mime', type: 'noteProperty', op: '=', value: 'text/javascript', logic: 'AND'}]. Find canvas OR mermaid notes: [{property: 'type', type: 'noteProperty', op: '=', value: 'canvas', logic: 'OR'}, {property: 'type', type: 'noteProperty', op: '=', value: 'mermaid'}]. CRITICAL: logic parameter connects current item TO next item.",
      items: {
        type: "object",
        properties: {
          property: {
            type: "string",
            description: "Property name. For labels: tag name (e.g., 'book', 'author'). For relations: relation name with optional property path (e.g., 'author', 'author.title', 'template.title'). Built-in templates: use 'template.title' with values 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'Table', 'Geo Map'. For note properties: system property name (e.g., 'isArchived', 'type', 'mime', 'title', 'content', 'dateCreated') OR hierarchy properties (e.g., 'parents.title', 'children.title', 'ancestors.title', 'parents.parents.title'). For fulltext: use 'fulltext'."
          },
          type: {
            type: "string",
            enum: ["label", "relation", "noteProperty", "fulltext"],
            description: "Type of search criteria: 'label' for #tags, 'relation' for ~relations, 'noteProperty' for note.* system properties and hierarchy navigation, 'fulltext' for keyword search tokens"
          },
          op: {
            type: "string",
            enum: ["exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with", "regex"],
            description: "Operator: 'exists' for presence checks, comparison operators for values, string operators for text fields. For fulltext type: operator is ignored.",
            default: "exists"
          },
          value: {
            type: "string",
            description: "Value to compare against (optional for exists operator). For built-in template relations: use 'Calendar' (calendar notes), 'Board' (task boards), 'Text Snippet' (text snippets), 'Grid View' (grid layouts), 'Table' (table views), 'Geo Map' (geography maps). For note type property: use note types like 'text' (rich text), 'code' (code with syntax highlighting), 'mermaid' (Mermaid diagrams), 'canvas' (Excalidraw drawings), 'book' (folders/containers), 'image' (images), 'file' (attachments), 'search' (saved searches), 'relationMap' (relation maps), 'render' (render notes). For note MIME property: use MIME types like 'text/javascript', 'text/x-python', 'text/x-java', 'text/css', 'text/html', 'text/x-typescript', 'text/x-sql', 'text/x-yaml', 'text/x-markdown', 'text/vnd.mermaid', 'application/json'. For noteProperty dates (dateCreated, dateModified): MUST use ISO date format - 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. For hierarchy navigation: parent/ancestor note title or 'root' for top-level. For fulltext type: the search token."
          },
          logic: {
            type: "string",
            enum: ["AND", "OR"],
            description: "Logic operator connecting this item to the NEXT item in the array. Think sequentially: each item's logic determines how it combines with the following item. For 'A OR B AND C' expressions, use OR on first item, AND on second item. For simple 'A OR B' use OR on first item only. Default AND creates standard conjunctions. System ignores logic on the final array item.",
            default: "AND"
          }
        },
        required: ["property", "type", "logic"]
      }
    },
    limit: {
      type: "number",
      description: "Maximum number of results to return",
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