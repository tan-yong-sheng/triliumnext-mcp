# CORRECTED File Upload Authentication - Session-Based API Access

## 🚨 IMPORTANT CORRECTION

**Critical Fix**: The previous documentation was **incorrect**. Internal file upload APIs **require session-based authentication**, not ETAPI tokens. The "Logged in session not found" error confirms this.

**Research Date**: October 24, 2025
**Status**: ✅ **CORRECTED** - Proper session-based authentication documented

## The Real Authentication Flow

### ❌ What Doesn't Work (Previous Incorrect Advice)
```bash
# THIS DOES NOT WORK - ETAPI tokens are for ETAPI endpoints only
curl -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -F "upload=@document.pdf;type=application/pdf"
# Result: "Logged in session not found"
```

### ✅ What Actually Works (Correct Method)
```bash
# Step 1: Login to get session cookie
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=your_trilium_password"

# Step 2: Use session cookie for file upload
curl -b cookies.txt -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@document.pdf;type=application/pdf"
```

## Complete Authentication Flow

### Step 1: Establish Session
```bash
#!/bin/bash
# Login to establish session
TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"
COOKIE_FILE="trilium_cookies.txt"

echo "🔐 Logging into Trilium..."

# Login request
login_response=$(curl -c "$COOKIE_FILE" -s -X POST "${TRILIUM_URL}/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${TRILIUM_PASSWORD}")

# Check if login successful
if [ -f "$COOKIE_FILE" ] && grep -q "trilium.sid" "$COOKIE_FILE"; then
  echo "✅ Login successful - Session established"
else
  echo "❌ Login failed - Check password and URL"
  exit 1
fi
```

### Step 2: Upload Files Using Session
```bash
#!/bin/bash
# Upload PDF using session authentication
TRILIUM_URL="http://localhost:8080"
TARGET_NOTE_ID="root"
PDF_FILE="/path/to/document.pdf"
COOKIE_FILE="trilium_cookies.txt"

echo "📄 Uploading PDF using session..."

# Upload file
upload_response=$(curl -b "$COOKIE_FILE" -s -X POST \
  "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${PDF_FILE};type=application/pdf")

# Parse response
attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
title=$(echo "$upload_response" | jq -r '.title')

if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
  echo "✅ PDF uploaded successfully!"
  echo "   Attachment ID: $attachment_id"
  echo "   Title: $title"
else
  echo "❌ Upload failed"
  echo "   Response: $upload_response"
fi
```

## Complete Working Examples

### Example 1: PDF Upload with Session Authentication
```bash
#!/bin/bash
# Complete PDF upload workflow with proper session authentication

TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"
TARGET_NOTE_ID="root"
PDF_FILE="/path/to/document.pdf"
COOKIE_FILE="trilium_session.txt"

echo "🚀 Starting PDF upload workflow..."

# Step 1: Login and establish session
echo "🔐 Step 1: Establishing session..."
login_response=$(curl -c "$COOKIE_FILE" -s -X POST "${TRILIUM_URL}/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${TRILIUM_PASSWORD}")

# Verify login success
if ! grep -q "trilium.sid" "$COOKIE_FILE"; then
  echo "❌ Login failed - Check credentials"
  rm -f "$COOKIE_FILE"
  exit 1
fi

echo "✅ Session established successfully"

# Step 2: Upload PDF
echo "📄 Step 2: Uploading PDF..."
upload_response=$(curl -b "$COOKIE_FILE" -s -X POST \
  "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${PDF_FILE};type=application/pdf")

# Parse upload response
attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
title=$(echo "$upload_response" | jq -r '.title')
size=$(echo "$upload_response" | jq -r '.contentLength')

if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
  echo "🎉 PDF upload completed successfully!"
  echo "   Attachment ID: $attachment_id"
  echo "   Title: $title"
  echo "   Size: $size bytes"
else
  echo "❌ PDF upload failed"
  echo "   Error: $upload_response"
fi

# Clean up
rm -f "$COOKIE_FILE"
```

