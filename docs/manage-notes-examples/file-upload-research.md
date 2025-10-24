# File Upload Research for TriliumNext ETAPI

## Overview

This document provides comprehensive research findings on file upload capabilities for TriliumNext Notes via the External Trilium API (ETAPI). The research covers the current state of file upload functionality, limitations, and potential approaches for handling different file types.

**Research Date**: October 24, 2025
**API Version**: TriliumNext ETAPI (based on openapi.yaml v1.0.0)
**Status**: ⚠️ **LIMITED SUPPORT** - File uploads currently have significant constraints

## Current ETAPI File Upload Capabilities

### Available Endpoints

Based on the OpenAPI specification analysis, the following attachment-related endpoints are available:

#### 1. Create Attachment
```http
POST /attachments
Content-Type: application/json

{
  "ownerId": "string",           // noteId or revisionId
  "role": "string",              // attachment role
  "mime": "string",              // MIME type
  "title": "string",             // attachment title
  "content": "string",           // TEXT content only
  "position": 10                 // integer position
}
```

#### 2. Update Attachment Content
```http
PUT /attachments/{attachmentId}/content
Content-Type: text/plain

"string content"                 // TEXT content only
```

#### 3. Get Attachment Content
```http
GET /attachments/{attachmentId}/content
Accept: text/html
```

### Critical Limitations

⚠️ **MAJOR CONSTRAINT**: The ETAPI attachment system currently only supports **text-based content**, not binary file uploads.

1. **Content Encoding**: Both create and update endpoints expect `text/plain` or JSON content
2. **No Binary Support**: No endpoints accept `multipart/form-data` or binary file streams
3. **Base64 Not Supported**: No mechanism for base64-encoded binary content
4. **File Size Limitations**: Text-based approach unsuitable for large binary files

## File Type Analysis and Current Status

### File Types Intended for Upload

| File Type | Common Extensions | Current ETAPI Support | Recommended Approach |
|-----------|-------------------|----------------------|---------------------|
| **PDF Documents** | `.pdf` | ❌ **Not Supported** | Manual upload via web interface |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` | ❌ **Not Supported** | Manual upload via web interface |
| **Audio Files** | `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg` | ❌ **Not Supported** | Manual upload via web interface |
| **Video Files** | `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm` | ❌ **Not Supported** | Manual upload via web interface |
| **Documents** | `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods` | ❌ **Not Supported** | Manual upload via web interface |
| **Archives** | `.zip`, `.rar`, `.7z`, `.tar.gz` | ❌ **Not Supported** | Manual upload via web interface |
| **Text Files** | `.txt`, `.md`, `.csv`, `.json`, `.xml` | ✅ **Partially Supported** | As text content in attachments |

### Note Type Support Status

According to the current TriliumNext MCP implementation:

- **`file`** note type: **TEMPORARILY DISABLED** due to ETAPI upload limitations
- **`image`** note type: **TEMPORARILY DISABLED** due to ETAPI upload limitations
- **`text`** note type: ✅ **Fully supported** (text content only)
- **`code`** note type: ✅ **Fully supported** (text content only)

## Theoretical Curl Examples (If Binary Upload Was Supported)

The following examples demonstrate what file upload curl commands **would look like** if the ETAPI supported binary file uploads. **These currently will NOT work** with the existing ETAPI implementation.

### PDF Upload Example
```bash
# Theoretical PDF upload (NOT WORKING - for illustration only)
curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "ownerId=TARGET_NOTE_ID" \
  -F "role=document" \
  -F "mime=application/pdf" \
  -F "title=Report.pdf" \
  -F "content=@/path/to/document.pdf;type=application/pdf"
```

### Image Upload Example
```bash
# Theoretical image upload (NOT WORKING - for illustration only)
curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "ownerId=TARGET_NOTE_ID" \
  -F "role=image" \
  -F "mime=image/png" \
  -F "title=screenshot.png" \
  -F "content=@/path/to/image.png;type=image/png"
```

### Audio File Upload Example
```bash
# Theoretical audio upload (NOT WORKING - for illustration only)
curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "ownerId=TARGET_NOTE_ID" \
  -F "role=audio" \
  -F "mime=audio/mpeg" \
  -F "title=podcast.mp3" \
  -F "content=@/path/to/audio.mp3;type=audio/mpeg"
```

### Video File Upload Example
```bash
# Theoretical video upload (NOT WORKING - for illustration only)
curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "ownerId=TARGET_NOTE_ID" \
  -F "role=video" \
  -F "mime=video/mp4" \
  -F "title=presentation.mp4" \
  -F "content=@/path/to/video.mp4;type=video/mp4"
```

## Current Working Approaches

### 1. Text-Based File Upload (Limited)

For text-based files, you can read the content and upload as text:

```bash
# Working example for text files
curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "TARGET_NOTE_ID",
    "role": "document",
    "mime": "text/plain",
    "title": "notes.txt",
    "content": "This is the file content as plain text",
    "position": 10
  }'
