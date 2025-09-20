# Core Utilities - Application-Level Utilities

## 🎯 Purpose

The Core Utilities directory provides **foundational utility functions** that support the entire application, offering essential functionality like note building, verbose logging, validation, and HTTP client configuration.

## 🏗️ Architecture Overview

```
utils/
├── 📄 index.ts              # [CORE] Central utility exports
├── 📄 noteBuilder.ts        # [NOTE] Note parameter building utilities
├── 📄 verboseUtils.ts       # [LOGGING] Centralized verbose logging
├── 📄 validationUtils.ts    # [VALIDATION] Zod-based validation
├── 📄 permissionUtils.ts    # [SECURITY] Permission checking utilities
├── 📄 hashUtils.ts          # [SECURITY] Hash generation utilities
├── 📄 axiosConfig.ts       # [HTTP] HTTP client configuration
└── 📄 typeUtils.ts          # [TYPES] Type utilities and helpers
```

## 🔄 Utility Architecture

```
Business Logic (Domain Modules)
    ↓ [Utility Import]
Core Utilities (utils/)
    ↓ [Cross-Cutting Concerns]
External Systems (API, Database, etc.)
```

## 🔧 Core Components

### **Note Builder** (`noteBuilder.ts`)
**Purpose**: Simplified note creation with intelligent content processing

**Key Features:**
- **Universal Function**: Single function for all note types
- **Smart Content Processing**: Auto-detect HTML/Markdown/plain text
- **Type Safety**: Strong TypeScript typing
- **Content Correction**: Automatic HTML wrapping for text notes

**Usage Example:**
```typescript
import { buildNoteParams } from './noteBuilder.js';

// Code note - content passes through unchanged
const codeNote = buildNoteParams({
  parentNoteId: "root",
  title: "Fibonacci Function",
  noteType: "code",
  content: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    else:
        fib = [0, 1]
        while len(fib) < n:
            fib.append(fib[-1] + fib[-2])
        return fib`,
  mime: "text/x-python"
});

// Text note with auto Markdown conversion
const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified"
});
```

### **Verbose Utils** (`verboseUtils.ts`)
**Purpose**: Centralized verbose logging system with specialized functions

**Key Features:**
- **Centralized Control**: Single source of truth for verbose behavior
- **Specialized Functions**: Input/output logging, API requests, error handling
- **Consistent Format**: Standardized logging output across all modules
- **Performance**: Optimized for minimal overhead

**Logging Functions:**
```typescript
// General purpose logging
logVerbose("category", "message", data);

// Specialized function logging
logVerboseInput("functionName", params);
logVerboseOutput("functionName", result);
logVerboseApi("GET", "/api/notes", data);
logVerboseError("context", error);
logVerboseAxiosError("context", error);
logVerboseTransform("category", from, to, reason);
```

**Benefits:**
- **Code Reduction**: Eliminated 11+ repetitive verbose checks
- **Consistency**: All verbose output follows `[VERBOSE] category: message` pattern
- **Maintainability**: Easy to modify logging behavior without touching multiple files
- **Enhanced Debugging**: Detailed API error information and transformation tracking

### **Validation Utils** (`validationUtils.ts`)
**Purpose**: Zod-based validation with comprehensive error handling

**Key Features:**
- **Schema Validation**: Complete MCP tool parameter schemas
- **Type Safety**: Runtime type checking with TypeScript inference
- **Error Formatting**: Clear, actionable error messages
- **Safe Validation**: Non-throwing validation functions

**Validation Functions:**
```typescript
import { validateCreateNote, validateSearchNotes, createValidationError } from './validationUtils.js';

// Safe validation (doesn't throw)
const validationResult = validateCreateNote(params);
if (!validationResult.success) {
  return {
    content: [{ type: "text", text: createValidationError(validationResult.error) }],
    isError: true
  };
}

