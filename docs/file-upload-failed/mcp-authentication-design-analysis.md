# MCP Authentication Design Analysis - Environment Variables vs API Tokens

## Executive Summary

**Strong Recommendation**: **NO** - MCP should **NOT** use Trilium passwords as environment variables. This violates fundamental security principles and MCP design patterns. MCP should use **ETAPI tokens** as the primary authentication method, with a **secure session establishment pattern** for file uploads.

**Analysis Date**: October 24, 2025
**Perspective**: Third-party application security and design best practices

## MCP Design Principles and Security Considerations

### 1. Principle of Least Privilege

**Environment Variable Approach (❌ Bad)**:
```bash
# Requires full admin password
TRILIUM_PASSWORD="user_admin_password"
```

**API Token Approach (✅ Good)**:
```bash
# Scoped, revocable token
TRILIUM_ETAPI_TOKEN="abc123...xyz"
```

**Analysis**: MCP is a third-party tool that should only have the minimum necessary permissions. ETAPI tokens provide scoped access that can be limited and revoked independently of the main account.

### 2. Credential Isolation and Rotation

**Environment Variable Issues**:
- **Shared Credential**: Same password used for MCP, web login, mobile apps
- **Rotation Impact**: Changing password breaks ALL integrations simultaneously
- **No Audit Trail**: Cannot distinguish MCP access from other access
- **Emergency Revocation**: Cannot revoke MCP access without changing main password

**API Token Benefits**:
- **Isolated Credential**: Dedicated token for MCP usage
- **Independent Rotation**: Can rotate MCP token without affecting other access
- **Granular Auditing**: ETAPI token usage can be tracked separately
- **Selective Revocation**: Can revoke MCP access while preserving other integrations

### 3. MCP Ecosystem Standards

**Standard MCP Pattern**:
```typescript
// Most MCP integrations use API tokens
{
  "name": "github-mcp",
  "authentication": {
    "type": "api_token",
    "environment_variable": "GITHUB_TOKEN"
  }
}

{
  "name": "slack-mcp",
  "authentication": {
    "type": "api_token",
    "environment_variable": "SLACK_BOT_TOKEN"
  }
}
```

**MCP Design Philosophy**: MCP servers are designed to integrate with services using **API tokens**, not user passwords. This follows the pattern established by GitHub, Slack, OpenAI, and other services in the MCP ecosystem.

## Security Architecture Analysis

### Threat Model Comparison

#### Environment Variable with Password
```
Threat Vectors:
├── Credential Exposure (High Risk)
│   ├── Environment files accidentally committed
│   ├── Process lists showing passwords
│   ├── Log files containing passwords
│   └── Crash dumps revealing passwords
├── Lateral Movement (Critical Risk)
│   ├── Password grants full system access
│   ├── Can access other user accounts
│   ├── Can modify system settings
│   └── Can create additional credentials
├── Credential Reuse (High Risk)
│   ├── Same password used across services
│   ├── Password strength limitations
│   ├── No ability to scope permissions
│   └── Cannot implement time-based access
└── Incident Response (Poor)
    ├── Must change password for ALL services
    ├── Cannot revoke MCP access selectively
    ├── No audit trail for MCP activities
    └── High impact on user workflow
```

#### API Token Approach
```
Threat Vectors:
├── Credential Exposure (Medium Risk)
│   ├── Token scope-limited to ETAPI operations
│   ├── Can be rotated without affecting main account
│   ├── Shorter token lifespan possible
│   └── Can be easily revoked
├── Lateral Movement (Low Risk)
│   ├── Token only grants API access
│   ├── Cannot access web interface
│   ├── Cannot modify system settings
│   └── ├──Limited to predefined operations
├── Credential Reuse (Low Risk)
│   ├── Dedicated token for MCP only
│   ├── Can generate multiple tokens for different uses
│   ├── Token-specific permissions possible
│   └── Can implement time-based restrictions
└── Incident Response (Good)
    ├── Can revoke only the compromised token
    ├── Main account remains secure
    ├── Audit trail shows specific token usage
    └── Minimal impact on user workflow
```

## Real-World MCP Integration Examples

