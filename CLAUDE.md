# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for TriliumNext Notes that provides tools to interact with Trilium Notes instances through the MCP framework. The server allows AI assistants to search, read, create, update, and delete notes in TriliumNext through its External API (ETAPI).

## Key Architecture

### Modular Structure (Refactored from Monolithic)
- **Main Server**: `src/index.ts` - Lightweight MCP server setup (~150 lines, down from 1400+)
- **Business Logic Modules**: `src/modules/` - Core functionality separated by domain:
  - `attributeManager.ts` - CRUD operations for labels and relations
  - `noteManager.ts` - Note creation, update, append, delete, and retrieval
  - `searchManager.ts` - Search, list_child_notes, and list_descendant_notes operations
- **Request Handlers**: `src/modules/` - MCP request/response processing:
  - `attributeHandler.ts` - Attribute tool request handling with permission validation
  - `noteHandler.ts` - Note tool request handling with permission validation
  - `searchHandler.ts` - Search tool request handling with permission validation
- **Schema Definitions**: `src/modules/` - Tool schema generation:
  - `toolDefinitions.ts` - Permission-based tool schema generation and definitions
- **Utility Modules**: `src/modules/` - Specialized helper functions:
  - `searchQueryBuilder.ts` - Builds Trilium search query strings from structured parameters
  - `contentProcessor.ts` - Markdown detection and HTML conversion
  - `noteFormatter.ts` - Output formatting for note listings
  - `responseUtils.ts` - Debug info and response formatting utilities

### MCP Tool Architecture
- **Permission-based tools**: READ vs WRITE permissions control available tools
- **Tool ordering**: `list_descendant_notes` appears before `list_child_notes` to prioritize comprehensive listing
- **Unified search architecture**: Single `search_notes` function with smart performance optimization
- **List function integration**: `list_child_notes` and `list_descendant_notes` use `search_notes` as parent function with different `hierarchyType` parameters
- **Critical Trilium syntax handling**: OR queries with parentheses require `~` prefix per Trilium parser requirements
- **Modular design patterns**: Separation of concerns with Manager (business logic) → Handler (request processing) → Tool Definition (schemas)

### Refactoring Benefits Achieved
- **91% reduction in main file size**: From 1400+ lines to ~150 lines
- **Complete separation of concerns**: Each module has single responsibility
- **Enhanced maintainability**: Business logic isolated from request handling
- **Improved testability**: Individual modules can be unit tested independently
- **Better extensibility**: New operations can be added without touching existing code
- **Type safety**: Strong TypeScript interfaces throughout the modular architecture

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
- `search_notes`: Unified search with comprehensive filtering capabilities including full-text search, date ranges, field-specific searches, attribute searches, note properties, and hierarchy navigation
- `resolve_note_id`: Find note ID by name/title - use when users provide note names (like "wqd7006") instead of IDs. Essential for LLM workflows where users reference notes by name. Features:
  - **Configurable folder prioritization**: `prioritizeFolders` parameter (default: false) controls whether to prioritize notes with children (folders)
  - **Smart search strategy**: When `prioritizeFolders=true`, searches folders first (`note.childrenCount > 0`), then falls back to all notes
  - **Configurable results**: `maxResults` parameter (default: 3, range: 1-10) controls number of alternatives returned
  - **Context-aware usage**: Enable folder prioritization for listing workflows (`list_descendant_notes`/`list_child_notes`), disable for content workflows (`get_note`)
  - **JSON response format**: Returns structured data with selectedNote, totalMatches, topMatches array, and nextSteps guidance
- `manage_attributes` (list operation): Get all unique attribute names (labels and relations) used across all notes with usage statistics - useful for discovering available attributes for searches and understanding attribute usage patterns across note types
- `list_descendant_notes`: List ALL descendant notes recursively (like Unix `find`) - uses `search_notes` with `hierarchyType="descendants"` - **PREFERRED for "list all notes"**
- `list_child_notes`: List direct child notes only (like Unix `ls`) - uses `search_notes` with `hierarchyType="children"` - for navigation/browsing
- `get_note`: Retrieve note content by ID

### WRITE Permission Tools
- `create_note`: Create new notes with various types (text, code, file, image, etc.)
- `update_note`: Update existing note content with revision control (defaults to revision=true for safety)
- `append_note`: Add content to existing notes without replacement (defaults to revision=false for performance)
- `delete_note`: Delete notes by ID (permanent operation with caution warnings)
- `manage_attributes` (CRUD operations): Comprehensive attribute management with create, update, delete, and get operations for both note labels and relations using ETAPI

