## Quick Reference: Testing Do's and Don'ts

| Scenario | Action Required |
|----------|----------------|
| Test fails due to my code changes | ⚠️ STOP - Inform user, await approval |
| Need to add new feature tests | ✅ Proceed - Add comprehensive tests |
| Test has typo in description | ✅ Proceed - Fix typo |
| Test expectation wrong due to bug fix | ⚠️ STOP - This reveals breaking change, inform user |
| Environment setup fails tests | ✅ Proceed - Fix environment/configuration |

## Testing Guidelines and Principles

### Core Testing Principles

**Test Preservation Policy**: Tests should never be modified when failing due to breaking changes. Test failures reveal important information about breaking changes that need user attention.

**User Approval Requirement**: Explicit user approval is required before modifying any test behavior, expectations, or logic.

**Breaking Change Protocol**: When code changes cause test failures, this indicates a potential breaking change that requires user awareness and approval.

### Test Modification Decision Tree

#### ✅ ALLOWED without explicit approval:
- **Typo fixes** in test descriptions or comments
- **Formatting improvements** (whitespace, indentation)
- **Add new tests** for new functionality
- **Fix test infrastructure** (imports, setup, environment)
- **Environment configuration** fixes (paths, variables, setup)

#### ❌ REQUIRES explicit user approval:
- **Change test expectations** (assertions, expected values)
- **Remove existing tests** (unless clearly obsolete)
- **Modify test logic** (conditions, loops, data)
- **Update test data** that changes expected behavior
- **Fix test failures** caused by code changes
- **Change test conditions** or validation criteria

### Test Failure Protocol

#### When tests fail due to code changes:
1. **STOP** - Do not modify tests
2. **ANALYZE** - Determine if failure indicates:
   - Genuine breaking change that needs user attention
   - Test implementation issue that needs user approval
   - Environment/configuration problem
3. **INFORM USER** - Clearly explain:
   - Why tests are failing
   - Impact of the code changes
   - Options for resolution
4. **AWAIT APPROVAL** - Do not proceed without explicit user consent

#### Communication Template:
```markdown
## Test Failure Alert

**Issue**: [Brief description of test failures]
**Cause**: Tests are failing due to code changes in [file/module]
**Impact**: [Describe what this breaking change affects]

**Options**:
1. **Approve test modification** - Update tests to match new behavior (confirms breaking change)
2. **Fix the code** - Modify implementation to maintain existing test expectations
3. **Document breaking change** - Update documentation to reflect new behavior

Please let me know which approach you'd prefer.
```

### Acceptable vs Unacceptable Test Modifications

#### ✅ Acceptable Test Modifications (Examples)
```typescript
// ✅ OK: Fix import path after file reorganization
import { safeValidate } from '../../utils/validationUtils.js';

// ✅ OK: Add new test for new feature
it('should handle new parameter validation', () => {
  const result = validateNewParameter({ valid: true });
  assert.strictEqual(result.success, true);
});

// ✅ OK: Fix typo in test description
it('should validate attribute creation', () => { // Fixed typo

// ✅ OK: Improve formatting for readability
const testData = {
  title: 'Test Note',
  type: 'text',
  content: 'Test content'
};
```

#### ❌ Unacceptable Test Modifications (Examples)
```typescript
// ❌ NOT OK: Change expected result due to code behavior change
assert.strictEqual(result.success, true); // Changed from false

// ❌ NOT OK: Remove validation test because it fails
// Removed: it('should reject invalid parameters', () => {...})

// ❌ NOT OK: Modify test data to pass failing tests
const testData = {
  // Changed from 'invalid' to 'valid' to make test pass
  status: 'valid'
};

// ❌ NOT OK: Update assertion to match new (broken) behavior
assert.ok(result.includes('new message')); // Changed from expected message
```

### Example: Test Reorganization (User-Approved)
The recent reorganization of validation tests from a 449-line monolithic file into 8 focused test files was performed with explicit user approval and serves as an example of major test restructuring that follows the proper protocol.

## Development Workflow

**Standard Development Process**:
1. **Edit Code** - Implement new features or fix bugs in source files
2. **Write Tests** - Add comprehensive tests for new functionality
3. **Update Documentation** - Sync documentation with code changes
4. **Build & Validate** - Run `npm run build` to ensure TypeScript compilation success

