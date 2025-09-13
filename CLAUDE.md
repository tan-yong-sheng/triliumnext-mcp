# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for TriliumNext Notes that provides tools to interact with Trilium Notes instances through the MCP framework. The server allows AI assistants to search, read, create, update, and delete notes in TriliumNext through its External API (ETAPI).

## Key Architecture

### Modular Structure (Refactored from Monolithic)
- **Main Server**: `src/index.ts` - Lightweight MCP server setup (~150 lines, down from 1400+)
- **Business Logic Modules**: `src/modules/` - Core functionality separated by domain:
  - `noteManager.ts` - Note creation, update, append, delete, and retrieval
  - `searchManager.ts` - Core search operations with hierarchy navigation support
  - `resolveManager.ts` - Note ID resolution with simple title-based search
- **Request Handlers**: `src/modules/` - MCP request/response processing:
  - `noteHandler.ts` - Note tool request handling with permission validation
  - `searchHandler.ts` - Search tool request handling with permission validation
  - `resolveHandler.ts` - Resolve note ID request handling with permission validation
- **Schema Definitions**: `src/modules/` - Tool schema generation:
  - `toolDefinitions.ts` - Permission-based tool schema generation and definitions
- **Utility Modules**: `src/modules/` - Specialized helper functions:
  - `searchQueryBuilder.ts` - Builds Trilium search query strings from structured parameters
  - `contentProcessor.ts` - Markdown detection and HTML conversion
  - `noteFormatter.ts` - Output formatting for note listings
  - `responseUtils.ts` - Debug info and response formatting utilities

### MCP Tool Architecture
- **Permission-based tools**: READ vs WRITE permissions control available tools
- **Unified search architecture**:
  - `search_notes` function with comprehensive filtering through unified `searchCriteria` structure including hierarchy navigation
- **Critical Trilium syntax handling**: OR queries with parentheses require `~` prefix per Trilium parser requirements
- **Modular design patterns**: Separation of concerns with Manager (business logic) → Handler (request processing) → Tool Definition (schemas)

## Environment Variables

Required environment variables for operation:
- `TRILIUM_API_TOKEN` (required): Authentication token from TriliumNext settings
- `TRILIUM_API_URL` (optional): API endpoint, defaults to `http://localhost:8080/etapi`
- `PERMISSIONS` (optional): Semicolon-separated permissions, defaults to `READ;WRITE`
- `VERBOSE` (optional): Debug logging, defaults to `false`

## Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript and set executable permissions
npm run prepare        # Same as build (runs on npm install)
npm run watch          # Watch mode for development
```

### Testing and Debugging
```bash
npm run inspector      # Run MCP inspector for testing tools
```

### Development Setup
```bash
npm install            # Install dependencies
npm run build         # Build the project
node build/index.js   # Run the server directly
```

## MCP Tools Available

### READ Permission Tools
- `search_notes`: Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, and hierarchy navigation through unified `searchCriteria` structure. Supports unlimited nesting depth for hierarchy properties (e.g., `parents.noteId`, `children.children.title`, `ancestors.noteId`).
- `resolve_note_id`: Find note ID by name/title - use when users provide note names (like "wqd7006") instead of IDs. Essential for LLM workflows where users reference notes by name. Features:
  - **Smart fuzzy search**: `exactMatch` parameter (default: false) controls search precision - fuzzy search handles typos and partial matches while prioritizing exact matches
  - **Configurable results**: `maxResults` parameter (default: 3, range: 1-10) controls number of alternatives returned
  - **User choice control**: `autoSelect` parameter (default: false) - when false, stops and asks user to choose from alternatives when multiple matches found; when true, uses intelligent auto-selection
  - **Simple prioritization**: Exact title matches → Folder-type notes → Most recent
  - **JSON response format**: Returns structured data with selectedNote, totalMatches, topMatches array, and nextSteps guidance
  - **Multiple match handling**: When `totalMatches > 1` and `autoSelect=false`, presents numbered list of options and asks user to choose
- `get_note`: Retrieve note content by ID

### WRITE Permission Tools
- `create_note`: Create new notes with various types (text, code, file, image, etc.)
- `update_note`: Update existing note content with revision control (defaults to revision=true for safety)
- `append_note`: Add content to existing notes without replacement (defaults to revision=false for performance)
- `delete_note`: Delete notes by ID (permanent operation with caution warnings)

## Search Query Architecture

### Unified Search System
- **Unified search architecture**:
  - `search_notes`: Comprehensive search with unified `searchCriteria` structure including hierarchy navigation support
- **Smart fastSearch logic**: Automatically uses `fastSearch=true` ONLY when ONLY text parameter is provided (no searchCriteria or limit), `fastSearch=false` for all other scenarios
- **FastSearch compatibility**: TriliumNext's fastSearch mode does not support `limit` clauses - these automatically disable fastSearch

### Query Builder System
- **Structured → DSL**: `searchQueryBuilder.ts` converts JSON parameters to Trilium search strings
- **Critical fix**: OR queries with parentheses automatically get `~` prefix (required by Trilium parser)
- **Field operators**: `*=*` (contains), `=*` (starts with), `*=` (ends with), `!=` (not equal), `%=` (regex)
- **Documentation**: `docs/search-query-examples.md` contains 30+ examples with JSON structure for all parameters

### Development Guidelines for Search Functions

**CRITICAL RULE: `search_notes` Parameter Immutability**

⚠️ **NEVER modify the parameters of the existing `search_notes` function** when creating new MCP functions that build on top of it. This includes:

- **Do NOT add new parameters** to `search_notes` interface
- **Do NOT remove existing parameters** from `search_notes`
- **Do NOT modify existing parameter types** or behavior

**Allowed modifications to `search_notes`:**
- ✅ **Direct capability enhancements**: Adding new core search functionality (e.g., regex search, advanced operators)
- ✅ **Bug fixes**: Correcting existing parameter behavior
- ✅ **Performance improvements**: Optimizing existing functionality

**When building new functions (like `resolve_note_id`):**
- ✅ **Create wrapper functions** with their own parameters
- ✅ **Use internal logic** to transform parameters before calling `search_notes`
- ✅ **Add filters via existing parameters** (`noteProperties`, `filters`, etc.)
- ✅ **Implement custom sorting/filtering** in the wrapper function

**Example of CORRECT approach** (`resolve_note_id`):
```typescript
// ✅ CORRECT: New function with own parameters
function handleResolveNoteId(args: ResolveNoteOperation) {
  // Internal logic to build search_notes parameters
  const searchParams: SearchOperation = {
    noteProperties: [{ property: "title", op: "contains", value: args.noteName }]
  };
  // Call search_notes with existing interface
  return handleSearchNotes(searchParams, axiosInstance);
}

