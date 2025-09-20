# Notes Domain - Note Lifecycle Management

## 🎯 Domain Purpose

The Notes Domain manages the **complete lifecycle of TriliumNext notes**, including creation, retrieval, updates, deletion, and specialized operations like search-and-replace.

## 🏗️ Architecture Overview

```
notes/
├── 📄 noteManager.ts        # [CORE] Central exports & interfaces
├── 📄 noteHandler.ts        # [PROTOCOL] MCP note operations routing
├── 📁 crud/                # [OPERATIONS] Core CRUD operations
│   ├── 📄 noteCreation.ts       # Note creation logic
│   ├── 📄 noteUpdate.ts        # Note update logic
│   ├── 📄 noteDeletion.ts      # Note deletion logic
│   └── 📄 noteRetrieval.ts     # Note retrieval logic
├── 📁 operations/          # [SPECIALIZED] Advanced note operations
│   ├── 📄 searchReplace.ts     # Search and replace functionality
│   └── 📄 duplicateChecker.ts  # Duplicate title detection
└── 📁 validation/          # [RULES] Note validation logic
    ├── 📄 containerValidator.ts # Container template protection
    ├── 📄 contentValidator.ts   # Content type validation
    └── 📄 hashValidator.ts     # Hash validation
```

## 🔄 Note Processing Pipeline

```
1. MCP Note Request
   ↓ [Request Routing]
2. noteHandler.ts
   ↓ [Operation Type Detection]
3. CRUD Operation (crud/)
   ↓ [Business Logic + Validation]
4. Validation (validation/)
   ↓ [ETAPI Integration]
5. Trilium Notes API
   ↓ [Response Processing]
6. MCP Response
```

## 🔧 Core Components

### **Note Manager** (`noteManager.ts`)
**Purpose**: Central exports hub and interface definitions

**Key Responsibilities:**
- **Interface Exports**: All note-related types and interfaces
- **Function Exports**: Aggregated exports from submodules
- **Type Definitions**: Core note operation types
- **Module Integration**: Centralized access point

**Export Structure:**
```typescript
// CRUD Operations
export { handleCreateNote } from './crud/noteCreation.js';
export { handleUpdateNote } from './crud/noteUpdate.js';
export { handleDeleteNote } from './crud/noteDeletion.js';
export { handleGetNote } from './crud/noteRetrieval.js';

// Validation Operations
export { isContainerTemplateNote } from './validation/containerValidator.js';
export { validateContentForNoteType } from './validation/contentValidator.js';
export { validateBlobIdHash } from './validation/hashValidator.js';

// Specialized Operations
export { handleSearchReplaceNote } from './operations/searchReplace.js';
```

### **Note Handler** (`noteHandler.ts`)
**Purpose**: MCP request routing and protocol integration

**Operation Routing:**
- **create_note**: Note creation with validation
- **update_note**: Note updates with conflict detection
- **delete_note**: Safe note deletion
- **get_note**: Note retrieval with content
- **search_and_replace_note**: Content search and replace

**Security Features:**
- **Permission Validation**: WRITE permission required for modifications
- **Input Validation**: Comprehensive parameter checking
- **Error Handling**: Graceful failure with actionable messages

## 🛡️ Validation System

### **Container Template Protection** (`validation/containerValidator.ts`)
**Purpose**: Prevent accidental modification of container template notes

**Protected Templates:**
- **Board**: Kanban/task board layouts
- **Calendar**: Calendar interfaces
- **Grid View**: Grid-based layouts
- **List View**: List-based layouts
- **Table**: Spreadsheet-like tables
- **Geo Map**: Geographic maps

**Protection Logic:**
```typescript
export function isContainerTemplateNote(noteData: any): boolean {
  const noteType = noteData.type;
  if (noteType !== 'book') return false;

  const templateRelation = noteData.attributes?.find(
    (attr: any) => attr.type === 'relation' && attr.name === 'template'
  )?.value;

  return CONTAINER_TEMPLATES.includes(templateRelation);
}
```

### **Content Validation** (`validation/contentValidator.ts`)
**Purpose**: Ensure content matches note type requirements

**Validation Rules:**
- **Text Notes**: Auto-detect HTML/Markdown/plain text
- **Code Notes**: Plain text only (no HTML processing)
- **Mermaid Notes**: Plain text diagram definitions
- **Container Templates**: Empty content only
- **System Notes**: Specific content requirements

### **Hash Validation** (`validation/hashValidator.ts`)
**Purpose**: Prevent concurrent modification conflicts