### GitHub MCP (Token-Based)
```bash
# Standard pattern used by GitHub MCP
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
```

### OpenAI MCP (Token-Based)
```bash
# OpenAI API key pattern
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

### Database MCP (Connection String - Not Password)
```bash
# Database connections use connection strings, not passwords
DATABASE_URL="postgresql://user:token@host:port/db"
```

## MCP Authentication Design Recommendations

### Recommended Architecture

```typescript
class TriliumMCPServer {
  private etapiToken: string;
  private sessionManager: SessionManager;

  constructor() {
    // Primary authentication: ETAPI token
    this.etapiToken = process.env.TRILIUM_ETAPI_TOKEN;
    if (!this.etapiToken) {
      throw new Error('TRILIUM_ETAPI_TOKEN environment variable required');
    }

    // Session management for file uploads
    this.sessionManager = new SessionManager();
  }

  // Note operations: Use ETAPI token directly
  async createNote(args: CreateNoteArgs): Promise<Note> {
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

  // File uploads: Use ETAPI token to establish temporary session
  async uploadFile(args: UploadFileArgs): Promise<Attachment> {
    // Option 1: Temporary session establishment (preferred)
    const session = await this.sessionManager.createSession(this.etapiToken);

    // Option 2: User provides temporary session token
    // const session = await this.sessionManager.validateSession(args.sessionToken);

    const formData = new FormData();
    formData.append('upload', await fs.readFile(args.filePath));

    const response = await fetch(
      `http://localhost:8080/api/notes/${args.noteId}/attachments/upload`,
      {
        method: 'POST',
        headers: {
          'Cookie': session.cookie
        },
        body: formData
      }
    );

    // Clean up session after upload
    await this.sessionManager.destroySession(session.id);

    return response.json();
  }
}
```

### Alternative Session Management Patterns

#### Pattern 1: One-Time Session Token (Recommended)
```typescript
// User generates one-time session token via Trilium UI
// MCP server validates token and establishes temporary session
class SessionManager {
  async validateSession(oneTimeToken: string): Promise<Session> {
    // Validate one-time token with Trilium
    const response = await fetch('http://localhost:8080/api/validate-session-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.etapiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: oneTimeToken })
    });

    if (response.ok) {
      return await response.json(); // Returns session cookie
    }
    throw new Error('Invalid session token');
  }
}
```

#### Pattern 2: Browser-Based Session Bridge
```typescript
// User authenticates via browser, gets session cookie
// User provides session cookie to MCP temporarily
class BrowserSessionBridge {
  async importBrowserSession(sessionCookie: string): Promise<boolean> {
    // Validate session cookie format and expiry
    // Use for file upload operations
    // User can revoke session after use
  }
}
```

## User Experience and Setup

### Recommended Setup Process

#### Step 1: ETAPI Token Setup
```bash
# User creates ETAPI token in Trilium UI
# Settings → Options → ETAPI → Generate Token
export TRILIUM_ETAPI_TOKEN="generated_token_here"
```

#### Step 2: File Upload Session Setup
```bash
# Option A: One-time session generation
# User generates temporary session token in Trilium UI
mcp upload-file --session-token="temp_token_abc123"

# Option B: Browser session bridge
# User copies session cookie from browser
mcp upload-file --session-cookie="trilium.sid=xyz789"

# Option C: Temporary password grant (least preferred)
# User provides password for temporary session only
mcp upload-file --temp-password="user_password"
```

### Configuration File
```json
{
  "trilium": {
    "etapi_token": "${TRILIUM_ETAPI_TOKEN}",
    "server_url": "http://localhost:8080",
    "file_upload_method": "session_token",
    "session_expiry": "1h"
  }
}
```

## Security Best Practices for MCP

### 1. Environment Variable Security
```bash
# ✅ Good: Use API tokens
TRILIUM_ETAPI_TOKEN="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# ❌ Bad: Use passwords
TRILIUM_PASSWORD="user_password_123"

