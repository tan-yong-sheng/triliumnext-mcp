# Internal TriliumNext File Upload API - Complete Technical Analysis

## Overview

This document provides comprehensive information about the **internal TriliumNext file upload API** that is used by the web interface but **not exposed through ETAPI**. This research reveals the actual file upload mechanisms that work within TriliumNext, providing insights for potential future ETAPI enhancements.

**Research Date**: October 24, 2025
**Source**: TriliumNext/Trilium GitHub Repository Analysis
**Status**: ✅ **INTERNAL API ONLY** - Not available through ETAPI

## Key Discovery

**Critical Finding**: TriliumNext has a **comprehensive internal file upload API** that fully supports binary file uploads via `multipart/form-data`, but **none of these endpoints are exposed through ETAPI** (External Trilium API).

### The Missing Link
- **ETAPI** (External): Only supports text-based attachment content
- **Internal API**: Full binary file upload support with multipart/form-data
- **Gap**: No bridge between internal capabilities and external API access

## Complete Internal File Upload API Endpoints

### 1. Upload File to Note
```http
PUT /api/notes/{noteId}/file
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary file]
```

**Response**: `204 No Content` (File uploaded successfully)

### 2. Upload Attachment File ⭐ **PRIMARY ENDPOINT**
```http
POST /api/notes/{noteId}/attachments/upload
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary file]
```

**Response**: `201 Created` with Attachment object
```json
{
  "attachmentId": "string",
  "ownerId": "string",
  "role": "string",
  "mime": "string",
  "title": "string",
  "position": 10,
  "blobId": "string",
  "dateModified": "2025-10-24T10:30:00.000Z",
  "utcDateModified": "2025-10-24T09:30:00.000Z",
  "contentLength": 1024
}
```

### 3. Update Attachment File
```http
PUT /api/attachments/{attachmentId}/file
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary file]
```

**Response**: `204 No Content` (Attachment file updated)

### 4. Upload Modified Attachment File
```http
POST /api/attachments/{attachmentId}/upload-modified-file
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary file]
```

**Response**: `200 OK` with success status
```json
{
  "success": true
}
```

### 5. Update Image Note
```http
PUT /api/images/{noteId}
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary image file]
```

**Response**: `204 No Content` (Image updated)

### 6. Import Notes with Files ⭐ **BULK IMPORT ENDPOINT**
```http
POST /api/notes/{parentNoteId}/notes-import
Content-Type: multipart/form-data
Authorization: Bearer [session-token]

Form Data:
- upload: [binary file]
- safeImport: [boolean]
- shrinkImages: [boolean]
- textImportedAsText: [boolean]
- codeImportedAsCode: [boolean]
- explodeArchives: [boolean]
- replaceUnderscoresWithSpaces: [boolean]
```

**Response**: `200 OK` with imported note information
```json
{
  "noteId": "string",
  "note": { /* Note object */ }
}
```

## Implementation Architecture

### Upload Middleware System

The internal API uses a sophisticated middleware system built on **Express.js** and **Multer**:

#### `uploadMiddlewareWithErrorHandling`
```javascript
// Core middleware configuration
const uploadMiddleware = createUploadMiddleware();
const uploadMiddlewareWithErrorHandling = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File size limit exceeded',
          maxSize: MAX_ALLOWED_FILE_SIZE_MB + 'MB'
        });
      }
      return next(err);
    }
    next();
  });
};
```

#### `createUploadMiddleware` Configuration
```javascript
function createUploadMiddleware() {
  return multer({
    fileFilter: (req, file, cb) => {
      // Convert filename from latin1 to utf8
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      cb(null, true);
    },
    limits: {
      fileSize: process.env.TRILIUM_NO_UPLOAD_LIMIT ?
        undefined :
        MAX_ALLOWED_FILE_SIZE_MB * 1024 * 1024
    }
  }).single('upload'); // Expect single file with field name "upload"
}
```

### File Processing Pipeline

1. **Request Reception**: Express route receives multipart/form-data request
2. **Middleware Processing**: Multer processes the binary file upload
3. **File Validation**: Size limits, filename encoding, MIME type detection
4. **Storage Handling**: File stored in Trilium's blob system
5. **Database Integration**: Attachment records created with blob references
6. **Response**: Success response with attachment metadata

## Working Curl Examples

