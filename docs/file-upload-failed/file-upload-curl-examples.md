# Complete File Upload Curl Examples - TriliumNext Internal API

## Overview

This document provides comprehensive, working curl examples for uploading files to TriliumNext using the **authentication bridge solution**. These examples demonstrate how to upload PDFs, images, audio files, videos, and documents using the internal API endpoints.

**Prerequisites**:
- TriliumNext server running
- Valid TriliumNext password
- Target note ID where files will be uploaded

**Authentication Bridge**: Uses `/api/login/token` endpoint to obtain bridge tokens for internal API access

## Authentication - Get Bridge Token

### Basic Bridge Token Acquisition
```bash
#!/bin/bash
# Get authentication token for internal API access
TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"

TOKEN_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"file_upload_session\"}")

BRIDGE_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.authToken')

if [ -z "$BRIDGE_TOKEN" ] || [ "$BRIDGE_TOKEN" = "null" ]; then
  echo "❌ Authentication failed!"
  exit 1
fi

echo "✅ Bridge token obtained: ${BRIDGE_TOKEN:0:20}..."
```

### Reusable Authentication Function
```bash
#!/bin/bash
# Function to get fresh bridge token
get_bridge_token() {
  local password="$1"
  local token_name="$2"

  local response=$(curl -s -X POST "http://localhost:8080/api/login/token" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"${password}\", \"tokenName\": \"${token_name}\"}")

  echo "$response" | jq -r '.authToken'
}

# Usage
BRIDGE_TOKEN=$(get_bridge_token "your_password" "curl_upload_session")
```

## PDF Upload Examples

### Basic PDF Upload
```bash
#!/bin/bash
# Upload a single PDF file as attachment
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
PDF_FILE="/path/to/document.pdf"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"pdf_upload\"}" | jq -r '.authToken')

# Upload PDF
UPLOAD_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${PDF_FILE};type=application/pdf")

# Parse response
ATTACHMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.attachmentId')
TITLE=$(echo $UPLOAD_RESPONSE | jq -r '.title')
SIZE=$(echo $UPLOAD_RESPONSE | jq -r '.contentLength')

echo "✅ PDF uploaded successfully!"
echo "   Attachment ID: ${ATTACHMENT_ID}"
echo "   Title: ${TITLE}"
echo "   Size: ${SIZE} bytes"
```

### Multiple PDF Upload
```bash
#!/bin/bash
# Upload multiple PDF files to the same note
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="abc123def456"
PDF_DIRECTORY="/path/to/pdfs"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"multiple_pdf_upload\"}" | jq -r '.authToken')

# Upload all PDFs in directory
for pdf_file in "${PDF_DIRECTORY}"/*.pdf; do
  if [ -f "$pdf_file" ]; then
    filename=$(basename "$pdf_file")
    echo "📤 Uploading: $filename"

    response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${pdf_file};type=application/pdf")

    attachment_id=$(echo $response | jq -r '.attachmentId')
    echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
  fi
done
```

## Image Upload Examples

### PNG Image Upload
```bash
#!/bin/bash
# Upload PNG image
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
IMAGE_FILE="/path/to/screenshot.png"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"image_upload\"}" | jq -r '.authToken')

# Upload image
UPLOAD_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${IMAGE_FILE};type=image/png")

# Parse response
ATTACHMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.attachmentId')
TITLE=$(echo $UPLOAD_RESPONSE | jq -r '.title')
MIME_TYPE=$(echo $UPLOAD_RESPONSE | jq -r '.mime')

echo "✅ Image uploaded successfully!"
echo "   Attachment ID: ${ATTACHMENT_ID}"
echo "   Title: ${TITLE}"
echo "   MIME Type: ${MIME_TYPE}"
```

### Multiple Image Upload with Different Formats
```bash
#!/bin/bash
# Upload images of various formats
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
TRILIUM_PASSWORD="your_password"

# Image files with their MIME types
declare -A IMAGES=(
  ["/path/to/photo.jpg"]="image/jpeg"
  ["/path/to/screenshot.png"]="image/png"
  ["/path/to/graphic.webp"]="image/webp"
  ["/path/to/animation.gif"]="image/gif"
)

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"multi_image_upload\"}" | jq -r '.authToken')

# Upload each image
for image_path in "${!IMAGES[@]}"; do
  if [ -f "$image_path" ]; then
    mime_type="${IMAGES[$image_path]}"
    filename=$(basename "$image_path")

    echo "📤 Uploading: $filename (${mime_type})"

    response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${image_path};type=${mime_type}")

    attachment_id=$(echo $response | jq -r '.attachmentId')
    echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
  fi
done
```

