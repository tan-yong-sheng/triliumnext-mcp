# Public Types - External Type Definitions

## 🎯 Purpose

The Public Types directory provides **external-facing type definitions** and interfaces that are consumed by external applications and libraries, offering a stable API contract for the TriliumNext MCP server.

## 🏗️ Architecture Overview

```
types/
├── 📄 index.ts              # [CORE] Central type exports
├── 📄 mcpTypes.ts           # [MCP] MCP protocol types
├── 📄 triliumTypes.ts       # [TRILIUM] Trilium-specific types
├── 📄 operationTypes.ts     # [OPERATION] Operation interface types
├── 📄 validationTypes.ts    # [VALIDATION] Validation schema types
└── 📄 errorTypes.ts         # [ERRORS] Error handling types
```

## 🔄 Type System Architecture

```
External Applications
    ↓ [Type Import]
Public Types (types/)
    ↓ [Implementation]
Internal Types (src/modules/types/)
    ↓ [Business Logic]
Domain Modules
```

## 🔧 Core Components

### **Type Index** (`index.ts`)
**Purpose**: Central export hub for all public types

**Export Structure:**
```typescript
// MCP Protocol Types
export * from './mcpTypes.js';

// Trilium-specific Types
export * from './triliumTypes.js';

// Operation Interface Types
export * from './operationTypes.js';

// Validation Schema Types
export * from './validationTypes.js';

// Error Handling Types
export * from './errorTypes.js';
```

### **MCP Types** (`mcpTypes.ts`)
**Purpose**: MCP (Model Context Protocol) specific type definitions

**Key Types:**
```typescript
// MCP Tool Definition
export interface McpTool {
  name: string;
  description: string;
  inputSchema: McpSchema;
}

// MCP Schema Types
export interface McpSchema {
  type: 'object';
  properties: Record<string, McpProperty>;
  required: string[];
  additionalProperties?: boolean;
}

export interface McpProperty {
  type: string;
  description?: string;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: any;
  items?: McpProperty;
}

// MCP Request/Response Types
export interface McpRequest {
  method: string;
  params: Record<string, any>;
}

export interface McpResponse {
  result?: any;
  error?: McpError;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

// MCP Server Types
export interface McpServerConfig {
  name: string;
  version: string;
  capabilities: McpCapabilities;
}

export interface McpCapabilities {
  tools?: McpToolCapability;
  resources?: McpResourceCapability;
  prompts?: McpPromptCapability;
}

export interface McpToolCapability {
  listChanged?: boolean;
}
```

### **Trilium Types** (`triliumTypes.ts`)
**Purpose**: Trilium-specific type definitions for API integration

**Key Types:**
```typescript
// Note Types
export type NoteType =
  | 'text'
  | 'code'
  | 'mermaid'
  | 'book'
  | 'search'
  | 'relationMap'
  | 'render'
  | 'webView'
  | 'noteMap';

export interface Note {
  noteId: string;
  title: string;
  type: NoteType;
  mime?: string;
  isProtected?: boolean;
  isArchived?: boolean;
  dateCreated: string;
  dateModified: string;
  blobId?: string;
  contentSize?: number;
  revisionCount?: number;
  attributes?: Attribute[];
}

// Attribute Types
export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

// Search Types
export interface SearchResult {
  noteId: string;
  title: string;
  type: NoteType;
  dateModified: string;
  relevanceScore?: number;
  excerpt?: string;
}

// API Types
export interface TriliumApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface TriliumApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
```

### **Operation Types** (`operationTypes.ts`)
**Purpose**: Type definitions for all public operations

**Key Types:**
```typescript
// Note Operations
export interface CreateNoteOperation {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content?: ContentSection[];
  attributes?: Attribute[];
  position?: number;
  prefix?: string;
}

export interface UpdateNoteOperation {
  noteId: string;
  type: NoteType;
  content?: ContentSection[];
  expectedHash?: string;
  revision?: boolean;
}

export interface DeleteNoteOperation {
  noteId: string;
}

export interface GetNoteOperation {
  noteId: string;
}

// Search Operations
export interface SearchOperation {
  text?: string;
  searchCriteria?: SearchCriteria[];
  limit?: number;
  orderBy?: string;
  fastSearch?: boolean;
}

// Attribute Operations
export interface ReadAttributesOperation {
  noteId: string;
}

export interface ManageAttributesOperation {
  noteId: string;
  operation: 'read' | 'create' | 'update' | 'delete' | 'batch_create';
  attribute?: Attribute;
  attributes?: Attribute[];
  expectedHash?: string;
}

// Resolution Operations
export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
  autoSelect?: boolean;
}
```

### **Validation Types** (`validationTypes.ts`)
**Purpose**: Validation schema and error type definitions