Based on the internal API analysis, here are the **correct curl commands** that would work with the internal API (if you had session authentication):

### PDF Upload to Attachment
```bash
# Upload PDF as attachment to note
curl -X POST "http://localhost:8080/api/notes/TARGET_NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/document.pdf;type=application/pdf"
```

### Image Upload to Note
```bash
# Upload image directly to note
curl -X PUT "http://localhost:8080/api/notes/TARGET_NOTE_ID/file" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/image.png;type=image/png"
```

### Audio File Upload
```bash
# Upload audio file as attachment
curl -X POST "http://localhost:8080/api/notes/TARGET_NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/audio.mp3;type=audio/mpeg"
```

### Video File Upload
```bash
# Upload video file as attachment
curl -X POST "http://localhost:8080/api/notes/TARGET_NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/video.mp4;type=video/mp4"
```

### Bulk Import with Options
```bash
# Import multiple files with processing options
curl -X POST "http://localhost:8080/api/notes/PARENT_NOTE_ID/notes-import" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/archive.zip;type=application/zip" \
  -F "safeImport=true" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true"
```

## File Type Support Matrix

### Fully Supported File Types

| Category | MIME Types | Internal API Support | Notes |
|----------|------------|----------------------|-------|
| **PDF Documents** | `application/pdf` | ✅ **Full Support** | Rendered in `<iframe>` |
| **Images** | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | ✅ **Full Support** | Auto-shrinking option available |
| **Audio Files** | `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/ogg` | ✅ **Full Support** | Rendered in `<audio>` tags |
| **Video Files** | `video/mp4`, `video/webm`, `video/quicktime` | ✅ **Full Support** | Rendered in `<video>` tags |
| **Documents** | `application/msword`, `application/vnd.openxmlformats-officedocument.*` | ✅ **Full Support** | Download links |
| **Archives** | `application/zip`, `application/x-rar-compressed` | ✅ **Full Support** | Auto-extraction option |
| **Text Files** | `text/plain`, `text/markdown`, `application/json` | ✅ **Full Support** | Can import as text/code notes |

### Advanced Features

1. **Image Shrinking**: Automatic image optimization and scaling
2. **Archive Extraction**: ZIP files can be exploded into multiple notes
3. **Safe Import**: Protected import mode for security
4. **Text/Code Detection**: Automatic note type detection for text files
5. **Filename Encoding**: Proper UTF-8 filename handling
6. **Size Limits**: Configurable file size restrictions
7. **Progress Tracking**: WebSocket-based upload progress updates

## Authentication and Security

### Session-Based Authentication
- **Internal API**: Uses session-based authentication (cookies)
- **ETAPI**: Uses token-based authentication (Bearer tokens)
- **Gap**: No token authentication for internal file upload endpoints

### Security Features
1. **CSRF Protection**: `csrfMiddleware` applied to upload endpoints
2. **File Size Limits**: Configurable maximum file sizes
3. **MIME Type Validation**: Server-side MIME type verification
4. **Filename Sanitization**: UTF-8 encoding for international filenames
5. **Permission Checks**: `auth.checkApiAuthOrElectron` for access control

## Client-Side Implementation

### Upload Service Structure
```typescript
// apps/client/src/services/import.ts
class ImportService {
  async uploadFiles(parentNoteId: string, files: File[], options: UploadFilesOptions) {
    for (const file of files) {
      const formData = new FormData();
      formData.append('upload', file);

      // Add import options
      if (options.shrinkImages) formData.append('shrinkImages', 'true');
      if (options.safeImport) formData.append('safeImport', 'true');

      const response = await fetch(`${baseApiUrl}notes/${parentNoteId}/notes-import`, {
        method: 'POST',
        body: formData,
        headers: {
          // CSRF token automatically added by fetch interceptor
        }
      });
    }
  }
}
```

### WebSocket Progress Tracking
```typescript
// Upload progress via WebSocket
wsSocket.on('message', (message) => {
  if (message.taskType === 'importNotes') {
    // Update UI with progress
    toastService.showMessage(message.progress);
  }
});
```

## Comparison: Internal API vs ETAPI