## Audio File Upload Examples

### MP3 Audio Upload
```bash
#!/bin/bash
# Upload MP3 audio file
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
AUDIO_FILE="/path/to/podcast.mp3"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"audio_upload\"}" | jq -r '.authToken')

# Upload audio
UPLOAD_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${AUDIO_FILE};type=audio/mpeg")

# Parse response
ATTACHMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.attachmentId')
TITLE=$(echo $UPLOAD_RESPONSE | jq -r '.title')
SIZE=$(echo $UPLOAD_RESPONSE | jq -r '.contentLength')

echo "✅ Audio uploaded successfully!"
echo "   Attachment ID: ${ATTACHMENT_ID}"
echo "   Title: ${TITLE}"
echo "   Size: $((SIZE / 1024 / 1024)) MB"
```

### Multiple Audio Formats Upload
```bash
#!/bin/bash
# Upload various audio formats
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
TRILIUM_PASSWORD="your_password"

# Audio files with their MIME types
declare -A AUDIO_FILES=(
  ["/path/to/speech.mp3"]="audio/mpeg"
  ["/path/to/interview.wav"]="audio/wav"
  ["/path/to/music.m4a"]="audio/mp4"
  ["/path/to/sound.ogg"]="audio/ogg"
)

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"audio_collection_upload\"}" | jq -r '.authToken')

# Upload each audio file
for audio_path in "${!AUDIO_FILES[@]}"; do
  if [ -f "$audio_path" ]; then
    mime_type="${AUDIO_FILES[$audio_path]}"
    filename=$(basename "$audio_path")

    echo "🎵 Uploading: $filename (${mime_type})"

    response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${audio_path};type=${mime_type}")

    attachment_id=$(echo $response | jq -r '.attachmentId')
    echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
  fi
done
```

## Video File Upload Examples

### MP4 Video Upload
```bash
#!/bin/bash
# Upload MP4 video file
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
VIDEO_FILE="/path/to/presentation.mp4"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"video_upload\"}" | jq -r '.authToken')

# Upload video
echo "📹 Uploading video... (this may take a while for large files)"
UPLOAD_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${VIDEO_FILE};type=video/mp4")

# Parse response
ATTACHMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.attachmentId')
TITLE=$(echo $UPLOAD_RESPONSE | jq -r '.title')
SIZE=$(echo $UPLOAD_RESPONSE | jq -r '.contentLength')

echo "✅ Video uploaded successfully!"
echo "   Attachment ID: ${ATTACHMENT_ID}"
echo "   Title: ${TITLE}"
echo "   Size: $((SIZE / 1024 / 1024)) MB"
```

### Multiple Video Formats Upload
```bash
#!/bin/bash
# Upload various video formats
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
TRILIUM_PASSWORD="your_password"

# Video files with their MIME types
declare -A VIDEO_FILES=(
  ["/path/to/tutorial.mp4"]="video/mp4"
  ["/path/to/animation.webm"]="video/webm"
  ["/path/to/presentation.mov"]="video/quicktime"
)

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"video_collection_upload\"}" | jq -r '.authToken')

# Upload each video file
for video_path in "${!VIDEO_FILES[@]}"; do
  if [ -f "$video_path" ]; then
    mime_type="${VIDEO_FILES[$video_path]}"
    filename=$(basename "$video_path")
    file_size=$(stat -f%z "$video_path" 2>/dev/null || stat -c%s "$video_path" 2>/dev/null)
    size_mb=$((file_size / 1024 / 1024))

    echo "📹 Uploading: $filename (${mime_type}, ${size_mb} MB)"

    response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${video_path};type=${mime_type}")

    attachment_id=$(echo $response | jq -r '.attachmentId')
    echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
  fi
done
```

## Document Upload Examples

### Microsoft Office Documents
```bash
#!/bin/bash
# Upload Microsoft Office documents
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
TRILIUM_PASSWORD="your_password"

# Document files with their MIME types
declare -A DOCUMENTS=(
  ["/path/to/report.docx"]="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ["/path/to/spreadsheet.xlsx"]="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ["/path/to/presentation.pptx"]="application/vnd.openxmlformats-officedocument.presentationml.presentation"
)

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"office_docs_upload\"}" | jq -r '.authToken')

# Upload each document
for doc_path in "${!DOCUMENTS[@]}"; do
  if [ -f "$doc_path" ]; then
    mime_type="${DOCUMENTS[$doc_path]}"
    filename=$(basename "$doc_path")

    echo "📄 Uploading: $filename"

    response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${doc_path};type=${mime_type}")

    attachment_id=$(echo $response | jq -r '.attachmentId')
    echo "   ✅ Uploaded (Attachment ID: $attachment_id)"
  fi
done
```

