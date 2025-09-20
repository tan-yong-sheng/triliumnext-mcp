# Types Domain - Internal Type Definitions

## 🎯 Domain Purpose

The Types Domain defines **internal type systems and schemas** used throughout the application, providing strong typing, validation, and consistency across all business domains.

## 🏗️ Architecture Overview

```
types/
├── 📄 index.ts              # [CORE] Central type exports
├── 📄 operationTypes.ts     # [OPERATIONS] Operation type definitions
├── 📄 entityTypes.ts        # [ENTITIES] Business entity types
├── 📄 apiTypes.ts           # [API] API-related types
├── 📄 validationTypes.ts    # [VALIDATION] Validation schema types
└── 📄 mcpTypes.ts           # [PROTOCOL] MCP protocol types
```

## 🔄 Type System Architecture

```
External Types (MCP Protocol)
    ↓ [Protocol Mapping]
Internal Types (Domain-Specific)
    ↓ [Business Logic]
Validation Types (Schema Enforcement)
    ↓ [API Integration]
External API Types (Trilium ETAPI)
```

## 🔧 Core Components

### **Type Index** (`index.ts`)
**Purpose**: Central export hub for all type definitions

**Export Structure:**
```typescript
// Core operation types
export * from './operationTypes.js';

// Business entity types
export * from './entityTypes.js';

// API integration types
export * from './apiTypes.js';

// Validation schema types
export * from './validationTypes.js';

// MCP protocol types
export * from './mcpTypes.js';
```

### **Operation Types** (`operationTypes.ts`)
**Purpose**: Type definitions for all business operations

**Operation Categories:**
- **Note Operations**: Create, read, update, delete notes
- **Search Operations**: Query building and result types
- **Attribute Operations**: Label and relation management
- **Resolve Operations**: Note identification and resolution

**Key Operation Types:**
```typescript
export interface CreateNoteOperation {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content?: ContentSection[];
  attributes?: Attribute[];
  position?: number;
  prefix?: string;
}

export interface SearchOperation {
  text?: string;
  searchCriteria?: SearchCriteria[];
  limit?: number;
  orderBy?: string;
  fastSearch?: boolean;
}

export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
  autoSelect?: boolean;
}

export interface ManageAttributesOperation {
  noteId: string;
  operation: 'read' | 'create' | 'update' | 'delete' | 'batch_create';
  attribute?: Attribute;
  attributes?: Attribute[];
  expectedHash?: string;
}
```

### **Entity Types** (`entityTypes.ts`)
**Purpose**: Core business entity definitions

**Entity Categories:**
- **Note Entities**: Note structure and metadata
- **Attribute Entities**: Labels and relations
- **Search Entities**: Query and result structures
- **System Entities**: System-level objects

**Key Entity Types:**
```typescript
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

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export interface SearchCriteria {
  property: string;
  type: 'label' | 'relation' | 'noteProperty';
  operator: SearchOperator;
  value: string | number | boolean;
  logic?: 'AND' | 'OR';
}

export interface SearchResult {
  noteId: string;
  title: string;
  type: NoteType;
  dateModified: string;
  relevanceScore?: number;
  excerpt?: string;
}
```

### **API Types** (`apiTypes.ts`)
**Purpose**: Trilium ETAPI integration types

**API Type Categories:**
- **Request Types**: API request structures
- **Response Types**: API response structures
- **Error Types**: API error handling
- **Configuration Types**: API configuration

**Key API Types:**
```typescript
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

export interface NoteContentResponse {
  note: Note;
  content: string;
  contentHash?: string;
  contentRequirements?: ContentRequirements;
}
```

### **Validation Types** (`validationTypes.ts`)
**Purpose**: Schema validation and constraint types

**Validation Categories:**
- **Schema Types**: JSON Schema definitions
- **Constraint Types**: Validation constraints
- **Error Types**: Validation error structures
- **Rule Types**: Validation rule definitions

**Key Validation Types:**
```typescript
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
```

### **MCP Types** (`mcpTypes.ts`)
**Purpose**: MCP protocol integration types

**MCP Type Categories:**
- **Tool Types**: MCP tool definitions
- **Request Types**: MCP request structures
- **Response Types**: MCP response structures
- **Protocol Types**: MCP protocol constants

**Key MCP Types:**
```typescript
export interface McpTool {
  name: string;
  description: string;
  inputSchema: ValidationSchema;
}

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
```

## 🎨 Type Design Principles

### **Type Safety**
- **Strong Typing**: Comprehensive type coverage
- **Null Safety**: Explicit null/undefined handling
- **Union Types**: Flexible type combinations
- **Generic Types**: Reusable type patterns

### **Consistency**
- **Naming Conventions**: Consistent naming across types
- **Structure Patterns**: Similar structure for related types
- **Documentation**: Clear type documentation
- **Versioning**: Type version management

### **Extensibility**
- **Open/Closed Principle**: Open for extension, closed for modification
- **Composition over Inheritance**: Prefer composition
- **Optional Properties**: Gradual adoption of new features
- **Discriminated Unions**: Type-safe discriminated unions

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

| Type Category | Count | Complexity | Usage Frequency |
|----------------|-------|-------------|-----------------|
| **Operation Types** | 15+ | Medium | High |
| **Entity Types** | 20+ | High | High |
| **API Types** | 10+ | Medium | Medium |
| **Validation Types** | 8+ | Low | Medium |
| **MCP Types** | 6+ | Low | Medium |

## 🧪 Testing Strategy

### **Test Categories**
1. **Type Validation**: Type system correctness
2. **Schema Testing**: JSON Schema validation
3. **Integration Testing**: Type integration with business logic
4. **Runtime Testing**: Runtime type validation
5. **Edge Cases**: Boundary conditions and error scenarios

### **Test Coverage**
- **Type Safety**: TypeScript compilation validation
- **Schema Compliance**: JSON Schema validation
- **Business Logic**: Type integration with operations
- **Error Handling**: Type-safe error scenarios
- **Performance**: Type system performance impact

## 🔧 Extension Points

### **Adding New Operation Types**
1. **Define Interface**: Add operation type definition
2. **Update Validation**: Add validation schema
3. **Add Tests**: Operation type testing
4. **Update Documentation**: Document operation usage

### **Adding New Entity Types**
1. **Define Entity**: Add entity type definition
2. **Update Operations**: Update related operation types
3. **Add Validation**: Entity validation rules
4. **Add Tests**: Entity type testing

### **Extending API Types**
1. **Update API Types**: Add new API types
2. **Update Mapping**: Update API type mapping
3. **Add Tests**: API type integration testing
4. **Update Documentation**: Document API changes

### **Enhancing Validation Types**
1. **Add Schema Types**: Add new validation schema types
2. **Update Rules**: Update validation rule types
3. **Add Tests**: Validation type testing
4. **Update Integration**: Update validation integration

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Shared Utilities](../shared/README.md)** - Shared type definitions
- **[Validation System](../../../docs/validation-system.md)** - Validation approach
- **[TypeScript Guide](../../../docs/typescript-guide.md)** - TypeScript best practices

---

**Types Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: Type System with Strong Typing