```

**Example of INCORRECT approach**:
```typescript
// ❌ WRONG: Adding new parameter to search_notes
interface SearchOperation {
  // ... existing parameters
  // ❌ Don't add parameters to existing search_notes interface
}
```

This ensures backward compatibility and prevents breaking changes to the core search functionality.

### Trilium Search DSL Integration
- **Parent-child queries**: Uses `note.parents.title = 'parentName'` for direct children
- **Ancestor queries**: Uses `note.ancestors.title = 'ancestorName'` for all descendants
- **Date filtering**: Supports created/modified date ranges with proper AND/OR logic
- **Ordering validation**: orderBy fields must also be present in filters

## Note Types Supported

- `text`: Regular text notes
- `code`: Code notes with syntax highlighting
- `file`: File attachments
- `image`: Image notes
- `search`: Search notes
- `book`: Book/folder notes
- `relationMap`: Relation map notes
- `render`: Render notes
- `canvas`: Canvas notes (application/json)
- `mermaid`: Mermaid diagram notes (text/vnd.mermaid)
- `mindMap`: Mind map notes (application/json)

### Template-Based Note Types

TriliumNext supports specialized note types through templates:

- **Calendar Notes**: `type: book` + `~template=Calendar`
- **Task Board Notes**: `type: book` + `~template=Board`
- **Text Snippet Notes**: `type: text` + `~template=Text Snippet`

**Note**: For template-based searches, use the `search_notes` function with template criteria rather than `resolve_note_id`.

## Content Processing

The server includes automatic Markdown detection and conversion:
- Detects likely Markdown content using heuristics
- Converts Markdown to HTML using the `marked` library
- Falls back to original content if parsing fails

## API Integration

Uses TriliumNext's External API (ETAPI) with endpoints defined in `openapi.yaml`:
- Authentication via Authorization header
- JSON request/response format
- RESTful API design following OpenAPI 3.0.3 specification
- Parent note filtering automatically applied to avoid showing parent in children/descendant lists

## Important Implementation Notes

### Search Query Bugs Fixed
- **OR parentheses**: Trilium requires `~` prefix for expressions starting with parentheses
- **Root handling**: Special handling for `parentNoteId="root"` in ancestor/parent queries
- **Universal search**: Uses `note.noteId != ''` as universal match condition for ETAPI
- **Hierarchy navigation**: Full support for hierarchy properties (`parents.noteId`, `children.title`, `ancestors.noteId`) with unlimited nesting depth

### Tool Selection Guidelines - When to Use search_notes vs resolve_note_id

**Use `search_notes` when:**
- **Searching for content/topic**: "search calendar note" → find notes about calendars
- **Multiple results expected**: "find project notes" → list all project-related notes
- **Complex filtering needed**: "search notes modified this week with #important tag"
- **Exploring/discovering**: user wants to see what's available
- **Ambiguous intent**: when unclear if user wants search or specific note resolution

**Use `resolve_note_id` when:**
- **Identifying specific note**: "find the note called 'Meeting Notes'" → get exact note ID
- **Single target expected**: user refers to a specific note by name/title
- **Follow-up operations**: need note ID for get_note, update_note, etc.
- **Reference resolution**: converting human-readable name to system ID

**Fallback Strategy**: `resolve_note_id` provides fallback suggestions when no matches found, recommending `search_notes` for broader content-based searches.

### Tool Descriptions Optimized for LLM Selection
- `search_notes`: Unified search with comprehensive filtering capabilities through searchCriteria structure - handles both complex search operations and simple hierarchy navigation
- `resolve_note_id` provides simple title-based resolution: resolve name → get ID → use with other tools (eliminates confusion when users provide note names instead of IDs)

## Content Modification Tools Strategy

### Revision Control Behavior
- **`update_note`**: Defaults to `revision=true` (safe behavior) - creates backup before complete content replacement
- **`append_note`**: Defaults to `revision=false` (performance behavior) - efficient for frequent additions like logs/journals
- **Risk-based defaults**: High-impact operations (complete replacement) default to safety, low-impact operations (append) default to efficiency

### Content Operation Guidelines
- Use `append_note` for adding content while preserving existing content (logs, journals, incremental updates)
- Use `update_note` for complete content replacement (rewrites, major edits)
- Both functions support explicit revision control override via `revision` parameter
- `delete_note` includes strong caution warnings as it's irreversible

## Field-Specific Search Implementation

### Unified noteProperties Approach
- **Architectural design**: Field-specific searches for `title` and `content` integrated into `noteProperties` parameter  
- **Supported operators**: `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=), `regex` (%=)
- **Known limitation**: `not_contains` (does not contain) is not reliably supported in Trilium's search DSL
- **OR logic support**: Full per-item logic support for title/content searches via `logic: "OR"` parameter
- **Consistent API**: Same interface pattern as system properties (note.isArchived, note.type, etc.)

### Enhanced Integration Benefits
- **Single parameter**: No distinction needed between field searches and property searches
- **Unified OR logic**: Same logic pattern works across all noteProperties (system + content)
- **Query optimization**: Consistent query building for all note.* properties
- **Documentation consistency**: All examples use the same noteProperties structure

## Note Properties Search Support

