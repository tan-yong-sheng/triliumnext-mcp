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

## Implementation Details

### Phase 1: Enhanced get_note Response

#### Current Implementation
```typescript
// Current get_note returns limited data
const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
const noteData = noteResponse.data;

return {
  note: noteData,
  content: noteContent  // Only basic fields
};
```

#### Enhanced Implementation
```typescript
// Enhanced get_note returns complete ETAPI Note object
const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
const noteData = noteResponse.data;

// Calculate content hash for validation
const contentHash = await generateContentHash(noteContent);

return {
  note: {
    ...noteData,  // Complete ETAPI Note object with all fields
    _contentHash: contentHash,  // Additional hash for validation
    _contentRequirements: getContentRequirements(noteData.type)
  },
  content: noteContent
};
```

#### Hash Generation Function
```typescript
async function generateContentHash(content: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

function getContentRequirements(noteType: string): {
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
        examples: [""]
      };
  }
}
```

### Phase 2: Enhanced update_note with Hash Validation

#### New Tool Definition
```typescript
{
  name: "update_note",
  description: "Complete content replacement with hash-based concurrency control and content type validation. ALWAYS call get_note first to obtain current hash and note type. The system will prevent updates if the note has been modified by another user (hash mismatch) or if content doesn't match note type requirements.",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "string",
        description: "ID of the note to update"
      },
      content: {
        type: "array",
        description: "New content as ContentItem array. Content requirements by note type: TEXT NOTES - require HTML content (wrap plain text in <p> tags, e.g., '<p>hello world</p>'); CODE/MERMAID NOTES - require plain text (no HTML tags); BOOK/SEARCH NOTES - can be empty string. Use HTML formatting for text notes: <p> for paragraphs, <strong> for bold, <em> for italic, etc.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["text", "data-url"],
              description: "Content type: 'text' for smart format detection (HTML/Markdown/plain), 'data-url' for embedded data"
            },
            content: {
              type: "string",
              description: "Content data - for text type: automatically detected as HTML/Markdown/plain; for file/image: base64 encoded; for url/data-url: URL string"
            },
            mimeType: {
              type: "string",
              description: "MIME type for file/image content (e.g., 'image/png', 'application/pdf')"
            },
            filename: {
              type: "string",
              description: "Filename for file/image content"
            }
          },
          required: ["type", "content"]
        }
      },
      expectedHash: {
        type: "string",
        description: "Content hash from get_note response for optimistic concurrency control. Prevents overwriting changes made by other users. Omit to bypass validation (not recommended)."
      },
      validateType: {
        type: "boolean",
        description: "Whether to validate content matches note type requirements (default: true). Set to false only if you're certain about content format.",
        default: true
      },
      revision: {
        type: "boolean",
        description: "Whether to create a revision before updating (default: true for safety)",
        default: true
      }
    },
    required: ["noteId", "content"]
  }
}
```

#### Enhanced update_note Implementation
```typescript
export async function handleUpdateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteUpdateResponse> {
  const {
    noteId,
    content: rawContent,
    revision = true,
    expectedHash,
    validateType = true
  } = args;

  if (!noteId || !rawContent) {
    throw new Error("noteId and content are required for update operation.");
  }

  // Step 1: Get current note state for validation
  const currentNote = await axiosInstance.get(`/notes/${noteId}`);
  const currentContent = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Step 2: Hash validation if provided
  if (expectedHash) {
    const currentHash = await generateContentHash(currentContent.data);
    if (currentHash !== expectedHash) {
      throw new McpError(ErrorCode.InvalidParams,
        `CONFLICT: Note has been modified by another user. ` +
        `Current hash: ${currentHash}, expected: ${expectedHash}. ` +
        `Please get the latest note content and retry.`);
    }
  }

  // Step 3: Content type validation if enabled
  if (validateType) {
    const validationResult = await validateContentForNoteType(
      rawContent,
      currentNote.data.type,
      currentContent.data
    );

    if (!validationResult.valid) {
      throw new McpError(ErrorCode.InvalidParams,
        `CONTENT_TYPE_MISMATCH: ${validationResult.error}`);
    }

    // Use validated/corrected content
    rawContent = validationResult.content;
  }

  // Step 4: Create revision if requested
  let revisionCreated = false;
  if (revision) {
    try {
      await axiosInstance.post(`/notes/${noteId}/revision`);
      revisionCreated = true;
    } catch (error) {
      console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
    }
  }

  // Step 5: Process and update content
  const processed = await processContentArray(rawContent, currentNote.data.type);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }

  await axiosInstance.put(`/notes/${noteId}/content`, processed.content, {
    headers: { "Content-Type": "text/plain" }
  });

  return {
    noteId,
    message: `Note ${noteId} updated successfully${revisionCreated ? ' (revision created)' : ''}`,
    revisionCreated,
    newHash: await generateContentHash(processed.content)
  };
}
```