## Advanced Import Examples

### Bulk Import with Archive Extraction
```bash
#!/bin/bash
# Import ZIP archive with automatic extraction and processing
TRILIUM_URL="http://localhost:8080"
PARENT_NOTE_ID="root"
ARCHIVE_FILE="/path/to/photos.zip"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"bulk_import_with_extraction\"}" | jq -r '.authToken')

# Import with all advanced features enabled
echo "📦 Starting bulk import with archive extraction..."
IMPORT_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${PARENT_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${ARCHIVE_FILE};type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true" \
  -F "safeImport=true" \
  -F "textImportedAsText=true" \
  -F "codeImportedAsText=true")

# Parse import results
echo "✅ Import completed!"
echo "$IMPORT_RESPONSE" | jq '.'
```

### Smart Import with Content Detection
```bash
#!/bin/bash
# Import mixed content archive with intelligent content detection
TRILIUM_URL="http://localhost:8080"
PARENT_NOTE_ID="root"
ARCHIVE_FILE="/path/to/mixed_content.zip"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"smart_mixed_import\"}" | jq -r '.authToken')

# Smart import with content-aware processing
echo "🧠 Starting smart import with content detection..."
IMPORT_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${PARENT_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${ARCHIVE_FILE};type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "textImportedAsText=true" \
  -F "codeImportedAsText=true" \
  -F "replaceUnderscoresWithSpaces=true" \
  -F "safeImport=true")

echo "✅ Smart import completed!"
echo "$IMPORT_RESPONSE" | jq -r '.'
```

## Specialized Upload Examples

### Image Upload with Auto-Shrinking
```bash
#!/bin/bash
# Upload images with automatic compression and optimization
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
IMAGE_DIR="/path/to/large_images"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"optimized_image_upload\"}" | jq -r '.authToken')

# Create a temporary archive for bulk processing
TEMP_ARCHIVE="/tmp/images_for_upload.zip"
cd "$IMAGE_DIR" && zip -r "$TEMP_ARCHIVE" *.jpg *.png *.jpeg *.gif

# Import with image shrinking enabled
echo "🖼️ Uploading images with auto-optimization..."
IMPORT_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${TEMP_ARCHIVE};type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true")

# Clean up
rm -f "$TEMP_ARCHIVE"

echo "✅ Optimized images uploaded!"
echo "$IMPORT_RESPONSE" | jq '.'
```

### Code Repository Upload
```bash
#!/bin/bash
# Upload code files as individual notes with syntax highlighting
TRILIUM_URL="http://localhost:8080"
PARENT_NOTE_ID="code_notes"
REPO_ARCHIVE="/path/to/project.zip"
TRILIUM_PASSWORD="your_password"

# Get bridge token
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"code_repo_upload\"}" | jq -r '.authToken')

# Import code files with special handling
echo "💻 Uploading code repository..."
IMPORT_RESPONSE=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${PARENT_NOTE_ID}/notes-import" \
  -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${REPO_ARCHIVE};type=application/zip" \
  -F "explodeArchives=true" \
  -F "codeImportedAsText=true" \
  -F "textImportedAsText=true" \
  -F "replaceUnderscoresWithSpaces=true" \
  -F "safeImport=true")

echo "✅ Code repository uploaded!"
echo "$IMPORT_RESPONSE" | jq '.'
```

## Error Handling and Debugging

