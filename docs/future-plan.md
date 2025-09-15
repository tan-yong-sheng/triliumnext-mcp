# Future Development Plan for TriliumNext MCP

This document outlines planned features and enhancements for the TriliumNext MCP server.

## High Priority Features

### 1. File must be read first before performing update operation... (applies to update attributes as well)
- so, we should explicitly suggest people to define 'READ' as well, when people only define 'WRITE' -> because of this case? -> this rule can directly write src/index.js server...

### 2. Remove marked Library and Require HTML Input

**Status**: **HIGH PRIORITY** - Proposed architectural improvement for content processing

**Overview**: Remove the `marked` library dependency and require HTML input for all content parameters in `create_note`, `update_note`, and `append_note` functions.

**Current Issues**:
- **Type Conflicts**: Markdown auto-conversion is incompatible with many TriliumNext note types (code, files, mermaid, canvas, etc.)
- **Content Corruption**: Risk of mangled JSON, YAML, code files, and structured content
- **False Positives**: Simple Markdown detection incorrectly processes non-Markdown content
- **ETAPI Misalignment**: TriliumNext ETAPI explicitly expects "html content", not Markdown

**Proposed Changes**:
- **Remove Dependency**: Eliminate `marked` library from package.json
- **Simplify Code**: Remove `src/utils/contentProcessor.ts` entirely
- **Direct HTML Input**: Require users to provide HTML-formatted content directly
- **Update Documentation**: Clear specification that content parameters expect HTML

**Implementation Impact**:
```typescript
// Current workflow:
rawContent → markdownDetection → htmlConversion → triliumNext

// Proposed workflow:
htmlContent → triliumNext
```

**Files to Modify**:
- `package.json`: Remove `marked` dependency
- `src/utils/contentProcessor.ts`: Remove entire file
- `src/modules/noteManager.ts`: Remove `processContent()` calls, use content directly
- `src/modules/noteHandler.ts`: Update validation and error handling
- Documentation: Update all content parameter descriptions

**Benefits**:
- ✅ **Type Safety**: Proper content handling for all 15 TriliumNext note types
- ✅ **No Corruption**: Eliminate risk of automatic conversion damaging structured content
- ✅ **ETAPI Alignment**: Matches TriliumNext's "html content" specification
- ✅ **Simplified Architecture**: Remove complexity and potential failure points
- ✅ **Better Performance**: Eliminate parsing overhead
- ✅ **User Control**: Users can use preferred Markdown-to-HTML tools

**User Migration**:
- **Current Users**: Will need to convert Markdown to HTML before content submission
- **Tool Recommendations**: Document suggested Markdown-to-HTML conversion tools
- **Examples**: Provide HTML equivalents for common Markdown patterns
- **Transition Guide**: Clear migration path for existing workflows

**Technical Justification**:
TriliumNext supports 15 diverse note types including:
- `code` notes with specific MIME types (application/json, text/javascript, etc.)
- `mermaid` diagrams with text/vnd.mermaid content
- `canvas` notes with application/json structure
- `file` attachments with binary/base64 content
- `relationMap` notes with complex JSON structures

Markdown conversion is inappropriate and potentially harmful for these non-text note types.

**Priority**: HIGH - This is a fundamental architectural improvement that affects content integrity and system reliability.

### 2. File Upload Capabilities for create_note Function

**Status**: Proposed enhancement for note creation with file attachments

**Proposed Implementation**:
- **File Parameter**: Add optional `filePath` parameter to `create_note` function
- **Automatic Type Detection**: Auto-detect MIME type based on file extension
- **Content Encoding**: Handle file content encoding and base64 conversion if needed
- **Size Validation**: Validate file size limits and provide clear error messages

**Key Features**:
- 📁 **Multiple File Types**: Support images, documents, code files, and other media
- 🔄 **Automatic Processing**: Handle file reading, encoding, and upload preparation
- 📋 **Metadata Preservation**: Preserve file metadata and original filenames
- ⚡ **Performance Optimization**: Efficient file handling for large files

**Interface Design**:
```typescript
interface CreateNoteWithFileParams {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content?: string;        // Optional for file notes
  filePath?: string;      // Path to file for upload
  mime?: string;          // Auto-detected from file
  attributes?: Attribute[];
}
```

**Use Cases**:
- Image notes with automatic MIME type detection
- Document attachments with metadata preservation
- Code files with syntax highlighting
- Media files with proper content type handling

### 3. Response Formatter for Standardized Output Formats

**Status**: Proposed enhancement for consistent response formatting across all tools

