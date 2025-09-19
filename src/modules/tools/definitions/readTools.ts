/**
 * Read Operation Tool Definitions
 * Defines schemas for read-only tools (GET, SEARCH, LIST operations)
 */

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
      description: "Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation through unified searchCriteria structure. For simple keyword searches, use the 'text' parameter. For complex boolean logic like 'docker OR kubernetes', use searchCriteria with proper OR logic. For template search: use relation type with 'template.title' property and built-in template values like 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'. For note type search: use noteProperty type with 'type' property and values from the 9 supported ETAPI types: 'text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView'. For MIME type search: use noteProperty type with 'mime' property and MIME values like 'text/javascript', 'text/x-python', 'text/vnd.mermaid', 'application/json'. Use hierarchy properties like 'parents.noteId', 'children.noteId', or 'ancestors.noteId' for navigation.",
      inputSchema: {
        type: "object",
        properties: searchProperties,
      },
    }
  ];
}