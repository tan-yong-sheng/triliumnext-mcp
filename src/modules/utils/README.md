# Utils Domain - Core Module Utilities

## 🎯 Domain Purpose

The Utils Domain provides **foundational utility functions** that support business logic operations, offering common functionality like validation, formatting, and API integration patterns.

## 🏗️ Architecture Overview

```
utils/
├── 📄 index.ts              # [CORE] Central utility exports
├── 📄 validationUtils.ts   # [VALIDATION] Input validation and schemas
├── 📄 searchUtils.ts        # [SEARCH] Search query building and optimization
├── 📄 formatUtils.ts        # [FORMATTING] Output formatting and transformation
├── 📄 apiUtils.ts           # [API] HTTP client and API integration
├── 📄 errorUtils.ts         # [ERRORS] Error handling and reporting
└── 📄 permissionUtils.ts     # [SECURITY] Permission checking and validation
```

## 🔄 Utility Flow Architecture

```
Business Logic (Domain Modules)
    ↓ [Utility Calls]
Core Utilities (Utils Domain)
    ↓ [Cross-Cutting Concerns]
External Systems (API, Database, etc.)
```

## 🔧 Core Components

### **Utility Index** (`index.ts`)
**Purpose**: Central export hub for all utility functions

**Export Structure:**
```typescript
// Validation utilities
export * from './validationUtils.js';

// Search utilities
export * from './searchUtils.js';

// Formatting utilities
export * from './formatUtils.js';

// API utilities
export * from './apiUtils.js';

// Error utilities
export * from './errorUtils.js';

// Permission utilities
export * from './permissionUtils.js';
```

### **Validation Utils** (`validationUtils.ts`)
**Purpose**: Comprehensive input validation and schema enforcement

**Validation Features:**
- **Schema Validation**: Zod-based JSON Schema validation
- **Type Safety**: Runtime type checking
- **Business Rules**: Domain-specific validation logic
- **Error Formatting**: Clear, actionable error messages

**Key Functions:**
```typescript
export function validateCreateNote(params: any): CreateNoteOperation {
  const schema = z.object({
    parentNoteId: z.string().min(1),
    title: z.string().min(1).max(200),
    type: z.enum(NOTE_TYPES),
    content: z.array(contentSectionSchema).optional(),
    attributes: z.array(attributeSchema).optional()
  });

  return schema.parse(params);
}

export function validateSearchOperation(params: any): SearchOperation {
  const schema = z.object({
    text: z.string().optional(),
    searchCriteria: z.array(searchCriteriaSchema).optional(),
    limit: z.number().min(1).max(200).optional(),
    orderBy: z.string().optional(),
    fastSearch: z.boolean().optional()
  });

  return schema.parse(params);
}

export function createValidationError(error: z.ZodError): string {
  return error.errors.map(err =>
    `${err.path.join('.')}: ${err.message}`
  ).join(', ');
}
```

### **Search Utils** (`searchUtils.ts`)
**Purpose**: Search query building and optimization utilities

**Search Features:**
- **Query Building**: Convert structured parameters to Trilium DSL
- **Query Optimization**: Performance optimization suggestions
- **Complexity Analysis**: Query cost estimation
- **Result Processing**: Search result filtering and formatting

**Key Functions:**
```typescript
export function buildSearchQuery(criteria: SearchCriteria[]): string {
  return criteria.map((c, index) => {
    const prefix = index > 0 && c.logic === 'OR' ? '~(' : '';
    const suffix = index > 0 && c.logic === 'OR' ? ')' : '';

    return `${prefix}${buildCriteriaQuery(c)}${suffix}`;
  }).join(' ');
}

export function analyzeQueryComplexity(query: string): QueryAnalysis {
  const orCount = (query.match(/\bOR\b/g) || []).length;
  const andCount = (query.match(/\bAND\b/g) || []).length;
  const hasRegex = query.includes('%=');

  return {
    complexity: calculateComplexity(orCount, andCount, hasRegex),
    suggestions: generateOptimizationSuggestions(orCount, andCount, hasRegex)
  };
}

export function optimizeSearchResults(results: SearchResult[], options: SearchOptions): SearchResult[] {
  let optimized = [...results];

  if (options.excludeParents) {
    optimized = excludeParentNotes(optimized);
  }

  if (options.sortByRelevance) {
    optimized = sortByRelevance(optimized);
  }

  if (options.limit) {
    optimized = optimized.slice(0, options.limit);
  }

  return optimized;
}
```

