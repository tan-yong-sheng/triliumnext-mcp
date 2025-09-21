/**
 * Tool Definition Module
 * Centralized tool schema definitions based on permissions
 */

import { PermissionChecker } from '../../modules/utils/system/permissionUtils.js';

/**
 * Generate write operation tools (CREATE, UPDATE, DELETE operations)
 */
export function createWriteTools(): any[] {
  return [
    {
      name: "create_note",
      description: "Create a new note with duplicate detection. For parent folder conflicts: use resolve_note_id first to get exact parent note ID. ONLY use when user explicitly requests note creation. TIP: Code notes use plain text content.",
      inputSchema: {
        type: "object",
        properties: {
          parentNoteId: {
            type: "string",
            description: "Parent note ID (use resolve_note_id when folder names conflict). ⚠️ CRITICAL: Use exact note ID for duplicate names. PARENT REQUIREMENTS: RENDER needs HTML code child, CALENDAR/BOARD need specific labels for proper display.",
            default: "root"
          },
          title: {
            type: "string",
            description: "Title of the note",
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView"],
            description: "Note type (ETAPI-aligned). ⚠️ SPECIAL: RENDER/CALENDAR/BOARD create empty containers requiring child notes with specific relations/labels.",
          },
          content: {
            type: "string",
            description: "Note content (optional). TEXT: HTML format (plain text wrapped in <p> tags). CODE/MERMAID: plain text only. ⚠️ OMIT for WEBVIEW (use #webViewSrc) and container templates (RENDER, BOARD, CALENDAR).",
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes",
          },
          attributes: {
            type: "array",
            description: "Optional labels (#tags) and relations (~template) to create with note. ⚠️ Add template relations during creation when possible. Templates: 'Board', 'Calendar', 'Text Snippet', etc.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["label", "relation"],
                  description: "Attribute type: 'label' (#tags) or 'relation' (~connections)"
                },
                name: {
                  type: "string",
                  description: "Attribute name: tags for labels, connection types for relations"
                },
                value: {
                  type: "string",
                  description: "Attribute value: optional for labels, required for relations (template names or note IDs)"
                },
                position: {
                  type: "number",
                  description: "Display position (lower first, default: 10)",
                  default: 10
                },
                isInheritable: {
                  type: "boolean",
                  description: "Inherited by child notes (default: false)",
                  default: false
                }
              },
              required: ["type", "name"]
            }
          },
        },
        required: ["parentNoteId", "title", "type"],
      },
    },
    {
      name: "update_note",
      description: "Update note content, title, type, or MIME type. ⚠️ CRITICAL: ONLY use when user explicitly requests modification. ⚠️ REQUIRED: Call get_note first to get current hash. Choose 'append' to add content or 'overwrite' to replace all content. Supports type conversion with validation. PREVENTS: Data loss from concurrent edits via hash validation.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to update"
          },
          title: {
            type: "string",
            description: "New title for the note. If provided alone (without content, type, or mime), performs efficient title-only update without affecting note content or blobId."
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView"],
            description: "Change note type with validation (e.g., 'text' to 'code'). ⚠️ Template compatibility checked. Optional - omit if not changing type."
          },
          mime: {
            type: "string",
            description: "Update MIME type for code notes (e.g., 'application/typescript' to 'text/x-python'). Optional - omit if not changing MIME type."
          },
          content: {
            type: "string",
            description: "Note content. TEXT: HTML format. CODE/MERMAID: plain text only. ⚠️ Keep EMPTY for container templates (RENDER, BOARD, CALENDAR, WEBVIEW)."
          },
          expectedHash: {
            type: "string",
            description: "⚠️ REQUIRED: Blob ID (content hash) from get_note response. This is Trilium's built-in content identifier that ensures data integrity by verifying the note hasn't been modified since you retrieved it. If you see an error about missing blobId, you MUST call get_note first to get the current blobId."
          },
          revision: {
            type: "boolean",
            description: "Whether to create a revision before updating (default: true for safety, title-only updates skip revision for efficiency)",
            default: true
          },
          mode: {
            type: "string",
            enum: ["overwrite", "append"],
            description: "⚠️ REQUIRED: 'append' to add content, 'overwrite' to replace all content. Choose based on user intent."
          }
        },
        required: ["noteId", "expectedHash", "mode"]
      }
    },
    {
      name: "delete_note",
      description: "Delete a note permanently. ⚠️ **CRITICAL: ONLY use this tool when the user explicitly requests note deletion** (e.g., 'delete the note', 'remove this note', 'delete this permanently', 'get rid of this note'). DO NOT use this tool proactively, for automated cleanup, or make assumptions about what should be deleted. CAUTION: This action cannot be undone and will permanently remove the note and all its content.",
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
      name: "search_and_replace_note",
      description: "Search and replace content within a single note. When someone wants to replace text in a note, first call get_note to get the current content and hash, then use this function to make the changes. This ensures you're working with the latest version of their note.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to perform search and replace on"
          },
          searchPattern: {
            type: "string",
            description: "What to search for in the note.",
          },
          replacePattern: {
            type: "string",
            description: "What to replace it with. For regex: supports patterns like '$1' for captured groups.",
          },
          useRegex: {
            type: "boolean",
            description: "Whether to use regex patterns (default: true).",
            default: true
          },
          searchFlags: {
            type: "string",
            description: "Search options. Defaults to 'gi' (global, case-insensitive). Remove 'i' for exact case matching.",
            default: "gi"
          },
          expectedHash: {
            type: "string",
            description: "⚠️ REQUIRED: Content hash from get_note response. Always get the note content first to obtain this hash.",
          },
          revision: {
            type: "boolean",
            description: "Whether to create a backup before replacing (default: true for safety).",
            default: true
          }
        },
        required: ["noteId", "searchPattern", "replacePattern", "expectedHash"]
      }
    },
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
      description: "Get a note and its content by ID. Perfect for when someone wants to see what's in a note, extract specific information, or prepare for search and replace operations. Getting the full content lets you see the context and extract information accurately. For extracting information from multiple notes: use search_notes to find relevant notes, then use get_note (with useRegex=false for LLM analysis, or useRegex=true for simple pattern matching).",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to retrieve",
          },
          searchPattern: {
            type: "string",
            description: "Optional pattern to search for within the note. ⚠️ IMPORTANT: When users request to extract specific types of information (URLs, emails, dates, code snippets, etc.), automatically generate appropriate regex patterns based on the extraction request. Use useRegex=true for pattern matching and searchFlags='gi' for comprehensive results.",
          },
          useRegex: {
            type: "boolean",
            description: "Whether to use regex patterns for searchPattern. Set to true for simple pattern matching, or false to let LLM read and analyze full content for more accurate extraction (recommended for complex cases like URLs, emails with context).",
            default: false
          },
          searchFlags: {
            type: "string",
            description: "Search options. Defaults to 'gi' (find all matches, case-insensitive). Use 'gi' for comprehensive extraction of all patterns.",
            default: "gi"
          },
        },
        required: ["noteId"],
      }
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
            description: "Maximum number of results to return in topMatches array (default: 10)",
            default: 10,
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
      description: "Search notes with two approaches: Use 'text' for broad searches across title AND content (e.g., 'project', 'meeting notes'). Use 'searchCriteria' for field-specific searches when users specify WHERE to search ('in title', 'in content'), need regex patterns, or want complex logic. For listing all notes: use searchCriteria with 'exists' operator on any property like 'noteId'. Supports label/attribute filtering, template searches, hierarchy navigation, and boolean logic.",
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
      description: "Broad search across both title and content. Use for simple discovery like 'project' or 'meeting notes'. ⚠️ CANNOT BE EMPTY - must provide search terms. Use searchCriteria instead for field-specific searches or when users specify 'in title', 'in content'. Does not support boolean operators.",
    },
    searchCriteria: {
      type: "array",
      description: "Field-specific searches for precise targeting. Use when users specify WHERE to search ('in title', 'in content'), need regex patterns, or want complex logic. Supports operators (contains, regex, exists), boolean logic (AND/OR), labels (#tags), relations (~connections), hierarchy navigation (parents.title, ancestors.noteId), note types, and MIME types.",
      items: {
        type: "object",
        properties: {
          property: {
            type: "string",
            description: "Property name: label names (e.g., 'book'), relation names with paths (e.g., 'template.title'), or note properties (e.g., 'title', 'type', 'dateCreated'). Use 'template.title' for built-in templates like 'Board', 'Calendar'."
          },
          type: {
            type: "string",
            enum: ["label", "relation", "noteProperty"],
            description: "Type of search criteria: 'label' for #tags, 'relation' for ~relations, 'noteProperty' for note.* system properties and hierarchy navigation"
          },
          op: {
            type: "string",
            enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with", "regex"],
            description: "Search operator: 'exists' (has property), 'contains' (partial match), '=' (exact match), 'regex' (pattern match). Default: 'exists'.",
            default: "exists"
          },
          value: {
            type: "string",
            description: "Value to match (optional for 'exists' operator). Use template names ('Board', 'Calendar'), note types ('text', 'code'), MIME types ('text/x-python'), or ISO dates for dateCreated/dateModified."
          },
          logic: {
            type: "string",
            enum: ["AND", "OR"],
            description: "Logic operator connecting to next item: 'AND' (default) for intersection, 'OR' for union. Use 'OR' on first item for 'A OR B AND C' patterns.",
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
      description: "Create, update, or delete note attributes (labels #tags and relations ~template). ⚠️ PRIORITY: Add template relations during create_note when possible. Use this for post-creation changes or complex scenarios. Supports batch operations. UPDATE LIMITATIONS: Labels: value/position only. Relations: position only. Use read_attributes to view existing attributes.",
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

  // Add read attribute tools if READ permission
  if (permissionChecker.hasPermission("READ")) {
    tools.push(...createReadAttributeTools());
  }

  // Add write attribute tools if WRITE permission
  if (permissionChecker.hasPermission("WRITE")) {
    tools.push(...createWriteAttributeTools());
  }

  return tools;
}