// Or use with try/catch for throwing validation
try {
  const validated = validateSearchNotes(params);
  // Process validated data
} catch (error) {
  return {
    content: [{ type: "text", text: createValidationError(error) }],
    isError: true
  };
}
```

### **Permission Utils** (`permissionUtils.ts`)
**Purpose**: Permission checking interface and utilities

**Key Features:**
- **Permission Interface**: Type-safe permission checking
- **Operation Mapping**: Map operations to required permissions
- **Error Handling**: Permission-specific error creation
- **Validation**: Permission validation utilities

**Permission Functions:**
```typescript
export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

export function requirePermission(
  server: PermissionChecker,
  permission: string,
  operation: string
): void {
  if (!server.hasPermission(permission)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `${operation} operation requires ${permission} permission`
    );
  }
}

export function getRequiredPermissions(operation: string): string[] {
  const permissionMap = {
    'create_note': ['WRITE'],
    'update_note': ['WRITE'],
    'delete_note': ['WRITE'],
    'get_note': ['READ'],
    'search_notes': ['READ'],
    'resolve_note_id': ['READ'],
    'read_attributes': ['READ'],
    'manage_attributes': ['WRITE']
  };

  return permissionMap[operation] || [];
}
```

### **Hash Utils** (`hashUtils.ts`)
**Purpose**: Hash generation and validation utilities

**Key Features:**
- **Content Hashing**: Generate content hashes for conflict detection
- **BlobId Integration**: Work with Trilium's blobId system
- **Validation**: Hash comparison and validation
- **Security**: Cryptographic hashing functions

**Hash Functions:**
```typescript
export function generateContentHash(content: string): string {
  // Use MD5 for compatibility with existing systems
  return crypto.createHash('md5').update(content).digest('hex');
}

export function validateContentHash(
  content: string,
  expectedHash: string
): boolean {
  const actualHash = generateContentHash(content);
  return actualHash === expectedHash;
}

export function blobIdToHash(blobId: string): string {
  // Extract hash component from blobId if needed
  return blobId.split('_')[1] || blobId;
}
```

### **Axios Config** (`axiosConfig.ts`)
**Purpose**: HTTP client configuration and utilities

**Key Features:**
- **Client Configuration**: Pre-configured axios instance
- **Error Handling**: Centralized error handling
- **Request/Response Interceptors**: Request/response processing
- **Retry Logic**: Automatic retry mechanisms

**Configuration:**
```typescript
export function createAxiosInstance(baseURL: string, token: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    timeout: 30000,
    maxRedirects: 5
  });
}

export function setupInterceptors(instance: AxiosInstance): void {
  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      if (process.env.VERBOSE === 'true') {
        logVerboseApi(config.method?.toUpperCase() || 'GET', config.url, config.data);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (process.env.VERBOSE === 'true') {
        logVerboseAxiosError('axios', error);
      }
      return Promise.reject(error);
    }
  );
}
```

### **Type Utils** (`typeUtils.ts`)
**Purpose**: Type utilities and helper functions

**Key Features:**
- **Type Guards**: Runtime type checking
- **Type Conversion**: Safe type conversion functions
- **Type Validation**: Type validation utilities
- **Generic Helpers**: Reusable type utilities

**Type Functions:**
```typescript
export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertType<T>(value: any, typeGuard: (value: any) => value is T): T {
  if (!typeGuard(value)) {
    throw new Error(`Type assertion failed: ${JSON.stringify(value)}`);
  }
  return value;
}
```

## 🎨 Usage Patterns

### **Cross-Module Integration**
```typescript
// Import utilities in domain modules
import {
  buildNoteParams,
  logVerbose,
  validateCreateNote,
  requirePermission
} from '../../utils/index.js';

// Use in business logic
export async function handleCreateNote(args, axiosInstance, server) {
  // Permission check
  requirePermission(server, 'WRITE', 'create_note');

  // Input validation
  const validated = validateCreateNote(args);
  if (!validated.success) {
    throw new McpError(ErrorCode.InvalidParams, createValidationError(validated.error));
  }

  // Log input
  logVerboseInput('handleCreateNote', args);

  // Build note parameters
  const noteParams = buildNoteParams({
    parentNoteId: validated.data.parentNoteId,
    title: validated.data.title,
    noteType: validated.data.type,
    content: validated.data.content,
    mime: validated.data.mime
  });

  // Continue with note creation...
}
```

### **Centralized Configuration**
```typescript
// Configure utilities once at application startup
import { setupVerboseLogging, createAxiosInstance } from './utils/index.js';

