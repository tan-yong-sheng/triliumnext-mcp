# Shared Domain - Cross-Domain Utilities

## 🎯 Domain Purpose

The Shared Domain provides **reusable utilities and common functionality** that spans across multiple business domains, promoting code reuse and consistency throughout the application.

## 🏗️ Architecture Overview

```
shared/
├── 📄 interfaces.ts        # [CORE] Shared interface definitions
├── 📄 constants.ts         # [VALUES] Application constants
├── 📄 validationRules.ts   # [RULES] Common validation logic
├── 📄 errorHandlers.ts     # [ERRORS] Error handling utilities
└── 📄 helpers.ts           # [HELPERS] General utility functions
```

## 🔄 Shared Utility Flow

```
Domain Modules
    ↓ [Import Shared Utilities]
Shared Components
    ↓ [Provide Common Functionality]
Cross-Domain Consistency
```

## 🔧 Core Components

### **Interfaces** (`interfaces.ts`)
**Purpose**: Shared type definitions and interfaces

**Key Interfaces:**
```typescript
// Common operation interfaces
export interface BaseOperation {
  operation: string;
  timestamp?: Date;
}

// Search-related interfaces
export interface SearchCriteria {
  property: string;
  type: string;
  operator: string;
  value: any;
  logic?: string;
}

// Attribute interfaces
export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
}
```

### **Constants** (`constants.ts`)
**Purpose**: Centralized constant definitions

**Constant Categories:**
- **Note Types**: Supported Trilium note types
- **Container Templates**: Protected template names
- **Operators**: Search operators and mappings
- **Limits**: Application limits and defaults
- **MIME Types**: Supported content types

**Example Constants:**
```typescript
export const NOTE_TYPES = [
  'text', 'code', 'mermaid', 'book', 'search',
  'relationMap', 'render', 'webView', 'file', 'image'
] as const;

export const CONTAINER_TEMPLATES = [
  'Board', 'Calendar', 'Grid View', 'List View', 'Table', 'Geo Map'
] as const;

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;
```

### **Validation Rules** (`validationRules.ts`)
**Purpose**: Common validation logic used across domains

**Validation Categories:**
- **Note Validation**: Note creation and update rules
- **Attribute Validation**: Attribute-specific validation
- **Search Validation**: Search parameter validation
- **General Validation**: Common validation patterns

**Validation Functions:**
```typescript
export function validateNoteType(type: string): boolean {
  return NOTE_TYPES.includes(type as any);
}

export function validateAttributeName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function validateSearchOperator(operator: string): boolean {
  return VALID_OPERATORS.includes(operator);
}
```

### **Error Handlers** (`errorHandlers.ts`)
**Purpose**: Centralized error handling and formatting

**Error Types:**
- **Validation Errors**: Input validation failures
- **Permission Errors**: Access control violations
- **API Errors**: Trilium API communication errors
- **Business Logic Errors**: Domain-specific errors

**Error Handling Functions:**
```typescript
export function createValidationError(message: string, field?: string): McpError {
  return new McpError(ErrorCode.InvalidParams,
    field ? `Validation failed for ${field}: ${message}` : message
  );
}

export function createPermissionError(operation: string): McpError {
  return new McpError(ErrorCode.InvalidParams,
    `${operation} operation requires appropriate permissions`
  );
}

export function formatApiError(error: any): string {
  return `API Error: ${error.response?.data?.message || error.message}`;
}
```

### **Helpers** (`helpers.ts`)
**Purpose**: General utility functions

**Helper Categories:**
- **String Utilities**: Text processing and formatting
- **Date Utilities**: Date manipulation and formatting
- **Array Utilities**: Array manipulation and validation
- **Object Utilities**: Object manipulation and deep operations

**Helper Functions:**
```typescript
export function sanitizeString(input: string): string {
  return input.replace(/[<>]/g, '');
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
```

## 🎨 Usage Patterns