### **Format Utils** (`formatUtils.ts`)
**Purpose**: Output formatting and data transformation

**Formatting Features:**
- **Note Formatting**: Standardized note output formatting
- **Attribute Formatting**: Attribute display formatting
- **Search Result Formatting**: Search result presentation
- **Date Formatting**: Consistent date/time formatting

**Key Functions:**
```typescript
export function formatNoteResponse(note: Note, content: string): FormattedNote {
  return {
    noteId: note.noteId,
    title: note.title,
    type: note.type,
    content: content,
    dateCreated: formatDate(note.dateCreated),
    dateModified: formatDate(note.dateModified),
    attributes: formatAttributes(note.attributes || []),
    metadata: {
      isArchived: note.isArchived || false,
      isProtected: note.isProtected || false,
      contentSize: note.contentSize || 0
    }
  };
}

export function formatAttributes(attributes: Attribute[]): FormattedAttribute[] {
  return attributes.map(attr => ({
    type: attr.type,
    name: attr.name,
    value: attr.value,
    display: `${attr.type === 'label' ? '#' : '~'}${attr.name}${attr.value ? ` = ${attr.value}` : ''}`,
    position: attr.position || 0
  }));
}

export function formatSearchResults(results: SearchResult[]): FormattedSearchResult[] {
  return results.map(result => ({
    noteId: result.noteId,
    title: result.title,
    type: result.type,
    excerpt: result.excerpt || '',
    relevanceScore: result.relevanceScore || 0,
    dateModified: formatDate(result.dateModified),
    actionUrl: `trilium://note/${result.noteId}`
  }));
}
```

### **API Utils** (`apiUtils.ts`)
**Purpose**: HTTP client and API integration utilities

**API Features:**
- **Request Building**: HTTP request construction
- **Response Handling**: API response processing
- **Error Handling**: API error management
- **Retry Logic**: Request retry mechanisms

**Key Functions:**
```typescript
export function buildApiRequest(endpoint: string, options: RequestOptions): ApiRequest {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': API_TOKEN,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return {
    url,
    method: options.method || 'GET',
    headers,
    data: options.data
  };
}

export function handleApiResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    status: response.status,
    headers: response.headers as Record<string, string>
  };
}

export function handleApiError(error: any): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message,
      code: error.response?.status?.toString() || 'UNKNOWN',
      details: error.response?.data
    };
  }

  return {
    message: error.message || 'Unknown error',
    code: 'UNKNOWN'
  };
}

export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError!;
}
```

### **Error Utils** (`errorUtils.ts`)
**Purpose**: Error handling and reporting utilities

**Error Features:**
- **Error Creation**: Standardized error creation
- **Error Formatting**: Consistent error message formatting
- **Error Classification**: Error type classification
- **Error Recovery**: Error recovery strategies

**Key Functions:**
```typescript
export function createMcpError(
  code: ErrorCode,
  message: string,
  data?: any
): McpError {
  return new McpError(code, message, data);
}

export function formatErrorMessage(error: any): string {
  if (error instanceof McpError) {
    return `MCP Error (${error.code}): ${error.message}`;
  }

  if (axios.isAxiosError(error)) {
    return `API Error: ${error.response?.data?.message || error.message}`;
  }

  if (error instanceof z.ZodError) {
    return `Validation Error: ${createValidationError(error)}`;
  }

  return `Error: ${error.message || 'Unknown error'}`;
}

export function classifyError(error: any): ErrorClass {
  if (error instanceof McpError) {
    return ErrorClass.MCP;
  }

  if (axios.isAxiosError(error)) {
    return ErrorClass.API;
  }

  if (error instanceof z.ZodError) {
    return ErrorClass.VALIDATION;
  }

  return ErrorClass.UNKNOWN;
}
```

### **Permission Utils** (`permissionUtils.ts`)
**Purpose**: Permission checking and validation utilities

**Permission Features:**
- **Permission Validation**: Permission existence checking
- **Operation Mapping**: Operation to permission mapping
- **Access Control**: Resource access validation
- **Permission Errors**: Permission-specific error handling

**Key Functions:**
```typescript
export function hasPermission(
  server: TriliumServer,
  permission: string
): boolean {
  return server.hasPermission(permission);
}