**Key Types:**
```typescript
// Validation Schema Types
export interface ValidationSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required: string[];
  additionalProperties?: boolean;
}

export interface PropertySchema {
  type: string;
  description?: string;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: any;
}

// Validation Error Types
export interface ValidationError {
  path: string;
  message: string;
  value?: any;
  constraint: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  data?: any;
}

// Content Types
export interface ContentSection {
  type: 'text';
  content: string;
}
```

### **Error Types** (`errorTypes.ts`)
**Purpose**: Error handling and exception type definitions

**Key Types:**
```typescript
// Error Code Types
export enum ErrorCode {
  // MCP Standard Error Codes
  InvalidParams = -32602,
  InternalError = -32603,
  MethodNotFound = -32601,

  // Custom Error Codes
  PermissionDenied = -32001,
  ValidationError = -32002,
  NotFound = -32003,
  Conflict = -32004,
  RateLimit = -32005
}

// Application Error Types
export interface ApplicationError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Validation Error Types
export interface SchemaValidationError {
  code: ErrorCode.Validation;
  message: string;
  field?: string;
  value?: any;
  schema?: string;
}

// Permission Error Types
export interface PermissionError {
  code: ErrorCode.PermissionDenied;
  message: string;
  requiredPermission?: string;
  operation?: string;
}

// API Error Types
export interface ApiError {
  code: ErrorCode.InternalError;
  message: string;
  endpoint?: string;
  statusCode?: number;
  response?: any;
}
```

## 🎨 Type Design Principles

### **API Stability**
- **Semantic Versioning**: Follow semantic versioning for type changes
- **Backward Compatibility**: Maintain backward compatibility where possible
- **Deprecation Path**: Clear deprecation path for obsolete types
- **Migration Guide**: Provide migration guides for breaking changes

### **Type Safety**
- **Strong Typing**: Comprehensive type coverage
- **Null Safety**: Explicit null/undefined handling
- **Union Types**: Flexible type combinations
- **Generic Types**: Reusable type patterns

### **Documentation**
- **JSDoc Comments**: Comprehensive documentation
- **Usage Examples**: Clear usage examples
- **Type Constraints**: Clear type constraint documentation
- **Migration Notes**: Clear migration documentation

## 🛡️ Type Security

### **Input Validation**
- **Runtime Validation**: Type validation at runtime
- **Schema Validation**: JSON Schema compliance
- **Constraint Enforcement**: Business rule enforcement
- **Error Handling**: Comprehensive error reporting

### **API Safety**
- **Request Validation**: Input parameter validation
- **Response Validation**: Output structure validation
- **Error Handling**: API error type safety
- **Serialization**: Safe serialization/deserialization

## 📊 Type System Metrics

| Type Category | Public Types | Internal Types | Stability |
|----------------|--------------|----------------|-----------|
| **MCP Types** | 15+ | 5+ | Stable |
| **Trilium Types** | 20+ | 10+ | Stable |
| **Operation Types** | 12+ | 8+ | Stable |
| **Validation Types** | 8+ | 6+ | Stable |
| **Error Types** | 10+ | 5+ | Stable |

## 🧪 Testing Strategy

### **Test Categories**
1. **Type Validation**: Type system correctness
2. **Schema Testing**: JSON Schema validation
3. **Integration Testing**: Type integration with business logic
4. **Runtime Testing**: Runtime type validation
5. **Compatibility Testing**: Backward compatibility testing

### **Test Coverage**
- **Type Safety**: TypeScript compilation validation
- **Schema Compliance**: JSON Schema validation
- **Business Logic**: Type integration with operations
- **Error Handling**: Type-safe error scenarios
- **Performance**: Type system performance impact

## 🔧 Extension Points

### **Adding New Public Types**
1. **Define Type**: Add type definition to appropriate file
2. **Update Exports**: Add to central exports
3. **Add Documentation**: Document type purpose and usage
4. **Add Tests**: Type validation and integration tests
5. **Version Management**: Update version if breaking change

### **Extending Existing Types**
1. **Backward Compatibility**: Maintain backward compatibility
2. **Optional Properties**: Add optional properties where possible
3. **Union Types**: Use union types for extensibility
4. **Deprecation**: Mark obsolete properties as deprecated

### **Type Evolution**
1. **Versioning**: Use semantic versioning for type changes
2. **Migration Guides**: Provide clear migration guidance
3. **Deprecation Period**: Allow reasonable deprecation period
4. **Communication**: Communicate changes clearly to users

## 📚 Related Documentation

- **[Source Architecture](../README.md)** - Source code overview
- **[Internal Types](../modules/types/README.md)** - Internal type definitions
- **[TypeScript Guide](../../docs/typescript-guide.md)** - TypeScript best practices
- **[API Documentation](../../docs/api-documentation.md)** - API usage guide

---

**Public Types Version**: v2.0 (Enhanced)
**Architecture Pattern**: External API Type Definitions