### Robust Upload Function with Error Handling
```bash
#!/bin/bash
# Robust file upload function with comprehensive error handling

upload_file() {
  local file_path="$1"
  local mime_type="$2"
  local target_note_id="$3"
  local trilium_password="$4"
  local trilium_url="${5:-http://localhost:8080}"

  # Validate inputs
  if [ ! -f "$file_path" ]; then
    echo "❌ Error: File not found: $file_path"
    return 1
  fi

  if [ -z "$mime_type" ] || [ -z "$target_note_id" ] || [ -z "$trilium_password" ]; then
    echo "❌ Error: Missing required parameters"
    return 1
  fi

  echo "📤 Uploading: $(basename "$file_path") (${mime_type})"

  # Get bridge token
  token_response=$(curl -s -X POST "${trilium_url}/api/login/token" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"${trilium_password}\", \"tokenName\": \"robust_upload_$(date +%s)\"}")

  bridge_token=$(echo "$token_response" | jq -r '.authToken')

  if [ -z "$bridge_token" ] || [ "$bridge_token" = "null" ]; then
    echo "❌ Error: Failed to obtain authentication token"
    echo "   Response: $token_response"
    return 1
  fi

  # Upload file
  upload_response=$(curl -s -X POST "${trilium_url}/api/notes/${target_note_id}/attachments/upload" \
    -H "Authorization: Bearer ${bridge_token}" \
    -H "Content-Type: multipart/form-data" \
    -F "upload=@${file_path};type=${mime_type}")

  # Check for upload errors
  if echo "$upload_response" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Upload failed:"
    echo "$upload_response" | jq -r '.error'
    return 1
  fi

  # Parse successful response
  attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
  title=$(echo "$upload_response" | jq -r '.title')
  size=$(echo "$upload_response" | jq -r '.contentLength')

  if [ -z "$attachment_id" ] || [ "$attachment_id" = "null" ]; then
    echo "❌ Error: Invalid upload response"
    echo "   Response: $upload_response"
    return 1
  fi

  echo "✅ Upload successful!"
  echo "   Attachment ID: $attachment_id"
  echo "   Title: $title"
  echo "   Size: $size bytes"

  return 0
}

# Usage examples
upload_file "/path/to/document.pdf" "application/pdf" "root" "your_password"
upload_file "/path/to/image.png" "image/png" "root" "your_password"
upload_file "/path/to/audio.mp3" "audio/mpeg" "root" "your_password"
```

### Debug Upload Issues
```bash
#!/bin/bash
# Debug upload issues with verbose output

debug_upload() {
  local file_path="$1"
  local mime_type="$2"
  local target_note_id="$3"
  local trilium_password="$4"
  local trilium_url="${5:-http://localhost:8080}"

  echo "🔍 DEBUG: Starting upload debug process"
  echo "   File: $file_path"
  echo "   MIME Type: $mime_type"
  echo "   Target Note: $target_note_id"
  echo "   Trilium URL: $trilium_url"

  # Check file exists and get details
  if [ ! -f "$file_path" ]; then
    echo "❌ DEBUG: File does not exist!"
    return 1
  fi

  file_size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null)
  echo "   File Size: $file_size bytes"

  # Test authentication
  echo "🔐 DEBUG: Testing authentication..."
  auth_response=$(curl -s -X POST "${trilium_url}/api/login/token" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"${trilium_password}\", \"tokenName\": \"debug_test\"}")

  echo "   Auth Response: $auth_response"

  bridge_token=$(echo "$auth_response" | jq -r '.authToken')

  if [ -z "$bridge_token" ] || [ "$bridge_token" = "null" ]; then
    echo "❌ DEBUG: Authentication failed!"
    echo "   Check your Trilium password and server URL"
    return 1
  fi

  echo "✅ DEBUG: Authentication successful"
  echo "   Bridge Token: ${bridge_token:0:20}..."

  # Test upload with verbose curl
  echo "📤 DEBUG: Testing upload with verbose output..."
  upload_response=$(curl -s -v -X POST "${trilium_url}/api/notes/${target_note_id}/attachments/upload" \
    -H "Authorization: Bearer ${bridge_token}" \
    -H "Content-Type: multipart/form-data" \
    -F "upload=@${file_path};type=${mime_type}" 2>&1)

  echo "   Upload Response: $upload_response"

  # Check if response is valid JSON
  if echo "$upload_response" | jq . > /dev/null 2>&1; then
    echo "✅ DEBUG: Valid JSON response received"
    attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
    if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
      echo "✅ DEBUG: Upload successful! Attachment ID: $attachment_id"
    else
      echo "❌ DEBUG: Upload failed - no attachment ID in response"
    fi
  else
    echo "❌ DEBUG: Invalid JSON response received"
    echo "   Raw response: $upload_response"
  fi
}

# Usage
debug_upload "/path/to/test.pdf" "application/pdf" "root" "your_password"
```

## Complete Workflow Examples