### Example 2: Multiple File Uploads
```bash
#!/bin/bash
# Upload multiple files with session authentication

TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"
TARGET_NOTE_ID="root"
COOKIE_FILE="trilium_multi_upload.txt"

# Files to upload
declare -A FILES=(
  ["/path/to/document.pdf"]="application/pdf"
  ["/path/to/image.png"]="image/png"
  ["/path/to/audio.mp3"]="audio/mpeg"
  ["/path/to/video.mp4"]="video/mp4"
)

# Step 1: Login
echo "🔐 Establishing session for multiple uploads..."
curl -c "$COOKIE_FILE" -s -X POST "${TRILIUM_URL}/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${TRILIUM_PASSWORD}" > /dev/null

if ! [ -f "$COOKIE_FILE" ]; then
  echo "❌ Session establishment failed"
  exit 1
fi

echo "✅ Session established"

# Step 2: Upload files
echo "📁 Starting multiple file uploads..."

success_count=0
total_count=${#FILES[@]}

for file_path in "${!FILES[@]}"; do
  if [ -f "$file_path" ]; then
    mime_type="${FILES[$file_path]}"
    filename=$(basename "$file_path")

    echo "📤 Uploading: $filename"

    upload_response=$(curl -b "$COOKIE_FILE" -s -X POST \
      "${TRILIUM_URL}/api/notes/${TARGET_NOTE_ID}/attachments/upload" \
      -H "Content-Type: multipart/form-data" \
      -F "upload=@${file_path};type=${mime_type}")

    attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')

    if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
      echo "   ✅ Success (ID: $attachment_id)"
      ((success_count++))
    else
      echo "   ❌ Failed: $upload_response"
    fi
  else
    echo "⚠️  Skipping missing file: $file_path"
    ((total_count--))
  fi
done

echo "📊 Upload Summary: $success_count/$total_count files uploaded successfully"

# Clean up
rm -f "$COOKIE_FILE"
```

### Example 3: Bulk Import with Session
```bash
#!/bin/bash
# Bulk import with advanced options using session authentication

TRILIUM_URL="http://localhost:8080"
TRILIUM_PASSWORD="your_password"
PARENT_NOTE_ID="root"
ARCHIVE_FILE="/path/to/files.zip"
COOKIE_FILE="trilium_bulk_import.txt"

echo "📦 Starting bulk import workflow..."

# Step 1: Login
echo "🔐 Establishing session for bulk import..."
curl -c "$COOKIE_FILE" -s -X POST "${TRILIUM_URL}/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${TRILIUM_PASSWORD}" > /dev/null

# Step 2: Bulk import
echo "📤 Uploading archive with processing options..."
import_response=$(curl -b "$COOKIE_FILE" -s -X POST \
  "${TRILIUM_URL}/api/notes/${PARENT_NOTE_ID}/notes-import" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${ARCHIVE_FILE};type=application/zip" \
  -F "shrinkImages=true" \
  -F "explodeArchives=true" \
  -F "replaceUnderscoresWithSpaces=true" \
  -F "safeImport=true" \
  -F "textImportedAsText=true" \
  -F "codeImportedAsText=true")

# Parse import response
echo "📋 Import Results:"
echo "$import_response" | jq '.' 2>/dev/null || echo "$import_response"

# Clean up
rm -f "$COOKIE_FILE"
```

## Session Management