**Proposed Implementation**:
- **Format Parameter**: Add optional `format` parameter to all MCP tools
- **Multiple Formats**: Support JSON, Markdown, CSV, and structured text outputs
- **Consistent Structure**: Standardized response format across all tools
- **Custom Formatting**: User-defined formatting templates and options

**Key Features**:
- 📊 **Multiple Output Formats**: JSON, Markdown, CSV, plain text, structured lists
- 🎯 **Consistent Structure**: Standardized success/error response format
- 🔧 **Custom Templates**: User-defined formatting for specific use cases
- 📈 **Rich Metadata**: Include execution time, result count, and debugging info

**Interface Design**:
```typescript
interface FormatOptions {
  format?: 'json' | 'markdown' | 'csv' | 'text' | 'structured';
  includeMetadata?: boolean;
  template?: string;
  fields?: string[];  // For CSV/structured outputs
}
```

**Response Structure**:
```typescript
interface FormattedResponse {
  success: boolean;
  data: any;
  metadata?: {
    executionTime: number;
    resultCount: number;
    tool: string;
    timestamp: string;
  };
  errors?: string[];
}
```

### 4. Intent Resolution Function for Semantic Routing

**Status**: Proposed enhancement for intelligent tool selection and parameter routing

**Proposed Implementation**:
- **Natural Language Analysis**: Parse user requests to determine intent
- **Tool Selection**: Automatically select appropriate tool based on request analysis
- **Parameter Mapping**: Transform user input into tool-specific parameters
- **Context Awareness**: Maintain conversation context for multi-step workflows

**Key Features**:
- 🎯 **Semantic Understanding**: Analyze user intent beyond keyword matching
- 🔄 **Automatic Routing**: Select best tool and parameters automatically
- 📝 **Context Preservation**: Maintain state across multiple requests
- 🧠 **Learning Capability**: Improve routing based on usage patterns

**Interface Design**:
```typescript
interface IntentResolutionParams {
  query: string;
  context?: IntentContext;
  preferences?: UserPreferences;
}

interface IntentResolutionResult {
  tool: string;
  parameters: any;
  confidence: number;
  alternatives?: ToolAlternative[];
}
```

**Use Cases**:
- "Find my meeting notes" → automatically routes to `search_notes` with appropriate filters
- "Create a new project note" → routes to `create_note` with suggested parameters
- "Update the budget spreadsheet" → identifies target note and routes to `update_note`


### 5. Offset Parameters for search_notes Function

**Status**: Proposed enhancement for paginated search results

**Proposed Implementation**:
- **Offset Parameter**: Add `offset` parameter to `search_notes` function
- **Pagination Support**: Enable browsing through large result sets
- **Combined with Limit**: Work with existing `limit` parameter for complete pagination
- **Performance Optimization**: Efficient handling of large search result sets

**Key Features**:
- 📄 **Paginated Results**: Browse through large search result sets efficiently
- ⚡ **Performance Optimized**: Efficient handling of offset queries
- 🔢 **Flexible Pagination**: Customizable page sizes and navigation
- 📊 **Result Metadata**: Include total count and pagination info

**Interface Design**:
```typescript
interface SearchWithOffsetParams {
  text?: string;
  searchCriteria?: any[];
  limit?: number;
  offset?: number;     // New parameter for pagination
}
```

**Response Structure**:
```typescript
interface PaginatedSearchResponse {
  results: any[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

### 6. Search and Replace Capabilities

**Status**: Proposed enhancement for content modification operations

**Proposed Implementation**:
- **Pattern Matching**: Support for literal text and regex patterns
- **Targeted Replacement**: Replace content in specific notes or across search results
- **Preview Mode**: Show changes before applying them
- **Batch Operations**: Apply replacements across multiple notes

**Key Features**:
- 🔍 **Pattern Matching**: Support for literal text and regular expressions
- 🎯 **Targeted Operations**: Replace in specific notes or search result sets
- 👀 **Preview Mode**: Show proposed changes before applying
- 📦 **Batch Processing**: Apply changes across multiple notes efficiently

**Interface Design**:
```typescript
interface SearchReplaceParams {
  searchPattern: string;
  replacement: string;
  targetNotes?: string[];  // Specific note IDs
  searchCriteria?: any[]; // Or use search to find target notes
  useRegex?: boolean;
  caseSensitive?: boolean;
  previewOnly?: boolean;
}
```

**Use Cases**:
- Update outdated terminology across project notes
- Fix common spelling errors in documentation
- Replace deprecated API references in code notes
- Standardize formatting across multiple notes

### 7. Enhanced Note ID Resolution

**Status**: Proposed enhancement for improved note identification and resolution

**Proposed Implementation**:
- **Multiple Resolution Strategies**: Title, content, attributes, and fuzzy matching
- **Confidence Scoring**: Rate match quality and provide alternatives
- **Interactive Selection**: User-friendly choice interface for multiple matches
- **Caching System**: Cache resolution results for performance

**Key Features**:
- 🎯 **Multi-Strategy Resolution**: Title, content, attributes, and semantic matching
- 📊 **Confidence Scoring**: Rate match quality with detailed explanations
- 🎮 **Interactive Selection**: User-friendly interface for choosing from matches
- ⚡ **Performance Caching**: Cache resolution results for faster subsequent lookups

**Enhanced Interface Design**:
```typescript
interface EnhancedResolveParams {
  identifier: string;
  strategies?: ('title' | 'content' | 'attributes' | 'fuzzy' | 'semantic')[];
  maxResults?: number;
  minConfidence?: number;
  context?: string;
}