### Enhanced Note Properties Support
- **Boolean properties**: `isArchived`, `isProtected` - support `=`, `!=` operators with `"true"`/`"false"` values
- **String properties**: `type` - support all operators with string values
- **Content properties**: `title`, `content` - support field-specific operators (`contains`, `starts_with`, `ends_with`, `not_equal`, `regex`)
- **Date properties**: `dateCreated`, `dateModified` - support comparison operators (`>=`, `<=`, `>`, `<`, `=`, `!=`) with ISO date strings and smart date expressions
- **Numeric properties**: `labelCount`, `ownedLabelCount`, `attributeCount`, `relationCount`, `parentCount`, `childrenCount`, `contentSize`, `revisionCount` - support numeric comparisons (`>`, `<`, `>=`, `<=`, `=`, `!=`) with unquoted numeric values
- **Automatic type handling**: Query builder properly handles boolean, string, content, date, and numeric value formatting
- **Smart date expressions**: Support TriliumNext native syntax like `TODAY-7`, `MONTH-1`, `YEAR+1` for dynamic date queries
- **Examples**: `note.labelCount > 5`, `note.type = 'text'`, `note.isArchived = true`, `note.title *=* 'project'`, `note.content =* 'introduction'`, `note.dateCreated >= 'TODAY-7'`

## Attribute OR Logic Support

### Clean Two-Parameter Approach - AND Logic Default Aligned with TriliumNext
- **`attributes` parameter**: For Trilium user-defined metadata (`#book`, `~author.title`)
  - **Labels**: `#book`, `#author` - user-defined tags and categories  
  - **Relations**: `~author.title *= 'Tolkien'` - connections between notes (**IMPLEMENTED - UNTESTED**)
  - **Per-item logic**: Each attribute can specify `logic: "OR"` to combine with next attribute
  - **Default logic**: AND when not specified (matches TriliumNext behavior: `#book #publicationYear = 1954`)
  - **Trilium syntax**: Automatically handles proper `#` and `~` prefixes, OR grouping with `~(#book OR #author)`
- **`noteProperties` parameter**: For Trilium built-in note metadata (`note.isArchived`, `note.type`)
  - **System properties**: Built into every note - `note.isArchived`, `note.type`, `note.labelCount`
  - **Different namespace**: Always prefixed with `note.` in Trilium DSL  
  - **Per-item logic**: Each property can specify `logic: "OR"` to combine with next property
  - **Default logic**: AND when not specified (matches TriliumNext behavior: `note.type = 'text' AND note.isArchived = false`)
- **Conceptual clarity**: Matches Trilium's architectural separation between user metadata and system metadata
- **Edge case handling**: Auto-cleanup of logic on last items, AND default logic, proper grouping

## Recent Enhancements

### Template Name Correction
Corrected built-in TriliumNext template names for proper template searches:
- Updated template names from underscore-prefixed to human-readable format
- Fixed working syntax: `~template.title = 'Calendar'` instead of `~template.title = '_template_calendar'`
- Added support for all built-in templates: Calendar, Board, Text Snippet, Grid View, Table, Geo Map
- **Status**: ✅ **COMPLETED**

### Note Type and MIME Type Search
Added comprehensive search support for TriliumNext note types and MIME types:
- **Note types**: Support for all types (text, code, mermaid, canvas, book, image, file, search, relationMap, render)
- **MIME types**: Filtering for code languages (JavaScript, Python, TypeScript, CSS, HTML, SQL, YAML, etc.)
- **Validation**: Added type/MIME validation functions to prevent invalid searches
- **Integration**: Works with unified `searchCriteria` structure and boolean logic
- **Examples**: Find Mermaid diagrams, JavaScript code, visual notes, web development files
- **Status**: ✅ **COMPLETED**

### Tool Selection Guidelines
Clear guidelines for choosing between `search_notes` and `resolve_note_id`:
- **Use `search_notes`**: For content/topic search, multiple results, complex filtering, exploration, or ambiguous intent
- **Use `resolve_note_id`**: For specific note identification, single target resolution, follow-up operations, or reference resolution

**Fallback mechanism**: When `resolve_note_id` finds no matches, it suggests using `search_notes` for broader content-based searches.

**Status**: ✅ **COMPLETED**

### Resolve Note ID Separation
Separated `resolve_note_id` from `search_notes` with modular design:
- **Separate resolve module**: `src/modules/resolveManager.ts` with specialized note resolution logic
- **Dedicated resolve handler**: `src/modules/resolveHandler.ts` for resolve-specific request processing
- **Clean separation**: `search_notes` handles complex searches, `resolve_note_id` handles simple resolution
- **Title-based search**: Straightforward title matching with intelligent prioritization