### Phase 3: Content Type Validation System

#### Content Validation Function
```typescript
async function validateContentForNoteType(
  content: ContentItem[],
  noteType: string,
  currentContent?: string
): Promise<{
  valid: boolean;
  content: ContentItem[];
  error?: string;
}> {
  if (!Array.isArray(content) || content.length === 0) {
    return {
      valid: false,
      content,
      error: "Content must be a non-empty ContentItem array"
    };
  }

  const firstItem = content[0];
  if (firstItem.type !== 'text') {
    // Non-text content (data-url) - assume valid
    return { valid: true, content };
  }

  const textContent = firstItem.content;

  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      // HTML required for text notes
      if (!isLikelyHtml(textContent)) {
        // Auto-wrap plain text in HTML
        const wrappedContent = `<p>${textContent}</p>`;
        return {
          valid: true,
          content: [{ ...firstItem, content: wrappedContent }]
        };
      }
      break;

    case 'code':
    case 'mermaid':
      // Plain text required for code/mermaid notes
      if (isLikelyHtml(textContent)) {
        return {
          valid: false,
          content,
          error: `${noteType} notes require plain text only, but HTML content was detected. ` +
                 `Remove HTML tags and use plain text format.`
        };
      }
      break;
  }

  return { valid: true, content };
}

function isLikelyHtml(content: string): boolean {
  const htmlPatterns = [
    /<[a-zA-Z][^>]*>.*<\/[a-zA-Z][^>]*>/, // Complete HTML tags
    /<[a-zA-Z][^>]*\/>/,                   // Self-closing tags
    /<[a-zA-Z][^>]*>/                      // Opening tags only
  ];

  return htmlPatterns.some(pattern => pattern.test(content));
}
```

## Usage Examples

### Basic Hash Validation Workflow

#### Step 1: Get Note with Hash
```bash
# MCP Tool Call: get_note
{
  "noteId": "abc123def",
  "includeContent": true
}
```

#### Response:
```json
{
  "note": {
    "noteId": "abc123def",
    "title": "Meeting Notes",
    "type": "text",
    "blobId": "blob_123456",
    "dateModified": "2024-01-15T10:30:00.000Z",
    "utcDateModified": "2024-01-15T09:30:00.000Z",
    "_contentHash": "5d41402abc4b2a76b9719d911017c592",
    "_contentRequirements": {
      "requiresHtml": true,
      "description": "HTML content required (wrap plain text in <p> tags)",
      "examples": ["<p>Hello world</p>"]
    }
  },
  "content": "<p>Original meeting content</p>"
}
```

#### Step 2: Update with Hash Validation
```bash
# MCP Tool Call: update_note
{
  "noteId": "abc123def",
  "content": [{"type": "text", "content": "<p>Updated meeting content</p>"}],
  "expectedHash": "5d41402abc4b2a76b9719d911017c592",
  "validateType": true,
  "revision": true
}
```

#### Success Response:
```json
{
  "noteId": "abc123def",
  "message": "Note abc123def updated successfully (revision created)",
  "revisionCreated": true,
  "newHash": "7c6a180b36896a0a8c02787eeafb0e4c"
}
```

#### Conflict Response:
```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "CONFLICT: Note has been modified by another user. Current hash: 9e107d9d372bb6826bd81d3542a419d6, expected: 5d41402abc4b2a76b9719d911017c592. Please get the latest note content and retry."
  }]
}
```

### Content Type Validation Examples

#### Auto-Correction (Text Note)
```bash
# User provides plain text for text note
{
  "noteId": "abc123def",
  "content": [{"type": "text", "content": "Plain text without HTML"}],
  "expectedHash": "...",
  "validateType": true
}

# System auto-wraps in HTML tags
# Result: <p>Plain text without HTML</p>
```

#### Type Mismatch Error (Code Note)
```bash
# User tries to put HTML in code note
{
  "noteId": "code123def",
  "content": [{"type": "text", "content": "<p>function hello() {}</p>"}],
  "expectedHash": "...",
  "validateType": true
}

# Error: code notes require plain text only
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