# TriliumNext MCP - Hash-Based Validation & Content Type Safety Implementation

## Overview

This document documents the completed implementation of hash-based validation and content type safety for the TriliumNext MCP server's `update_note` function. The implementation prevents concurrent modification conflicts while ensuring content type requirements are properly enforced using Trilium's native `blobId` system.

## ✅ COMPLETED IMPLEMENTATION

## Current State Analysis

### ETAPI Note Object Structure (from OpenAPI spec)

Based on the `openapi.yaml` file in your repository, the Note object includes these key fields:

```yaml
Note:
  type: object
  properties:
    noteId:
      type: string
      readOnly: true
    title:
      type: string
    type:
      type: string
      enum: [text, code, render, file, image, search, relationMap, book, noteMap, mermaid, webView, shortcut, doc, contentWidget, launcher]
    mime:
      type: string
    isProtected:
      type: boolean
      readOnly: true
    blobId:
      type: string
      description: ID of the blob object which effectively serves as a content hash
    attributes:
      $ref: "#/components/schemas/AttributeList"
      readOnly: true
    parentNoteIds:
      type: array
      items:
        $ref: "#/components/schemas/EntityId"
      readOnly: true
    childNoteIds:
      type: array
      items:
        $ref: "#/components/schemas/EntityId"
      readOnly: true
    dateCreated:
      $ref: "#/components/schemas/LocalDateTime"
    dateModified:
      $ref: "#/components/schemas/LocalDateTime"
      readOnly: true
    utcDateCreated:
      $ref: "#/components/schemas/UtcDateTime"
    utcDateModified:
      $ref: "#/components/schemas/UtcDateTime"
      readOnly: true
```

### Current Implementation Issues

1. **Limited get_note Response**: Currently returns only basic note metadata and content
2. **No Hash Validation**: update_note doesn't validate content hasn't been modified
3. **Missing Content Type Validation**: update_note doesn't ensure content matches note type requirements
4. **No Concurrency Control**: Multiple users can overwrite each other's changes

## Hash-Based Validation Architecture

### Core Components

#### 1. Enhanced get_note Response
- Returns complete Note object with all ETAPI fields
- Includes `blobId` for content hash validation
- Includes `type` field for content type validation
- Includes `utcDateModified` for timestamp validation

#### 2. Enhanced update_note Parameters
- **New `expectedHash` parameter**: Optional blobId for optimistic concurrency
- **New `validateType` parameter**: Boolean flag for content type validation
- **Enhanced error messages**: Clear guidance on conflicts and type mismatches

#### 3. Content Type Validation System
- **Auto-detection**: Detect note type from existing note
- **Content Requirements**: Validate content matches note type (HTML vs plain text)
- **Auto-correction**: Automatically wrap plain text in HTML for text notes
- **Error Handling**: Clear messages for uncorrectable issues

## ✅ IMPLEMENTED FEATURES

### 1. BlobId-Based Hash Validation ✅ COMPLETED

**Key Change**: Uses Trilium's native `blobId` instead of manual MD5 hash generation

**Implementation**:
```typescript
// get_note returns blobId as contentHash
const blobId = noteData.blobId;
return {
  note: noteData,
  content: noteContent,
  contentHash: blobId, // Use blobId as content hash
  contentRequirements
};

// update_note validates against blobId
if (expectedHash) {
  const currentBlobId = currentNote.data.blobId;
  if (currentBlobId !== expectedHash) {
    return { noteId, message: "CONFLICT: Note has been modified by another user...", conflict: true };
  }
}
```

**Benefits**:
- Native Trilium content identification
- No manual hash generation needed
- Perfect reliability and performance

### 2. Required Type Parameter ✅ COMPLETED

**Key Change**: Added required `type` parameter to `update_note` for consistency with `create_note`

**Implementation**:
```typescript
// Tool definition
type: {
  type: "string",
  enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "shortcut", "doc", "contentWidget", "launcher"],
  description: "Type of note (aligned with TriliumNext ETAPI specification). This determines content validation requirements."
},
required: ["noteId", "type", "content", "expectedHash"]
```