**Status**: ✅ **COMPLETED**

### Simplified `resolve_note_id`
Title-based note resolution:
- **Simple search**: Uses `note.title contains 'searchTerm'` for fuzzy matching
- **Smart prioritization**: Exact title matches → Folder-type notes → Most recent
- **User choice workflow**: Configurable auto-selection vs user choice for multiple matches
- **Fast resolution**: Optimized for quick note identification

**Usage**:
- Simple: `resolve_note_id({noteName: "project"})`
- Exact matching: `resolve_note_id({noteName: "project", exactMatch: true})`
- User choice: `resolve_note_id({noteName: "project", autoSelect: false})`

**Status**: ✅ **COMPLETED**

### Unified Hierarchy Navigation
Hierarchy navigation through unified `searchCriteria` structure:
- **Properties**: `note.parents.title`, `note.children.title`, `note.ancestors.title`, `note.parents.parents.title`
- **Boolean logic**: Full OR/AND support with other search criteria
- **Cross-type queries**: Combine with labels, relations, and note properties
- **Unlimited nesting**: Deep hierarchy navigation support

### Unified Boolean Logic Architecture
Single-array `searchCriteria` structure:
- **Capabilities**: Cross-type OR logic, unified syntax, LLM-friendly structure
- **Format**: Unified object with property, type, operator, value, and logic fields
- **Example**: `~template.title = 'Grid View' OR note.dateCreated >= '2024-12-13'`
- **Status**: ⚠️ **DOCUMENTATION ONLY** - Code implementation pending

### MCP Protocol Compatibility
MCP protocol supports unified search architecture:
- **JSON Schema**: Native support across all MCP SDKs
- **Complex structures**: Perfect fit for unified `searchCriteria`
- **Boolean expressions**: Cross-type OR operations map directly to MCP
- **Multi-language**: Works identically across all MCP bindings

### Regex Search Support
Regex search capabilities:
- **TriliumNext integration**: Full `%=` operator support for attributes and note properties
- **Coverage**: Regex patterns for labels, relations, titles, and content
- **Mixed searches**: Combine regex with other search types
- **Status**: ✅ **IMPLEMENTED - UNTESTED**

### OrderBy Support Removal
Removed orderBy functionality for reliability:
- **Decision**: Eliminated structured orderBy to focus on core search functionality
- **Benefits**: Simplified query building, reduced edge cases, cleaner codebase
- **Future approach**: Simple string-based orderBy with direct TriliumNext syntax

### FastSearch Logic Fix
Fixed fastSearch detection bug:
- **Issue**: Missing `!args.limit` check caused incorrect fastSearch activation
- **Root cause**: TriliumNext fastSearch doesn’t support limit/orderBy clauses
- **Fix**: FastSearch only when ONLY text parameter provided
- **Impact**: Resolved empty results for queries like "n8n limit 5"

### Logic Default Alignment
Aligned default logic with TriliumNext:
- **Change**: Default from OR to AND for attributes and noteProperties
- **TriliumNext evidence**: `#book #publicationYear = 1954` demonstrates AND behavior
- **Benefits**: Multiple labels/relations use AND by default, explicit OR available
- **Backward compatibility**: All functionality preserved

### Relation Search
Comprehensive relation search support:
- **TriliumNext patterns**: `~author`, `~author.title`, `~author.relations.publisher.title`
- **Mixed searches**: Combine labels and relations with proper syntax (`#` vs `~` prefixes)
- **OR logic**: Compatible with existing per-item logic system
- **Operators**: Complete support including exists, comparison, and string operations
- **Status**: ✅ **IMPLEMENTED - UNTESTED**

### Date Parameter Unification
Unified date searches into `noteProperties` parameter:
- **TriliumNext integration**: Full support for `note.dateCreated` and `note.dateModified`
- **Smart expressions**: Native syntax support (`TODAY-7`, `MONTH-1`, `YEAR+1`)
- **OR logic**: Mix date searches with other properties
- **Simplified codebase**: Removed legacy date-specific query building

### Unified Search Architecture
Streamlined field-specific searches into `noteProperties`:
- **Single parameter**: Handles both system properties and content searches
- **Consistent OR logic**: Same pattern across all property types
- **Field operators**: Title/content support contains, starts_with, ends_with, regex
- **API simplification**: No distinction between search parameter types

