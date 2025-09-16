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

**Challenges Addressed**:
- **PDF Corruption**: Binary files were being corrupted during upload due to incorrect attachment process
- **API Complexity**: Trilium ETAPI attachment system requires specific handling that wasn't properly implemented
- **Error Reduction**: Removing unstable features eliminated persistent errors and improved system reliability

**Future Implementation Requirements**:
- **Correct Attachment Process**: Research and implement proper Trilium ETAPI attachment creation
- **Binary File Handling**: Ensure proper base64 encoding and file preservation
- **URL Content Retrieval**: Rebuild secure and efficient URL downloading system
- **MIME Type Detection**: Robust file type identification and validation
- **Size Limits**: Configurable file size restrictions with proper error handling
- **Security**: File validation, virus scanning, and secure temporary file handling

**Technical Implementation Plan**:
```typescript
// Future enhanced file attachment system
interface FileAttachmentSystem {
  // Step 1: Proper attachment creation using correct ETAPI process
  createAttachment(noteId: string, fileData: FileData): Promise<AttachmentResult>

  // Step 2: URL content retrieval with proper error handling
  downloadUrlContent(url: string): Promise<DownloadedContent>

  // Step 3: File validation and MIME type detection
  validateFile(content: Buffer, filename: string): ValidationResult

  // Step 4: Integration with existing content processing
  processFileContent(item: ContentItem): Promise<ProcessedContent>
}
```

**Key Features to Reimplement**:
- 📁 **Local File Upload**: Support for various file types (PDF, images, documents)
- 🌐 **URL Content Retrieval**: Automatic downloading from remote URLs
- 🔗 **Data URL Support**: Base64 encoded embedded content
- 📊 **File Validation**: Type detection, size limits, and security scanning
- ⚡ **Performance**: Streaming uploads and memory-efficient processing
- 🛡️ **Error Handling**: Graceful failure with detailed error messages

**Reimplementation Priority**: High (core functionality that was removed for stability)

**Success Criteria**:
- PDF files upload without corruption and can be viewed in TriliumNext
- Image files are properly attached and displayed
- URL content is downloaded and attached with correct metadata
- System maintains stability and doesn't introduce new errors
- Comprehensive error handling for edge cases

### 2. Note must be read first before performing update operation... (applies to update attributes as well)
- so, we should explicitly suggest people to define 'READ' as well, when people only define 'WRITE' -> because of this case? -> this rule can directly write src/index.js server...
- Need to have a way to prevent editing when note is modified during the process... Note has been unexpectedly modified. Read it again before attempting to write it.


### 2. Multi-Modal Content Support for create_note Function

**Status**: ⏸️ **PARTIALLY IMPLEMENTED** - Text and code content processing working, file/image features temporarily disabled

**Current Implementation**:
- **✅ Text Content**: Smart format detection (HTML/Markdown/plain) with automatic conversion
- **✅ Code Content**: Syntax highlighting with MIME type support
- **✅ Data URLs**: Base64 encoded embedded content (images, other data)
- **⏸️ Local Files**: Temporarily disabled due to API implementation challenges
- **⏸️ Remote URLs**: Temporarily disabled due to API implementation challenges
- **✅ Mixed Content**: Text notes can combine multiple text sections

**Future Enhancement Plan**:
- **Multi-Modal Content Parameter**: Transform `content` from string to `ContentItem[]` array
- **Multiple Content Types**: Support text, local files, remote URLs, and mixed content
- **Intelligent Processing**: Automatic MIME type detection and content optimization
- **URL Fetching**: Built-in HTTP client for remote content fetching
- **Backward Compatibility**: Graceful handling of string content as single-item array

**Enhanced Content Types (Future)**:
- 📝 **Text Content**: HTML, markdown (pre-processed), plain text
- 📁 **Local Files**: Images, documents, code files, media (via file path) - *TO REIMPLEMENT*
- 🌐 **Remote URLs**: Direct URL support for images and files (HTTP/HTTPS) - *TO REIMPLEMENT*
- 🔗 **Data URLs**: Base64 encoded content with MIME type
- 📦 **Mixed Content**: Combine multiple content types in single note

**Enhanced Interface Design**:
```typescript
interface ContentItem {
  type: 'text' | 'file' | 'image' | 'url' | 'data-url';
  content: string;
  mimeType?: string;
  filename?: string;
  encoding?: 'plain' | 'base64' | 'data-url';
  urlOptions?: {
    timeout?: number;
    headers?: Record<string, string>;
    followRedirects?: boolean;
  };
}

interface MultiModalCreateNoteParams {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content: ContentItem[] | string;  // Backward compatible
  mime?: string;
  attributes?: Attribute[];
}
```