```

### 2. Manual Web Interface Upload

Currently, the most reliable method for uploading binary files:

1. Access TriliumNext web interface
2. Navigate to target note
3. Use drag-and-drop or file selection
4. Files are properly stored as binary attachments

### 3. Base64 Encoding Workaround (Not Recommended)

While technically possible to encode files as base64 text, this approach has significant limitations:

```bash
# Base64 encoding approach (NOT RECOMMENDED)
base64_input=$(base64 -w 0 /path/to/file.pdf)

curl -X POST "http://localhost:8080/etapi/attachments" \
  -H "Authorization: Bearer YOUR_ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ownerId\": \"TARGET_NOTE_ID\",
    \"role\": \"document\",
    \"mime\": \"application/pdf\",
    \"title\": \"document.pdf\",
    \"content\": \"$base64_input\"
  }"
```

**Limitations of base64 approach:**
- Files stored as text, not binary
- 33% size increase due to base64 encoding
- TriliumNext may not correctly handle base64-encoded binary content
- No guarantee of proper file type recognition

## Technical Implementation Analysis

### ETAPI Attachment Schema Analysis

From the OpenAPI specification:

```yaml
CreateAttachment:
  type: object
  properties:
    ownerId:
      $ref: "#/components/schemas/EntityId"
    role:
      type: string
    mime:
      type: string
    title:
      type: string
    content:
      type: string    # ← Text only, no binary support
    position:
      type: integer
      format: int32
```

**Key observations:**
- `content` field is defined as `type: string` (text-only)
- No support for `binary` format or `multipart/form-data`
- Content encoding not specified for binary data

### Current TriliumNext MCP Implementation Status

From the project documentation:

> **Status**: ⏸️ **TEMPORARILY DISABLED** - Removed due to API implementation challenges with PDF corruption and attachment handling

> **Background**: File and image note creation features were previously implemented but caused persistent errors due to incorrect Trilium ETAPI attachment handling.

## Recommendations

### For Current Implementation

1. **Avoid Binary File Uploads**: Do not attempt to upload PDF, images, audio, or video files via ETAPI
2. **Use Web Interface**: Direct users to the TriliumNext web interface for file uploads
3. **Text-Only Approach**: Only support text-based file content through ETAPI
4. **Clear Documentation**: Explicitly communicate limitations to users

### For Future Development

1. **Monitor ETAPI Updates**: Watch for enhanced attachment support in future TriliumNext versions
2. **Binary Upload Support**: Advocate for proper multipart/form-data support in ETAPI
3. **Alternative Approaches**: Investigate direct database integration or alternative APIs
4. **Community Involvement**: Participate in TriliumNext development discussions

### Alternative Solutions

1. **Direct Database Access**: For advanced users with database access
2. **File System Integration**: Direct file system manipulation (not recommended)
3. **Third-Party Integration**: Use external file storage services with links in notes
4. **Browser Automation**: Automate web interface uploads (complex but possible)

## MIME Type Reference

### Supported MIME Types (for text content)

| Category | MIME Types | Notes |
|----------|------------|-------|
| **Text** | `text/plain`, `text/html`, `text/markdown`, `text/csv` | ✅ Fully supported |
| **Code** | `text/javascript`, `text/python`, `text/css`, `application/json` | ✅ Fully supported |
| **Documents** | `application/xml`, `text/xml`, `application/yaml` | ✅ Text-based XML/YAML |
| **Structured Data** | `application/json`, `text/csv` | ✅ Plain text formats |

### Unsupported MIME Types (binary files)

| Category | MIME Types | Status |
|----------|------------|--------|
| **PDF** | `application/pdf` | ❌ Binary format |
| **Images** | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | ❌ Binary format |
| **Audio** | `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/ogg` | ❌ Binary format |
| **Video** | `video/mp4`, `video/webm`, `video/quicktime` | ❌ Binary format |
| **Documents** | `application/msword`, `application/vnd.openxmlformats-officedocument.*` | ❌ Binary format |
| **Archives** | `application/zip`, `application/x-rar-compressed` | ❌ Binary format |

## Conclusion

The TriliumNext ETAPI currently has **severe limitations** for file upload functionality:

1. **No Binary Support**: Only text-based content can be uploaded via attachments
2. **Missing Features**: No multipart/form-data or file streaming capabilities
3. **Implementation Issues**: Previous attempts at file upload integration caused corruption and errors
4. **Manual Upload Required**: Binary files must be uploaded through the web interface

**Recommendation**: Use the TriliumNext web interface for all file uploads until the ETAPI is enhanced with proper binary file support. For automated workflows, consider browser automation or direct database access as advanced alternatives.

---

**Research Sources:**
- TriliumNext ETAPI OpenAPI Specification (v1.0.0)
- TriliumNext MCP Implementation Documentation
- TriliumNext Official Documentation
- Current MCP Project Status and Limitations

**Last Updated**: October 24, 2025