### resolve_note_id User Choice
User choice capability for multiple matches:
- **autoSelect parameter**: Control behavior when multiple matches found (default: false)
- **User-friendly**: Numbered list with note details (title, type, ID, date)
- **Backward compatibility**: Existing usage patterns preserved
- **Usage**: Default shows choice list, `autoSelect=true` uses intelligent selection

### resolve_note_id Function
LLM-friendly note ID resolution:
- **Smart search**: Fuzzy matching with exact matches → folders → recent prioritization
- **JSON response**: Configurable alternatives with `maxResults` parameter
- **Simple focus**: Title-based resolution for core functionality
- **Fallback guidance**: `nextSteps` suggestions when searches fail

### Permission Case Fix
Fixed case mismatch in permission checks:
- **Issue**: Functions checked lowercase "read" vs uppercase "READ" environment variable
- **Resolution**: Updated all permission checks to use uppercase "READ"
- **Impact**: Resolved authorization errors preventing search operations

### Modular Architecture Refactoring
Transformed monolithic codebase:
- **Size reduction**: 1400+ line `index.ts` → ~150 lines (91% reduction)
- **Module structure**: 6 specialized modules for business logic, handlers, and schemas
- **Design pattern**: Manager (logic) → Handler (requests) → Tool Definition (schemas)
- **Benefits**: Separation of concerns, enhanced maintainability, improved testability

### `manage_attributes` Tool Enhancement - **REMOVED**

**Status**: Removed due to reliability issues and implementation complexity

**Issues identified**:
- Unclear operation semantics (list vs get confusion)
- ETAPI compatibility concerns
- Insufficient testing against live TriliumNext instances
- User experience confusion about requirements

**Future consideration**: Full redesign with comprehensive testing planned for future implementation (see `docs/future-plan.md`)


### TriliumNext Relation Syntax Fix
Corrected relation search syntax:
- **Issue**: TriliumNext requires property access syntax for relations
- **Solution**: Use `~template.title = 'Grid View'` instead of `~template = 'Grid View'`
- **Validation**: Relations point to notes, requiring property access on target notes
- **Updates**: Corrected all documentation examples to use proper relation syntax
- **Key insight**: Relations are connections between notes - access target note properties (`.title`) rather than comparing relation to string values

## Documentation Status

### Testing Status
- ⚠️ **NEEDS TESTING**: Regex search examples in `docs/search-query-examples.md` need validation against actual TriliumNext instances
- ⚠️ **NEEDS TESTING**: Relation search examples in `docs/search-query-examples.md` (examples 63-70) need validation against actual TriliumNext instances
- ⚠️ **UNTESTED**: Attribute search examples from "## Attribute Search Examples" section (examples 24-33) have not been tested against actual TriliumNext instances  
- ⚠️ **UNTESTED**: Two-parameter approach with per-item logic needs validation
- ✅ **COMPLETED**: Field-specific search unification - `filters` parameter removed and `title`/`content` moved to `noteProperties`
- ✅ **UPDATED**: All documentation examples migrated from `filters` to `noteProperties` syntax (examples 12-23, 47-52)
- ✅ **RESEARCHED**: Date parameter unification feasibility - confirmed TriliumNext native support for date properties and smart date expressions
- ✅ **DOCUMENTED**: Enhanced date search examples (examples 55-62) showing unified noteProperties approach with smart dates and UTC support
- ✅ **IMPLEMENTED**: Date parameter unification - removed legacy date parameters and unified into noteProperties with smart date support
- ✅ **MIGRATED**: All date examples (1-11, 18, 32) updated to use noteProperties syntax with smart date expressions
- ✅ **IMPLEMENTED - UNTESTED**: Relation search support - full implementation with comprehensive examples and updated schemas, but not validated against live TriliumNext instances
- **Reminder**: All attribute and relation examples need validation to ensure the generated Trilium search strings work correctly with the ETAPI
- **Priority**: Test unified `noteProperties` implementation and new relation search functionality  
- **Next**: Consider performance testing of unified approach vs legacy specialized parameters