## Search Query Architecture

### Unified Search System
- **Single search function**: `search_notes` handles all search scenarios with automatic performance optimization
- **Smart fastSearch logic**: Automatically uses `fastSearch=true` for simple text-only queries, `fastSearch=false` for complex structured queries
- **Hierarchical integration**: `list_child_notes` and `list_descendant_notes` use `search_notes` internally with different `hierarchyType` parameters
- **Parameter inheritance**: List functions support all `search_notes` parameters for powerful filtering capabilities

### Query Builder System
- **Structured → DSL**: `searchQueryBuilder.ts` converts JSON parameters to Trilium search strings
- **Critical fix**: OR queries with parentheses automatically get `~` prefix (required by Trilium parser)
- **Field operators**: `*=*` (contains), `=*` (starts with), `*=` (ends with), `!=` (not equal)
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
    filters: [{ field: "title", op: "contains", value: args.noteName }],
    noteProperties: args.prioritizeFolders ? [{ property: "childrenCount", op: ">", value: "0" }] : []
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
  prioritizeFolders?: boolean; // ❌ Don't do this
}
```

This ensures backward compatibility and prevents breaking changes to the core search functionality.

### Trilium Search DSL Integration
- **Parent-child queries**: Uses `note.parents.noteId = 'parentId'` for direct children
- **Ancestor queries**: Uses `note.ancestors.noteId = 'parentId'` for all descendants
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

### Tool Descriptions Optimized for LLM Selection
- `list_descendant_notes` marked as "PREFERRED for 'list all notes' requests"
- Clear Unix command analogies: `ls` vs `find` behavior for `list_child_notes` and `list_descendant_notes` respectively
- Specific guidance on when to use each tool for better LLM decision-making
- `resolve_note_id` provides clear workflow: resolve name → get ID → use with other tools (eliminates confusion when users provide note names instead of IDs)

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
- **Supported operators**: `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=)
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
- **Content properties**: `title`, `content` - support field-specific operators (`contains`, `starts_with`, `ends_with`, `not_equal`)
- **Date properties**: `dateCreated`, `dateModified`, `dateCreatedUtc`, `dateModifiedUtc` - support comparison operators (`>=`, `<=`, `>`, `<`, `=`, `!=`) with ISO date strings and smart date expressions
- **Numeric properties**: `labelCount`, `ownedLabelCount`, `attributeCount`, `relationCount`, `parentCount`, `childrenCount`, `contentSize`, `revisionCount` - support numeric comparisons (`>`, `<`, `>=`, `<=`, `=`, `!=`) with unquoted numeric values
- **Automatic type handling**: Query builder properly handles boolean, string, content, date, and numeric value formatting
- **Smart date expressions**: Support TriliumNext native syntax like `TODAY-7`, `MONTH-1`, `YEAR+1` for dynamic date queries
- **Examples**: `note.labelCount > 5`, `note.type = 'text'`, `note.isArchived = true`, `note.title *=* 'project'`, `note.content =* 'introduction'`, `note.dateCreated >= 'TODAY-7'`

## Attribute OR Logic Support

### Clean Two-Parameter Approach
- **`attributes` parameter**: For Trilium user-defined metadata (`#book`, `~author.title`)
  - **Labels**: `#book`, `#author` - user-defined tags and categories  
  - **Relations**: `~author.title *= 'Tolkien'` - connections between notes (**IMPLEMENTED**)
  - **Per-item logic**: Each attribute can specify `logic: "OR"` to combine with next attribute
  - **Trilium syntax**: Automatically handles proper `#` and `~` prefixes, OR grouping with `~(#book OR #author)`
- **`noteProperties` parameter**: For Trilium built-in note metadata (`note.isArchived`, `note.type`)
  - **System properties**: Built into every note - `note.isArchived`, `note.type`, `note.labelCount`
  - **Different namespace**: Always prefixed with `note.` in Trilium DSL  
  - **Per-item logic**: Each property can specify `logic: "OR"` to combine with next property
- **Conceptual clarity**: Matches Trilium's architectural separation between user metadata and system metadata
- **Edge case handling**: Auto-cleanup of logic on last items, OR default logic, proper grouping

## Recent Enhancements (Latest)

