# Future Development Plan for TriliumNext MCP

This document outlines planned features and enhancements for the TriliumNext MCP server.

## High Priority Features

### 1. File and Image Note Creation System

**Status**: ⏸️ **TEMPORARILY DISABLED** - Removed due to API implementation challenges with PDF corruption and attachment handling

**Background**: File and image note creation features were previously implemented but caused persistent errors due to incorrect Trilium ETAPI attachment handling. The system has been temporarily disabled to focus on stable text and code note creation.

**Current State**:
- **Removed**: File/image creation logic from `contentProcessor.ts` and `noteManager.ts`
- **Disabled**: URL content retrieval system (`urlContentRetriever.ts` removed)
- **Limited**: Only text and code note creation currently supported
- **Searchable**: File and image notes can still be searched and accessed if created directly in TriliumNext

**Future Implementation Requirements**:
- **Correct Attachment Process**: Research and implement proper Trilium ETAPI attachment creation
- **Binary File Handling**: Ensure proper base64 encoding and file preservation
- **URL Content Retrieval**: Rebuild secure and efficient URL downloading system
- **MIME Type Detection**: Robust file type identification and validation
- **Size Limits**: Configurable file size restrictions with proper error handling
- **Security**: File validation, virus scanning, and secure temporary file handling

### 2. Response Formatter for Standardized Output Formats

**Status**: Proposed enhancement for consistent response formatting across all tools

**Proposed Implementation**:
- **Format Parameter**: Add optional `format` parameter to all MCP tools
- **Multiple Formats**: Support JSON, Markdown, CSV, and structured text outputs
- **Consistent Structure**: Standardized response format across all tools
- **Custom Formatting**: User-defined formatting templates and options

### 3. Intent Resolution Function for Semantic Routing

**Status**: Proposed enhancement for intelligent tool selection and parameter routing

**Proposed Implementation**:
- **Natural Language Analysis**: Parse user requests to determine intent
- **Tool Selection**: Automatically select appropriate tool based on request analysis
- **Parameter Mapping**: Transform user input into tool-specific parameters
- **Context Awareness**: Maintain conversation context for multi-step workflows

### 4. Offset Parameters for search_notes Function

**Status**: Proposed enhancement for paginated search results

**Proposed Implementation**:
- **Offset Parameter**: Add `offset` parameter to `search_notes` function
- **Pagination Support**: Enable browsing through large result sets
- **Combined with Limit**: Work with existing `limit` parameter for complete pagination
- **Performance Optimization**: Efficient handling of large search result sets

### 5. Search and Replace Capabilities

**Status**: Proposed enhancement for content modification operations

**Proposed Implementation**:
- **Pattern Matching**: Support for literal text and regex patterns
- **Targeted Replacement**: Replace content in specific notes or across search results
- **Preview Mode**: Show changes before applying them
- **Batch Operations**: Apply replacements across multiple notes

### 6. Enhanced Note ID Resolution

**Status**: Proposed enhancement for improved note identification and resolution

**Proposed Implementation**:
- **Multiple Resolution Strategies**: Title, content, attributes, and fuzzy matching
- **Confidence Scoring**: Rate match quality and provide alternatives
- **Interactive Selection**: User-friendly choice interface for multiple matches
- **Caching System**: Cache resolution results for performance

### 7. Top/Bottom Append Options for append_note Function

**Status**: Proposed enhancement for controlled content appending

**Proposed Implementation**:
- **Position Control**: Add `position` parameter to control where content is appended
- **Separator Options**: Configurable separators between appended content
- **Template Support**: Use templates for consistent append formatting
- **Conditional Appending**: Conditions for when to append content

---

## Recently Completed Features

### 1. Enhanced `create_note` Function with Attribute Integration

**Status**: ✅ **COMPLETED**

**Implementation**:
- **One-Step Workflow**: `create_note` now accepts an `attributes` parameter, allowing for note and attribute creation in a single, parallelized operation.
- **Performance Optimization**: This one-step approach is 30-50% faster than the previous manual two-step process.
- **Template Integration**: Directly apply templates during note creation.

### 2. Relation Search by NoteId Enhancement

**Status**: ✅ **COMPLETED**

**Implementation**:
- **Dual Search Approach**: The system now supports both string-based and `noteId`-based relation searches.
- **Auto-Enhancement**: The `searchQueryBuilder.ts` intelligently detects `noteId` patterns for template and system relations and enhances the query to use the more precise and performant `noteId` search (`~template.noteId = '_template_grid_view'`) instead of a title search.
- **Flexibility**: Users can still perform flexible string-based searches (e.g., `~author.title *= 'Tolkien'`).

---

*This plan is subject to change based on user feedback and technical constraints.*