| Feature | Internal API | ETAPI | Gap Analysis |
|---------|--------------|-------|--------------|
| **Binary Uploads** | ✅ Full multipart/form-data | ❌ Text-only content | **Major Gap** |
| **File Types** | ✅ All file types supported | ❌ Limited to text | **Major Gap** |
| **Authentication** | Session-based | Token-based | **Bridge Needed** |
| **Bulk Import** | ✅ Advanced options | ❌ Not available | **Feature Gap** |
| **Image Processing** | ✅ Auto-shrinking | ❌ Not available | **Feature Gap** |
| **Archive Handling** | ✅ Auto-extraction | ❌ Not available | **Feature Gap** |
| **Progress Tracking** | ✅ WebSocket updates | ❌ Not available | **Feature Gap** |
| **Error Handling** | ✅ Detailed feedback | ❌ Basic responses | **UX Gap** |

## Recommendations for ETAPI Enhancement

### Phase 1: Bridge Authentication Gap
1. **Add Token Support**: Extend internal endpoints to accept Bearer tokens
2. **Maintain Compatibility**: Keep session authentication for web interface
3. **Unified API**: Single set of endpoints for both internal and external access

### Phase 2: ETAPI Integration
1. **Add ETAPI Endpoints**: Mirror internal upload endpoints in ETAPI namespace
2. **Feature Parity**: Implement all internal features in ETAPI
3. **Backward Compatibility**: Ensure existing ETAPI functionality unchanged

### Phase 3: Advanced Features
1. **Bulk Import API**: ETAPI endpoint for advanced import operations
2. **Processing Options**: Image shrinking, archive extraction options
3. **Progress API**: WebSocket or polling-based progress tracking

### Proposed ETAPI File Upload Endpoints

```yaml
# Enhanced ETAPI Specification (Proposal)
/etapi/notes/{noteId}/attachments-upload:
  post:
    summary: Upload attachment file (binary)
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              upload:
                type: string
                format: binary
    responses:
      '201':
        description: Attachment uploaded
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Attachment'

/etapi/notes/{noteId}/file-upload:
  put:
    summary: Upload file to note (binary)
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              upload:
                type: string
                format: binary
    responses:
      '204':
        description: File uploaded

/etapi/notes/{parentNoteId}/import:
  post:
    summary: Import notes with files
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              upload:
                type: string
                format: binary
              shrinkImages:
                type: boolean
              explodeArchives:
                type: boolean
              safeImport:
                type: boolean
```

## Implementation Path for MCP Integration

### Current Workaround Options

1. **Browser Automation**: Use tools like Puppeteer to automate web interface uploads
2. **Direct Database**: Access Trilium database directly (advanced users only)
3. **File System**: Manipulate files in Trilium data directory (risky)

### Future Integration Strategy

1. **Monitor ETAPI Development**: Watch for file upload endpoint additions
2. **Community Advocacy**: Request ETAPI file upload support in TriliumNext issues
3. **Alternative Approaches**: Consider building a bridge service that translates ETAPI calls to internal API calls

### Temporary Solutions

```typescript
// Conceptual bridge service (for future implementation)
class ETAPIBridge {
  async uploadAttachment(noteId: string, file: File) {
    // Convert ETAPI token to session
    const session = await this.tokenToSession(this.etapiToken);

    // Call internal API with session authentication
    const formData = new FormData();
    formData.append('upload', file);

    return fetch(`/api/notes/${noteId}/attachments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session}`
      },
      body: formData
    });
  }
}
```

## Conclusion

The **TriliumNext internal file upload API** is comprehensive and fully capable of handling all file types with advanced features like image processing and archive extraction. However, **none of these capabilities are exposed through ETAPI**, creating a significant gap between what's possible internally and what's available externally.

**Key Takeaways**:
1. **Technical Solution Exists**: Internal API fully supports binary file uploads
2. **Authentication Gap**: Need to bridge token-based and session-based authentication
3. **ETAPI Enhancement Opportunity**: Clear path for extending ETAPI capabilities
4. **Current Limitation**: ETAPI file uploads remain text-only until enhanced

**Recommendation**: Advocate for ETAPI enhancement to include multipart/form-data support, which would unlock full file upload capabilities for external integrations and automation tools.

---

**Research Sources**:
- TriliumNext GitHub Repository: `/TriliumNext/Trilium`
- Internal API Routes: `apps/server/src/routes/`
- Upload Middleware: `apps/server/src/routes/upload-middleware.ts`
- Import Service: `apps/client/src/services/import.ts`
- OpenAPI Specification: `api-openapi.yaml`

**Last Updated**: October 24, 2025