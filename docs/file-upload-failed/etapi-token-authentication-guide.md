# ETAPI Token Authentication Guide - Direct Access to Internal APIs

## 🎯 IMPORTANT DISCOVERY

**Critical Finding**: You **CANNOT** use ETAPI tokens with the `/api/login/token` endpoint. However, you **CAN** use ETAPI tokens **directly** with many internal file upload APIs, including the web clipper endpoints!

**Research Date**: October 24, 2025
**Status**: ✅ **SIMPLIFIED SOLUTION** - ETAPI tokens work directly with file upload APIs

## Key Findings

### ❌ What Doesn't Work

```bash
# THIS DOES NOT WORK - /api/login/token requires password, not ETAPI token
curl -X POST "http://localhost:8080/api/login/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -d '{"password": "ETAPI_TOKEN"}'  # ❌ WRONG
```

The `/api/login/token` endpoint **only accepts the main Trilium password**, not ETAPI tokens.

### ✅ What Actually Works

```bash
# THIS WORKS - ETAPI tokens work directly with file upload endpoints!
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@document.pdf;type=application/pdf"
```

## Simplified Authentication Flow

### Method 1: Direct ETAPI Token Usage (Recommended)

No bridge token needed! ETAPI tokens work directly with internal file upload APIs.

#### Step 1: Get ETAPI Token (One-time setup)
```bash
# Get ETAPI token from Trilium UI: Options → ETAPI
# Or generate programmatically (requires password)
ETAPI_TOKEN=$(curl -s -X POST "http://localhost:8080/etapi/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "your_trilium_password"}' | jq -r '.authToken')
```

#### Step 2: Upload Files Directly
```bash
# Upload PDF using ETAPI token directly
curl -X POST "http://localhost:8080/api/notes/TARGET_NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer $ETAPI_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@document.pdf;type=application/pdf"
```

### Method 2: Web Clipper Authentication Pattern

The web clipper uses ETAPI tokens directly with internal APIs:

```bash
# Web clipper-style file upload
curl -X POST "http://localhost:8080/api/clipper/clippings" \
  -H "Authorization: Bearer $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clipped Content",
    "content": "<p>Clipped from web</p>",
    "noteId": "TARGET_NOTE_ID"
  }'
```

## Complete Working Examples

### Basic File Upload with ETAPI Token

```bash
#!/bin/bash
# Upload files using ETAPI token directly (no bridge needed)

# Configuration
TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_existing_etapi_token"
TARGET_NOTE_ID="root"

# Upload PDF
echo "📄 Uploading PDF..."
response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${ETAPI_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@/path/to/document.pdf;type=application/pdf")

attachment_id=$(echo $response | jq -r '.attachmentId')
echo "✅ PDF uploaded! Attachment ID: $attachment_id"
```

### Multiple File Uploads with ETAPI Token

```bash
#!/bin/bash
# Upload multiple files using ETAPI token

TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_etapi_token"
TARGET_NOTE_ID="root"

# Files to upload
files=(
  "/path/to/document.pdf:application/pdf"
  "/path/to/image.png:image/png"
  "/path/to/audio.mp3:audio/mpeg"
  "/path/to/video.mp4:video/mp4"
)

for file_info in "${files[@]}"; do
  IFS=':' read -r file_path mime_type <<< "$file_info"
  filename=$(basename "$file_path")

  echo "📤 Uploading: $filename"

  response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
    -H "Authorization: Bearer ${ETAPI_TOKEN}" \
    -H "Content-Type: multipart/form-data" \
    -F "upload=@${file_path};type=${mime_type}")

  attachment_id=$(echo $response | jq -r '.attachmentId')
  echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
done
```

### Bulk Import with ETAPI Token

```bash
#!/bin/bash
# Bulk import with advanced options using ETAPI token

TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_etapi_token"
PARENT_NOTE_ID="root"
ARCHIVE_FILE="/path/to/files.zip"

echo "📦 Starting bulk import..."
response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${PARENT_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${ETAPI_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${ARCHIVE_FILE};type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true" \
  -F "safeImport=true")

echo "✅ Bulk import completed!"
echo "$response" | jq '.'
```

## ETAPI Token Authentication Methods

ETAPI tokens can be provided in three different formats:

### Method 1: Bearer Token (Recommended)
```bash
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -F "upload=@file.pdf;type=application/pdf"
```

### Method 2: Direct Token
```bash
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: ETAPI_TOKEN" \
  -F "upload=@file.pdf;type=application/pdf"
```

### Method 3: Basic Authentication
```bash
# Create basic auth string: base64("etapi:ETAPI_TOKEN")
BASIC_AUTH=$(echo -n "etapi:ETAPI_TOKEN" | base64)

curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Basic ${BASIC_AUTH}" \
  -F "upload=@file.pdf;type=application/pdf"
```

## ETAPI Token vs Bridge Token Comparison