**Benefits**:
- Consistent API with create_note
- Explicit content validation
- Clear type safety

### 3. Required Hash Validation ✅ COMPLETED

**Key Change**: Made `expectedHash` required for data integrity

**Implementation**:
```typescript
// Handler validation
if (!args.expectedHash) {
  throw new McpError(
    ErrorCode.InvalidParams,
    "Missing required parameter 'expectedHash'. You must call get_note first to retrieve the current blobId (content hash) before updating. This ensures data integrity by preventing overwriting changes made by other users."
  );
}
```

**Benefits**:
- Prevents concurrent modification conflicts
- Enforces get_note → update_note workflow
- Ensures data integrity

### 4. Always-On Content Validation ✅ COMPLETED

**Key Change**: Removed `validateType` parameter, now always validates content

**Implementation**:
```typescript
// Content validation always enabled
const validationResult = await validateContentForNoteType(
  rawContent as ContentItem[],
  type as NoteType,
  currentContent.data
);

if (!validationResult.valid) {
  return {
    noteId,
    message: `CONTENT_TYPE_MISMATCH: ${validationResult.error}`,
    revisionCreated: false,
    conflict: false
  };
}
```

**Benefits**:
- Simplified API (fewer parameters)
- Consistent content safety
- Automatic HTML correction

### 5. Enhanced Content Type Validation ✅ COMPLETED

**Features**:
- **Text Notes**: Auto-detect HTML/Markdown/plain text, auto-wrap plain text in `<p>` tags
- **Code Notes**: Plain text only, reject HTML content
- **Mermaid Notes**: Plain text only, reject HTML content
- **Other Types**: Flexible content requirements

**Implementation**:
```typescript
export function getContentRequirements(noteType: NoteType): {
  requiresHtml: boolean;
  description: string;
  examples: string[];
} {
  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      return {
        requiresHtml: true,
        description: "HTML content required (wrap plain text in <p> tags)",
        examples: ["<p>Hello world</p>", "<strong>Bold text</strong>"]
      };

    case 'code':
    case 'mermaid':
      return {
        requiresHtml: false,
        description: "Plain text only (no HTML tags)",
        examples: ["def fibonacci(n):", "graph TD; A-->B"]
      };

    default:
      return {
        requiresHtml: false,
        description: "Content optional or any format accepted",
        examples: ["", "Any content format"]
      };
  }
}
```

## ✅ WORKFLOW EXAMPLES

### Basic Update Workflow

```typescript
// Step 1: Get current note state with blobId
const noteResponse = await get_note({
  noteId: "abc123"
});

// Returns: {
//   note: { noteId: "abc123", type: "text", blobId: "blobId_123", ... },
//   content: "<p>Original content</p>",
//   contentHash: "blobId_123",
//   contentRequirements: {...}
// }

// Step 2: Update with blobId validation
const updateResponse = await update_note({
  noteId: "abc123",
  type: "text",
  content: [{ type: "text", content: "<p>Updated content</p>" }],
  expectedHash: "blobId_123" // Required from get_note response
});

// Success: "Note abc123 updated successfully (revision created)"
```

### Content Auto-Correction Example

```typescript
// Get current note
const note = await get_note({ noteId: "abc123" });

// Update with plain text (auto-corrected to HTML)
const result = await update_note({
  noteId: "abc123",
  type: "text",
  content: [{ type: "text", content: "Hello world" }], // Plain text
  expectedHash: note.contentHash
});

// Result: "Note abc123 updated successfully (revision created) (content auto-corrected)"
// Content becomes: "<p>Hello world</p>"
```

### Conflict Detection Example

```typescript
// User A gets note
const noteA = await get_note({ noteId: "abc123" });

// User B gets same note
const noteB = await get_note({ noteId: "abc123" });

// User A updates successfully
await update_note({
  noteId: "abc123",
  type: "text",
  content: [{ type: "text", content: "<p>User A's changes</p>" }],
  expectedHash: noteA.contentHash
});

// User B tries to update with old blobId
const result = await update_note({
  noteId: "abc123",
  type: "text",
  content: [{ type: "text", content: "<p>User B's changes</p>" }],
  expectedHash: noteB.contentHash // Old blobId
});

// Result: "CONFLICT: Note has been modified by another user. Current blobId: blobId_456, expected: blobId_123. Please get the latest note content and retry."
```

