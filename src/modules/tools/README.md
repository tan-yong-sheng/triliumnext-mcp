# Tools Domain - MCP Tool Schema Definitions

## 🎯 Domain Purpose

The Tools Domain manages **MCP tool schema definitions** and dynamic tool generation based on user permissions, providing a clean interface between business logic and the MCP protocol.

## 🏗️ Architecture Overview

```
tools/
├── 📄 toolDefinitions.ts    # [CORE] Tool schema generation
├── 📁 definitions/         # [SCHEMAS] Individual tool schemas
│   ├── 📄 noteTools.ts        # Note operation schemas
│   ├── 📄 searchTools.ts      # Search operation schemas
│   ├── 📄 attributeTools.ts   # Attribute operation schemas
│   └── 📄 resolveTools.ts     # Resolution operation schemas
└── 📁 validation/         # [VALIDATION] Schema validation logic
    └── 📄 toolValidator.ts  # Tool schema validation
```

## 🔄 Tool Generation Pipeline

```
1. MCP List Tools Request
   ↓ [Permission Analysis]
2. Tool Definitions
   ↓ [Dynamic Tool Generation]
3. Permission-Based Filtering
   ↓ [Schema Assembly]
4. MCP Tools Response
   ↓ [Tool Usage]
5. Request Routing to Handlers
```

## 🔧 Core Components

### **Tool Definitions** (`toolDefinitions.ts`)
**Purpose**: Central tool schema generation with permission-based filtering

**Key Features:**
- **Dynamic Tool Generation**: Tools generated based on user permissions
- **Permission Integration**: READ vs WRITE permission filtering
- **Schema Assembly**: Combines individual tool schemas
- **Validation Integration**: Built-in schema validation
- **Description Optimization**: LLM-friendly tool descriptions

**Generation Process:**
```typescript
export function generateTools(server: TriliumServer) {
  const tools = [];

  // Always available with READ permission
  if (server.hasPermission('READ')) {
    tools.push(...createReadTools());
  }

  // Additional tools with WRITE permission
  if (server.hasPermission('WRITE')) {
    tools.push(...createWriteTools());
  }

  return tools;
}
```

### **Schema Definitions** (`definitions/`)
**Purpose**: Individual tool schemas organized by domain

**Organization:**
- **`noteTools.ts`**: Note CRUD operation schemas
- **`searchTools.ts`**: Search and query schemas
- **`attributeTools.ts`**: Attribute management schemas
- **`resolveTools.ts`**: Note resolution schemas

**Schema Structure:**
```typescript
export const createNoteTool = {
  name: "create_note",
  description: "Create new notes with various types...",
  inputSchema: {
    type: "object",
    properties: {
      // Schema properties
    },
    required: ["parentNoteId", "title", "type"]
  }
};
```

### **Tool Validation** (`validation/`)
**Purpose**: Schema validation and consistency checking

**Features:**
- **Schema Validation**: JSON Schema compliance
- **Consistency Checking**: Cross-tool consistency
- **Permission Validation**: Tool-permission alignment
- **Error Reporting**: Clear validation error messages

## 🎨 Tool Categories

### **READ Permission Tools**
- **`search_notes`**: Unified search with comprehensive filtering
- **`resolve_note_id`**: Note title resolution with fuzzy matching
- **`get_note`**: Note content retrieval
- **`read_attributes`**: View note attributes (labels and relations)

### **WRITE Permission Tools**
- **`create_note`**: Create new notes with various types
- **`update_note`**: Update existing note content
- **`delete_note`**: Delete notes by ID
- **`manage_attributes`**: Create, update, delete attributes
- **`list_attributes`**: List attribute types and values

### **Permission-Based Behavior**
- **Least Privilege**: Users only see tools they're authorized to use
- **Dynamic Interface**: Tool list adapts to permission level
- **Clear Separation**: Read vs write operation separation

## 🛡️ Security Architecture

