# File Upload Guide for Trilium

## Create File Note (Documents, Audio, Video, etc.)

### Step 1: Create file note
```bash
curl -X POST "http://localhost:8080/etapi/create-note" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "parentNoteId": "{parentNoteId}",
      "title": "test_1.pdf",
      "type": "file",
      "mime": "application/pdf",
      "content": ""
    }'
```

## Create Image Note (JPG, PNG, GIF, SVG, etc.)

### Step 1: Create image note
```bash
curl -X POST "http://localhost:8080/etapi/create-note" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "parentNoteId": "{parentNoteId}",
      "title": "image_1.jpeg",
      "type": "image",
      "mime": "image/jpg",
      "content": ""
    }'
```

**Complete MIME Types Reference:**

### File Notes (type: "file")
**Documents:**
- PDF: `application/pdf`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- PPTX: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- CSV: `text/csv`

**Audio Files:**
- MP3: `audio/mpeg`
- WAV: `audio/wav`
- M4A: `audio/mp4`

**Video Files:**
- MP4: `video/mp4`
- MKV: `video/x-matroska`
- MOV: `video/quicktime`
- AVI: `video/x-msvideo`
- WebM: `video/webm`
- WMV: `video/x-ms-wmv`

### Image Notes (type: "image")
- JPG/JPEG: `image/jpg` (supports both .jpg and .jpeg extensions)
- PNG: `image/png`
- WebP: `image/webp`
- ICO: `image/ico`
- TIFF: `image/tif`
- SVG: `image/svg+xml`
- GIF: `image/gif`

### Smart File Type Detection
TriliumNext MCP automatically detects file types based on MIME types and extensions. You can also use the fallback mechanism for unsupported but valid MIME types.

### Step 2: Upload File/Image Content with These Exact Headers
```bash
curl -v -X PUT "http://localhost:8080/etapi/notes/{noteId}/content" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/octet-stream" \
    -H "Content-Transfer-Encoding: binary" \
    --data-binary "@test_1.pdf"
```

**For Images:**
```bash
curl -v -X PUT "http://localhost:8080/etapi/notes/{noteId}/content" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/octet-stream" \
    -H "Content-Transfer-Encoding: binary" \
    --data-binary "@image_1.jpg"
```

## Working with Content and Attachments

### Get Note Content
```bash
curl -i -X GET "http://localhost:8080/etapi/notes/{noteId}/content" \
  -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>"
```

**Example Response:**
```html
<p>hi, how are you&</p><figure class="image"><img style="aspect-ratio:512/512;" src="api/attachments/Ne9ZgiFAxrVW/image/tech-expo-crowd-stockcake.jpg" width="512" height="512"></figure><p>&nbsp;</p><figure class="image"><img style="aspect-ratio:1000/667;" src="api/attachments/Ht67CCBo0tKm/image/generated_image.jpeg" width="1000" height="667"></figure>
```

### Get Attachment Details
```bash
curl -i -X GET "http://localhost:8080/etapi/attachments/{attachmentId}" \
  -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>"
```

**Example Response:**
```json
{
  "attachmentId":"Ne9ZgiFAxrVW",
  "ownerId":"ElRH4Diq3tFE",
  "role":"image",
  "mime":"image/jpg",
  "title":"tech-expo-crowd-stockcake.jpg",
  "position":10,
  "blobId":"KETidfJYPqJpImBXYFY8",
  "dateModified":"2025-10-25 16:02:14.328+0800",
  "utcDateModified":"2025-10-25 08:02:14.814Z",
  "utcDateScheduledForErasureSince":null,
  "contentLength":64380
}
```

### File URL Format
- **File location**: `api/attachments/{attachmentId}/image/{title}`
- **HTML embed**: `<figure class="image"><img style="aspect-ratio:512/512;" src="api/attachments/{attachmentId}/image/{title}" width="512" height="512"></figure>`

## Update File/Image Note

⚠️ **Important: Simpler Update Rules**
Note type and MIME type are **immutable** after creation. You can only update the title and replace the file content with the **same file type**.

### Update File/Image Note Title Only
```bash
curl -X PATCH "http://localhost:8080/etapi/notes/{noteId}" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Updated Document Title"
    }'
```

### Replace File Content (Same File Type Only)
```bash
curl -v -X PUT "http://localhost:8080/etapi/notes/{noteId}/content" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/octet-stream" \
    -H "Content-Transfer-Encoding: binary" \
    --data-binary "@/path/to/new_document.pdf"
```

### Replace Image Content (Same Image Type Only)
```bash
curl -v -X PUT "http://localhost:8080/etapi/notes/{noteId}/content" \
    -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
    -H "Content-Type: application/octet-stream" \
    -H "Content-Transfer-Encoding: binary" \
    --data-binary "@/path/to/new_image.jpg"
```

### ✅ Allowed Updates
- **Title changes**: Any note type
- **File replacement**: Same file type only (PDF→PDF, MP3→MP3, etc.)
- **Image replacement**: Same image type only (JPG→JPG, PNG→PNG, etc.)

### ❌ Rejected Updates
- **Type changes**: Cannot change `file` to `image` or vice versa
- **MIME changes**: Cannot change `application/pdf` to `image/png`
- **Cross-type replacement**: Cannot replace image with video file

### Workflow for Different File Types
If you need to change a file type (e.g., image → video):

1. **Delete the old note**:
   ```bash
   curl -X DELETE "http://localhost:8080/etapi/notes/{oldNoteId}" \
       -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>"
   ```

2. **Create a new note** with the correct type:
   ```bash
   curl -X POST "http://localhost:8080/etapi/create-note" \
       -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{
         "parentNoteId": "{parentNoteId}",
         "title": "New Video File",
         "type": "file",
         "mime": "video/mp4",
         "content": ""
       }'
   ```

3. **Upload the new content**:
   ```bash
   curl -v -X PUT "http://localhost:8080/etapi/notes/{newNoteId}/content" \
       -H "Authorization: Bearer <TRILIUM_ETAPI_TOKEN>" \
       -H "Content-Type: application/octet-stream" \
       -H "Content-Transfer-Encoding: binary" \
       --data-binary "@/path/to/new_video.mp4"
   ```

## Notes
- Replace `<TRILIUM_ETAPI_TOKEN>` with your actual ETAPI token
- Replace note IDs and attachment IDs with your actual values
- The `parentNoteId` should be the ID of the note where you want to create the file/image note
- The note ID in Step 2 should be the ID returned from Step 1

### 📁 Supported File Types
**File Notes (type: "file"):**
- **Documents**: PDF, DOCX, PPTX, XLSX, CSV
- **Audio**: MP3, WAV, M4A
- **Video**: MP4, MKV, MOV, AVI, WebM, WMV

**Image Notes (type: "image"):**
- **Images**: JPG/JPEG, PNG, WebP, ICO, TIFF, SVG, GIF

### 🔧 Update Rules
- **File Content Updates**: Use `PUT /notes/{noteId}/content` to replace binary file content (same type only)
- **Metadata Updates**: Use `PATCH /notes/{noteId}` to update title only (type and MIME are immutable)
- **File Type Changes**: **Not allowed** - create a new note instead for different file types

### ⚡ Smart Content Inclusion (get_note)
- **Text/Code notes**: Content returned by default
- **File/Image notes**: Binary content excluded by default for performance
- **Include binary data**: Use `includeBinaryContent: true` parameter when needed

### 🛡️ Error Handling
- **Type mismatch errors**: Clear messages when file types don't match
- **Immutable type errors**: Helpful guidance to create new notes for different types
- **File validation**: Automatic detection of file types from MIME types and extensions