export function requirePermission(
  server: TriliumServer,
  permission: string,
  operation: string
): void {
  if (!hasPermission(server, permission)) {
    throw createMcpError(
      ErrorCode.InvalidParams,
      `${operation} operation requires ${permission} permission`
    );
  }
}

export function getRequiredPermissions(operation: string): string[] {
  const permissionMap: Record<string, string[]> = {
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

export function validateOperationPermissions(
  server: TriliumServer,
  operation: string
): void {
  const requiredPermissions = getRequiredPermissions(operation);

  for (const permission of requiredPermissions) {
    requirePermission(server, permission, operation);
  }
}
```

## 🎨 Utility Design Principles

### **Modularity**
- **Single Responsibility**: Each utility has a clear, focused purpose
- **Loose Coupling**: Utilities are independent and composable
- **High Cohesion**: Related functions grouped together
- **Reusability**: Functions designed for reuse across domains

### **Consistency**
- **Naming Conventions**: Consistent function naming patterns
- **Error Handling**: Consistent error handling approaches
- **Input Validation**: Consistent input validation patterns
- **Documentation**: Consistent documentation standards

### **Performance**
- **Efficiency**: Optimized for performance
- **Memory Management**: Minimal memory footprint
- **Caching**: Strategic caching where appropriate
- **Lazy Loading**: Load resources only when needed

## 🛡️ Security Considerations

### **Input Validation**
- **Sanitization**: Input sanitization for security
- **Type Checking**: Runtime type validation
- **Bounds Checking**: Input bounds validation
- **Schema Validation**: Schema-based validation

### **Permission Security**
- **Principle of Least Privilege**: Minimum required permissions
- **Permission Validation**: Runtime permission checking
- **Access Control**: Resource access validation
- **Audit Trail**: Permission usage logging

### **Error Security**
- **Information Disclosure**: Avoid sensitive information in errors
- **Consistent Errors**: Consistent error messaging
- **Graceful Degradation**: Safe failure modes
- **Error Logging**: Secure error logging

## 📊 Utility Metrics

| Utility Category | Functions | Complexity | Usage Frequency |
|------------------|-----------|-------------|-----------------|
| **Validation** | 15+ | Medium | High |
| **Search** | 10+ | High | High |
| **Formatting** | 8+ | Low | Medium |
| **API** | 12+ | Medium | High |
| **Error** | 6+ | Low | Medium |
| **Permission** | 5+ | Low | High |

## 🧪 Testing Strategy

### **Test Categories**
1. **Unit Tests**: Individual function testing
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

### **Adding New Validation Functions**
1. **Create Function**: Add validation function to `validationUtils.ts`
2. **Add Schema**: Define validation schema
3. **Add Tests**: Comprehensive testing
4. **Update Exports**: Update central exports

### **Adding New Search Utilities**
1. **Create Function**: Add search utility to `searchUtils.ts`
2. **Update Integration**: Update search integration points
3. **Add Tests**: Search utility testing
4. **Update Documentation**: Document utility usage

### **Adding New Formatting Functions**
1. **Create Function**: Add formatting function to `formatUtils.ts`
2. **Update Usage**: Update usage in domain modules
3. **Add Tests**: Formatting function testing
4. **Update Documentation**: Document formatting options

### **Adding New API Utilities**
1. **Create Function**: Add API utility to `apiUtils.ts`
2. **Update Integration**: Update API integration points
3. **Add Tests**: API utility testing
4. **Update Documentation**: Document API usage patterns

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Shared Domain](../shared/README.md)** - Shared utilities and constants
- **[Validation System](../../../docs/validation-system.md)** - Validation approach
- **[API Integration Guide](../../../docs/api-integration.md)** - API usage patterns

---

**Utils Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: Utility Library with Cross-Cutting Concerns