### Session Cookie Handling
```bash
#!/bin/bash
# Session management utilities

create_session() {
  local trilium_url="$1"
  local password="$2"
  local cookie_file="$3"

  echo "🔐 Creating session..."

  # Clear any existing cookies
  > "$cookie_file"

  # Login request
  login_response=$(curl -c "$cookie_file" -s -X POST "${trilium_url}/api/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "password=${password}")

  # Verify session
  if grep -q "trilium.sid" "$cookie_file"; then
    echo "✅ Session created successfully"
    return 0
  else
    echo "❌ Session creation failed"
    return 1
  fi
}

validate_session() {
  local trilium_url="$1"
  local cookie_file="$2"

  echo "🔍 Validating session..."

  # Test session with a simple API call
  test_response=$(curl -b "$cookie_file" -s -w "%{http_code}" \
    "${trilium_url}/api/root" -o /dev/null)

  if [ "$test_response" = "200" ]; then
    echo "✅ Session is valid"
    return 0
  else
    echo "❌ Session is invalid or expired"
    return 1
  fi
}

destroy_session() {
  local trilium_url="$1"
  local cookie_file="$2"

  echo "🗑️  Destroying session..."

  # Logout request
  curl -b "$cookie_file" -s -X POST "${trilium_url}/api/logout" > /dev/null

  # Remove cookie file
  rm -f "$cookie_file"

  echo "✅ Session destroyed"
}

# Usage examples
# create_session "http://localhost:8080" "password" "cookies.txt"
# validate_session "http://localhost:8080" "cookies.txt"
# destroy_session "http://localhost:8080" "cookies.txt"
```

### Reusable Upload Function
```bash
#!/bin/bash
# Reusable file upload function with session management

upload_file_with_session() {
  local trilium_url="$1"
  local note_id="$2"
  local file_path="$3"
  local mime_type="$4"
  local password="$5"
  local temp_cookies="/tmp/trilium_upload_$(date +%s).txt"

  # Validate inputs
  if [ ! -f "$file_path" ]; then
    echo "❌ Error: File not found: $file_path"
    return 1
  fi

  # Create session
  if ! create_session "$trilium_url" "$password" "$temp_cookies"; then
    return 1
  fi

  # Upload file
  echo "📤 Uploading: $(basename "$file_path")"

  upload_response=$(curl -b "$temp_cookies" -s -X POST \
    "${trilium_url}/api/notes/${note_id}/attachments/upload" \
    -H "Content-Type: multipart/form-data" \
    -F "upload=@${file_path};type=${mime_type}")

  # Parse response
  attachment_id=$(echo "$upload_response" | jq -r '.attachmentId')
  title=$(echo "$upload_response" | jq -r '.title')

  if [ -n "$attachment_id" ] && [ "$attachment_id" != "null" ]; then
    echo "✅ Upload successful!"
    echo "   Attachment ID: $attachment_id"
    echo "   Title: $title"
    result=0
  else
    echo "❌ Upload failed"
    echo "   Response: $upload_response"
    result=1
  fi

  # Clean up session
  destroy_session "$trilium_url" "$temp_cookies"

  return $result
}

# Usage example:
# upload_file_with_session "http://localhost:8080" "root" "/path/to/file.pdf" \
#   "application/pdf" "your_password"
```

## Troubleshooting Session Authentication

### Common Issues and Solutions

#### Issue 1: "Logged in session not found"
```bash
# Problem: Missing or invalid session cookie
# Solution: Ensure proper login and cookie handling

# Debug: Check if cookie file contains session
echo "🔍 Checking session cookie..."
if grep -q "trilium.sid" cookies.txt; then
  echo "✅ Session cookie found"
else
  echo "❌ No session cookie found - re-authenticate"
fi
```

#### Issue 2: Session expired
```bash
# Problem: Session has timed out
# Solution: Re-establish session

# Test session validity
curl -b cookies.txt -s -w "%{http_code}" "http://localhost:8080/api/root" \
  -o /dev/null

# If not 200, re-login:
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=your_password"
```

#### Issue 3: CSRF token errors
```bash
# Problem: Missing CSRF token for state-changing operations
# Solution: Get CSRF token first, then include in requests

# Get CSRF token
csrf_token=$(curl -b cookies.txt -s "http://localhost:8080/api/csrf-token" \
  | jq -r '.csrfToken')

# Use CSRF token in upload request
curl -b cookies.txt -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -H "X-CSRF-Token: $csrf_token" \
  -F "upload=@file.pdf;type=application/pdf"
```

