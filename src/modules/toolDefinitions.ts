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
      description: "Create a new note in TriliumNext with duplicate title detection. When a note with the same title already exists in the same directory, you'll be presented with choices: skip creation, create anyway (with forceCreate: true), or update the existing note. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes. TIP: For code notes, content is plain text (no HTML processing).",
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
          content: {
            type: "string",
            description: "Content of the note (optional). Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ OMIT CONTENT for: 1) FILE notes (binary content uploaded separately via fileUri parameter), 2) WEBVIEW notes (use #webViewSrc label instead), 3) Container templates (Board, Calendar, Grid View, List View, Table, Geo Map), 4) System notes: RENDER (create child HTML note with type='code' and mime='application/x-html', then link with ~renderNote relation), SEARCH (queries in search properties), RELATION_MAP (visual maps), NOTE_MAP (visual hierarchies), BOOK (container notes) - these must be EMPTY to work properly. When omitted, note will be created with empty content."
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "file", "image"],
            description: "Type of note (aligned with TriliumNext ETAPI specification). For file uploads: Use 'image' for Images (JPG/JPEG/PNG/WebP), 'file' for Documents & Audio (PDF/DOCX/MP3/WAV/M4A). Other types: 'text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView'.",
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes. For file uploads, auto-detected from file extension when not specified. Supported: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/mpeg, audio/wav, audio/mp4, image/jpg, image/png, image/webp"
          },
          fileUri: {
            type: "string",
            description: "File data source (required when type='file' or type='image'). Supports: 1) Local file path: '/path/to/document.pdf', 2) Base64 data URI: 'data:application/pdf;base64,JVBERi0xLjcK...', 3) Raw base64 string. Supports PDF, DOCX, PPTX, XLSX, CSV, MP3, WAV, M4A, JPG, JPEG, PNG, WebP formats. File will be uploaded via Trilium's two-step process: create note metadata, then upload binary content."
          },
          attributes: {
            type: "array",
            description: "Optional attributes to create with the note (labels and relations). Enables one-step note creation with metadata. Labels use #tag format (e.g., 'important', 'project'), relations connect to other notes (e.g., template relations use 'Board', 'Calendar', 'Text Snippet'). ⚠️ TEMPLATE RESTRICTIONS: Container templates (Board, Calendar, Grid View, List View, Table, Geo Map) MUST be empty notes - add content as child notes.",
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
          forceCreate: {
            type: "boolean",
            description: "Bypass duplicate title check and create note even if a note with the same title already exists in the same directory. Use this when you want to intentionally create duplicate notes.",
            default: false
          },
        },
        required: ["parentNoteId", "title", "type"],
      },
    },
    {
      name: "update_note",
      description: "Update note with support for title-only updates, content overwrite, content append, or file replacement. ⚠️ REQUIRED: ALWAYS call get_note first to obtain current hash. ⚠️ SIMPLER RULES: Note type and MIME type are IMMUTABLE - cannot be changed after creation. MODE SELECTION: Use 'append' when user wants to add/insert content (e.g., 'append to note', 'add to the end', 'insert content', 'add more content', 'continue writing', 'add to bottom'). Use 'overwrite' when replacing entire content (e.g., 'replace content', 'overwrite note', 'update the whole note', 'completely replace'). TITLE-ONLY: Efficient title changes without content modification. FILE UPDATES: Replace file content only with SAME file type (image→image, file→file). To change file types, create a new note instead. PREVENTS: Type mismatches, file type conflicts, and overwriting changes made by other users. ONLY use when user explicitly requests note update. WORKFLOW: get_note → review content → update_note with returned hash",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to update"
          },
          title: {
            type: "string",
            description: "New title for the note. If provided alone (without content), performs efficient title-only update without affecting note content or blobId."
          },
          content: {
            type: "string",
            description: "Content of the note. Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ SYSTEM NOTES MUST REMAIN EMPTY: RENDER (HTML handled by note type), SEARCH (queries in search properties), RELATION_MAP (visual maps), NOTE_MAP (visual hierarchies), BOOK (container notes), WEBVIEW (use #webViewSrc label); IMPORTANT: When updating notes with template relations (Board, Calendar, Grid View, List View, Table, Geo Map), the note must remain EMPTY - these templates provide specialized layouts and content should be added as child notes instead."
          },
          fileUri: {
            type: "string",
            description: "File data source for file/image note updates. Replaces the existing file content with new file data. ⚠️ FILE TYPE MUST MATCH: The new file must have the same type as the current note (image files for image notes, other files for file notes). Supports: 1) Local file path: '/path/to/new_document.pdf', 2) Base64 data URI: 'data:application/pdf;base64,JVBERi0xLjcK...', 3) Raw base64 string. To change file types, create a new note instead."
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
            description: "Content update mode. REQUIRED when updating content for text/code notes, optional for file-only updates. CRITICAL: Choose based on user intent: 'append' = add/insert content while preserving existing content (use for 'add to', 'append', 'insert', 'add more', 'continue writing'); 'overwrite' = completely replace all existing content (use for 'replace', 'overwrite', 'update all', 'completely replace'). Default behavior is not available - you MUST explicitly choose when updating content."
          }
        },
        required: ["noteId", "expectedHash"]
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
      description: "Get a note and its content by ID. Perfect for when someone wants to see what's in a note, extract specific information, or prepare for search and replace operations. Getting the full content lets you see the context and create better regex patterns for extraction or replacement. ⚠️ SMART CONTENT INCLUSION: For file/image notes, binary content is automatically excluded by default for performance. Use includeBinaryContent: true to explicitly retrieve binary data when needed.",
      inputSchema: {
        type: "object",
        properties: {
          noteId: {
            type: "string",
            description: "ID of the note to retrieve",
          },
          includeContent: {
            type: "boolean",
            description: "Whether to include note content (default: true). For file/image notes, this excludes binary content by default - use includeBinaryContent to retrieve binary data.",
            default: true
          },
          includeBinaryContent: {
            type: "boolean",
            description: "Whether to include binary content for file/image notes (default: false). Set to true only when you need the actual binary data (e.g., for file downloads). Otherwise, keep false for faster responses.",
            default: false
          },
          searchPattern: {
            type: "string",
            description: "Optional pattern to search for within the note. Use when you need to find specific text or extract information. Note: Search is not available for file/image notes unless includeBinaryContent is true.",
          },
          useRegex: {
            type: "boolean",
            description: "Whether to use regex patterns (default: true).",
            default: true
          },
          searchFlags: {
            type: "string",
            description: "Search options. Defaults to 'gi' (find all matches, case-insensitive).",
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
      description: "Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation through unified searchCriteria structure. For simple keyword searches, use the 'text' parameter. For complex boolean logic like 'docker OR kubernetes', use searchCriteria with proper OR logic. For template search: use relation type with 'template.title' property and built-in template values like 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'. For note type search: use noteProperty type with 'type' property and values from the 9 supported ETAPI types: 'text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView'. For MIME type search: use noteProperty type with 'mime' property and MIME values like 'text/javascript', 'text/x-python', 'text/vnd.mermaid', 'application/json'. Use hierarchy properties like 'parents.noteId', 'children.noteId', or 'ancestors.noteId' for navigation.",
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
      description: "Unified search criteria array that supports all search types with complete boolean logic. Enables cross-type OR operations (e.g., 'relation OR dateCreated' searches). Supports labels, relations, note properties (including hierarchy navigation: parents.title, children.title, ancestors.title), note type filtering, MIME type filtering, and keyword searches. For keyword searches: use noteProperty type with 'title' or 'content' properties. Operators include existence checks (exists, not_exists), comparisons (=, !=, >=, <=, >, <), and text matching (contains, starts_with, ends_with, regex). Use OR logic between items for 'either/or' searches across ANY criteria types. Examples: Find mermaid diagrams by setting type property to 'mermaid'. Find JavaScript code by combining type 'code' with mime 'text/javascript'. Find mermaid notes by using OR logic between type criteria. Logic parameter connects current item to next item.",
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
            description: "Value to compare against (optional for exists operator). For built-in template relations: use 'Calendar' (calendar notes), 'Board' (task boards), 'Text Snippet' (text snippets), 'Grid View' (grid layouts), 'List View' (list layouts), 'Table' (table views), 'Geo Map' (geography maps). For note type property: use ETAPI-aligned note types: 'text' (rich text), 'code' (code with syntax highlighting), 'render' (rendered content), 'search' (saved searches), 'relationMap' (relation maps), 'book' (folders/containers), 'noteMap' (note relationship maps), 'mermaid' (Mermaid diagrams), 'webView' (web content embedding). For note MIME property: use MIME types like 'text/javascript', 'text/x-python', 'text/x-java', 'text/css', 'text/html', 'text/x-typescript', 'text/x-sql', 'text/x-yaml', 'text/x-markdown', 'text/vnd.mermaid', 'application/json'. For noteProperty dates (dateCreated, dateModified): MUST use ISO date format - 'YYYY-MM-DDTHH:mm:ss.sssZ'. For hierarchy navigation: parent/ancestor note title or 'root' for top-level."
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