interface ResolveResult {
  noteId?: string;
  confidence: number;
  matchStrategy: string;
  alternatives?: AlternativeMatch[];
  reasoning: string;
}
```

### 8. Top/Bottom Append Options for append_note Function

**Status**: Proposed enhancement for controlled content appending

**Proposed Implementation**:
- **Position Control**: Add `position` parameter to control where content is appended
- **Separator Options**: Configurable separators between appended content
- **Template Support**: Use templates for consistent append formatting
- **Conditional Appending**: Conditions for when to append content

**Key Features**:
- 📍 **Position Control**: Append at top, bottom, or before/after specific content
- 📏 **Separator Options**: Configurable separators and formatting
- 🎨 **Template Support**: Use templates for consistent append formatting
- 🔄 **Conditional Logic**: Smart conditions for when and how to append

**Interface Design**:
```typescript
interface EnhancedAppendParams {
  noteId: string;
  content: string;
  position?: 'top' | 'bottom' | 'before' | 'after';
  targetContent?: string;  // For position-relative appends
  separator?: string;
  template?: string;
  condition?: {
    contentExists?: boolean;
    maxLength?: number;
    containsPattern?: string;
  };
}
```

**Use Cases**:
- Add new entries to the top of journal notes
- Append status updates to the bottom of project notes
- Insert content before specific sections
- Add timestamps or metadata with consistent formatting

### 9. Enhanced create_note Function with Attribute Integration

**Status**: 🔄 **READY FOR IMPLEMENTATION** - Phase 2 of attribute management system

**Proposed Implementation**:
- **One-Step Workflow**: Single API call with internal parallel processing
- **Optional Attributes**: Add `attributes` parameter to `create_note` function
- **Performance Optimization**: 30-50% improvement over manual two-step approach
- **Template Integration**: Direct template application during creation

**Key Features**:
- ⚡ **Performance**: 30-50% faster than manual create + attributes workflow
- 🎯 **One-Step**: Single function call for complete note creation with metadata
- 🔄 **Backward Compatible**: Existing usage patterns remain unchanged
- 📋 **Template Support**: Direct template application during creation

**Interface Design**:
```typescript
interface EnhancedCreateNoteParams {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content: string;
  mime?: string;
  attributes?: Attribute[];  // New optional parameter
}
```

**Performance Architecture**:
```typescript
async function create_note_with_attributes(params) {
  // Parallel processing: note creation + attribute preparation
  const [noteResult, attributePreparation] = await Promise.all([
    create_basic_note(params),
    params.attributes?.length ? prepare_attribute_requests(params.attributes) : null
  ]);

  // Apply attributes if needed
  if (attributePreparation) {
    await execute_batch_attributes(noteResult.noteId, attributePreparation);
  }

  return enhanced_response(noteResult, params.attributes);
}
```

### 10. Relation Search by NoteId Enhancement

**Status**: Proposed enhancement for precise relation searches using noteId values

**Proposed Implementation**:
- **Dual Search Approach**: Support both string-based and noteId-based relation searches
- **NoteId Precision**: Enable precise relation targeting for specific relation types
- **Auto-Enhancement**: Intelligent detection and conversion of noteId values in relation searches
- **Backward Compatibility**: Maintain existing string-based search functionality

**Key Features**:
- 🎯 **NoteId Precision**: Direct targeting of relations by noteId for exact matches
- 🔍 **Smart Detection**: Automatically identify noteId patterns in search values
- 📝 **Dual Syntax Support**: Support both `~template.noteId = '_template_grid_view'` and `~template.title = 'Grid View'`
- ⚡ **Performance Optimization**: Faster searches when using noteId for template and system relations
- 🔄 **Backward Compatible**: Existing string-based searches continue to work unchanged

**Technical Analysis**:
Based on research of TriliumNext relation patterns, different relation types have different requirements:

**Relations that benefit from noteId search:**
- **Template Relations**: `~template.noteId = '_template_grid_view'` (precise template targeting)
- **System Relations**: Built-in relations that reference specific system notes
- **Internal Links**: Relations pointing to specific known notes within the system

**Relations better suited for string search:**
- **User-defined Relations**: `~author.title *= 'Tolkien'` (fuzzy matching on content)
- **Category Relations**: `~category.title = 'Programming'` (descriptive matching)
- **Dynamic Relations**: Relations where target notes may change or have variable titles

**Enhanced Search Architecture**:
```typescript
interface EnhancedRelationSearch {
  property: string;  // e.g., 'template', 'author', 'category'
  type: 'relation';
  op: string;        // '=', '!=', 'exists', 'contains', etc.
  value: string;     // Can be noteId or string value
  searchMode?: 'auto' | 'noteId' | 'string';  // New parameter for search control
}