**Workflow Guidelines**:
- **Code First**: Focus on implementing the core functionality in TypeScript
- **Test Coverage**: Add tests that cover all new functionality, edge cases, and error conditions
- **Documentation Sync**: Update CLAUDE.md, tool descriptions, and any relevant documentation
- **Build Validation**: Always run `npm run build` to catch TypeScript errors before committing
- **Iterative Development**: Repeat the cycle for each feature or bug fix

**Quality Checks**:
- TypeScript compilation must pass (no errors)
- New functionality must have corresponding tests
- Documentation must reflect current implementation
- Build process must complete successfully

**Example Workflow**:
```bash
# 1. Edit code
vim src/modules/newFeature.ts

# 2. Write tests
vim tests/newFeature.test.js

# 3. Update documentation
vim CLAUDE.md

# 4. Build and validate
npm run check
npm run build
```

## Project Overview

This is a Model Context Protocol (MCP) server for TriliumNext Notes that provides tools to interact with Trilium Notes instances through the MCP framework. The server allows AI assistants to search, read, create, update, and delete notes in TriliumNext through its External API (ETAPI).

## Key Architecture

### Modular Structure (Refactored from Monolithic)
- **Main Server**: `src/index.ts` - Lightweight MCP server setup (~150 lines, down from 1400+)
- **Business Logic Modules**: `src/modules/` - Core functionality separated by domain:
  - `noteManager.ts` - Note creation, update, delete, and retrieval
  - `searchManager.ts` - Core search operations with hierarchy navigation support
  - `resolveManager.ts` - Note ID resolution with simple title-based search
- **Request Handlers**: `src/modules/` - MCP request/response processing:
  - `noteHandler.ts` - Note tool request handling with permission validation
  - `searchHandler.ts` - Search tool request handling with permission validation
  - `resolveHandler.ts` - Resolve note ID request handling with permission validation
- **Schema Definitions**: `src/modules/` - Tool schema generation:
  - `toolDefinitions.ts` - Permission-based tool schema generation and definitions
- **Utility Modules**: `src/utils/` - Specialized helper functions:
  - `searchQueryBuilder.ts` - Builds Trilium search query strings from structured parameters
  - `noteFormatter.ts` - Output formatting for note listings
  - `verboseUtils.ts` - Centralized verbose logging utilities with specialized functions for input/output tracking, API requests, error handling, and data transformation logging
  - `validationUtils.ts` - Zod-based type validation and schema definitions
  - `permissionUtils.ts` - Permission checking interface and utilities

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

## Centralized Verbose Logging System

The project implements a centralized verbose logging system through `src/utils/verboseUtils.ts` that provides consistent debugging output across all modules:

### Verbose Logging Functions
- `logVerbose(category, message, data?)` - General purpose logging with consistent formatting
- `logVerboseInput(functionName, params)` - Specialized for function input parameters
- `logVerboseOutput(functionName, result)` - Specialized for function output/results
- `logVerboseApi(method, url, data?)` - HTTP request logging with standardized format
- `logVerboseError(context, error)` - General error logging with context
- `logVerboseAxiosError(context, error)` - Specialized axios error logging with detailed API response info
- `logVerboseTransform(category, from, to, reason?)` - Data transformation logging

### Centralization Benefits
- **Consistent Format**: All verbose output follows `[VERBOSE] category: message` pattern
- **Code Reduction**: Eliminated 11+ repetitive `process.env.VERBOSE === "true"` checks across modules
- **Single Source of Truth**: Verbose behavior controlled in one location
- **Enhanced Debugging**: Specialized functions provide detailed API error information, transformation tracking, and request/response logging
- **Maintainability**: Easy to modify logging behavior without touching multiple files

### Usage Pattern
```typescript
// Instead of repetitive code:
const isVerbose = process.env.VERBOSE === "true";
if (isVerbose) {
  console.error(`[VERBOSE] function_name: message`, data);
}

// Use centralized functions:
logVerbose("function_name", "message", data);
```

### Modules Using Centralized Logging
- **searchQueryBuilder.ts**: Input/output logging and relation transformation tracking
- **resolveManager.ts**: Input parameter logging for note resolution
- **attributeManager.ts**: Comprehensive debugging including available attributes, API requests, and detailed error logging

## Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript and set executable permissions
npm run prepare        # Same as build (runs on npm install)
npm run watch          # Watch mode for development
npm run check          # Build + run comprehensive validation tests with Zod schemas
```

### Testing and Debugging
```bash
npm run inspector      # Run MCP inspector for testing tools
```

### Development Setup
```bash
npm install            # Install dependencies
npm run build         # Build the project
npm run check         # Run comprehensive validation tests
node build/index.js   # Run the server directly
```

## Type Validation System

### Zod-Based Schema Validation
The project includes comprehensive type validation using Zod schemas to ensure data integrity and catch type-related errors early:

- **Validation Utilities**: `src/utils/validationUtils.ts` - Centralized validation functions and schemas
- **Test Coverage**: `tests/validation.test.js` - 25+ test cases covering all MCP tool parameters
- **Runtime Validation**: Validates search criteria, attributes, note creation, and search operations

### Validation Features
- **Schema Definitions**: Complete Zod schemas for all MCP tool parameters
- **Error Handling**: Detailed error messages with field-specific validation feedback
- **Safe Validation**: Non-throwing validation functions for graceful error handling
- **Type Safety**: TypeScript inference from Zod schemas for compile-time type checking

### Using npm run check
The `npm run check` command provides comprehensive validation:
1. **TypeScript Compilation**: Ensures type safety and compilation success
2. **Schema Validation Tests**: Validates all MCP tool parameter schemas
3. **Edge Case Testing**: Tests complex scenarios, error conditions, and data type validation
4. **Error Message Testing**: Verifies clear, actionable error messages

### Integration Points
Validation functions can be integrated into request handlers for runtime validation:
```typescript
import { validateManageAttributes, createValidationError } from '../utils/validationUtils.js';

// In request handlers
try {
  const validated = validateManageAttributes(request.params.arguments);
  // Process validated data
} catch (error) {
  return {
    content: [{ type: "text", text: createValidationError(error) }],
    isError: true
  };
}
```

**Note**: When modifying validation logic that affects existing tests, follow the Test Failure Protocol above and obtain explicit user approval before changing any test expectations or behavior.

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
- `read_attributes`: Read all attributes (labels and relations) for a note. View existing labels (#tags), template relations (~template), and note metadata. This tool provides read-only access to inspect current attributes assigned to any note with structured output including labels/relations breakdown and summary information.

### WRITE Permission Tools
- `create_note`: Create new notes with various types (text, code, mermaid, canvas, book, etc.) - 13 ETAPI-aligned note types supported. Includes optional `attributes` parameter for one-step template relation creation (30-50% performance improvement over manual two-step approach)
- `manage_attributes`: Manage note attributes (labels and relations) with write operations. Create labels (#tags), template relations (~template), update existing attributes, and organize notes with metadata. Supports single operations and efficient batch creation for better performance. Template relations like ~template = 'Board' enable specialized note layouts and functionality. Supports "create", "update", "delete", and "batch_create" operations.
- `update_note`: Update existing note content with revision control (defaults to revision=true for safety)
- `delete_note`: Delete notes by ID (permanent operation with caution warnings)

### Permission-Based Tool Behavior
The attribute management tools have clear permission separation:
- **READ permission only**: Shows `read_attributes` tool for viewing note attributes
- **WRITE permission only**: Shows `manage_attributes` tool for creating, updating, deleting attributes
- **READ + WRITE permissions**: Shows both `read_attributes` and `manage_attributes` tools for complete attribute management

This follows the principle of least privilege and provides clean separation between read and write operations.

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

This prevents breaking changes to the core search functionality.

### Trilium Search DSL Integration
- **Parent-child queries**: Uses `note.parents.title = 'parentName'` for direct children
- **Ancestor queries**: Uses `note.ancestors.title = 'ancestorName'` for all descendants
- **Date filtering**: Supports created/modified date ranges with proper AND/OR logic
- **Ordering validation**: orderBy fields must also be present in filters

## Note Types Supported

- `text`: Regular text notes
- `code`: Code notes with syntax highlighting
- `search`: Search notes
- `book`: Book/folder notes
- `relationMap`: Relation map notes
- `render`: Render notes
- `mermaid`: Mermaid diagram notes (text/vnd.mermaid)
- `webView`: WebView notes

**Note**: The following note types have been deprecated and removed from the TriliumNext ETAPI specification. These types are no longer available for search or creation operations:
- `doc` (document containers)
- `shortcut` (navigation shortcuts)
- `contentWidget` (interactive widgets)
- `launcher` (application launchers)

### Template-Based Note Types

TriliumNext supports specialized note types through templates:

- **Calendar Notes**: `type: book` + `~template=Calendar`
- **Task Board Notes**: `type: book` + `~template=Board`
- **Text Snippet Notes**: `type: text` + `~template=Text Snippet`

**Note**: For template-based searches, use the `search_notes` function with template criteria rather than `resolve_note_id`.

## Content Input & Simplified Interface

### Smart Content Processing
The server now includes intelligent content processing:
- **Text notes**: Auto-detects Markdown vs HTML vs plain text, converts Markdown to HTML
- **Code notes**: Content passes through exactly as written (no processing)
- **Mixed content**: Text notes can combine multiple text sections


### Simplified Helper Functions
Exported helper functions for easier note creation:
- `buildNoteParams()` - Universal function for text and code note types with automatic content mapping

**Usage Example:**
```typescript
import { buildNoteParams } from 'triliumnext-mcp';

