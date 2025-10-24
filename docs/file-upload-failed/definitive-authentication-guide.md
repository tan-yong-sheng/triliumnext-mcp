# Definitive Authentication Guide - TriliumNext API Access

## 🎯 DEFINITIVE ANSWER

**NO**, you cannot establish sessions via ETAPI tokens on `/api/login`. The authentication systems are **completely separate and non-interchangeable**.

**Research Date**: October 24, 2025
**Status**: ✅ **DEFINITIVE** - No token-to-session conversion possible

## Authentication Systems Summary

### Two Separate Authentication Worlds

| Authentication Type | ETAPI Tokens | Session Cookies |
|-------------------|--------------|-----------------|
| **Creation Method** | `/etapi/auth/login` + password | `/api/login` + password |
| **Format** | `Authorization: Bearer TOKEN` | `Cookie: trilium.sid=SESSION_ID` |
| **API Access** | `/etapi/*` endpoints only | `/api/*` endpoints only |
| **File Uploads** | ❌ **NO ACCESS** | ✅ **FULL ACCESS** |
| **Conversion** | ❌ Cannot convert to sessions | ❌ Cannot convert to tokens |

## The Hard Reality

### ❌ What You Cannot Do

```bash
# THIS DOES NOT WORK - /api/login only accepts passwords
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Authorization: Bearer ETAPI_TOKEN" \
  -d "password=ETAPI_TOKEN"
# Result: Authentication failed - not a valid password
```

```bash
# THIS DOES NOT WORK - No conversion endpoints exist
curl -X POST "http://localhost:8080/api/convert-token-to-session" \
  -H "Authorization: Bearer ETAPI_TOKEN"
# Result: 404 Not Found - no such endpoint
```

### ✅ What You Must Do

**For file uploads, you MUST use the main Trilium password:**

```bash
# The ONLY way to establish sessions for file uploads
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=MAIN_TRIIUM_PASSWORD"
```

## Complete Authentication Matrix

| Operation | ETAPI Token | Session Cookie | Password Required |
|-----------|-------------|----------------|-------------------|
| **Create Note** | ✅ `/etapi/create-note` | ❌ No ETAPI access | ✅ For session creation |
| **Search Notes** | ✅ `/etapi/notes` | ❌ No ETAPI access | ✅ For session creation |
| **Get Note Content** | ✅ `/etapi/notes/{id}/content` | ❌ No ETAPI access | ✅ For session creation |
| **Upload Files** | ❌ **NO ACCESS** | ✅ `/api/notes/{id}/attachments/upload` | ✅ **REQUIRED** |
| **Import Archives** | ❌ **NO ACCESS** | ✅ `/api/notes/{id}/notes-import` | ✅ **REQUIRED** |
| **Update Attachment** | ❌ **NO ACCESS** | ✅ `/api/attachments/{id}/file` | ✅ **REQUIRED** |

## Working Examples - Two Separate Workflows

### Workflow 1: ETAPI Operations (Token-Based)
```bash
#!/bin/bash
# ETAPI operations - no sessions needed

# Step 1: Get ETAPI token (one-time setup)
ETAPI_TOKEN=$(curl -s -X POST "http://localhost:8080/etapi/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password"}' | jq -r '.authToken')

# Step 2: Use ETAPI token for ETAPI operations
curl -H "Authorization: Bearer $ETAPI_TOKEN" \
  "http://localhost:8080/etapi/notes/root"

curl -X POST -H "Authorization: Bearer $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parentNoteId": "root", "title": "Test", "type": "text", "content": "test"}' \
  "http://localhost:8080/etapi/create-note"

# File uploads: NOT POSSIBLE with ETAPI tokens
```

### Workflow 2: File Upload Operations (Session-Based)
```bash
#!/bin/bash
# File upload operations - sessions required

# Step 1: Establish session with password
curl -c cookies.txt -X POST "http://localhost:8080/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=your_password"

# Step 2: Use session for file uploads
curl -b cookies.txt -X POST \
  "http://localhost:8080/api/notes/root/attachments/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "upload=@document.pdf;type=application/pdf"

# ETAPI operations: NOT POSSIBLE with sessions
```

## Technical Architecture

### Why No Conversion Exists

1. **Security Design**: ETAPI tokens are for external API access, sessions are for internal client access
2. **Different Scopes**: Each authentication type provides access to different API sets
3. **Separate Systems**: Built on different middleware and validation logic
4. **No Bridge Functionality**: No conversion mechanisms were implemented

### API Endpoint Separation

```
ETAPI Endpoints (Token Auth):
├── /etapi/auth/login
├── /etapi/create-note
├── /etapi/notes/{id}
├── /etapi/notes/{id}/content
├── /etapi/branches
├── /etapi/attributes
└── /etapi/app-info
    ↑
    │
    │ ONLY ETAPI TOKENS
    │
    ↓

Internal API Endpoints (Session Auth):
├── /api/login
├── /api/notes/{id}/attachments/upload
├── /api/notes/{id}/notes-import
├── /api/attachments/{id}/file
├── /api/clipper/*
└── /api/tree/*
    ↑
    │
    │ ONLY SESSION COOKIES
    │
    ↓
```