### Relation Search Implementation - Full Support Completed
- **Major capability addition**: Implemented comprehensive relation search support in `buildAttributeQuery()` function
- **TriliumNext integration**: Full support for `~relationName` and `~relationName.property` syntax patterns
- **Query building enhancement**: Added `~` prefix handling for relations vs `#` prefix for labels
- **Enhanced capabilities achieved**:
  - **Complete relation support**: All TriliumNext relation patterns now supported - `~author`, `~author.title`, `~author.relations.publisher.title`
  - **Mixed searches**: Labels and relations can be combined in same query with proper syntax
  - **OR logic compatibility**: Relations work with existing per-item logic system
  - **Property access**: Support for nested relation properties like `~author.title *=* 'Tolkien'`
  - **All operators**: Full operator support for relations: `exists`, `=`, `!=`, `>=`, `<=`, `>`, `<`, `contains`, `starts_with`, `ends_with`
- **Implementation details**:
  - Modified `buildAttributeQuery()` to support both `type: "label"` and `type: "relation"`
  - Added prefix selection logic: `#` for labels, `~` for relations
  - Updated tool schema description to remove "future support" notation
  - Enhanced documentation with 8 comprehensive relation search examples (examples 63-70)
  - Updated architectural status from "partially implemented" to "IMPLEMENTED"
- **Documentation impact**: Added comprehensive relation search examples in `docs/search-query-examples.md`
- **Status**: ✅ **COMPLETED** - Full implementation with comprehensive examples and updated tool schemas

### Date Parameter Unification Implementation - noteProperties Enhancement Completed
- **Major architectural change**: Removed all legacy date parameters (`created_date_start`, `created_date_end`, `modified_date_start`, `modified_date_end`) and unified them into `noteProperties` parameter
- **TriliumNext integration**: Full support for `note.dateCreated`, `note.dateModified`, `note.dateCreatedUtc`, `note.dateModifiedUtc` properties
- **Smart date expressions**: Implemented TriliumNext native syntax support (`TODAY±days`, `NOW±seconds`, `MONTH±months`, `YEAR±years`)
- **Enhanced capabilities achieved**:
  - **Unified API**: All search criteria now use consistent `noteProperties` pattern
  - **Enhanced OR logic**: Date searches can be mixed with other properties using per-item `logic: "OR"`
  - **Smart date expressions**: Full support for dynamic date queries like `TODAY-7`, `MONTH-1`
  - **UTC timezone support**: Added `dateCreatedUtc`, `dateModifiedUtc` for global applications
  - **Simplified codebase**: Removed complex date-specific query building logic
  - **Range queries**: Use multiple properties for precise date ranges
- **Implementation details**:
  - Added `dateCreated`, `dateModified`, `dateCreatedUtc`, `dateModifiedUtc` to noteProperties enum
  - Updated query builder to handle date properties with quotes and smart expressions
  - Removed legacy date handling logic from searchQueryBuilder
  - Updated all interfaces, handlers, and tool schemas
  - Migrated all documentation examples to use noteProperties approach
- **Migration impact**: Breaking change - existing date parameter usage must migrate to `noteProperties`
- **Status**: ✅ **COMPLETED** - Full implementation with comprehensive testing documentation

### Date Parameter Unification Research - noteProperties Enhancement Feasibility
- **Research completed**: Comprehensive analysis of moving date parameters to `noteProperties` parameter
- **TriliumNext validation**: Confirmed native support for `note.dateCreated`, `note.dateModified` with all comparison operators
- **Smart date discovery**: TriliumNext supports native smart date expressions (`TODAY±days`, `NOW±seconds`, `MONTH±months`, `YEAR±years`)
- **UTC timezone support**: `dateCreatedUtc`, `dateModifiedUtc` properties available for global applications
- **Architecture benefits identified**:
  - **Unified API**: All search criteria use consistent `noteProperties` pattern
  - **Enhanced OR logic**: Mix dates with other properties using per-item `logic: "OR"`
  - **Smart date expressions**: Enable TriliumNext's native smart date syntax like `TODAY-7`
  - **Simplified codebase**: Remove complex date-specific query building logic
  - **Range queries**: Use multiple properties for precise date ranges
- **Migration strategy documented**: Clear path from current separate date parameters to unified noteProperties approach
- **Status**: ⚠️ **READY FOR IMPLEMENTATION** - All research completed, examples documented, architecture validated