// Enhanced auto-enhancement logic in searchQueryBuilder.ts
function enhanceRelationSearch(criteria: SearchCriteria): SearchCriteria {
  const { property, value } = criteria;

  // Auto-detect noteId patterns
  if (isNoteIdPattern(value) && isTemplateRelation(property)) {
    // Convert to noteId search: ~template.noteId = '_value'
    return {
      ...criteria,
      property: `${property}.noteId`,
      value: value.startsWith('_') ? value : `_${value}`
    };
  }

  // Default to string search with property enhancement
  if (!property.includes('.') && criteria.op !== 'exists' && criteria.op !== 'not_exists') {
    return {
      ...criteria,
      property: `${property}.title`
    };
  }

  return criteria;
}
```

**NoteId Pattern Detection**:
```typescript
function isNoteIdPattern(value: string): boolean {
  // Common TriliumNext noteId patterns:
  // - Internal templates: _template_grid_view, _template_calendar
  // - System notes: _root, _hidden
  // - Regular noteIds: alphanumeric strings (usually 8+ chars)

  const noteIdPatterns = [
    /^_[a-zA-Z0-9_]+$/,      // Templates and system notes
    /^[a-zA-Z0-9]{8,}$/,      // Regular note IDs
    /^_[a-zA-Z0-9]+$/,        // Simple system notes
  ];

  return noteIdPatterns.some(pattern => pattern.test(value));
}

function isTemplateRelation(property: string): boolean {
  const templateRelations = ['template', 'prototype', 'archetype'];
  return templateRelations.includes(property.toLowerCase());
}
```

**Implementation Strategy**:
1. **Enhanced Query Builder**: Modify `searchQueryBuilder.ts` to include intelligent noteId detection
2. **Search Mode Parameter**: Add optional `searchMode` parameter for user control over search type
3. **Documentation Updates**: Provide clear examples of when to use noteId vs string searches
4. **Validation**: Add validation to ensure noteId values exist when noteId search mode is used
5. **Performance Testing**: Benchmark noteId searches vs string searches for optimization

**Examples of Enhanced Searches**:
```typescript
// Auto-enhanced to noteId search (precise template targeting)
{
  property: "template",
  type: "relation",
  op: "=",
  value: "_template_grid_view"
}
// Generates: ~template.noteId = '_template_grid_view'

// String-based search (fuzzy author matching)
{
  property: "author",
  type: "relation",
  op: "contains",
  value: "Tolkien"
}
// Generates: ~author.title *= 'Tolkien'

