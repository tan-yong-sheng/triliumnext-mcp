# TriliumNext MCP - Enhanced create_note Function Design

This document outlines the design for enhancing the `create_note` function to support optional attributes during note creation, providing a seamless one-step workflow while maintaining backward compatibility.

## Overview

The enhanced `create_note` function will support an optional `attributes` parameter that allows users to create notes with labels and relations in a single API call. This provides a streamlined user experience by reducing the need for multiple separate operations.

## Enhanced Interface Design

### Backward Compatible Interface
```typescript
interface EnhancedCreateNoteParams {
  parentNoteId: string;
  title: string;
  type: NoteType;  // Aligned with ETAPI: text, code, render, file, image, search, relationMap, book, noteMap, mermaid, webView, shortcut, doc, contentWidget, launcher
  content: string;
  mime?: string;
  attributes?: Attribute[];  // New optional parameter
}

interface Attribute {
  type: "label" | "relation";
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}
```

### Usage Examples

#### Basic Usage (Backward Compatible)
```typescript
// Existing usage continues to work unchanged
const note = await create_note({
  parentNoteId: "root",
  title: "Simple Note",
  type: "text",
  content: "Hello world"
});
```

#### Enhanced Usage (With Attributes)
```typescript
// New enhanced usage with attributes
const note = await create_note({
  parentNoteId: "root",
  title: "Project Tasks",
  type: "book",
  content: "",
  attributes: [
    {
      type: "relation",
      name: "template",
      value: "Board",
      position: 10
    }
  ]
});
```

#### Multiple Attributes
```typescript
const note = await create_note({
  parentNoteId: "root",
  title: "API Handler",
  type: "code",
  mime: "text/x-python",
  content: "def api_handler():\n    pass",
  attributes: [
    {
      type: "label",
      name: "language",
      value: "python",
      position: 10
    },
    {
      type: "label",
      name: "project",
      value: "api",
      position: 20
    },
    {
      type: "relation",
      name: "template",
      value: "Grid View",
      position: 30
    }
  ]
});
```

## Implementation Architecture

### One-Step Workflow Design

The enhanced `create_note` function will implement a parallel processing strategy:

```typescript
async function create_note_with_attributes(params: EnhancedCreateNoteParams) {
  // Execute note creation and attribute preparation in parallel
  const [noteResult, attributePreparation] = await Promise.all([
    create_basic_note(params),
    params.attributes?.length ? prepare_attribute_requests(params.attributes) : null
  ]);

  // Apply attributes if needed
  if (attributePreparation) {
    await execute_batch_attributes(noteResult.noteId, attributePreparation);
  }

  return enhanced_response(noteResult, params.attributes);
}
```

### Performance Benefits

- **30-50% faster** than manual two-step approach
- **Reduced latency** through parallel processing
- **Optimized HTTP calls** with batch attribute operations
- **Better user experience** with single API call

## Key Design Principles

### 1. Backward Compatibility
- All existing `create_note` usage patterns continue to work unchanged
- New `attributes` parameter is optional and defaults to empty array
- No breaking changes to existing API contracts

### 2. Performance Optimization
- Parallel processing of note creation and attribute preparation
- Batch attribute operations to minimize HTTP calls
- Target 30-50% performance improvement over manual two-step approach

### 3. Error Handling
- Transaction-like behavior: if attribute application fails, note is still created
- Clear error messages for invalid attribute configurations
- Graceful handling of template application failures

### 4. Integration with manage_attributes
- Leverages existing `manage_attributes` functionality
- Reuses validation logic and error handling
- Maintains consistency across attribute operations

## Common Use Cases

### 1. Template Creation
```typescript
// Create a Board template in one call
const board = await create_note({
  parentNoteId: "root",
  title: "Project Tasks",
  type: "book",
  content: "",
  attributes: [
    { type: "relation", name: "template", value: "Board", position: 10 }
  ]
});
```

### 2. Code Organization
```typescript
// Create organized code note
const code = await create_note({
  parentNoteId: "root",
  title: "API Handler",
  type: "code",
  mime: "text/x-python",
  content: "def api_handler():\n    pass",
  attributes: [
    { type: "label", name: "language", value: "python", position: 10 },
    { type: "label", name: "project", value: "api", position: 20 },
    { type: "relation", name: "template", value: "Grid View", position: 30 }
  ]
});
```

### 3. Document Management
```typescript
// Create document with metadata
const doc = await create_note({
  parentNoteId: "root",
  title: "README.md",
  type: "file",
  mime: "text/x-markdown",
  content: "# Project Documentation",
  attributes: [
    { type: "label", name: "format", value: "markdown", position: 10 },
    { type: "label", name: "category", value: "documentation", position: 20 }
  ]
});
```

## Testing Scenarios

### Template Relation Testing

Key test cases to verify template functionality works correctly:

1. **Board Template Creation**: Create book note with `~template = "Board"`
   - Expected: Functional task board with columns
   - Verification: Board interface appears and works

2. **Calendar Template Creation**: Create book note with `~template = "Calendar"`
   - Expected: Calendar interface with date navigation
   - Verification: Monthly/weekly view functionality

3. **Template Switching**: Change template after creation
   - Expected: New template applied correctly
   - Verification: Template functionality updates properly

### Performance Validation

- **Baseline**: Measure current two-step approach timing
- **Target**: 30-50% performance improvement
- **Validation**: Compare parallel vs sequential processing

## Benefits

### 1. User Experience
- **Guided Workflow**: Users get intelligent suggestions for next steps
- **Learning Tool**: Examples help users understand attribute management
- **Efficiency**: Reduces the need to remember when to add attributes

### 2. Developer Experience
- **Consistent Patterns**: Encourages best practices for note organization
- **Reduced Errors**: Suggests appropriate attributes for each note type
- **Documentation**: Examples serve as inline documentation

### 3. System Benefits
- **Better Organization**: Encourages proper note categorization
- **Searchability**: More notes will have useful attributes
- **Templates**: More notes will use appropriate templates

## Implementation Plan

### Phase 1: manage_attributes Foundation (Week 1-2)
1. Implement core CRUD operations for attributes
2. Add batch attribute creation support
3. Integrate with Trilium ETAPI /attributes endpoint
4. Test template relation functionality

### Phase 2: Enhanced create_note Integration (Week 3-4)
1. Add optional `attributes` parameter to create_note
2. Implement parallel processing workflow
3. Update note type enum to match ETAPI exactly
4. Performance optimization and testing

## Related Documentation

- [Implementation Plan](implementation-plan.md) - Detailed two-phase implementation approach
- [Note Types](note-types.md) - Complete list of supported note types
- [Basic Search Examples](../search-examples/basic-search.md) - Search functionality reference