### **Domain Module Integration**
```typescript
// Import from shared utilities
import {
  NOTE_TYPES,
  validateNoteType,
  createValidationError,
  SearchCriteria
} from '../shared/interfaces.js';

// Use in domain logic
export function handleCreateNote(args: CreateNoteOperation) {
  if (!validateNoteType(args.type)) {
    throw createValidationError('Invalid note type', 'type');
  }

  // Continue with note creation
}
```

### **Cross-Domain Consistency**
```typescript
// Same validation used across multiple domains
// In notes domain
if (!validateNoteType(type)) {
  throw createValidationError('Invalid note type');
}

// In search domain
if (!validateNoteType(searchType)) {
  throw createValidationError('Invalid search type');
}
```

### **Constant References**
```typescript
// Use centralized constants across the application
export function isContainerTemplate(template: string): boolean {
  return CONTAINER_TEMPLATES.includes(template);
}

export function getDefaultLimit(): number {
  return DEFAULT_LIMIT;
}
```

## 🛡️ Security Considerations

### **Input Sanitization**
- **String Sanitization**: Remove potentially dangerous characters
- **HTML Escaping**: Prevent XSS attacks in content
- **SQL Injection**: Prevent injection attacks in search queries

### **Validation Security**
- **Type Safety**: Strong typing prevents many common errors
- **Input Bounds**: Validate input lengths and formats
- **Allowed Lists**: Use allowed lists rather than blocked lists

### **Error Handling Security**
- **Information Leakage**: Don't expose sensitive information in errors
- **Consistent Errors**: Provide consistent error messages
- **Graceful Degradation**: Fail safely when unexpected errors occur

## 📊 Performance Considerations

### **Memory Management**
- **Immutable Operations**: Use immutable patterns where possible
- **Object Pooling**: Reuse objects for better memory efficiency
- **Garbage Collection**: Write code that helps the garbage collector

### **CPU Optimization**
- **Caching**: Cache expensive operations
- **Lazy Evaluation**: Defer expensive operations until needed
- **Memoization**: Cache function results for repeated calls

## 🧪 Testing Strategy

### **Test Categories**
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Cross-domain integration
3. **Performance Tests**: Optimization validation
4. **Security Tests**: Input validation and sanitization
5. **Edge Cases**: Boundary conditions and error scenarios

### **Test Coverage**
- **Interface Testing**: Type safety and interface compliance
- **Constant Testing**: Ensure constants are correct and complete
- **Validation Testing**: All validation rules and edge cases
- **Error Handling**: Error creation and formatting
- **Helper Functions**: Utility function correctness

## 🔧 Extension Points

### **Adding New Interfaces**
1. **Define Interface**: Add to `interfaces.ts`
2. **Update Documentation**: Document interface purpose and usage
3. **Add Tests**: Interface validation and usage tests
4. **Update Dependencies**: Update imports in dependent modules

### **Adding New Constants**
1. **Define Constant**: Add to appropriate category in `constants.ts`
2. **Update Validation**: Update validation rules if needed
3. **Add Tests**: Constant value and usage tests
4. **Update Documentation**: Document constant purpose and values

### **Adding New Validation Rules**
1. **Create Function**: Add validation function to `validationRules.ts`
2. **Update Error Handling**: Add error cases if needed
3. **Add Tests**: Comprehensive validation testing
4. **Update Documentation**: Document validation rules and usage

### **Adding New Helpers**
1. **Create Function**: Add helper function to `helpers.ts`
2. **Add Tests**: Function correctness and edge case testing
3. **Update Documentation**: Document function purpose and usage
4. **Update Dependencies**: Update imports in using modules

## 📈 Usage Metrics

| Component | Complexity | Performance | Usage Frequency |
|-----------|------------|--------------|------------------|
| **Interfaces** | Low | N/A | High |
| **Constants** | Low | Very Fast | High |
| **Validation Rules** | Medium | Fast | High |
| **Error Handlers** | Medium | Fast | Medium |
| **Helpers** | Low | Fast | Medium |

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Type System](../types/README.md)** - Type definitions and schemas
- **[Core Utilities](../../utils/README.md)** - Application-level utilities
- **[Validation Strategy](../../../docs/validation-strategy.md)** - Validation approach

---

**Shared Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: Utility Library with Cross-Domain Support