### Debug Script
```bash
#!/bin/bash
# Comprehensive authentication debug script

TRILIUM_URL="${1:-http://localhost:8080}"
PASSWORD="${2:-your_password}"
COOKIE_FILE="debug_cookies.txt"

echo "🔍 Trilium Authentication Debug"
echo "URL: $TRILIUM_URL"
echo ""

# Step 1: Test login
echo "Step 1: Testing login..."
login_response=$(curl -c "$COOKIE_FILE" -v -X POST "${TRILIUM_URL}/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${PASSWORD}" 2>&1)

echo "Login response headers:"
echo "$login_response" | grep -E "(Set-Cookie|HTTP|<)"

# Step 2: Check cookies
echo ""
echo "Step 2: Checking cookies..."
if [ -f "$COOKIE_FILE" ]; then
  echo "Cookie file contents:"
  cat "$COOKIE_FILE"
else
  echo "❌ No cookie file created"
fi

# Step 3: Test API access
echo ""
echo "Step 3: Testing API access..."
api_response=$(curl -b "$COOKIE_FILE" -s -w "%{http_code}" \
  "${TRILIUM_URL}/api/root" -o /dev/null)

echo "API access status: $api_response"

if [ "$api_response" = "200" ]; then
  echo "✅ Session authentication working"
else
  echo "❌ Session authentication failed"
fi

# Step 4: Test file upload
echo ""
echo "Step 4: Testing file upload..."
test_file="/tmp/test_upload.txt"
echo "Test content" > "$test_file"

upload_response=$(curl -b "$COOKIE_FILE" -s -X POST \
  "${TRILIUM_URL}/api/notes/root/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@${test_file};type=text/plain")

echo "Upload response:"
echo "$upload_response" | jq '.' 2>/dev/null || echo "$upload_response"

# Clean up
rm -f "$COOKIE_FILE" "$test_file"
```

## API Authentication Summary

| Authentication Type | ETAPI Endpoints | Internal API Endpoints | File Upload APIs |
|-------------------|-----------------|----------------------|------------------|
| **ETAPI Token** | ✅ **Required** | ❌ **Not Supported** | ❌ **Not Supported** |
| **Session Cookie** | ❌ **Not Supported** | ✅ **Required** | ✅ **Required** |
| **Password** | ❌ **Not Supported** | ❌ **Not Supported** | ❌ **Not Supported** |

## Correct Usage Patterns

### ✅ ETAPI Endpoints (Use ETAPI Token)
```bash
# Create note using ETAPI
curl -X POST "http://localhost:8080/etapi/create-note" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parentNoteId": "root", "title": "Test", "type": "text", "content": "test"}'
```

### ✅ File Upload Endpoints (Use Session)
```bash
# Upload file using session
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=PASSWORD"

curl -b cookies.txt -X POST "http://localhost:8080/api/notes/NOTE_ID/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@file.pdf;type=application/pdf"
```

## MCP Implementation Implications

### Corrected MCP Tool Implementation
```typescript
// MCP tools need session management, not just ETAPI tokens
async function uploadFile(args: {
  noteId: string;
  filePath: string;
  mimeType: string;
  triliumPassword: string;  // Required for session establishment
}): Promise<UploadResult> {
  // Step 1: Establish session
  const session = await this.establishSession(args.triliumPassword);

  // Step 2: Upload file using session cookies
  const formData = new FormData();
  formData.append('upload', new Blob([await fs.readFile(args.filePath)]), {
    type: args.mimeType
  });

  const response = await fetch(
    `http://localhost:8080/api/notes/${args.noteId}/attachments/upload`,
    {
      method: 'POST',
      headers: {
        'Cookie': session.getCookieHeader()
      },
      body: formData
    }
  );

  return response.json();
}
```

## Conclusion

**Key Corrections:**

1. ❌ **ETAPI tokens DO NOT work** with internal file upload APIs
2. ✅ **Session-based authentication IS REQUIRED** for file uploads
3. ✅ **Two-step process**: Login → Get session cookie → Use session for uploads
4. ✅ **Password required** for establishing sessions
5. ✅ **Session management** needed for proper authentication

The "Logged in session not found" error you encountered confirms that **session-based authentication is mandatory** for internal file upload APIs.

---

**Last Updated**: October 24, 2025
**Status**: ✅ **CORRECTED** - Accurate authentication flow documented
**Authentication Method**: Session-based (required for file uploads)