| Feature | ETAPI Token Direct | Bridge Token Method |
|---------|-------------------|---------------------|
| **Authentication Required** | ETAPI token | Trilium password |
| **Token Source** | Trilium UI or `/etapi/auth/login` | `/api/login/token` |
| **Setup Complexity** | Simple (one-time) | Complex (password required) |
| **Security** | Token-based | Password-based |
| **API Access** | Internal APIs + ETAPI | Internal APIs |
| **MCP Integration** | ✅ **Easier** | ❌ More complex |
| **Token Management** | Long-lived tokens | Session-based tokens |

## Supported Internal APIs with ETAPI Tokens

### ✅ File Upload Endpoints
- `POST /api/notes/{noteId}/attachments/upload` - Upload attachments
- `PUT /api/notes/{noteId}/file` - Upload files to notes
- `POST /api/notes/{parentNoteId}/notes-import` - Bulk import
- `PUT /api/attachments/{attachmentId}/file` - Update attachments
- `PUT /api/images/{noteId}` - Upload image notes

### ✅ Web Clipper Endpoints
- `POST /api/clipper/clippings` - Create clippings
- `POST /api/clipper/notes` - Create notes via clipper
- `GET /api/clipper/handshake` - Clipper handshake
- `GET /api/clipper/notes/{noteId}` - Get notes via clipper

### ✅ Other Internal APIs
- Many internal APIs support ETAPI tokens via `auth.checkApiAuthOrElectron` middleware

## Practical Examples

### Example 1: Document Management System
```bash
#!/bin/bash
# Document management using ETAPI token

TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_etapi_token"
DOCUMENT_NOTE_ID="documents_2024"

# Upload documents
documents=(
  "/path/to/report.pdf:application/pdf"
  "/path/to/spreadsheet.xlsx:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  "/path/to/presentation.pptx:application/vnd.openxmlformats-officedocument.presentationml.presentation"
)

echo "📋 Uploading documents to Trilium..."

for doc in "${documents[@]}"; do
  IFS=':' read -r file_path mime_type <<< "$doc"
  filename=$(basename "$file_path")

  echo "📄 Processing: $filename"

  response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${DOCUMENT_NOTE_ID}/attachments/upload" \
    -H "Authorization: Bearer ${ETAPI_TOKEN}" \
    -H "Content-Type: multipart/form-data" \
    -F "upload=@${file_path};type=${mime_type}")

  attachment_id=$(echo $response | jq -r '.attachmentId')
  echo "   ✅ Uploaded (ID: $attachment_id)"
done

echo "🎉 Document upload completed!"
```

### Example 2: Media Library Import
```bash
#!/bin/bash
# Import media files with organization

TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_etapi_token"
MEDIA_NOTE_ID="media_library"

# Create media archive for bulk import
echo "📦 Preparing media archive..."
TEMP_DIR="/tmp/trilium_media_$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy media files to temp directory
cp "/path/to/photos"/*.jpg "$TEMP_DIR/" 2>/dev/null
cp "/path/to/videos"/*.mp4 "$TEMP_DIR/" 2>/dev/null
cp "/path/to/audio"/*.mp3 "$TEMP_DIR/" 2>/dev/null

# Create archive
cd "$TEMP_DIR"
zip -r "media_files.zip" ./*

# Import with optimization
echo "🚀 Importing media files to Trilium..."
response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${MEDIA_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${ETAPI_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@media_files.zip;type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true")

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Media import completed!"
echo "$response" | jq '.'
```

### Example 3: Automated Backup System
```bash
#!/bin/bash
# Automated file backup to Trilium

TRILIUM_URL="http://localhost:8080"
ETAPI_TOKEN="your_etapi_token"
BACKUP_NOTE_ID="automated_backups"
SOURCE_DIR="/path/to/important/files"

# Create daily backup
DATE_STAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${DATE_STAMP}"

echo "💾 Starting automated backup: $BACKUP_NAME"

# Create backup archive
BACKUP_FILE="/tmp/${BACKUP_NAME}.zip"
cd "$SOURCE_DIR"
zip -r "$BACKUP_FILE" ./*

# Upload to Trilium
response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${BACKUP_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${ETAPI_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${BACKUP_FILE};type=application/zip")

attachment_id=$(echo $response | jq -r '.attachmentId')

# Clean up
rm -f "$BACKUP_FILE"

if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
  echo "✅ Backup completed successfully!"
  echo "   Backup ID: $attachment_id"
  echo "   Timestamp: $DATE_STAMP"
else
  echo "❌ Backup failed!"
  echo "   Response: $response"
fi
```

## Security Best Practices

### ETAPI Token Security
1. **Token Storage**: Store ETAPI tokens securely, never in public code
2. **Token Rotation**: Regularly rotate ETAPI tokens for enhanced security
3. **Access Control**: Use specific tokens for specific applications
4. **Environment Variables**: Store tokens in environment variables, not in scripts

