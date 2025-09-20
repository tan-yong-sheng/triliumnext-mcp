# Resolve Domain - Note Resolution Service

## 🎯 Domain Purpose

The Resolve Domain provides **intelligent note identification and resolution** services, converting human-readable note names into system note IDs with fuzzy matching and user choice workflows.

## 🏗️ Architecture Overview

```
resolve/
├── 📄 resolveManager.ts    # [CORE] Resolution business logic
└── 📄 resolveHandler.ts    # [PROTOCOL] MCP request processing
```

## 🔄 Resolution Processing Pipeline

```
1. MCP Resolve Request
   ↓ [Input Validation + Permission Check]
2. resolveHandler.ts
   ↓ [Parameter Processing]
3. resolveManager.ts
   ↓ [Fuzzy Search + Prioritization]
4. Trilium Search API
   ↓ [Result Processing]
5. User Choice Logic (if needed)
   ↓ [Response Formatting]
6. MCP Response
```

## 🔧 Core Components

### **Resolve Manager** (`resolveManager.ts`)
**Purpose**: Core note resolution logic with intelligent matching

**Key Features:**
- **Fuzzy Search**: Uses `note.title contains 'searchTerm'` for flexible matching
- **Smart Prioritization**: Exact matches → Folder-type notes → Most recent
- **User Choice Workflow**: Configurable auto-selection vs interactive choice
- **Fallback Guidance**: Suggests alternative approaches when no matches found
- **Performance Optimization**: Optimized for quick note identification

**Resolution Algorithm:**
```typescript
// Search for notes with matching titles
const searchQuery = `note.title *=* '${args.noteName}'`;
const searchResults = await searchNotes({ searchQuery }, axiosInstance);

// Apply intelligent prioritization
const prioritizedResults = prioritizeResults(searchResults.results);

// Handle user choice or auto-selection
return handleResultSelection(prioritizedResults, args);
```

### **Resolve Handler** (`resolveHandler.ts`)
**Purpose**: MCP protocol integration with permission validation

**Responsibilities:**
- **Input Validation**: Comprehensive parameter checking
- **Permission Integration**: READ permission requirement
- **Error Handling**: Graceful failure with actionable messages
- **Response Formatting**: Structured JSON output for LLM consumption

## 🎨 Resolution Capabilities

### **Fuzzy Matching**
- **Flexible Search**: Handles typos, partial matches, and variations
- **Title-Based**: Searches note titles for best matches
- **Case Insensitive**: Natural text matching regardless of case

### **Smart Prioritization**
```typescript
// Priority order for results:
1. Exact title matches (highest priority)
2. Folder-type notes (book type)
3. Most recently modified notes
4. All other matches
```

### **User Choice Control**
- **`autoSelect` parameter**: Control behavior when multiple matches found
  - `true`: Use intelligent auto-selection
  - `false` (default): Present numbered list for user choice
- **`maxResults` parameter**: Control number of alternatives (1-10, default: 3)
- **Interactive Workflow**: User-friendly choice presentation with note details

### **Exact Match Mode**
- **`exactMatch` parameter**: Control search precision
  - `true`: Only exact title matches
  - `false` (default): Fuzzy matching with prioritization

## 🛡️ Security Architecture

### **Permission Integration**
```typescript
// Resolution requires READ permission
if (!server.hasPermission('READ')) {
  throw new McpError(ErrorCode.InvalidParams, 'Resolve requires READ permission');
}
```

### **Input Validation**
- **Parameter Validation**: Comprehensive schema validation
- **Type Safety**: TypeScript type checking
- **Range Validation**: `maxResults` limited to 1-10
- **Business Rules**: Domain-specific constraints

## 📊 Response Structure

### **Successful Resolution**
```typescript
{
  selectedNote: {
    noteId: "abc123",
    title: "Project Planning",
    type: "text",
    dateModified: "2024-09-20T10:30:00Z"
  },
  totalMatches: 1,
  topMatches: [
    // Array of alternative matches
  ],
  nextSteps: "Use this note ID with other tools: get_note, update_note, etc."
}
```

### **Multiple Matches (autoSelect=false)**
```typescript
{
  selectedNote: null,
  totalMatches: 3,
  topMatches: [
    {
      noteId: "abc123",
      title: "Project Planning",
      type: "text",
      dateModified: "2024-09-20T10:30:00Z"
    },
    // ... additional matches
  ],
  nextSteps: "Multiple matches found. Please choose by number or set autoSelect=true."
}
```

### **No Matches**
```typescript
{
  selectedNote: null,
  totalMatches: 0,
  topMatches: [],
  nextSteps: "No matches found. Try searching with search_notes for broader results."
}
```

## 🎨 Usage Patterns

### **Basic Resolution**
```typescript
// Simple fuzzy search
const result = await resolve_note_id({
  noteName: "project"
});
```

### **Exact Matching**
```typescript
// Only exact title matches
const result = await resolve_note_id({
  noteName: "Project Planning",
  exactMatch: true
});
```

### **User Choice Workflow**
```typescript
// Present choices to user
const result = await resolve_note_id({
  noteName: "project",
  autoSelect: false,
  maxResults: 5
});
```

### **Auto-Selection**
```typescript
// Automatically select best match
const result = await resolve_note_id({
  noteName: "project",
  autoSelect: true
});
```

## 🧪 Testing Strategy

### **Test Categories**
1. **Resolution Logic**: Fuzzy matching and prioritization
2. **User Choice**: Interactive selection workflows
3. **Exact Matching**: Precise title matching
4. **Edge Cases**: No matches, special characters, edge cases
5. **Performance**: Resolution speed and efficiency
6. **Error Handling**: Invalid parameters and graceful failure

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end resolution workflows
- **User Experience**: Choice presentation and interaction
- **Performance**: Optimization validation

## 🔧 Extension Points

### **Enhanced Prioritization**
1. **Add Factors**: Content relevance, attribute weighting
2. **Custom Algorithms**: Domain-specific prioritization
3. **Machine Learning**: Pattern-based matching improvements

### **Advanced Search Options**
1. **Content Search**: Search within note content
2. **Attribute Filtering**: Filter by labels or relations
3. **Hierarchy Navigation**: Search within specific subtrees

### **Integration Enhancements**
1. **Caching**: Result caching for frequently resolved notes
2. **Learning**: User preference learning for auto-selection
3. **Suggest**: Intelligent suggestions for similar notes

## 📈 Usage Metrics

| Resolution Type | Complexity | Performance | Usage Frequency |
|-----------------|------------|--------------|------------------|
| **Fuzzy Search** | Low | Fast | High |
| **Exact Match** | Low | Very Fast | Medium |
| **User Choice** | Medium | Fast | Medium |
| **Auto-Select** | Low | Fast | High |

## 📚 Related Documentation

- **[Module Architecture](../README.md)** - Overall module design
- **[Search Domain](../search/README.md)** - Advanced search capabilities
- **[Usage Examples](../../../docs/resolve-examples.md)** - Resolution patterns
- **[Tool Selection Guide](../../../docs/tool-selection-guide.md)** - When to use resolve vs search

---

**Resolve Domain Version**: v2.0 (Enhanced)
**Architecture Pattern**: Service Layer with Fuzzy Matching