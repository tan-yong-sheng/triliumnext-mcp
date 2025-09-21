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
      description: "Create a new note in TriliumNext with duplicate title detection. When a note with the same title already exists in the same directory, you'll be presented with choices: skip creation or update the existing note. Use for 'create a new note called', 'make a new note in', 'create a code note for'. ⚠️ **PARENT FOLDER SELECTION**: If user references a parent folder by name (e.g., 'create meeting note in Projects folder') and there are multiple folders with that name, ALWAYS use resolve_note_id first to find the exact parent note ID and let user choose the correct location. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes. Supports note types: 'text' (rich text), 'code' (syntax highlighting), 'mermaid' (diagrams), 'book' (folders), 'render' (HTML/JS). TIP: For code notes, content is plain text (no HTML processing).",
      inputSchema: {
        type: "object",
        properties: {
          parentNoteId: {
            type: "string",
            description: "ID of the parent note. Use for 'create a new note called', 'make a new note in', 'create a code note for'. ⚠️ CRITICAL: If you have multiple folders/notes with identical names (e.g., multiple 'Projects' folders, multiple 'Grid View' notes), you MUST use the exact note ID - do NOT guess or auto-select! When multiple potential parents exist, the system will detect conflicts and ask you to choose the specific parent note ID.\n\n🔍 **FINDING PARENT NOTE ID**: Use resolve_note_id to find the exact note ID when you only know the folder name. Example: resolve_note_id({noteName: 'Projects'}) will return the note ID and show alternatives if multiple matches exist.\n\n📋 **PARENT NOTE REQUIREMENTS**:\n• RENDER parents: child must be type='code', mime='text/html' (HTML content for rendering)\n• CALENDAR parents: child must have #startDate, #endDate, #startTime, #endTime labels\n• BOARD parents: child must have #status label (e.g., 'To Do', 'In Progress', 'Done')\n• Missing required labels/relations will cause child notes to not display properly\n\n⚠️ **MULTIPLE PARENTS WITH SAME NAME**: When users say 'put note under Projects folder' but there are multiple 'Projects' folders, ALWAYS use resolve_note_id first to let users choose the correct parent, then use the returned note ID for parentNoteId.",
            default: "root"
          },
          title: {
            type: "string",
            description: "Title of the note",
          },
          type: {
            type: "string",
            enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView"],
            description: "Type of note (aligned with TriliumNext ETAPI specification). Use for 'create a new note called', 'make a new note in', 'create a code note for'. ⚠️ SPECIAL TYPES REQUIRE CHILD NOTES:\n• RENDER: Creates empty container - requires child HTML code note with ~renderNote relation\n• CALENDAR (template): Creates empty container - requires child notes with date/time labels\n• BOARD (template): Creates empty container - requires child notes with #status labels\n• All other types can contain content directly",
          },
          content: {
            type: "string",
            description: "Content of the note (optional). Use for 'create a new note called', 'make a new note in', 'create a code note for'. Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ OMIT CONTENT for: 1) WEBVIEW notes (use #webViewSrc label instead), 2) Container templates (Board, Calendar, Grid View, List View, Table, Geo Map), 3) SYSTEM notes: RENDER, SEARCH, RELATION_MAP, NOTE_MAP, BOOK - these must be EMPTY to work properly. When omitted, note will be created with empty content.\n\n📋 WORKFLOW FOR SPECIAL NOTE TYPES:\n• RENDER notes: Create empty → create child HTML code note → add ~renderNote relation to child\n• CALENDAR/BOARD/GRID/LIST/TABLE/GEO templates: Create empty with ~template relation → add child notes with proper labels\n• TEXT SNIPPET templates: Create with ~template relation + content\n• Most other types: Add content directly during creation",
          },
          mime: {
            type: "string",
            description: "MIME type for code/file/image notes",
          },
          attributes: {
            type: "array",
            description: "Optional attributes to create with the note (labels and relations). Use for 'add a label with value', 'tag this note as', 'apply the template to', 'create an author relation pointing to'. Enables one-step note creation with metadata. ⚠️ CRITICAL: Always add template relations during create_note when possible!\n\n📋 TEMPLATE RELATIONS (add during create_note):\n• ~template = 'Board' (kanban task boards)\n• ~template = 'Calendar' (calendar event displays)\n• ~template = 'Grid View' (grid layouts)\n• ~template = 'List View' (list layouts)\n• ~template = 'Table' (table structures)\n• ~template = 'Geo Map' (geographic maps)\n• ~template = 'Text Snippet' (reusable text)\n\n⚠️ SPECIAL CASES requiring separate steps:\n• ~renderNote = '<noteId>' (RENDER notes - requires existing child note ID)\n• Custom relations pointing to specific notes (use note IDs after creation)\n\n📋 LABELS & OTHER RELATIONS:\n• Labels: #tag format (e.g., #important, #project)\n• Relations: ~connection format (e.g., ~author, ~publisher)\n• Template relations use human-readable names (auto-translated to system IDs)\n\n⚠️ TEMPLATE RESTRICTIONS: Container templates MUST be book note type with empty content - add content as child notes",
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
          },
        },
        required: ["parentNoteId", "title", "type"],
      },
    },
    {
      name: "update_note",
      description: "Update note with support for title-only updates, content operations, note type changes, and MIME type updates. Use for 'update my project plan with', 'replace the content of', 'rewrite this note with', 'add today's progress to', 'append this meeting summary to', 'add this code snippet to'. ⚠️ **CRITICAL: ONLY use this tool when the user explicitly requests note modification** (e.g., 'update the note', 'change the content', 'modify the title', 'edit this note'). DO NOT use this tool proactively or make assumptions about what should be updated. ⚠️ REQUIRED: ALWAYS call get_note first to obtain current hash and validate current note type. MODE SELECTION: Use 'append' when adding content, 'overwrite' when replacing content, or title-only for efficient title changes. TYPE CHANGES: Convert between note types (e.g., 'text' to 'code') with automatic validation for template compatibility and content requirements. MIME UPDATES: Change content type for code notes (e.g., JavaScript to Python). PREVENTS: Overwriting changes made by other users (hash mismatch) or invalid type conversions. WORKFLOW: get_note → review current state → update_note with hash",
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
            description: "NEW: Change note type with validation (e.g., convert 'text' to 'code' note). Use for 'update my project plan with', 'rewrite this note with'. ⚠️ IMPORTANT: Type changes are validated for template compatibility - notes with ~template='Board' must remain type='book', ~template='Calendar' must remain type='book', etc. Content compatibility is also validated (e.g., HTML content may not be suitable for code notes). Use this when converting between different note formats (e.g., changing a text note to a code note for better syntax highlighting, or converting a generic note to a Mermaid diagram). Optional - omit if not changing note type."
          },
          mime: {
            type: "string",
            description: "Update MIME type for code notes (e.g., change 'application/typescript' to 'text/x-python'). Use for 'update my project plan with', 'rewrite this note with'. Only valid for code-type notes. Use this when switching programming languages or content types. Optional - omit if not changing MIME type."
          },
          content: {
            type: "string",
            description: "Content of the note. Use for 'update my project plan with', 'replace the content of', 'rewrite this note with', 'add today's progress to', 'append this meeting summary to', 'add this code snippet to'. Content requirements by note type: TEXT notes require HTML content (plain text auto-wrapped in <p> tags, e.g., '<p>Hello world</p>', '<strong>bold</strong>'); CODE/MERMAID notes require plain text ONLY (HTML tags rejected, e.g., 'def fibonacci(n):'); ⚠️ SYSTEM NOTES MUST REMAIN EMPTY: RENDER (HTML handled by note type), SEARCH (queries in search properties), RELATION_MAP (visual maps), NOTE_MAP (visual hierarchies), BOOK (container notes), WEBVIEW (use #webViewSrc label); IMPORTANT: When updating notes with template relations (Board, Calendar, Grid View, List View, Table, Geo Map), the note must remain EMPTY - these templates provide specialized layouts and content should be added as child notes instead."
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
            description: "⚠️ REQUIRED: Content update mode. Use for 'update my project plan with', 'replace the content of', 'rewrite this note with', 'add today's progress to', 'append this meeting summary to', 'add this code snippet to'. CRITICAL: Choose based on user intent: 'append' = add/insert content while preserving existing content (use for 'add to', 'append', 'insert', 'add more', 'continue writing'); 'overwrite' = completely replace all existing content (use for 'replace', 'overwrite', 'update all', 'completely replace'). Default behavior is not available - you MUST explicitly choose."
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
      description: "Search and replace content within a single note. Use for 'replace all occurrences of', 'find and fix typos', 'update all instances of', 'replace old phone numbers with', 'change all dates from', 'update broken image links', 'find and replace'. First call get_note to get current content and hash, then make changes. Supports regex patterns with capture groups. PREVENTS: Overwriting changes made by others via hash validation.",
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
      description: "Get a note and its content by ID. Use for 'show me the content of', 'what's in my', 'extract all URLs from', 'find all email addresses in', 'extract phone numbers from', 'get all dates mentioned in', 'search for specific patterns in'. Perfect for content analysis, extraction tasks, or preparing for search and replace operations. Supports regex pattern matching for information extraction. Getting full content enables accurate analysis and pattern matching.",
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
      description: "🔎 **SMART SEARCH with two distinct approaches**: Choose wisely based on what the user is looking for:\n\n📝 **Simple content discovery?** Use 'text' parameter for broad searches across both title AND content when users say general things like 'find notes containing docker' or 'search for kubernetes'.\n\n🎯 **Specific targeting or listing?** Use 'searchCriteria' when users specify WHERE to search ('in title', 'in content'), need complex logic ('docker OR kubernetes'), want to list all notes ('show me all notes', 'list notes under folder'), filter by properties ('notes created in 2024', 'archived notes'), hierarchy navigation ('notes under Projects folder', 'children of this note'), note types ('find all code notes', 'show me book notes'), template searches ('find Board notes', 'Calendar notes'), or any criteria-based searches.\n\n✨ **POWERFUL CAPABILITIES**: Field-specific searches (title-only, content-only), date ranges, regex patterns, boolean logic, label/attribute filtering, template searches, hierarchy navigation (parents.title, ancestors.noteId), note type filtering, and MIME type searches.\n\n📋 **IMPORTANT USAGE GUIDANCE**:\n• Use 'text' for: 'find notes containing', 'search for', 'show me notes about'\n• Use 'searchCriteria' for: 'show me all notes', 'list notes under', 'notes created in', 'find all code notes', 'notes under Projects'\n• For listing all notes: use searchCriteria with 'exists' operator on any property like 'noteId'\n• For complex boolean logic: always use searchCriteria with AND/OR operators\n\n🗺️ **HIERARCHY NAVIGATION**:\n• Direct children: parents.noteId / parents.title\n• All descendants: ancestors.noteId / ancestors.title\n• Parent finding: children.noteId / children.title",
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
      description: "🔍 **BROAD SEARCH across both title and content** - Think of this as asking 'find me anything related to X' without caring which field it appears in. Perfect for simple discovery when you want to cast a wide net. Examples: 'project' (finds notes with 'project' in title OR content), 'meeting notes' (finds notes containing both words together anywhere), '\"quarterly report\"' (finds exact phrase in title or content). Use for 'find notes containing', 'search for', 'show me notes about'. ⚠️ **AVOID THIS when users specify WHERE to search** - if they say 'in the title', 'in the content', 'title containing', or need regex patterns, use searchCriteria instead for precise field targeting. Does NOT support boolean operators like OR/AND/NOT.",
    },
    searchCriteria: {
      type: "array",
      description: "Precise field-specific searches. REQUIRED for: 'show me all notes', 'list notes under folder', 'notes created in 2024', 'find all code notes', 'archived notes', 'notes under Projects', 'children of this note', 'Board template notes', 'Calendar notes'. Supports operators: 'contains', 'starts_with', 'ends_with', '=', '!=', '>', '<', '>=', '<=', 'exists', 'regex'. Boolean logic: 'AND'/'OR'. Search properties: 'title', 'content', 'type', 'mime', 'dateCreated', 'dateModified', 'isArchived', 'parents.title', 'ancestors.title', 'template.title'. Labels: '#important', '#project', '#status'. Relations: '~author', '~template'. Hierarchy navigation: 'parents.title', 'ancestors.title'. Note types: 'text', 'code', 'mermaid', 'book'. MIME types: 'application/typescript', 'text/x-python'. Templates: 'Board', 'Calendar', 'Text Snippet'.",
      items: {
        type: "object",
        properties: {
          property: {
            type: "string",
            description: "Property name. For labels: tag names like 'important', 'project', 'status'. For relations: relation names with paths like 'author', 'template.title', 'publisher'. For note properties: system properties like 'title', 'content', 'type', 'mime', 'dateCreated', 'dateModified', 'isArchived', 'labelCount', 'parentCount', 'childrenCount'. For hierarchy: 'parents.title', 'ancestors.title', 'children.noteId'. Use 'template.title' for built-in templates: 'Board', 'Calendar', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'."
          },
          type: {
            type: "string",
            enum: ["label", "relation", "noteProperty"],
            description: "Type of search criteria: 'label' for #tags, 'relation' for ~relations, 'noteProperty' for note.* system properties and hierarchy navigation"
          },
          op: {
            type: "string",
            enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with", "regex"],
            description: "Search operator: 'exists' (has property), 'contains' (partial text match), 'starts_with' (title starts with), 'ends_with' (title ends with), '=' (exact match), '!=' (not equal), '>' (greater than), '<' (less than), '>=' (greater or equal), '<=' (less or equal), 'regex' (pattern matching). Default: 'exists'.",
            default: "exists"
          },
          value: {
            type: "string",
            description: "Value to match (optional for 'exists' operator). Use: template names ('Board', 'Calendar', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'), note types ('text', 'code', 'mermaid', 'book', 'render'), MIME types ('application/typescript', 'text/x-python', 'text/x-java', 'text/css', 'text/html', 'text/x-sql', 'text/x-yaml', 'text/vnd.mermaid'), ISO dates ('2024-01-01T00:00:00.000Z'), label values ('In Progress', 'High', 'Website Redesign'), relation targets (note titles or IDs)."
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
      description: "Read all attributes (labels #tags and relations ~template) for a note. Use for 'show me all attributes on', 'what labels and relations are attached to', 'list all tags and metadata for'. View existing labels (#important, #project), template relations (~template), author relations (~author), publisher relations (~publisher). Provides read-only access to inspect current attributes assigned to any note. Returns structured data with labels, relations, and summary information.",
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
      description: "Create, update, or delete note attributes (labels #tags and relations ~template). Use for 'add a label with value', 'tag this note as', 'add a label with value', 'create a label with value', 'apply the template to', 'set this note to use the template', 'make this note use the template', 'create an author relation pointing to', 'set up a publisher relation for', 'add a template relation using', 'create a series relation connecting', 'change the status label from to', 'update the priority label to', 'modify the project label value to', 'change the template relation to', 'add multiple tags at once', 'create several labels for', 'set up multiple template relations', 'remove the label from', 'delete the old status attribute', 'remove the template relation'. ⚠️ PRIORITY: Add template relations during create_note when possible. Use this for post-creation changes or complex scenarios. Supports batch operations. UPDATE LIMITATIONS: Labels: value/position only. Relations: position only. Use read_attributes to view existing attributes.",
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