### Unified Search Architecture - noteProperties Parameter Enhancement
- **Major architectural change**: Removed `filters` parameter and moved `note.title`/`note.content` searches to `noteProperties` parameter
- **Problem solved**: Eliminated API inconsistency between field-specific searches and note property searches
- **Key benefits**: 
  - **Unified API**: Single `noteProperties` parameter handles both system properties and content searches
  - **Consistent OR logic**: Same per-item logic pattern as `attributes` parameter 
  - **Enhanced capabilities**: All noteProperties now support OR logic including title/content searches
  - **Simplified usage**: No need to distinguish between different search parameter types
- **Implementation details**:
  - Added `title` and `content` to noteProperties enum with operators: `contains`, `starts_with`, `ends_with`, `not_equal`
  - Updated query builder to handle string operators for title/content properties
  - Migrated all field-specific examples to use noteProperties syntax
  - Removed deprecated `filters` parameter from interfaces and handlers
- **Migration impact**: Breaking change - existing `filters` usage must migrate to `noteProperties`

### `resolve_note_id` Function Implementation
- **Purpose**: LLM-friendly note ID resolution from note names/titles
- **Problem solved**: Eliminates LLM confusion when users provide note names instead of IDs
- **Key features**: 
  - JSON response format with top N alternatives (configurable via `maxResults`)
  - Context-aware folder prioritization via `prioritizeFolders` parameter
  - Smart search strategy: folders first → all notes fallback
  - Clear workflow guidance in responses
- **Usage patterns**:
  - Listing: `resolve_note_id(name, prioritizeFolders=true) → list_descendant_notes`
  - Content: `resolve_note_id(name, prioritizeFolders=false) → get_note`

### Permission Case Mismatch Fix
- **Issue**: Search functions were checking for lowercase `"read"` while environment uses uppercase `"READ"`
- **Resolution**: Updated all permission checks in search handlers to use uppercase `"READ"` to match `PERMISSIONS` environment variable format
- **Impact**: Fixed authorization errors preventing search, list, and resolve operations

### Modular Architecture Refactoring  
- **Transformation**: Monolithic 1400+ line `index.ts` → modular architecture (~150 lines main file)
- **Modules created**: 6 specialized modules for business logic, request handling, and schema definitions
- **Benefits**: 91% size reduction, complete separation of concerns, enhanced maintainability and testability
- **Pattern**: Manager (business logic) → Handler (request processing) → Tool Definition (schemas)

### `manage_attributes` Tool Enhancement
- **Upgrade**: From `manage_labels` to unified `manage_attributes` supporting both labels and relations
- **Capabilities**: Full CRUD operations (create, read, update, delete, list) for both labels (`#tag`) and relations (`~connection`)
- **Permission-based exposure**: Dynamic tool schema generation based on READ/WRITE permissions
- **API integration**: Uses unified `/attributes` endpoints from OpenAPI specification

## Documentation Status

### Testing Status
- ⚠️ **NEEDS TESTING**: Relation search examples in `docs/search-query-examples.md` (examples 63-70) need validation against actual TriliumNext instances
- ⚠️ **UNTESTED**: Attribute search examples from "## Attribute Search Examples" section (examples 24-33) have not been tested against actual TriliumNext instances  
- ⚠️ **UNTESTED**: Two-parameter approach with per-item logic needs validation
- ✅ **COMPLETED**: Field-specific search unification - `filters` parameter removed and `title`/`content` moved to `noteProperties`
- ✅ **UPDATED**: All documentation examples migrated from `filters` to `noteProperties` syntax (examples 12-23, 47-52)
- ✅ **RESEARCHED**: Date parameter unification feasibility - confirmed TriliumNext native support for date properties and smart date expressions
- ✅ **DOCUMENTED**: Enhanced date search examples (examples 55-62) showing unified noteProperties approach with smart dates and UTC support
- ✅ **IMPLEMENTED**: Date parameter unification - removed legacy date parameters and unified into noteProperties with smart date support
- ✅ **MIGRATED**: All date examples (1-11, 18, 32) updated to use noteProperties syntax with smart date expressions
- ✅ **IMPLEMENTED**: Relation search support - full implementation with comprehensive examples and updated schemas
- **Reminder**: All attribute and relation examples need validation to ensure the generated Trilium search strings work correctly with the ETAPI
- **Priority**: Test unified `noteProperties` implementation and new relation search functionality  
- **Next**: Consider performance testing of unified approach vs legacy specialized parameters