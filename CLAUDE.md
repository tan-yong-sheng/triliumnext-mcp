# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for TriliumNext Notes that provides tools to interact with Trilium Notes instances through the MCP framework. The server allows AI assistants to search, read, create, update, and delete notes in TriliumNext through its External API (ETAPI).

## Key Architecture

### Modular Structure (Evolved from Single File)
- **Main Server**: `src/index.ts` - MCP server setup, tool definitions, and request handling
- **Helper Modules**: `src/modules/` - Specialized functionality split into focused modules:
  - `searchQueryBuilder.ts` - Builds Trilium search query strings from structured parameters
  - `listChildHelper.ts` - Handles direct children listing (like Unix `ls`)
  - `listDescendantNotesHelper.ts` - Handles recursive note listing (like Unix `find`)
  - `contentProcessor.ts` - Markdown detection and HTML conversion
  - `noteFormatter.ts` - Output formatting for note listings
  - `responseUtils.ts` - Debug info and response formatting utilities

### MCP Tool Architecture
- **Permission-based tools**: READ vs WRITE permissions control available tools
- **Tool ordering**: `list_descendant_notes` appears before `list_child_notes` to prioritize comprehensive listing
- **Search hierarchy**: Basic `search_notes` → Advanced `search_notes_advanced` → Listing tools
- **Critical Trilium syntax handling**: OR queries with parentheses require `~` prefix per Trilium parser requirements

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
- `search_notes`: Fast full-text search using simple keyword searches
- `search_notes_advanced`: Advanced filtered search with date ranges, field-specific searches
- `list_descendant_notes`: List ALL descendant notes recursively (like Unix `find`) - **PREFERRED for "list all notes"**
- `list_child_notes`: List direct child notes only (like Unix `ls`) - for navigation/browsing
- `get_note`: Retrieve note content by ID

### WRITE Permission Tools
- `create_note`: Create new notes with various types (text, code, file, image, etc.)
- `update_note`: Update existing note content with revision control (defaults to revision=true for safety)
- `append_note`: Add content to existing notes without replacement (defaults to revision=false for performance)
- `delete_note`: Delete notes by ID (permanent operation with caution warnings)

## Search Query Architecture

### Query Builder System
- **Structured → DSL**: `searchQueryBuilder.ts` converts JSON parameters to Trilium search strings
- **Critical fix**: OR queries with parentheses automatically get `~` prefix (required by Trilium parser)
- **Field operators**: `*=*` (contains), `=*` (starts with), `*=` (ends with), `!=` (not equal)
- **Documentation**: `docs/search-query-examples.md` contains 21+ examples with JSON structure for future filters parameter

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

## Field-Specific Search Limitations

### Supported Operators
- `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=)
- **Known limitation**: `not_contains` (does not contain) is not reliably supported in Trilium's search DSL
- Field-specific searches work on `title` and `content` fields through the `filters` parameter