// Code note - content passes through unchanged
const codeNote = buildNoteParams({
  parentNoteId: "root",
  title: "Fibonacci Function",
  noteType: "code",
  content: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    else:
        fib = [0, 1]
        while len(fib) < n:
            fib.append(fib[-1] + fib[-2])
        return fib`,
  mime: "text/x-python"
});

// Text note with auto Markdown conversion
const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified"
});
```

### Content Requirements by Note Type
- **Text notes**: Support smart format detection (HTML/Markdown/plain)
- **Code notes**: Plain text only, no processing applied
- **Book/Search/etc**: Optional content, can be empty

**Documentation**: See `docs/create-notes-examples/simplified-interface-guide.md` for comprehensive examples and usage patterns.

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
- **Risk-based defaults**: High-impact operations (complete replacement) default to safety

### Content Operation Guidelines
- Use `update_note` for both content additions and complete content replacement (rewrites, major edits)
- The function supports explicit revision control override via `revision` parameter
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
  - **Relations**: `~author.title *= 'Tolkien'` - connections between notes (**IMPLEMENTED - TESTED & WORKING**)
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
- **Note types**: Support for searchable types (text, code, mermaid, book, image, file, search, relationMap, render, webView, etc.)
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
- **Status**: ✅ **IMPLEMENTED - TESTED & WORKING**

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

### Relation Search
Comprehensive relation search support:
- **TriliumNext patterns**: `~author`, `~author.title`, `~author.relations.publisher.title`
- **Mixed searches**: Combine labels and relations with proper syntax (`#` vs `~` prefixes)
- **OR logic**: Compatible with existing per-item logic system
- **Operators**: Complete support including exists, comparison, and string operations
- **Status**: ✅ **IMPLEMENTED - TESTED & WORKING**

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

### Permission-Based Attribute Management Implementation - **COMPLETED**

**Status**: ✅ **IMPLEMENTED & TESTED** - Successfully implemented operation-specific permission control

**Implementation Overview**:
- **Operation-Specific Permissions**: `manage_attributes` tool now enforces granular permissions based on operation type
- **READ Permission**: Allows "read" operation only (viewing attributes)
- **WRITE Permission**: Allows "create", "update", "delete", "batch_create" operations
- **Dynamic Tool Descriptions**: Tool descriptions update based on available permissions
- **Separate Tool Generation**: `createReadAttributeTools()` and `createWriteAttributeTools()` functions

**Key Features**:
- ✅ **Granular Security**: Read operations require READ permission, write operations require WRITE permission
- ✅ **Principle of Least Privilege**: Users only see operations they're authorized to perform
- ✅ **Dynamic Interface**: Tool descriptions automatically adapt to permission level
- ✅ **Backward Compatibility**: Existing functionality preserved with enhanced security

**Permission Behavior**:
- **READ only**: Shows `manage_attributes` with "read" operation description
- **WRITE only**: Shows `manage_attributes` with create/update/delete operations
- **READ + WRITE**: Shows both tool variants for complete attribute management

**Technical Implementation**:
- **Handler Updates**: `attributeHandler.ts` now checks operation-specific permissions
- **Tool Definitions**: Separated into permission-specific functions in `toolDefinitions.ts`
- **Validation**: Comprehensive error handling for permission violations
- **Testing**: Verified with all permission combinations

**Files Modified**:
- `src/modules/attributeHandler.ts`: Added operation-specific permission validation
- `src/modules/toolDefinitions.ts`: Split into permission-based tool generation functions
- Documentation updated to reflect new permission model

This implementation provides fine-grained access control while maintaining user experience clarity and system security.


### TriliumNext Relation Syntax Fix
Corrected relation search syntax:
- **Issue**: TriliumNext requires property access syntax for relations
- **Solution**: Use `~template.title = 'Grid View'` instead of `~template = 'Grid View'`
- **Validation**: Relations point to notes, requiring property access on target notes
- **Updates**: Corrected all documentation examples to use proper relation syntax
- **Key insight**: Relations are connections between notes - access target note properties (`.title`) rather than comparing relation to string values

### Negation Operator Enhancement
Enhanced negation operator support and documentation:
- **Issue**: `not_exists` operator was implemented in searchQueryBuilder.ts but missing from toolDefinitions.ts operator enum
- **Resolution**: Added `"not_exists"` to the operator enum in toolDefinitions.ts
- **Description improvement**: Refined tool descriptions to clearly distinguish between `not_exists` and `!=` operators
- **Documentation**: Added comprehensive examples in `docs/search-examples/advanced-queries.md` (examples 91-95)
- **Key distinction**:
  - `not_exists`: Finds notes WITHOUT a property at all (generates `#!collection`)
  - `!=`: Finds notes WITH a property but excluding specific values (generates `#collection != 'value'`)
- **Use cases**: Examples cover finding notes without specific labels, mixed negation scenarios, and proper operator selection

### ✅ Template Relations Implementation - COMPLETED

**Status**: ✅ **FULLY IMPLEMENTED & DOCUMENTED**

Template relations enable specialized note layouts and functionality by connecting notes to built-in TriliumNext templates. The implementation provides complete support for creating and managing template relations.

#### Available Built-in Templates:
- **Board** - Task boards with kanban-style columns (project management)
- **Calendar** - Calendar interface with date navigation (scheduling, events)
- **Text Snippet** - Reusable text snippet management (code libraries, templates)
- **Grid View** - Grid-based layouts (data organization, visual collections)
- **List View** - List-based layouts with filtering (task lists, directories)
- **Table** - Spreadsheet-like table structures (structured data, specifications)
- **Geo Map** - Geographic maps with location markers (travel planning, location data)

#### Implementation Features:
- ✅ **One-Step Creation**: `create_note` tool supports optional `attributes` parameter
- ✅ **Two-Step Management**: `manage_attributes` tool for existing notes
- ✅ **Batch Processing**: Efficient parallel attribute creation (30-50% performance gain)
- ✅ **Template Relations**: Full support for `~template` relation type
- ✅ **Combined Attributes**: Template relations + labels + other relations
- ✅ **Error Handling**: Graceful failure with actionable error messages
- ✅ **Documentation**: Comprehensive guide with examples for all template types

#### Usage Examples:

**One-Step Template Creation (Recommended)**:
```typescript
// Create a Task Board with template relation
{
  "parentNoteId": "root",
  "title": "Project Tasks",
  "type": "book",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 10
    }
  ]
}
```

**Template Relations with Labels**:
```typescript
// Create a Calendar with project metadata
{
  "parentNoteId": "root",
  "title": "2024 Event Calendar",
  "type": "book",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar",
      "position": 10
    },
    {
      "type": "label",
      "name": "project",
      "value": "Team Events",
      "position": 20
    }
  ]
}
```

**Batch Template Creation**:
```typescript
// Create multiple template relations efficiently
{
  "noteId": "note-id",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Text Snippet",
      "position": 10
    },
    {
      "type": "label",
      "name": "language",
      "value": "JavaScript",
      "position": 20
    }
  ]
}
```

#### Technical Implementation:
- **create_note**: Supports `attributes` parameter with parallel processing via `createNoteAttributes()`
- **manage_attributes**: Full CRUD operations for template relations on existing notes
- **Performance**: 30-50% faster than manual two-step approach due to parallel processing
- **Validation**: Comprehensive attribute validation with clear error messages
- **Error Recovery**: Graceful handling when attribute creation fails after note creation

#### Documentation:
- **Complete Guide**: `docs/create-notes-examples/template-relations.md` with examples for all template types
- **Best Practices**: Template selection guidelines, performance optimization, troubleshooting
- **Search Integration**: Finding template-based notes using `search_notes` with relation criteria
- **Advanced Usage**: Inheritable templates, combining with other relations, batch operations

**File**: `src/modules/noteManager.ts:101-137` - Attributes integration in create_note function
**File**: `src/modules/attributeManager.ts:131-198` - Batch attribute creation for performance

### ✅ Hash Validation and Content Type Safety Implementation - COMPLETED

**Status**: ✅ **FULLY IMPLEMENTED & DOCUMENTED**

Comprehensive hash-based validation and content type safety system for the `update_note` function to prevent concurrent modification conflicts and ensure content integrity.

#### Key Features Implemented:

**BlobId-Based Hash Validation**:
- Uses Trilium's native `blobId` instead of manual MD5 hash generation
- Perfect reliability and performance with Trilium's built-in content identification
- Prevents concurrent modification conflicts with optimistic concurrency control

**Required Type Parameter**:
- Added required `type` parameter to `update_note` for consistency with `create_note`
- Enables explicit content validation based on note type
- Ensures type safety across all note operations

**Required Hash Validation**:
- Made `expectedHash` parameter required for data integrity
- Enforces `get_note` → `update_note` workflow
- Prevents accidental overwrites of concurrent changes

**Always-On Content Validation**:
- Removed redundant `validateType` parameter (simplified API)
- Content type validation now always enabled for consistent safety
- Automatic HTML correction for text notes with plain text content

**Enhanced Content Type Safety**:
- **Text Notes**: Auto-detect HTML/Markdown/plain text, auto-wrap plain text in `<p>` tags
- **Code Notes**: Plain text only, reject HTML content with clear error messages
- **Mermaid Notes**: Plain text only, reject HTML content
- **Other Types**: Flexible content requirements based on note type

#### Implementation Details:

**Enhanced get_note Response**:
```typescript
// Returns blobId as contentHash for validation
return {
  note: noteData,
  content: noteContent,
  contentHash: blobId, // Use blobId as content hash
  contentRequirements: getContentRequirements(noteData.type)
};
```

**Enhanced update_note Validation**:
```typescript
// Required hash validation
if (!args.expectedHash) {
  throw new McpError(ErrorCode.InvalidParams,
    "Missing required parameter 'expectedHash'. You must call get_note first to retrieve the current blobId (content hash) before updating."
  );
}

// BlobId-based conflict detection
if (expectedHash) {
  const currentBlobId = currentNote.data.blobId;
  if (currentBlobId !== expectedHash) {
    return { noteId, message: "CONFLICT: Note has been modified by another user...", conflict: true };
  }
}
```

#### Workflow Examples:

**Basic Update Workflow**:
```typescript
// Step 1: Get current note state with blobId
const note = await get_note({ noteId: "abc123" });
// Returns: { note: {...}, content: "...", contentHash: "blobId_123", ... }

// Step 2: Update with blobId validation
const result = await update_note({
  noteId: "abc123",
  type: "text",
  content: [{ type: "text", content: "<p>Updated content</p>" }],
  expectedHash: note.contentHash // Required from get_note response
});
```

**Content Auto-Correction**:
```typescript
// Plain text automatically wrapped in HTML for text notes
// Input: "Hello world" → Output: "<p>Hello world</p>"
// Result message: "Note abc123 updated successfully (content auto-corrected)"
```

**Conflict Detection**:
```typescript
// Clear error when note modified by another user
// "CONFLICT: Note has been modified by another user. Current blobId: blobId_456, expected: blobId_123. Please get the latest note content and retry."
```

#### Benefits:

**Data Integrity**:
- Prevents concurrent modification conflicts using Trilium's native blobId
- Ensures content matches note type requirements
- Maintains consistency between expected and actual state

**User Experience**:
- Clear error messages with actionable guidance
- Automatic content correction when possible
- Simplified workflow with required parameters

**Performance**:
- Uses Trilium's native blobId (no manual hash generation)
- Efficient validation logic
- Minimal API overhead

**Documentation**:
- Complete implementation guide: `docs/hash-validation-implementation-plan.md`
- Comprehensive workflow examples and error handling patterns
- Migration guidance for existing code

**Files Modified**:
- `src/modules/toolDefinitions.ts`: Updated update_note schema with required parameters
- `src/modules/noteHandler.ts`: Added hash validation and required parameter checks
- `src/modules/noteManager.ts`: Implemented blobId validation and content type safety
- `src/utils/hashUtils.ts`: Created content validation utilities
- `docs/hash-validation-implementation-plan.md`: Complete documentation

### ✅ Note Type Alignment Completed
**Status**: ✅ **COMPLETED**

**ETAPI Alignment Updates**:
- **Updated Note Type Enum**: Changed from 11 to 15 types to exactly match ETAPI specification
- **Removed**: `canvas` type (currently not yet supported)
- **Added**: `noteMap`, `webView`, `shortcut`, `doc`, `contentWidget`, `launcher`
- **Tool Definitions**: Updated `create_note` and `search_notes` schemas with new enum values
- **Backward Compatibility**: All existing functionality preserved with new type support

**Current Supported Types**: `text`, `code`, `render`, `search`, `relationMap`, `book`, `noteMap`, `mermaid`, `webView`, `shortcut`, `doc`, `contentWidget`, `launcher` (13 total)

### ⚠️ File and Image Note Type Limitation
**Status**: **TEMPORARILY DISABLED**

**Issue**: The `file` and `image` note types have been temporarily removed from supported note types due to broken API support for attachment uploads in the current TriliumNext ETAPI implementation.

**Impact**:
- `file` and `image` note types are not available for creation or search
- Content validation for these types has been disabled
- The note creation function will reject attempts to create file/image notes

**Future Implementation**:
- Will be re-enabled once the TriliumNext ETAPI attachment upload functionality is stabilized
- Hash validation and content type safety features are ready for these types when API support is restored


## Documentation Status

### Testing Status

**Important**: All test modifications must follow the [Testing Guidelines and Principles](#testing-guidelines-and-principles) outlined above. Test failures due to code changes require explicit user approval before any modifications.
- ⚠️ **NEEDS TESTING**: Regex search examples in `docs/search-query-examples.md` need validation against actual TriliumNext instances
- ⚠️ **NEEDS TESTING**: Relation search examples in `docs/search-query-examples.md` (examples 63-70) need validation against actual TriliumNext instances
- ✅ **TESTED & WORKING**: Attribute search examples from "## Attribute Search Examples" section (examples 24-33) confirmed working with live TriliumNext instances
- ⚠️ **UNTESTED**: Two-parameter approach with per-item logic needs validation
- 🔄 **BEING IMPLEMENTED**: `manage_attributes` tool based on comprehensive design specification - modular architecture with CRUD operations
- ✅ **COMPLETED**: Field-specific search unification - `filters` parameter removed and `title`/`content` moved to `noteProperties`
- ✅ **UPDATED**: All documentation examples migrated from `filters` to `noteProperties` syntax (examples 12-23, 47-52)
- ✅ **RESEARCHED**: Date parameter unification feasibility - confirmed TriliumNext native support for date properties and smart date expressions
- ✅ **DOCUMENTED**: Enhanced date search examples (examples 55-62) showing unified noteProperties approach with smart dates and UTC support
- ✅ **IMPLEMENTED**: Date parameter unification - removed legacy date parameters and unified into noteProperties with smart date support
- ✅ **MIGRATED**: All date examples (1-11, 18, 32) updated to use noteProperties syntax with smart date expressions
- ✅ **IMPLEMENTED - TESTED & WORKING**: Relation search support - confirmed working with examples like `~template.title = 'Board'` and `~author.title *= 'Tolkien'`
- ✅ **VALIDATED**: Attribute and relation examples confirmed working with live TriliumNext instances (e.g., `~template.title = 'Board'`, `#collection`)
- **Priority**: Continue performance testing and optimization of unified search approach
- **Next**: Consider advanced search features and enhancements

### ✅ Template Relations Documentation - COMPLETED
- **Complete Guide**: `docs/create-notes-examples/template-relations.md` with comprehensive examples
- **All Templates Covered**: Board, Calendar, Text Snippet, Grid View, List View, Table, Geo Map
- **Best Practices**: Template selection, performance optimization, troubleshooting guide
- **Advanced Features**: Batch operations, inheritable templates, search integration
