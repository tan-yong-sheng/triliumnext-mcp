/**
 * Write Operation Tool Definitions
 * Defines schemas for write-only tools (create, update, delete operations)
 */

/**
 * Generate write operation tools (CREATE, UPDATE, DELETE operations)
 */
export function createWriteTools(): any[] {
  return [
    {
      name: "create_note",
      description: "Create a new note in TriliumNext with duplicate title detection. When a note with the same title already exists in the same directory, you'll be presented with choices: skip creation or update the existing note. ⚠️ **PARENT FOLDER SELECTION**: If user references a parent folder by name (e.g., 'create meeting note in Projects folder') and there are multiple folders with that name, ALWAYS use resolve_note_id first to find the exact parent note ID and let user choose the correct location. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes. TIP: For code notes, content is plain text (no HTML processing).",
      inputSchema: {
        type: "object",
        properties: {
          parentNoteId: {
            type: "string",
            description: "ID of the parent note. ⚠️ CRITICAL: If you have multiple folders/notes with identical names (e.g., multiple 'Projects' folders, multiple 'Grid View' notes), you MUST use the exact note ID - do NOT guess or auto-select! When multiple potential parents exist, the system will detect conflicts and ask you to choose the specific parent note ID.\n\n🔍 **FINDING PARENT NOTE ID**: Use resolve_note_id to find the exact note ID when you only know the folder name. Example: resolve_note_id({noteName: 'Projects'}) will return the note ID and show alternatives if multiple matches exist.\n\n📋 **PARENT NOTE REQUIREMENTS**:\n• RENDER parents: child must be type='code', mime='text/html' (HTML content for rendering)\n• CALENDAR parents: child must have #startDate, #endDate, #startTime, #endTime labels\n• BOARD parents: child must have #status label (e.g., 'To Do', 'In Progress', 'Done')\n• Missing required labels/relations will cause child notes to not display properly\n\n⚠️ **MULTIPLE PARENTS WITH SAME NAME**: When users say 'put note under Projects folder' but there are multiple 'Projects' folders, ALWAYS use resolve_note_id first to let users choose the correct parent, then use the returned note ID for parentNoteId.",
            default: "root"
          },
          title: {
            type: "string",
            description: "Title of the note",
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView"],
            description: "Type of note (aligned with TriliumNext ETAPI specification). ⚠️ SPECIAL TYPES REQUIRE CHILD NOTES:\n• RENDER: Creates empty container - requires child HTML code note with ~renderNote relation\n• CALENDAR (template): Creates empty container - requires child notes with date/time labels\n• BOARD (template): Creates empty container - requires child notes with #status labels\n• All other types can contain content directly",
          },
          content: {
            type: "string",
            description: "Content of the note (optional). Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ OMIT CONTENT for: 1) WEBVIEW notes (use #webViewSrc label instead), 2) Container templates (Board, Calendar, Grid View, List View, Table, Geo Map), 3) SYSTEM notes: RENDER, SEARCH, RELATION_MAP, NOTE_MAP, BOOK - these must be EMPTY to work properly. When omitted, note will be created with empty content.\n\n📋 WORKFLOW FOR SPECIAL NOTE TYPES:\n• RENDER notes: Create empty → create child HTML code note → add ~renderNote relation to child\n• CALENDAR/BOARD/GRID/LIST/TABLE/GEO templates: Create empty with ~template relation → add child notes with proper labels\n• TEXT SNIPPET templates: Create with ~template relation + content\n• Most other types: Add content directly during creation"
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes",
          },
          attributes: {
            type: "array",
            description: "Optional attributes to create with the note (labels and relations). Enables one-step note creation with metadata. ⚠️ CRITICAL: Always add template relations during create_note when possible!\n\n📋 TEMPLATE RELATIONS (add during create_note):\n• ~template = 'Board' (kanban task boards)\n• ~template = 'Calendar' (calendar event displays)\n• ~template = 'Grid View' (grid layouts)\n• ~template = 'List View' (list layouts)\n• ~template = 'Table' (table structures)\n• ~template = 'Geo Map' (geographic maps)\n• ~template = 'Text Snippet' (reusable text)\n\n⚠️ SPECIAL CASES requiring separate steps:\n• ~renderNote = '<noteId>' (RENDER notes - requires existing child note ID)\n• Custom relations pointing to specific notes (use note IDs after creation)\n\n📋 LABELS & OTHER RELATIONS:\n• Labels: #tag format (e.g., #important, #project)\n• Relations: ~connection format (e.g., ~author, ~publisher)\n• Template relations use human-readable names (auto-translated to system IDs)\n\n⚠️ TEMPLATE RESTRICTIONS: Container templates MUST be book note type with empty content - add content as child notes",
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
        required: ["parentNoteId", "title", "type"],
      },
    },
    {
      name: "update_note",
      description: "Update note with support for title-only updates, content operations, note type changes, and MIME type updates. ⚠️ REQUIRED: ALWAYS call get_note first to obtain current hash and validate current note type. MODE SELECTION: Use 'append' when adding content, 'overwrite' when replacing content, or title-only for efficient title changes. TYPE CHANGES: Convert between note types (e.g., 'text' to 'code') with automatic validation for template compatibility and content requirements. MIME UPDATES: Change content type for code notes (e.g., JavaScript to Python). PREVENTS: Overwriting changes made by other users (hash mismatch) or invalid type conversions. WORKFLOW: get_note → review current state → update_note with hash",
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
            description: "NEW: Change note type with validation (e.g., convert 'text' to 'code' note). ⚠️ IMPORTANT: Type changes are validated for template compatibility - notes with ~template='Board' must remain type='book', ~template='Calendar' must remain type='book', etc. Content compatibility is also validated (e.g., HTML content may not be suitable for code notes). Use this when converting between different note formats (e.g., changing a text note to a code note for better syntax highlighting, or converting a generic note to a Mermaid diagram). Optional - omit if not changing note type."
          },
          mime: {
            type: "string",
            description: "NEW: Update MIME type for code notes (e.g., change 'application/typescript' to 'text/x-python'). Only valid for code-type notes. Use this when switching programming languages or content types. Optional - omit if not changing MIME type."
          },
          content: {
            type: "string",
            description: "Content of the note. Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ SYSTEM NOTES MUST REMAIN EMPTY: RENDER (HTML handled by note type), SEARCH (queries in search properties), RELATION_MAP (visual maps), NOTE_MAP (visual hierarchies), BOOK (container notes), WEBVIEW (use #webViewSrc label); IMPORTANT: When updating notes with template relations (Board, Calendar, Grid View, List View, Table, Geo Map), the note must remain EMPTY - these templates provide specialized layouts and content should be added as child notes instead."
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
            description: "⚠️ REQUIRED: Content update mode. CRITICAL: Choose based on user intent: 'append' = add/insert content while preserving existing content (use for 'add to', 'append', 'insert', 'add more', 'continue writing'); 'overwrite' = completely replace all existing content (use for 'replace', 'overwrite', 'update all', 'completely replace'). Default behavior is not available - you MUST explicitly choose."
          }
        },
        required: ["noteId", "expectedHash", "mode"]
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