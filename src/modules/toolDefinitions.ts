/**
 * Tool Definition Module
 * Centralized tool schema definitions based on permissions
 */

import { PermissionChecker } from '../utils/permissionUtils.js';

/**
 * Generate write operation tools (CREATE, UPDATE, DELETE operations)
 */
export function createWriteTools(): any[] {
  return [
    {
      name: "create_note",
      description: "Create a new note in TriliumNext. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes. TIP: For code notes, content is plain text (no HTML processing).",
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
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "shortcut", "doc", "contentWidget", "launcher"],
            description: "Type of note (aligned with TriliumNext ETAPI specification)",
          },
          content: {
            type: "array",
            description: "Content of the note as ContentItem array. Content requirements by note type: TEXT NOTES - require HTML content (wrap plain text in <p> tags, e.g., '<p>hello world</p>'); CODE/MERMAID NOTES - require plain text (no HTML tags); BOOK/SEARCH NOTES - can be empty string. Use HTML formatting for text notes: <p> for paragraphs, <strong> for bold, <em> for italic, etc.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["text", "data-url"],
                  description: "Content type: 'text' for HTML content (text notes require HTML formatting), 'data-url' for embedded data"
                },
                content: {
                  type: "string",
                  description: "HTML content for text notes (e.g., '<p>hello world</p>', '<strong>bold text</strong>'), plain text for code/mermaid notes"
                },
                mimeType: {
                  type: "string",
                  description: "MIME type for code notes (e.g., 'text/x-javascript', 'text/x-python', 'text/x-typescript'). Helps with syntax highlighting."
                }
              },
              required: ["type", "content"]
            }
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes",
          },
          attributes: {
            type: "array",
            description: "Optional attributes to create with the note (labels and relations). Enables one-step note creation with metadata. Labels use #tag format (e.g., 'important', 'project'), relations connect to other notes (e.g., template relations use 'Board', 'Calendar', 'Text Snippet').",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["label", "relation"],
                  description: "Attribute type: 'label' for #tags, 'relation' for ~connections"
                },
                name: {
                  type: "string",
                  description: "Attribute name: for labels use descriptive tags, for relations use connection types (e.g., 'template', 'author')"
                },
                value: {
                  type: "string",
                  description: "Attribute value: optional for labels (e.g., 'In Progress'), required for relations (e.g., 'Board', 'Calendar', target note IDs/titles)"
                },
                position: {
                  type: "number",
                  description: "Display position (lower numbers appear first, default: 10)",
                  default: 10
                },
                isInheritable: {
                  type: "boolean",
                  description: "Whether attribute is inherited by child notes (default: false)",
                  default: false
                }
              },
              required: ["type", "name"]
            }
          },
        },
        required: ["parentNoteId", "title", "type", "content"],
      },
    },
    {
      name: "update_note",
      description: "Complete content replacement with hash-based concurrency control and content type validation. ⚠️ REQUIRED: ALWAYS call get_note first to obtain current hash and note type. The system will reject updates without a valid hash to ensure data integrity. Prevents overwriting changes made by other users (hash mismatch) or content that doesn't match note type requirements. ONLY use this tool when the user explicitly requests note update (e.g., 'update the note', 'replace the content', 'rewrite this note'). IDEAL FOR: Major restructuring, complete rewrites, or final document organization after iterative building with append_note. SAFE: Creates revision backup by default (revision=true). WORKFLOW: get_note → review content → update_note with returned hash",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to update"
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "shortcut", "doc", "contentWidget", "launcher"],
            description: "Type of note (aligned with TriliumNext ETAPI specification). This determines content validation requirements."
          },
          content: {
            type: "array",
            description: "Content of the note as ContentItem array. Content requirements by note type: TEXT NOTES - require HTML content (wrap plain text in <p> tags, e.g., '<p>hello world</p>'); CODE/MERMAID NOTES - require plain text (no HTML tags); BOOK/SEARCH NOTES - can be empty string. Use HTML formatting for text notes: <p> for paragraphs, <strong> for bold, <em> for italic, etc.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["text", "data-url"],
                  description: "Content type: 'text' for smart format detection (HTML/Markdown/plain), 'data-url' for embedded data"
                },
                content: {
                  type: "string",
                  description: "Content data - for text type: automatically detected as HTML/Markdown/plain; for file/image: base64 encoded; for url/data-url: URL string"
                },
                mimeType: {
                  type: "string",
                  description: "MIME type for file/image content (e.g., 'image/png', 'application/pdf')"
                },
                filename: {
                  type: "string",
                  description: "Filename for file/image content"
                }
              },
              required: ["type", "content"]
            }
          },
          expectedHash: {
            type: "string",
            description: "⚠️ REQUIRED: Blob ID (content hash) from get_note response. This is Trilium's built-in content identifier that ensures data integrity by verifying the note hasn't been modified since you retrieved it. If you see an error about missing blobId, you MUST call get_note first to get the current blobId."
          },
          revision: {
            type: "boolean",
            description: "Whether to create a revision before updating (default: true for safety)",
            default: true
          }
        },
        required: ["noteId", "type", "content", "expectedHash"]
      }
    },
    {
      name: "append_note",
      description: "Append content without overwriting existing text. ONLY use this tool when the user explicitly requests content addition (e.g., 'add to the note', 'append this text', 'add this to my notes'). TRY NOT to use this tool proactively unless building content incrementally as part of a clear workflow. Perfect for iterative building (logs, drafts, sections). WORKFLOW: Build content incrementally, then use update_note for major restructuring when needed. Performance optimized with revision=false by default.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to append content to"
          },
          content: {
            type: "array",
            description: "Content to append as ContentItem array. Content requirements vary by note type: text/render/webView use smart format detection (HTML/Markdown/plain), code/mermaid require plain text, file/image require base64 encoded data.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["text", "data-url"],
                  description: "Content type: 'text' for smart format detection (HTML/Markdown/plain), 'data-url' for embedded data"
                },
                content: {
                  type: "string",
                  description: "Content data - for text type: automatically detected as HTML/Markdown/plain; for file/image: base64 encoded; for url/data-url: URL string"
                },
                mimeType: {
                  type: "string",
                  description: "MIME type for file/image content (e.g., 'image/png', 'application/pdf')"
                },
                filename: {
                  type: "string",
                  description: "Filename for file/image content"
                }
              },
              required: ["type", "content"]
            }
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
      description: "Delete a note permanently. ONLY use this tool when the user explicitly requests note deletion (e.g., 'delete the note', 'remove this note', 'delete this permanently'). TRY NOT to use this tool proactively or for automated cleanup. CAUTION: This action cannot be undone and will permanently remove the note and all its content.",
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
      description: "Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation through unified searchCriteria structure. For simple keyword searches, use the 'text' parameter. For complex boolean logic like 'docker OR kubernetes', use searchCriteria with proper OR logic. For template search: use relation type with 'template.title' property and built-in template values like 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'. For note type search: use noteProperty type with 'type' property and values from the 15 supported ETAPI types: 'text', 'code', 'render', 'file', 'image', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView', 'shortcut', 'doc', 'contentWidget', 'launcher'. For MIME type search: use noteProperty type with 'mime' property and MIME values like 'text/javascript', 'text/x-python', 'text/vnd.mermaid', 'application/json'. Use hierarchy properties like 'parents.noteId', 'children.noteId', or 'ancestors.noteId' for navigation.",
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
      description: "SIMPLE keyword search ONLY - single terms or exact phrases. Examples: 'kubernetes' (finds notes containing 'kubernetes'), 'machine learning' (finds notes containing both 'machine' AND 'learning' together), '\"docker kubernetes\"' (finds notes containing the exact phrase 'docker kubernetes'). ⚠️ WARNING: This parameter does NOT support boolean operators like OR, AND, NOT. If you use 'docker OR kubernetes', it will search for the literal text 'docker OR kubernetes' and return no results. For any boolean logic (OR, AND, NOT), you MUST use searchCriteria parameter instead.",
    },
    searchCriteria: {
      type: "array",
      description: "Unified search criteria array that supports all search types with complete boolean logic. Enables cross-type OR operations (e.g., 'relation OR dateCreated' searches). Supports labels, relations, note properties (including hierarchy navigation: parents.title, children.title, ancestors.title), note type filtering, MIME type filtering, and keyword searches. For keyword searches: use noteProperty type with 'title' or 'content' properties. Operators include existence checks (exists, not_exists), comparisons (=, !=, >=, <=, >, <), and text matching (contains, starts_with, ends_with, regex). Use OR logic between items for 'either/or' searches across ANY criteria types. Examples: Find mermaid diagrams by setting type property to 'mermaid'. Find JavaScript code by combining type 'code' with mime 'text/javascript'. Find canvas OR mermaid notes by using OR logic between type criteria. Logic parameter connects current item to next item.",
      items: {
        type: "object",
        properties: {
          property: {
            type: "string",
            description: "Property name. For labels: tag name (e.g., 'book', 'author'). For relations: relation name with optional property path (e.g., 'author', 'author.title', 'template.title'). Built-in templates: use 'template.title' with values 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'. For note properties: system property name (e.g., 'isArchived', 'type', 'mime', 'title', 'content', 'dateCreated') OR hierarchy properties (e.g., 'parents.title', 'children.title', 'ancestors.title', 'parents.parents.title')."
          },
          type: {
            type: "string",
            enum: ["label", "relation", "noteProperty"],
            description: "Type of search criteria: 'label' for #tags, 'relation' for ~relations, 'noteProperty' for note.* system properties and hierarchy navigation"
          },
          op: {
            type: "string",
            enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with", "regex"],
            description: "Search operator for property matching and comparison. Use 'exists' to find notes with a property, 'not_exists' to find notes without the property at all, '=' for exact matches, '!=' to find notes that have the property but excluding specific values, '>=' and '<=' for ranges, and text operators like 'contains' for partial matches.",
            default: "exists"
          },
          value: {
            type: "string",
            description: "Value to compare against (optional for exists operator). For built-in template relations: use 'Calendar' (calendar notes), 'Board' (task boards), 'Text Snippet' (text snippets), 'Grid View' (grid layouts), 'List View' (list layouts), 'Table' (table views), 'Geo Map' (geography maps). For note type property: use ETAPI-aligned note types: 'text' (rich text), 'code' (code with syntax highlighting), 'render' (rendered content), 'file' (attachments), 'image' (images), 'search' (saved searches), 'relationMap' (relation maps), 'book' (folders/containers), 'noteMap' (note relationship maps), 'mermaid' (Mermaid diagrams), 'webView' (web content embedding), 'shortcut' (navigation shortcuts), 'doc' (document containers), 'contentWidget' (interactive widgets), 'launcher' (application launchers). For note MIME property: use MIME types like 'text/javascript', 'text/x-python', 'text/x-java', 'text/css', 'text/html', 'text/x-typescript', 'text/x-sql', 'text/x-yaml', 'text/x-markdown', 'text/vnd.mermaid', 'application/json'. For noteProperty dates (dateCreated, dateModified): MUST use ISO date format - 'YYYY-MM-DDTHH:mm:ss.sssZ'. For hierarchy navigation: parent/ancestor note title or 'root' for top-level."
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
      description: "Manage note attributes with write operations (create, update, delete). Create labels (#tags), template relations (~template), update existing attributes, and organize notes with metadata. IMPORTANT: This tool only provides write access - use read_attributes to view existing attributes. Relations require values pointing to existing notes (e.g., template relations use 'Board', 'Calendar'; author relations use target note titles or IDs). UPDATE LIMITATIONS: For labels, only value and position can be updated. For relations, only position can be updated. The isInheritable property cannot be changed via update - delete and recreate to modify inheritability. Supports single operations and efficient batch creation for better performance.",
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
            description: "Operation type: 'create' (new attribute), 'update' (modify existing - limited to label value/position and relation position only), 'delete' (remove attribute), 'batch_create' (multiple new attributes efficiently)"
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
                  description: "Attribute value: REQUIRED for relations (relations must point to existing notes - use template names like 'Board', 'Calendar', 'Text Snippet' or target note IDs/titles like 'Tolkien' or 'abc123def'), optional for labels (e.g., status labels like 'In Progress', priority labels like 'High'). Relations always need values since they connect notes together."
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