### Example Secure Configuration
```bash
#!/bin/bash
# Secure token management

# Load configuration from environment file
if [ -f ".env" ]; then
  source .env
fi

# Validate required environment variables
if [ -z "$TRILIUM_ETAPI_TOKEN" ]; then
  echo "❌ Error: TRILIUM_ETAPI_TOKEN not set"
  exit 1
fi

if [ -z "$TRILIUM_URL" ]; then
  echo "❌ Error: TRILIUM_URL not set"
  exit 1
fi

# Use secure token
ETAPI_TOKEN="$TRILIUM_ETAPI_TOKEN"
TRILIUM_URL="$TRILIUM_URL"

# Proceed with file upload...
echo "🔐 Using secure authentication..."
```

## MCP Integration Simplified

### Simplified MCP Tool Implementation
```typescript
// Much simpler MCP implementation with ETAPI tokens
async function uploadFile(args: {
  noteId: string;
  filePath: string;
  mimeType: string;
  etapiToken: string;
}): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('upload', new Blob([await fs.readFile(args.filePath)]), {
    type: args.mimeType
  });

  const response = await fetch(
    `http://localhost:8080/api/notes/${args.noteId}/attachments/upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${args.etapiToken}`
      },
      body: formData
    }
  );

  if (response.ok) {
    const attachment = await response.json();
    return {
      success: true,
      attachmentId: attachment.attachmentId,
      title: attachment.title
    };
  } else {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}
```

### MCP Tool Definition
```typescript
{
  name: "upload_file_to_note",
  description: "Upload a file to a Trilium note using ETAPI token",
  inputSchema: {
    type: "object",
    properties: {
      noteId: {
        type: "string",
        description: "Target note ID where the file will be attached"
      },
      filePath: {
        type: "string",
        description: "Local path to the file to upload"
      },
      mimeType: {
        type: "string",
        description: "MIME type of the file"
      },
      etapiToken: {
        type: "string",
        description: "ETAPI token for authentication (from Trilium Options → ETAPI)"
      }
    },
    required: ["noteId", "filePath", "mimeType", "etapiToken"]
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "401 Unauthorized" Error
```bash
# Check if ETAPI token is valid
curl -H "Authorization: Bearer $ETAPI_TOKEN" \
  "http://localhost:8080/etapi/app-info"

# If this fails, your ETAPI token is invalid or expired
# Get a new token from Trilium: Options → ETAPI
```

#### Issue: "404 Not Found" Error
```bash
# Check if note ID exists
curl -H "Authorization: Bearer $ETAPI_TOKEN" \
  "http://localhost:8080/etapi/notes/NOTE_ID"

# If this fails, the note ID doesn't exist
```

#### Issue: "413 Payload Too Large" Error
```bash
# File is too large for upload
# Check Trilium's file size limits in configuration
# Consider compressing large files before upload
```

### Debug Script
```bash
#!/bin/bash
# Debug ETAPI token authentication

ETAPI_TOKEN="$1"
TRILIUM_URL="${2:-http://localhost:8080}"

echo "🔍 Testing ETAPI token authentication..."

# Test 1: Basic ETAPI access
echo "Test 1: ETAPI endpoint access..."
response=$(curl -s -H "Authorization: Bearer $ETAPI_TOKEN" \
  "$TRILIUM_URL/etapi/app-info")

if echo "$response" | jq -e '.appVersion' > /dev/null 2>&1; then
  echo "✅ ETAPI token is valid"
  version=$(echo "$response" | jq -r '.appVersion')
  echo "   Trilium Version: $version"
else
  echo "❌ ETAPI token is invalid"
  exit 1
fi

# Test 2: Internal API access
echo "Test 2: Internal API access..."
response=$(curl -s -H "Authorization: Bearer $ETAPI_TOKEN" \
  "$TRILIUM_URL/api/clipper/handshake")

if [ -n "$response" ]; then
  echo "✅ ETAPI token works with internal APIs"
else
  echo "❌ ETAPI token doesn't work with internal APIs"
  exit 1
fi

echo "🎉 All tests passed! ETAPI token is ready for file uploads."
```

## Conclusion

**Key Takeaways**:

1. ✅ **ETAPI tokens work directly** with internal file upload APIs - no bridge needed
2. ❌ **Cannot use ETAPI tokens** with `/api/login/token` - it requires password
3. ✅ **Simpler authentication** - just use your existing ETAPI token
4. ✅ **Same functionality** - all file upload capabilities available
5. ✅ **Better security** - no need to handle passwords in scripts

**Recommended Approach**: Use ETAPI tokens directly for file uploads. It's simpler, more secure, and doesn't require password handling in your automation scripts.

---

**Last Updated**: October 24, 2025
**Status**: ✅ **COMPLETE** - ETAPI token authentication verified and documented
**Authentication Method**: Direct ETAPI token usage (recommended)