// Explicit noteId search mode
{
  property: "template",
  type: "relation",
  op: "=",
  value: "grid_view",
  searchMode: "noteId"
}
// Generates: ~template.noteId = '_grid_view'
```

**Benefits**:
- ✅ **Precision**: NoteId searches provide exact matching for system and template relations
- ✅ **Performance**: Faster search execution when targeting specific known notes
- ✅ **Flexibility**: Users can choose between precision (noteId) and flexibility (string)
- ✅ **Intelligent**: Auto-detection reduces user cognitive load for common patterns
- ✅ **Backward Compatible**: Existing search patterns continue to work unchanged

**User Experience Improvements**:
- Clear documentation on when to use noteId vs string searches
- Auto-enhancement provides "best of both worlds" approach
- Optional searchMode parameter for advanced users who want explicit control
- Better search results for template and system relation use cases

**Implementation Priority**: Medium-High (enhances core search functionality without breaking changes)


**Implementation Strategy**:
1. **marked Library Removal**: Remove markdown conversion and require HTML input for content parameters
2. **File Upload Implementation**: Add file handling capabilities to `create_note` function
3. **Response Formatter**: Standardize output formats across all tools with multiple format support
4. **Intent Resolution**: Develop semantic analysis for intelligent tool selection
5. **Search Enhancements**: Implement offset parameters, search/replace functionality, and relation search by noteId
6. **Note Resolution**: Enhance `resolve_note_id` with multiple resolution strategies
7. **Append Options**: Add position control and template support to `append_note`
8. **create_note Enhancement**: Complete Phase 2 with integrated attribute support

## Future Architecture Considerations
- Maintain backward compatibility with existing tools
- Design APIs for extensibility and performance
- Consider security implications of file uploads and batch operations
- Ensure robust error handling and user feedback
- Implement comprehensive logging and monitoring
- Design for scalability and large dataset handling
- Consider offline capabilities and caching strategies

## Implementation Notes

### File Upload Considerations
- **Security**: Validate file types, sizes, and implement virus scanning if possible
- **Performance**: Implement streaming upload for large files and memory optimization
- **Storage**: Consider TriliumNext storage limitations and quota management
- **Metadata**: Preserve file metadata and handle various encoding formats
- **Error Handling**: Provide clear error messages for upload failures

### Response Formatting Considerations
- **Consistency**: Maintain consistent response structure across all tools
- **Extensibility**: Design format system to accommodate future output types
- **Performance**: Optimize formatting for large result sets
- **User Experience**: Provide clear, human-readable outputs with machine-readable options
- **Localization**: Consider internationalization for error messages and outputs

### Intent Resolution Considerations
- **Privacy**: Ensure user query analysis respects privacy and data protection
- **Accuracy**: Balance automation with user control and confirmation
- **Context**: Implement appropriate context management and retention policies
- **Fallback**: Provide clear fallback mechanisms when intent resolution fails
- **Learning**: Consider user feedback loops for improving routing accuracy

### Performance Considerations
- **Caching**: Implement intelligent caching for frequently accessed data
- **Batching**: Support batch operations for improved performance
- **Streaming**: Consider streaming responses for large datasets
- **Concurrency**: Handle concurrent requests efficiently
- **Memory**: Optimize memory usage for large file operations and search results

### Relation and Label Management Considerations
- **ETAPI Compatibility**: Ensure all operations work within TriliumNext's External API limitations
- **Atomic Operations**: Label/relation changes should be transactional where possible
- **Permission Handling**: Respect note protection and access controls
- **Conflict Resolution**: Handle concurrent modifications gracefully
- **Data Integrity**: Validate relation targets and label constraints

## Timeline

**Phase 1** (Immediate): Remove marked library and require HTML input (HIGH PRIORITY)
**Phase 2** (Near-term): Enhanced create_note function with attribute integration
**Phase 3** (Mid-term): File upload capabilities and response formatting
**Phase 4** (Future): Intent resolution and search enhancements

## Implementation Status

**Completed**:
- ✅ Permission-based attribute management system
- ✅ Modular architecture with separation of concerns
- ✅ Comprehensive search functionality with unified criteria
- ✅ Relation search and template support
- ✅ Field-specific search integration
- ✅ Enhanced note ID resolution

**In Progress**:
- 🔄 Enhanced create_note function with integrated attribute support (Phase 2)

**Proposed**:
- 🚨 **HIGH PRIORITY**: Remove marked library and require HTML input for content parameters
- 📋 File upload capabilities for create_note function
- 📊 Response formatter for standardized output formats
- 🎯 Intent resolution function for semantic routing
- 📄 Offset parameters for search_notes function
- 🔍 Search and replace capabilities
- 🎯 **Relation search by noteId enhancement** for precise template and system relation targeting
- 🧠 Enhanced note ID resolution with multiple strategies
- 📍 Top/bottom append options for append_note function

---

**Note**: All relation and label management features are proposals and not determined plans yet. Implementation will depend on:
- User feedback and demand
- ETAPI capabilities and limitations  
- Technical feasibility assessment
- Resource availability and priorities

*This plan is subject to change based on user feedback and technical constraints.*


---

## DISPOSED PLAN:

### search_and_replace feature [Don't want, it's hard to implement because Trilium Note doesn't support it natively]
- Performs search-and-replace operations in a note.
- Proposed arguments: targetType, replacements, useRegex?, replaceAll?