# ✅ Good: Use .env files with proper permissions
# .env (600 permissions)
TRILIUM_ETAPI_TOKEN="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# ✅ Good: Use secret management
TRILIUM_ETAPI_TOKEN="$(vault read secret/trilium/token)"
```

### 2. Session Security
```typescript
class SecureSessionManager {
  private sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

  async createSession(etapiToken: string): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      etapiToken: etapiToken,
      cookie: await this.establishSession(etapiToken)
    };

    this.sessions.set(sessionId, session);

    // Auto-cleanup after timeout
    setTimeout(() => this.destroySession(sessionId), this.SESSION_TIMEOUT);

    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Logout from Trilium
      await fetch('http://localhost:8080/api/logout', {
        method: 'POST',
        headers: {
          'Cookie': session.cookie
        }
      });

      this.sessions.delete(sessionId);
    }
  }
}
```

### 3. Error Handling and Security
```typescript
class SecureMCPServer {
  private sanitizeError(error: Error): string {
    // Never expose authentication details in error messages
    if (error.message.includes('password') ||
        error.message.includes('token') ||
        error.message.includes('session')) {
      return 'Authentication failed. Please check your credentials.';
    }
    return error.message;
  }

  private logSecurityEvent(event: string, details: any): void {
    // Log security events without sensitive data
    console.log(`[SECURITY] ${event}`, {
      timestamp: new Date().toISOString(),
      userId: this.hashUserId(details.userId),
      operation: details.operation,
      success: details.success
      // Never log passwords or tokens
    });
  }
}
```

## Implementation Roadmap

### Phase 1: ETAPI Token Implementation (Immediate)
```typescript
// Implement all note operations using ETAPI tokens
// This covers 80% of MCP functionality
- Create notes
- Search notes
- Get note content
- Manage attributes
- Update note content
```

### Phase 2: Secure File Upload Solution (Short-term)
```typescript
// Implement session-based file uploads with secure patterns
- One-time session token generation
- Browser session bridge
- Temporary session management
- Session cleanup and security
```

### Phase 3: Enhanced Security Features (Long-term)
```typescript
// Advanced security and user experience features
- Time-limited tokens
- IP-based restrictions
- Audit logging
- Multi-factor authentication support
```

## Compliance and Standards

### GDPR and Data Protection
- **Data Minimization**: API tokens provide minimal necessary access
- **Right to Erasure**: Tokens can be revoked without affecting main account
- **Audit Trail**: ETAPI token usage can be logged and tracked
- **Security Breach Response**: Can revoke specific tokens without service disruption

### OAuth 2.0 Principles
- **Separation of Concerns**: Different credentials for different purposes
- **Token-Based Authentication**: Standard pattern for API access
- **Revocation and Rotation**: Tokens can be rotated independently
- **Scope Limitation**: Tokens can be scoped to specific operations

## Conclusion and Final Recommendation

### **Strong Recommendation: Use ETAPI Tokens, Not Passwords**

**Architectural Reasons**:
1. **Follows MCP Standards**: Aligns with ecosystem patterns
2. **Security Best Practices**: Principle of least privilege
3. **Credential Isolation**: Separate credentials for separate purposes
4. **Incident Response**: Can revoke MCP access without affecting other services

**Security Reasons**:
1. **Reduced Attack Surface**: Token compromise is less severe than password compromise
2. **Audit Trail**: ETAPI token usage can be tracked separately
3. **Rotation Management**: Tokens can be rotated independently
4. **Emergency Revocation**: Can disable MCP access selectively

**User Experience Reasons**:
1. **Standard Pattern**: Users expect API tokens for integrations
2. **Granular Control**: Users can manage MCP access independently
3. **Peace of Mind**: Main account password not exposed to third-party tools
4. **Professional Setup**: Aligns with enterprise security expectations

### **For File Uploads**: Implement secure session management patterns that don't expose passwords directly to the MCP server. This could include one-time session tokens, browser session bridges, or temporary authentication flows.

---

**Final Decision**: **Use ETAPI tokens as environment variables**. Implement secure session management for file uploads that doesn't require password storage in the MCP server.

**Implementation Priority**:
1. ETAPI token authentication (immediate)
2. Secure session-based file uploads (short-term)
3. Enhanced security features (long-term)