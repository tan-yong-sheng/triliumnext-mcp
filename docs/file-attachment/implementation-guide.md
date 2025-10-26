# File Upload Implementation Guide

## Quick Reference

This guide provides implementation details for adding file upload functionality to the TriliumNext MCP server by extending existing tools rather than creating new ones.

## Enhanced Tool Parameters

### 1. create_note Tool Extensions

**New Parameters** (added to existing schema):
```typescript
type: {
  enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "file"]
}
filePath: {
  description: "Local file path to upload (required when type='file')"
}
mimeType: {
  description: "MIME type for file uploads (optional, auto-detected)"
}
```

**Supported File Types**:
- **Documents**: `application/pdf` (.pdf), `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- **Images**: `image/jpg` (.jpg), `image/png` (.png), `image/webp` (.webp)
- **Audio**: `audio/mpeg` (.mp3), `audio/wav` (.wav), `audio/mp4` (.m4a)

**Usage Examples**:
```typescript
// Basic PDF upload
create_note({
  parentNoteId: "root",
  type: "file",
  filePath: "/path/to/document.pdf"
})

// With custom metadata
create_note({
  parentNoteId: "project123",
  type: "file",
  filePath: "/path/to/meeting.mp3",
  title: "Q4 Planning Meeting",
  mimeType: "audio/mpeg",
  attributes: [
    {type: "label", name: "meeting", value: "planning"},
    {type: "label", name: "quarter", value: "Q4"}
  ]
})

// Word document upload
create_note({
  parentNoteId: "documents",
  type: "file",
  filePath: "/path/to/contract.docx",
  title: "Service Contract 2025",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
})

// WAV audio file
create_note({
  parentNoteId: "media",
  type: "file",
  filePath: "/path/to/interview.wav",
  title: "Candidate Interview",
  mimeType: "audio/wav"
})
```

### 2. search_notes Tool Extensions

**No Schema Changes Required** - uses existing searchCriteria structure:

**File Type Search**:
```typescript
search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file"},
    {property: "mime", type: "noteProperty", op: "=", value: "application/pdf"}
  ]
})
```

**Complex File Searches**:
```typescript
// Large images in project folder
search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file", logic: "AND"},
    {property: "mime", type: "noteProperty", op: "=", value: "image/jpg", logic: "OR"},
    {property: "mime", type: "noteProperty", op: "=", value: "image/png"},
    {property: "contentSize", type: "noteProperty", op: ">", value: "1048576"},
    {property: "parents.noteId", type: "noteProperty", op: "=", value: "project123"}
  ]
})

// Find all audio files (MP3, WAV, M4A)
search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file", logic: "AND"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/mpeg", logic: "OR"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/wav", logic: "OR"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/mp4"}
  ]
})

// Find Word documents
search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file"},
    {property: "mime", type: "noteProperty", op: "=", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
  ]
})
```

### 3. get_note Tool Extensions

**No Schema Changes Required** - automatically returns enhanced metadata:

```typescript
// Enhanced response for file notes
get_note({noteId: "file123"})
// Returns:
{
  noteId: "file123",
  title: "Project Requirements",
  type: "file",
  mimeType: "application/pdf",
  contentSize: 2048576,
  attachmentId: "att789",
  fileUrl: "api/attachments/att789/document/requirements.pdf",
  dateModified: "2025-01-15T10:30:00.000Z",
  blobId: "abc123def456"
}
```

## Implementation Steps

### Step 1: Update toolDefinitions.ts

**Extend create_note enum** (line 30):
```typescript
enum: ["text", "code", "render", "search", "relationMap", "book", "noteMap", "mermaid", "webView", "file"]
```

**Add new parameters** (after line 39):
```typescript
filePath: {
  type: "string",
  description: "Local file path to upload (required when type='file'). Supports PDF, MP3, JPG, PNG, WebP files."
},
mimeType: {
  type: "string",
  description: "MIME type for file uploads (optional, auto-detected from file extension)."
}
```

### Step 2: Create File Handler Modules

**src/utils/fileUtils.ts**:
```typescript
export const SUPPORTED_MIME_TYPES = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'text/csv': ['csv'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/mp4': ['m4a'],
  'image/jpg': ['jpg'],
  'image/png': ['png'],
  'image/webp': ['webp']
} as const;