### **Permission Integration**
```typescript
// Tool generation based on permissions
export function createReadTools(): Tool[] {
  return [
    searchNotesTool,
    resolveNoteIdTool,
    getNoteTool,
    readAttributesTool
  ];
}

export function createWriteTools(): Tool[] {
  return [
    createNoteTool,
    updateNoteTool,
    deleteNoteTool,
    manageAttributesTool,
    listAttributesTool
  ];
}
```

### **Schema Security**
- **Input Validation**: Comprehensive parameter validation
- **Type Safety**: Strong TypeScript typing
- **Sanitization**: Input sanitization where appropriate
- **API Constraints**: Enforce Trilium-specific requirements

## 📊 Tool Schema Design

### **Schema Principles**
- **Consistency**: Uniform schema structure across tools
- **Clarity**: Clear parameter descriptions and examples
- **Validation**: Comprehensive validation rules
- **Extensibility**: Easy to add new parameters and tools

### **Parameter Design**
```typescript
parameters: {
  // Required parameters clearly marked
  parentNoteId: {
    type: "string",
    description: "Parent note ID for the new note"
  },

  // Optional parameters with defaults
  type: {
    type: "string",
    description: "Note type (text, code, book, etc.)",
    default: "text"
  },

  // Complex parameters with examples
  attributes: {
    type: "array",
    description: "Optional attributes for the note",
    items: {
      // Attribute schema definition
    }
  }
}
```

## 🎨 Integration Patterns

### **Handler Integration**
```typescript
// Tools map directly to handler functions
{
  name: "create_note",
  handler: handleCreateNoteRequest
}
```

### **Permission Mapping**
```typescript
// Clear permission-to-tool mapping
const permissionToolMap = {
  'READ': ['search_notes', 'resolve_note_id', 'get_note'],
  'WRITE': ['create_note', 'update_note', 'delete_note']
};
```

### **Schema Versioning**
- **Backward Compatibility**: Maintain compatibility with existing clients
- **Deprecation**: Clear deprecation path for obsolete parameters
- **Versioning**: Schema version tracking and migration

## 🧪 Testing Strategy

### **Test Categories**
1. **Schema Validation**: JSON Schema compliance
2. **Permission Testing**: Tool availability based on permissions
3. **Integration Testing**: Tool-to-handler mapping
4. **Parameter Testing**: Input validation and error handling
5. **Documentation Testing**: Schema documentation accuracy

### **Test Coverage**
- **Unit Tests**: Individual schema validation
- **Integration Tests**: End-to-end tool workflows
- **Permission Tests**: Access control validation
- **Edge Cases**: Invalid parameters and error conditions

## 🔧 Extension Points

### **Adding New Tools**
1. **Create Schema**: Add to appropriate definitions file
2. **Update Generation**: Add to tool generation functions
3. **Add Validation**: Update validation logic
4. **Add Tests**: Comprehensive test coverage
5. **Update Documentation**: Tool usage examples

### **Schema Enhancement**
1. **New Parameters**: Add to existing tool schemas
2. **Validation Rules**: Enhance parameter validation
3. **Documentation**: Improve parameter descriptions
4. **Examples**: Add usage examples

### **Permission Integration**
1. **New Permission Types**: Extend permission system
2. **Tool Grouping**: Organize tools by permission level
3. **Dynamic Tools**: Context-aware tool generation

## 📈 Usage Metrics

| Tool Category | Schema Complexity | Generation Performance | Usage Frequency |
|----------------|-------------------|------------------------|------------------|
| **Note Tools** | High | Fast | High |
| **Search Tools** | Medium | Fast | High |
| **Attribute Tools** | Medium | Fast | Medium |
| **Resolve Tools** | Low | Very Fast | Medium |

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Schema Design Guide](../../../docs/schema-design-guide.md)** - Schema best practices
- **[Permission Model](../../../docs/permission-model.md)** - Access control details
- **[MCP Protocol Integration](../../../docs/mcp-integration.md)** - Protocol compliance

---

**Tools Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: Schema Generation with Permission Control