### Type Validation Example

```typescript
// Get code note
const codeNote = await get_note({ noteId: "code123" });

// Try to update with HTML content
const result = await update_note({
  noteId: "code123",
  type: "code",
  content: [{ type: "text", content: "<p>function test() {}</p>" }], // HTML in code note
  expectedHash: codeNote.contentHash
});

// Result: "CONTENT_TYPE_MISMATCH: code notes require plain text only, but HTML content was detected. Remove HTML tags and use plain text format. Expected format: def fibonacci(n):, graph TD; A-->B"
```

## Implementation Priority

### Phase 1: Core Infrastructure (High Priority)
1. **Enhanced get_note response** - Return complete ETAPI Note object
2. **Hash generation utility** - MD5 hash for content validation
3. **Basic hash validation** - Prevent concurrent modifications

### Phase 2: Content Type Safety (Medium Priority)
1. **Content type validation** - Ensure content matches note type
2. **Auto-correction** - Fix common issues (plain text → HTML)
3. **Enhanced error messages** - Clear guidance for users

### Phase 3: Advanced Features (Low Priority)
1. **Optimistic concurrency** - Retry mechanisms for conflicts
2. **Performance optimization** - Caching and batch operations
3. **Advanced validation** - Schema validation for specific note types

## Migration Strategy

### Backward Compatibility
- All existing parameters remain unchanged
- New parameters are optional with sensible defaults
- Existing workflows continue to work without modification

### Gradual Adoption
1. **Stage 1**: Enhanced get_note responses (no breaking changes)
2. **Stage 2**: Optional hash validation (opt-in)
3. **Stage 3**: Default hash validation (opt-out)
4. **Stage 4**: Required hash validation (future release)

## Benefits

### For Users
- **No More Data Loss**: Prevent accidental overwrites of concurrent changes
- **Content Type Safety**: Automatic validation and correction of content formats
- **Clear Error Messages**: Actionable guidance when issues occur
- **Better Workflow**: Structured get → update → retry process

### For Developers
- **Robust API**: Hash-based concurrency control prevents race conditions
- **Type Safety**: Content validation ensures data integrity
- **Extensible Design**: Easy to add new validation rules and note types
- **Comprehensive Testing**: Clear test scenarios for all validation cases

## Testing Strategy

### Unit Tests
- Hash generation accuracy
- Content type validation logic
- Auto-correction functionality
- Error message generation

### Integration Tests
- End-to-end workflow (get → update → retry)
- Conflict detection and handling
- Content type validation across all note types
- Performance impact assessment

### User Acceptance Tests
- Real-world usage scenarios
- Concurrent user simulation
- Error recovery procedures
- Migration compatibility verification

## Risk Assessment

### Low Risk
- Enhanced get_note response (backward compatible)
- Optional hash validation (opt-in)
- Content type validation (informative errors)

### Medium Risk
- Default hash validation (workflow changes)
- Auto-correction behavior (content modification)

### Mitigation Strategies
- Gradual rollout with feature flags
- Comprehensive documentation and examples
- Clear migration guide for existing users
- Extensive testing of edge cases

## Success Metrics

### Technical Metrics
- Zero incidents of concurrent data overwrites
- 100% content type validation coverage
- <100ms additional latency for hash validation
- 99.9% backward compatibility maintained

### User Experience Metrics
- Clear understanding of conflict resolution workflow
- Reduced support tickets for content-related issues
- Successful adoption of new validation features
- Positive feedback on auto-correction behavior

## Conclusion

This implementation provides robust hash-based validation and content type safety while maintaining backward compatibility. The phased approach allows for gradual adoption and thorough testing at each stage. The enhanced update_note function will prevent data loss, ensure content integrity, and provide a better user experience for TriliumNext MCP users.