export function detectMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  for (const [mimeType, extensions] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if (extensions.includes(ext.substring(1))) {
      return mimeType;
    }
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

export function validateFile(filePath: string): ValidationResult {
  if (!fs.existsSync(filePath)) {
    return {valid: false, error: 'File not found'};
  }

  const stats = fs.statSync(filePath);
  if (stats.size > 50 * 1024 * 1024) { // 50MB limit
    return {valid: false, error: 'File too large'};
  }

  return {valid: true};
}
```

### Step 3: Enhance Existing Handlers

**src/modules/noteHandler.ts** - Add file type handling:
```typescript
if (createNoteParams.type === 'file') {
  if (!createNoteParams.filePath) {
    throw new Error('filePath is required when type="file"');
  }

  // Validate file and detect MIME type
  const validation = fileUtils.validateFile(createNoteParams.filePath);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mimeType = createNoteParams.mime || fileUtils.detectMimeType(createNoteParams.filePath);
  const title = createNoteParams.title || fileUtils.generateFileTitle(createNoteParams.filePath);

  // Create file note with metadata
  const noteData = {
    parentNoteId: createNoteParams.parentNoteId,
    title: title,
    type: 'file',
    mime: mimeType,
    content: '' // Empty content initially
  };

  const noteResult = await this.noteManager.createNote(noteData);

  // Upload binary content
  await this.fileManager.uploadFileContent(noteResult.noteId, createNoteParams.filePath, mimeType);

  return noteResult;
}
```

### Step 4: Update Search Handler

**src/modules/searchHandler.ts** - No changes needed! Existing searchCriteria structure already supports file searches.

### Step 5: Enhance Note Retrieval

**src/modules/noteManager.ts** - Add file metadata enhancement:
```typescript
async getNote(noteId: string): Promise<Note> {
  const note = await this.axiosClient.get(`/notes/${noteId}`);

  // Enhance with file metadata if applicable
  if (note.type === 'file') {
    const attachmentInfo = await this.getAttachmentInfo(noteId);
    return {
      ...note,
      attachmentId: attachmentInfo.attachmentId,
      fileUrl: `api/attachments/${attachmentInfo.attachmentId}/document/${note.title}`,
      contentSize: attachmentInfo.contentLength
    };
  }

  return note;
}
```

## Integration Testing

### Test File Upload
```typescript
// Test PDF upload
const result = await create_note({
  parentNoteId: "root",
  type: "file",
  filePath: "/test/sample.pdf"
});

console.log(result.noteId); // Should return new file note ID

// Test Word document upload
const docxResult = await create_note({
  parentNoteId: "documents",
  type: "file",
  filePath: "/test/contract.docx",
  title: "Test Contract"
});

console.log(docxResult.noteId); // Should return new file note ID

// Test WAV audio upload
const wavResult = await create_note({
  parentNoteId: "media",
  type: "file",
  filePath: "/test/audio.wav",
  title: "Test Audio"
});

console.log(wavResult.noteId); // Should return new file note ID
```

### Test File Search
```typescript
// Test finding PDF files
const searchResult = await search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file"},
    {property: "mime", type: "noteProperty", op: "=", value: "application/pdf"}
  ]
});

console.log(searchResult.results.length); // Should find uploaded PDF

// Test finding all audio files
const audioSearchResult = await search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file", logic: "AND"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/mpeg", logic: "OR"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/wav", logic: "OR"},
    {property: "mime", type: "noteProperty", op: "=", value: "audio/mp4"}
  ]
});

console.log(audioSearchResult.results.length); // Should find all uploaded audio files