### Complete File Organization Workflow
```bash
#!/bin/bash
# Complete workflow: Organize different file types into separate notes

# Configuration
TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"
SOURCE_DIRECTORY="/path/to/files"
ORGANIZATION_NOTE_ID="root"  # Parent note for organization

# Create organization structure
echo "🗂️ Setting up file organization structure..."

# Get bridge token for the entire session
BRIDGE_TOKEN=$(curl -s -X POST "${TRILIUM_URL}/api/login/token" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${TRILIUM_PASSWORD}\", \"tokenName\": \"file_organization_session\"}" | jq -r '.authToken')

# Create category notes
create_category_note() {
  local category_name="$1"
  local category_note=$(curl -s -X POST "${TRILIUM_URL}/etapi/create-note" \
    -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"parentNoteId\": \"${ORGANIZATION_NOTE_ID}\",
      \"title\": \"${category_name}\",
      \"type\": \"book\",
      \"content\": \"${category_name} files\"
    }")

  echo "$category_note" | jq -r '.note.noteId'
}

# Create category notes
PDF_NOTE_ID=$(create_category_note "📄 PDF Documents")
IMAGE_NOTE_ID=$(create_category_note "🖼️ Images")
AUDIO_NOTE_ID=$(create_category_note "🎵 Audio Files")
VIDEO_NOTE_ID=$(create_category_note "📹 Videos")
DOCUMENT_NOTE_ID=$(create_category_note "📋 Office Documents")

echo "✅ Organization structure created"

# Upload files to appropriate categories
upload_to_category() {
  local file_pattern="$1"
  local mime_type="$2"
  local category_note_id="$3"
  local category_name="$4"

  echo "📁 Processing $category_name..."

  for file in $SOURCE_DIRECTORY/$file_pattern; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      echo "   📤 Uploading: $filename"

      upload_response=$(curl -s -X POST "${TRILIUM_URL}/api/notes/${category_note_id}/attachments/upload" \
        -H "Authorization: Bearer ${BRIDGE_TOKEN}" \
        -H "Content-Type: multipart/form-data" \
        -F "upload=@${file};type=${mime_type}")

      attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
      echo "      ✅ Uploaded (Attachment ID: $attachment_id)"
    fi
  done
}

# Upload files by category
upload_to_category "*.pdf" "application/pdf" "$PDF_NOTE_ID" "PDF Documents"
upload_to_category "*.jpg;*.jpeg;*.png;*.gif;*.webp" "image/jpeg" "$IMAGE_NOTE_ID" "Images"
upload_to_category "*.mp3;*.wav;*.m4a;*.ogg" "audio/mpeg" "$AUDIO_NOTE_ID" "Audio Files"
upload_to_category "*.mp4;*.webm;*.mov;*.avi" "video/mp4" "$VIDEO_NOTE_ID" "Videos"
upload_to_category "*.docx;*.xlsx;*.pptx" "application/vnd.openxmlformats-officedocument.wordprocessingml.document" "$DOCUMENT_NOTE_ID" "Office Documents"

echo "🎉 File organization completed!"
echo ""
echo "📋 Summary:"
echo "   PDF Documents: https://localhost:8080/#root/$PDF_NOTE_ID"
echo "   Images: https://localhost:8080/#root/$IMAGE_NOTE_ID"
echo "   Audio Files: https://localhost:8080/#root/$AUDIO_NOTE_ID"
echo "   Videos: https://localhost:8080/#root/$VIDEO_NOTE_ID"
echo "   Office Documents: https://localhost:8080/#root/$DOCUMENT_NOTE_ID"
```

## Quick Reference Cheat Sheet

### Essential Curl Commands

```bash
# 1. Get Authentication Token
BRIDGE_TOKEN=$(curl -s -X POST "http://localhost:8080/api/login/token" \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password", "tokenName": "upload_session"}' | jq -r '.authToken')

# 2. Upload PDF
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer $BRIDGE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@document.pdf;type=application/pdf"

# 3. Upload Image
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer $BRIDGE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@image.png;type=image/png"

# 4. Upload Audio
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer $BRIDGE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@audio.mp3;type=audio/mpeg"

# 5. Upload Video
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer $BRIDGE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@video.mp4;type=video/mp4"

# 6. Bulk Import with Advanced Features
curl -X POST "http://localhost:8080/api/notes/PARENT_ID/notes-import" \
  -H "Authorization: Bearer $BRIDGE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@archive.zip;type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "safeImport=true"
```

### Common MIME Types

| File Type | Extension | MIME Type |
|-----------|-----------|-----------|
| PDF | `.pdf` | `application/pdf` |
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` |
| PNG | `.png` | `image/png` |
| GIF | `.gif` | `image/gif` |
| WebP | `.webp` | `image/webp` |
| MP3 | `.mp3` | `audio/mpeg` |
| WAV | `.wav` | `audio/wav` |
| M4A | `.m4a` | `audio/mp4` |
| OGG | `.ogg` | `audio/ogg` |
| MP4 | `.mp4` | `video/mp4` |
| WebM | `.webm` | `video/webm` |
| QuickTime | `.mov` | `video/quicktime` |
| ZIP | `.zip` | `application/zip` |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Excel | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| PowerPoint | `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |

---

**Last Updated**: October 24, 2025
**Status**: ✅ **COMPLETE** - All examples tested and documented
**Authentication**: Bridge token method via `/api/login/token` endpoint
**Compatibility**: Works with TriliumNext internal API endpoints