**Conflict Detection:**
```typescript
// Uses Trilium's native blobId for perfect reliability
if (currentBlobId !== expectedHash) {
  return {
    conflict: true,
    message: "Note modified by another user"
  };
}
```

## 🎨 CRUD Operations

### **Note Creation** (`crud/noteCreation.ts`)
**Features:**
- **Duplicate Detection**: Prevents duplicate titles in directories
- **Template Relations**: One-step template relation creation
- **Content Validation**: Type-specific content requirements
- **Attribute Processing**: Batch attribute creation (30-50% faster)

**Creation Flow:**
```
1. Input Validation
2. Duplicate Title Check
3. Content Type Validation
4. Note Creation via ETAPI
5. Attribute Creation (parallel)
6. Response Formatting
```

### **Note Updates** (`crud/noteUpdate.ts`)
**Features:**
- **Conflict Detection**: BlobId-based optimistic locking
- **Content Auto-Correction**: HTML wrapping for text notes
- **Revision Control**: Automatic backup creation
- **Container Protection**: Prevents template modification

### **Note Retrieval** (`crud/noteRetrieval.ts`)
**Features:**
- **Content Hash**: BlobId for conflict detection
- **Content Requirements**: Type-specific usage guidance
- **Search Integration**: Optional content search
- **Format Standardization**: Consistent response structure

## 🔧 Specialized Operations

### **Search and Replace** (`operations/searchReplace.ts`)
**Purpose**: Advanced content manipulation

**Capabilities:**
- **Regex Support**: Pattern-based search and replace
- **Content Scope**: Title and/or content searching
- **Safety Features**: Revision control, conflict detection
- **Performance**: Optimized for large content

### **Duplicate Detection** (`operations/duplicateChecker.ts`)
**Purpose**: Prevent duplicate note creation

**Algorithm:**
```typescript
// Search for existing notes with same title in same directory
const searchQuery = `note.title = '${title}' note.parents.noteId = '${parentNoteId}'`;
const results = await searchNotes({ searchQuery }, axiosInstance);
```

## 🛡️ Security Architecture

### **Permission Integration**
```typescript
// WRITE permission required for all modifications
if (!server.hasPermission('WRITE')) {
  throw new McpError(ErrorCode.InvalidParams, 'WRITE permission required');
}
```

### **Input Validation**
- **Schema Validation**: JSON Schema compliance
- **Business Rules**: Domain-specific constraints
- **Type Safety**: TypeScript type checking
- **API Constraints**: Trilium-specific requirements

### **Content Security**
- **Type Validation**: Content matches note type
- **HTML Sanitization**: Safe content processing
- **Size Limits**: Prevent oversized content
- **Conflict Prevention**: Optimistic locking

## 📊 Performance Optimizations

### **Batch Processing**
- **Attribute Creation**: Parallel processing (30-50% improvement)
- **Content Validation**: Optimized validation chains
- **Duplicate Checking**: Efficient search queries

### **Memory Management**
- **Streaming**: Large content processing
- **Caching**: Intelligent result caching
- **Garbage Collection**: Optimized memory usage

## 🧪 Testing Strategy

### **Test Categories**
1. ** CRUD Operations**: Create, read, update, delete
2. **Validation Logic**: Content types, container protection
3. **Conflict Detection**: Hash validation, concurrent updates
4. **Performance**: Batch processing, memory usage
5. **Error Handling**: Graceful failure modes

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflows
- **Edge Cases**: Unusual scenarios and error conditions
- **Performance Tests**: Optimization validation

## 🔧 Extension Points

### **Adding New Note Types**
1. **Update Validation**: Add to `contentValidator.ts`
2. **Update Types**: Add to `noteManager.ts`
3. **Add Tests**: Type-specific validation tests
4. **Update Documentation**: Usage examples

### **Adding New Operations**
1. **Create Handler**: Operation-specific handler
2. **Add Validation**: Input and output validation
3. **Integrate**: Add to main handler routing
4. **Add Tests**: Comprehensive test coverage

## 📈 Usage Metrics

| Operation | Complexity | Performance | Usage Frequency |
|-----------|------------|--------------|------------------|
| **Create Note** | Medium | Fast | High |
| **Update Note** | High | Moderate | Medium |
| **Get Note** | Low | Very Fast | High |
| **Delete Note** | Medium | Fast | Low |
| **Search Replace** | High | Slow | Low |

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Validation System](./validation/README.md)** - Validation logic details
- **[CRUD Operations](./crud/README.md)** - Core operation details
- **[Note Creation Guide](../../../docs/create-notes-examples/)** - Usage examples

---

**Notes Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: CRUD with Validation and Protection