// Test finding Word documents
const docxSearchResult = await search_notes({
  searchCriteria: [
    {property: "type", type: "noteProperty", op: "=", value: "file"},
    {property: "mime", type: "noteProperty", op: "=", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
  ]
});

console.log(docxSearchResult.results.length); // Should find uploaded Word documents
```

### Test File Retrieval
```typescript
// Test enhanced metadata
const fileNote = await get_note({noteId: result.noteId});

console.log(fileNote.type); // "file"
console.log(fileNote.mimeType); // "application/pdf"
console.log(fileNote.attachmentId); // Should have attachment ID
```

## Error Handling

### File Validation Errors
```typescript
// Unsupported file type
create_note({
  parentNoteId: "root",
  type: "file",
  filePath: "/test/video.mp4" // Not supported
});
// Error: "Unsupported file type: .mp4"

// File not found
create_note({
  parentNoteId: "root",
  type: "file",
  filePath: "/nonexistent.pdf"
});
// Error: "File not found"

// Missing filePath
create_note({
  parentNoteId: "root",
  type: "file"
  // Missing filePath
});
// Error: "filePath is required when type='file'"

// MIME type mismatch
create_note({
  parentNoteId: "root",
  type: "file",
  filePath: "/test/document.pdf",
  mimeType: "image/png" // Wrong MIME type
});
// Error: "MIME type mismatch: detected application/pdf, specified image/png"
```

### Upload Errors
```typescript
// Network timeout during upload
// Should retry with exponential backoff
// Log error with file details
// Return appropriate error message
```

## Configuration

### Environment Variables
```bash
# File upload settings
MAX_FILE_SIZE=52428800  # 50MB default
SUPPORTED_FILE_TYPES=pdf,docx,mp3,wav,m4a,jpg,png,webp
TEMP_UPLOAD_DIR=/tmp/trilium-uploads
```

### File Size Limits
```typescript
// Default limits (configurable)
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ['pdf', 'docx', 'mp3', 'wav', 'm4a', 'jpg', 'png', 'webp'];
```

## Security Considerations

### Path Validation
```typescript
function validateFilePath(filePath: string): void {
  const resolvedPath = path.resolve(filePath);

  // Prevent directory traversal
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid file path');
  }

  // Ensure file exists and is readable
  if (!fs.existsSync(resolvedPath)) {
    throw new Error('File not found');
  }
}
```

### MIME Type Validation
```typescript
function validateMimeType(filePath: string, mimeType?: string): string {
  const detectedMime = detectMimeType(filePath);

  if (mimeType && mimeType !== detectedMime) {
    throw new Error(`MIME type mismatch: detected ${detectedMime}, specified ${mimeType}`);
  }

  return detectedMime;
}
```

## Performance Optimization

### Streaming Upload
```typescript
// For large files, use streaming instead of loading entire file into memory
async uploadFileContentStream(noteId: string, filePath: string, mimeType: string): Promise<void> {
  const fileStream = fs.createReadStream(filePath);

  await this.axiosClient.put(`/notes/${noteId}/content`, fileStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Transfer-Encoding': 'binary'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
}
```

### Progress Tracking
```typescript
// Optional: Add upload progress for large files
async uploadWithProgress(noteId: string, filePath: string): Promise<void> {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  // Track upload progress
  const onUploadProgress = (progressEvent: any) => {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(`Upload progress: ${progress}%`);
  };

  await this.axiosClient.put(`/notes/${noteId}/content`, fileStream, {
    onUploadProgress
  });
}
```

## Migration Guide

### For Existing Users
- **No breaking changes** - all existing functionality preserved
- **New features** - optional file upload capabilities
- **Search enhancement** - existing searches continue to work, file searches use same patterns

### Upgrade Path
1. Deploy updated MCP server with file support
2. Existing create_note calls continue to work unchanged
3. New file upload capabilities available immediately
4. Search automatically includes file notes in results when applicable

This implementation ensures seamless integration with the existing TriliumNext MCP architecture while adding powerful file upload capabilities.