// Initialize verbose logging
setupVerboseLogging(process.env.VERBOSE === 'true');

// Create HTTP client
const axiosInstance = createAxiosInstance(
  process.env.TRILIUM_API_URL || 'http://localhost:8080/etapi',
  process.env.TRILIUM_API_TOKEN
);
```

## 🛡️ Security Considerations

### **Input Validation**
- **Schema Validation**: Comprehensive input validation
- **Type Safety**: Runtime type checking
- **Sanitization**: Input sanitization where appropriate
- **Bounds Checking**: Input bounds validation

### **Permission Security**
- **Principle of Least Privilege**: Minimum required permissions
- **Runtime Validation**: Continuous permission checking
- **Audit Trail**: Permission usage logging
- **Access Control**: Resource-level access control

### **Error Security**
- **Information Disclosure**: Avoid sensitive information in errors
- **Consistent Errors**: Standardized error messages
- **Graceful Degradation**: Safe failure modes
- **Error Logging**: Secure error logging

## 📊 Performance Considerations

### **Optimization Strategies**
- **Lazy Loading**: Load utilities only when needed
- **Memoization**: Cache expensive operations
- **Batch Processing**: Process operations in batches
- **Streaming**: Process large data efficiently

### **Memory Management**
- **Object Pooling**: Reuse objects where possible
- **Garbage Collection**: Optimize for garbage collection
- **Memory Profiling**: Monitor memory usage
- **Resource Cleanup**: Proper resource cleanup

## 🧪 Testing Strategy

### **Test Categories**
1. **Unit Tests**: Individual utility function testing
2. **Integration Tests**: Utility integration testing
3. **Performance Tests**: Utility performance validation
4. **Security Tests**: Input validation and permission testing
5. **Edge Cases**: Boundary conditions and error scenarios

### **Test Coverage**
- **Functionality**: Correctness of utility functions
- **Error Handling**: Error scenario testing
- **Performance**: Performance optimization validation
- **Security**: Security feature testing
- **Integration**: Cross-utility integration testing

## 🔧 Extension Points

### **Adding New Utilities**
1. **Create Utility File**: Add new utility in appropriate category
2. **Update Exports**: Update central exports
3. **Add Tests**: Comprehensive testing
4. **Update Documentation**: Document utility usage

### **Enhancing Existing Utilities**
1. **New Features**: Add new features to existing utilities
2. **Performance Optimization**: Optimize utility performance
3. **Security Enhancement**: Improve security features
4. **API Enhancement**: Improve utility APIs

### **Utility Categories**
1. **New Categories**: Add new utility categories
2. **Category Organization**: Reorganize utility categories
3. **Cross-Cutting Concerns**: Address new cross-cutting concerns
4. **Framework Integration**: Integrate with external frameworks

## 📈 Utility Metrics

| Utility Category | Functions | Complexity | Usage Frequency |
|------------------|-----------|-------------|------------------|
| **Note Building** | 3+ | Medium | High |
| **Verbose Logging** | 8+ | Low | High |
| **Validation** | 15+ | High | High |
| **Permission** | 5+ | Low | High |
| **Hash Utilities** | 4+ | Medium | Medium |
| **HTTP Client** | 6+ | Medium | High |
| **Type Utils** | 10+ | Low | Medium |

## 📚 Related Documentation

- **[Source Architecture](../README.md)** - Source code overview
- **[Module Architecture](../modules/README.md)** - Module architecture
- **[Validation System](../../docs/validation-system.md)** - Validation approach
- **[Security Architecture](../../docs/security-architecture.md)** - Security model

---

**Core Utilities Version**: v2.0 (Enhanced)
**Architecture Pattern**: Utility Library with Cross-Cutting Concerns