**Content Processing Engine**:
```typescript
class MultiModalContentProcessor {
  async processContentItems(items: ContentItem[]): Promise<ProcessResult> {
    const result: ProcessResult = {
      textContent: '',
      attachments: [],
      primaryMimeType: null
    };

    for (const item of items) {
      switch (item.type) {
        case 'text':
          result.textContent += await this.processTextContent(item);
          break;
        case 'file':
          const fileAttachment = await this.processLocalFile(item);
          result.attachments.push(fileAttachment);
          break;
        case 'url':
          const urlAttachment = await this.processRemoteUrl(item);
          result.attachments.push(urlAttachment);
          break;
        case 'image':
          const imageAttachment = await this.processImageContent(item);
          result.attachments.push(imageAttachment);
          break;
        case 'data-url':
          const dataAttachment = await this.processDataUrl(item);
          result.attachments.push(dataAttachment);
          break;
      }
    }

    return result;
  }
}
```

**URL Processing Features**:
- 🌐 **Protocol Support**: HTTP/HTTPS with configurable timeout
- 🔒 **Security**: URL validation, content type verification, size limits
- 🔄 **Redirect Handling**: Optional redirect following for URL shorteners
- 📋 **Custom Headers**: Support for authentication and custom headers
- ⚡ **Caching**: Intelligent caching for frequently accessed URLs

**Example Usage Patterns**:

**Mixed Content (Text + Local Image + Remote File)**:
```typescript
{
  content: [
    { type: 'text', content: '<h1>Project Report</h1>' },
    { type: 'image', content: '/path/to/local/chart.png', mimeType: 'image/png' },
    {
      type: 'url',
      content: 'https://example.com/data.pdf',
      mimeType: 'application/pdf',
      filename: 'external-data.pdf'
    }
  ]
}
```

**Remote Image with Custom Options**:
```typescript
{
  content: [
    {
      type: 'url',
      content: 'https://example.com/image.jpg',
      mimeType: 'image/jpeg',
      urlOptions: {
        timeout: 10000,
        headers: { 'Authorization': 'Bearer token' },
        followRedirects: true
      }
    }
  ]
}
```

**Data URL Content**:
```typescript
{
  content: [
    {
      type: 'data-url',
      content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
      mimeType: 'image/svg+xml'
    }
  ]
}
```

**Backward Compatibility**:
```typescript
// Still works - auto-converted to ContentItem[]
{
  content: '<h1>Simple note</h1>'
}
// Automatically becomes:
{
  content: [
    { type: 'text', content: '<h1>Simple note</h1>' }
  ]
}
```

**Key Technical Features**:
- 🎯 **MIME Type Detection**: Automatic detection from file extensions, URL headers, and content analysis
- 📊 **Size Validation**: Configurable size limits for each content type with clear error messages
- 🔐 **Security**: Comprehensive validation including URL allowlists, file type restrictions, and content scanning
- ⚡ **Performance**: Parallel processing for multiple content items, intelligent caching
- 🛡️ **Error Handling**: Graceful failure with detailed error context and recovery suggestions
- 📈 **Progress Tracking**: Real-time progress reporting for large file operations and URL fetches

**Security Considerations**:
- URL validation and allowlist/denylist support
- File type restrictions and content validation
- Size limits to prevent denial of service
- Secure temporary file handling
- Authentication support for protected URLs
- Content scanning for malicious files

**Performance Optimizations**:
- Parallel content processing
- Streaming file operations for large files
- Intelligent URL caching with TTL
- Memory-efficient base64 encoding
- Connection pooling for HTTP requests

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
1. **Multi-Modal Content Support**: Enhanced `create_note` with text, file, URL, and mixed content support
2. **Response Formatter**: Standardize output formats across all tools with multiple format support
3. **Intent Resolution**: Develop semantic analysis for intelligent tool selection
4. **Search Enhancements**: Implement offset parameters, search/replace functionality, and relation search by noteId
5. **Note Resolution**: Enhance `resolve_note_id` with multiple resolution strategies
6. **Append Options**: Add position control and template support to `append_note`
7. **create_note Enhancement**: Complete Phase 2 with integrated attribute support

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

**Phase 1** (Near-term): **File and Image Note Creation System** - Reimplement with proper ETAPI attachment handling and fix PDF corruption issues
**Phase 2** (Mid-term): Complete multi-modal content support and enhanced create_note function with attribute integration
**Phase 3** (Future): Response formatting, intent resolution, and search enhancements

## Implementation Status

**Completed**:
- ✅ Permission-based attribute management system
- ✅ Modular architecture with separation of concerns
- ✅ Comprehensive search functionality with unified criteria
- ✅ Relation search and template support
- ✅ Field-specific search integration
- ✅ Enhanced note ID resolution

**In Progress**:
- 🔄 Multi-modal content support for create_note function (partially implemented - text/code working, file/image temporarily disabled)

**Proposed**:
- 📁 **File and Image Note Creation System** - Reimplement with proper ETAPI attachment handling (high priority)
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