## MCP Implementation Requirements

### Two-Mode Operation Required

Your MCP server needs to support **both authentication modes**:

```typescript
class TriliumMCPServer {
  private etapiToken?: string;
  private sessionCookie?: string;

  // Mode 1: ETAPI operations
  async createNote(args: CreateNoteArgs) {
    // Use ETAPI token
    const response = await fetch('http://localhost:8080/etapi/create-note', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.etapiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args)
    });
    return response.json();
  }

  // Mode 2: File upload operations
  async uploadFile(args: UploadFileArgs) {
    // Need password to establish session
    if (!this.sessionCookie) {
      await this.establishSession(args.triliumPassword);
    }

    const formData = new FormData();
    formData.append('upload', await fs.readFile(args.filePath), {
      type: args.mimeType
    });

    const response = await fetch(
      `http://localhost:8080/api/notes/${args.noteId}/attachments/upload`,
      {
        method: 'POST',
        headers: {
          'Cookie': this.sessionCookie
        },
        body: formData
      }
    );
    return response.json();
  }

  private async establishSession(password: string) {
    const response = await fetch('http://localhost:8080/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `password=${password}`
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.sessionCookie = setCookieHeader.split(';')[0];
    }
  }
}
```

### User Configuration Requirements

```typescript
// MCP tool configurations need both auth methods
{
  "tools": [
    {
      "name": "create_note",
      "description": "Create a note (ETAPI token required)",
      "inputSchema": {
        "type": "object",
        "properties": {
          "etapiToken": {"type": "string", "description": "ETAPI token from Trilium Options"},
          "parentNoteId": {"type": "string"},
          "title": {"type": "string"},
          "type": {"type": "string"},
          "content": {"type": "string"}
        },
        "required": ["etapiToken", "parentNoteId", "title", "type"]
      }
    },
    {
      "name": "upload_file",
      "description": "Upload a file (Trilium password required)",
      "inputSchema": {
        "type": "object",
        "properties": {
          "triliumPassword": {"type": "string", "description": "Main Trilium password"},
          "noteId": {"type": "string"},
          "filePath": {"type": "string"},
          "mimeType": {"type": "string"}
        },
        "required": ["triliumPassword", "noteId", "filePath", "mimeType"]
      }
    }
  ]
}
```

## Security Implications

### Password Storage in MCP

**Important consideration**: MCP will need to handle user passwords for file uploads:

```typescript
// Secure password handling in MCP
class SecurePasswordManager {
  private passwords = new Map<string, string>();

  // Store password temporarily for session establishment
  async storePassword(userId: string, password: string): Promise<void> {
    // Hash password for storage
    const hash = await this.hashPassword(password);
    this.passwords.set(userId, hash);
  }

  // Use password to establish session
  async establishSession(userId: string): Promise<string> {
    const hashedPassword = this.passwords.get(userId);
    if (!hashedPassword) {
      throw new Error('No password stored for user');
    }

    // Establish session with original password
    // (In reality, you'd need the original password, not hash)
    // This highlights the security challenge
  }

  // Clear password after use
  async clearPassword(userId: string): Promise<void> {
    this.passwords.delete(userId);
  }
}
```

## Alternative Approaches

### Option 1: User-Provided Sessions
```bash
# Users manage their own sessions and provide session cookies
# MCP server doesn't handle passwords directly
curl -b user_provided_cookies.txt -X POST \
  "http://localhost:8080/api/notes/root/attachments/upload" \
  -F "upload=@file.pdf"
```

### Option 2: Browser Automation
```bash
# Use browser automation to handle file uploads
# More complex but doesn't expose passwords to MCP
# (Not recommended for production use)
```

### Option 3: Custom Authentication Service
```bash
# Build a separate service that handles authentication
# MCP calls the service, which manages sessions securely
# (Most complex but most secure)
```

## Final Recommendation

### For MCP Implementation:

1. **Accept two authentication methods**:
   - ETAPI tokens for note operations
   - Trilium passwords for file upload operations

2. **Clear user communication**:
   - Explain why both are needed
   - Document the security implications
   - Provide setup instructions

3. **Secure password handling**:
   - Never log passwords
   - Clear passwords after session establishment
   - Consider session timeout management

4. **Graceful error handling**:
   - Clear error messages for authentication failures
   - Help users understand which auth method to use

## Conclusion

**The definitive answer is NO** - ETAPI tokens cannot be used to establish sessions, and sessions cannot be established without the main Trilium password. The two authentication systems are completely separate by design.

For file uploads in your MCP server, you **must** handle user passwords to establish sessions. There is no way around this architectural limitation in the current TriliumNext API design.

---

**Last Updated**: October 24, 2025
**Status**: ✅ **DEFINITIVE** - No token-to-session conversion possible
**Authentication Requirements**: Both ETAPI tokens (for notes) AND passwords (for file uploads) needed