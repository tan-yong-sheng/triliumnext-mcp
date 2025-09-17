# Create and Update Notes with Hash Validation - Complete Workflow Guide

This guide demonstrates the complete workflow for creating and updating notes with the new hash validation and content type safety features in TriliumNext MCP.

## Overview

The enhanced note management system provides:
- **Hash-based concurrency control** using Trilium's native `blobId`
- **Content type safety** with automatic validation and correction
- **Required workflow** that prevents data loss from concurrent modifications
- **Smart content processing** for different note types

## Complete Workflow: Create → Get → Update

### Step 1: Create a New Note

```typescript
// Create a text note with smart content processing
const createResult = await create_note({
  parentNoteId: "root",
  title: "Meeting Notes",
  type: "text",
  content: [{
    type: "text",
    content: "# Q4 Planning Meeting\n\n- Discussed budget allocation\n- Reviewed team performance\n- **Action items** identified"
  }]
});

// Success: "Created note: abc123def"
```

**Smart Processing Features**:
- Auto-detects Markdown format and converts to HTML
- Handles plain text, HTML, and Markdown seamlessly
- Validates content matches note type requirements

### Step 2: Get Note with Hash Information

```typescript
// Retrieve the note with blobId for future updates
const noteResponse = await get_note({
  noteId: "abc123def",
  includeContent: true
});

// Response includes:
{
  "note": {
    "noteId": "abc123def",
    "title": "Meeting Notes",
    "type": "text",
    "blobId": "abc123def_456",  // Trilium's native content hash
    "dateModified": "2024-01-15T10:30:00.000Z",
    // ... other note properties
  },
  "content": "<h1>Q4 Planning Meeting</h1>\n<p>- Discussed budget allocation<br>- Reviewed team performance<br>- <strong>Action items</strong> identified</p>",
  "contentHash": "abc123def_456",  // Use this for update validation
  "contentRequirements": {
    "requiresHtml": true,
    "description": "HTML content required (wrap plain text in <p> tags)",
    "examples": ["<p>Hello world</p>", "<strong>Bold text</strong>"]
  }
}
```

**Key Information for Updates**:
- `contentHash`: Required blobId for conflict detection
- `contentRequirements`: Shows validation rules for this note type
- `note.type`: Current note type (must match update type)

### Step 3: Update Note with Hash Validation

```typescript
// Update using the blobId from get_note response
const updateResult = await update_note({
  noteId: "abc123def",
  type: "text",  // Must match current note type
  content: [{
    type: "text",
    content: "# Q4 Planning Meeting - Updated\n\n- Budget approved: $50,000\n- Team performance: Exceeded targets\n- **Action items**: Assigned to team leads"
  }],
  expectedHash: "abc123def_456",  // Required from get_note response
  revision: true  // Create backup before update
});

// Success: "Note abc123def updated successfully (revision created)"
```

**Safety Features**:
- **Hash Validation**: Prevents updates if note was modified by another user
- **Type Safety**: Ensures content matches note type requirements
- **Revision Control**: Creates backup before major changes
- **Auto-Correction**: Fixes common content format issues

## Content Type Examples by Note Type

### Text Notes (Smart HTML Processing)

#### Auto-Correction Workflow
```typescript
// 1. Get current note
const note = await get_note({ noteId: "text123" });
// contentHash: "blob_789", type: "text"

// 2. Update with plain text (auto-corrected to HTML)
const result = await update_note({
  noteId: "text123",
  type: "text",
  content: [{
    type: "text",
    content: "Simple plain text note"  // Will be wrapped in <p> tags
  }],
  expectedHash: "blob_789"
});

// Result: "Note text123 updated successfully (content auto-corrected)"
// Final content: "<p>Simple plain text note</p>"
```

#### HTML Content Handling
```typescript
// Proper HTML content passes through unchanged
const result = await update_note({
  noteId: "text123",
  type: "text",
  content: [{
    type: "text",
    content: "<div class=\"meeting-notes\">\n  <h2>Discussion Points</h2>\n  <ul>\n    <li>Budget review</li>\n    <li>Timeline planning</li>\n  </ul>\n</div>"
  }],
  expectedHash: note.contentHash
});

// Success: No auto-correction needed
```

#### Markdown to HTML Conversion
```typescript
// Markdown automatically converted to HTML
const result = await update_note({
  noteId: "text123",
  type: "text",
  content: [{
    type: "text",
    content: "## Project Status\n\n### Completed\n- [x] Setup database\n- [x] Create API endpoints\n\n### In Progress\n- [ ] Frontend development\n- [ ] Testing phase"
  }],
  expectedHash: note.contentHash
});

// Auto-converted to proper HTML with <h2>, <h3>, <ul>, <li> tags
```

### Code Notes (Plain Text Only)

#### Correct Code Note Updates
```typescript
// 1. Get code note
const codeNote = await get_note({ noteId: "code123" });
// type: "code", contentHash: "blob_456"

// 2. Update with plain code (correct format)
const result = await update_note({
  noteId: "code123",
  type: "code",
  content: [{
    type: "text",
    content: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    else:
        fib = [0, 1]
        while len(fib) < n:
            fib.append(fib[-1] + fib[-2])
        return fib`
  }],
  expectedHash: codeNote.contentHash
});

// Success: Plain text code is valid for code notes
```

#### HTML Rejection in Code Notes
```typescript
// Attempt to update code note with HTML (will be rejected)
const result = await update_note({
  noteId: "code123",
  type: "code",
  content: [{
    type: "text",
    content: "<p>function hello() {</p><p>  console.log('Hello world');</p><p>}</p>"  // HTML in code note
  }],
  expectedHash: codeNote.contentHash
});

// Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only, but HTML content was detected. Remove HTML tags and use plain text format. Expected format: def fibonacci(n):, graph TD; A-->B"
```

### Mermaid Notes (Plain Text Diagrams)

#### Valid Mermaid Updates
```typescript
// 1. Get mermaid note
const mermaidNote = await get_note({ noteId: "mermaid123" });
// type: "mermaid", contentHash: "blob_789"

// 2. Update with mermaid diagram syntax
const result = await update_note({
  noteId: "mermaid123",
  type: "mermaid",
  content: [{
    type: "text",
    content: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`
  }],
  expectedHash: mermaidNote.contentHash
});

// Success: Plain text mermaid syntax is valid
```

## Conflict Detection and Resolution

### Concurrent Modification Scenario

```typescript
// User A and User B both get the same note
const noteA = await get_note({ noteId: "shared123" });
const noteB = await get_note({ noteId: "shared123" });
// Both receive contentHash: "blob_original"

// User A updates first
await update_note({
  noteId: "shared123",
  type: "text",
  content: [{ type: "text", content: "User A's changes" }],
  expectedHash: "blob_original"
});
// Success: Note updated, new blobId: "blob_user_a"

// User B tries to update with old hash
const result = await update_note({
  noteId: "shared123",
  type: "text",
  content: [{ type: "text", content: "User B's changes" }],
  expectedHash: "blob_original"  // Old hash, now stale
});

// Conflict Error: "CONFLICT: Note has been modified by another user. Current blobId: blob_user_a, expected: blob_original. Please get the latest note content and retry."
```

### Conflict Resolution Workflow

```typescript
// 1. Detect conflict
try {
  await update_note({
    noteId: "shared123",
    type: "text",
    content: [{ type: "text", content: "My updates" }],
    expectedHash: "old_hash"
  });
} catch (error) {
  if (error.message.includes("CONFLICT")) {
    // 2. Get latest note state
    const latestNote = await get_note({ noteId: "shared123" });
    // New contentHash: "current_hash"

    // 3. Merge changes and retry
    await update_note({
      noteId: "shared123",
      type: "text",
      content: [{ type: "text", content: "My updates merged with latest" }],
      expectedHash: latestNote.contentHash  // Use current hash
    });

    // Success: "Note shared123 updated successfully"
  }
}
```

## Template Integration Examples

### Create Note with Template Relation

```typescript
// Create a task board with template relation in one step
const boardNote = await create_note({
  parentNoteId: "root",
  title: "Project Management Board",
  type: "book",
  content: [{ type: "text", content: "" }],
  attributes: [{
    type: "relation",
    name: "template",
    value: "Board",
    position: 10
  }]
});

// Success: "Created note: board123"
```

### Update Template-Based Note

```typescript
// 1. Get the board note
const boardNote = await get_note({ noteId: "board123" });
// contentHash: "blob_board", type: "book"

// 2. Update with hash validation (preserves template relation)
const result = await update_note({
  noteId: "board123",
  type: "book",
  content: [{ type: "text", content: "Updated board configuration" }],
  expectedHash: boardNote.contentHash
});

// Success: Template relation preserved, content updated safely
```

## Best Practices

### 1. Always Follow Get → Update Pattern

```typescript
// ✅ CORRECT: Always get current state first
const note = await get_note({ noteId: "myNote" });
await update_note({
  noteId: "myNote",
  type: note.note.type,
  content: newContent,
  expectedHash: note.contentHash
});

// ❌ WRONG: Never update without current hash
// This will cause an error: "Missing required parameter 'expectedHash'"
```

### 2. Handle Conflicts Gracefully

```typescript
async function safeUpdate(noteId, type, content) {
  try {
    const note = await get_note({ noteId });
    return await update_note({
      noteId,
      type,
      content,
      expectedHash: note.contentHash
    });
  } catch (error) {
    if (error.message.includes("CONFLICT")) {
      console.log("Conflict detected, getting latest version...");
      const latestNote = await get_note({ noteId });
      return await update_note({
        noteId,
        type,
        content,
        expectedHash: latestNote.contentHash
      });
    }
    throw error;
  }
}
```

### 3. Use Appropriate Content Formats

```typescript
// Text notes: HTML or Markdown (auto-converted)
const textContent = [{
  type: "text",
  content: "<h1>Welcome</h1><p>This is HTML content</p>"
}];

// Code notes: Plain text only
const codeContent = [{
  type: "text",
  content: `function greet() {
  console.log("Hello, World!");
}`
}];

// Mermaid notes: Plain text diagram syntax
const mermaidContent = [{
  type: "text",
  content: "flowchart LR\nA --> B --> C"
}];
```

### 4. Leverage Auto-Correction

```typescript
// Let the system handle format conversion
const result = await update_note({
  noteId: "text123",
  type: "text",
  content: [{
    type: "text",
    content: "Plain text that will be auto-wrapped"  // Becomes <p>...</p>
  }],
  expectedHash: currentHash
});

// Result includes "(content auto-corrected)" message
```

## Error Handling Guide

### Common Errors and Solutions

#### Missing Expected Hash
```typescript
// Error: "Missing required parameter 'expectedHash'"
// Solution: Always call get_note before update_note
```

#### Hash Mismatch (Conflict)
```typescript
// Error: "CONFLICT: Note has been modified by another user"
// Solution: Get latest note content and retry with new hash
```

#### Content Type Mismatch
```typescript
// Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only"
// Solution: Remove HTML tags for code/mermaid notes
```

#### Type Mismatch
```typescript
// Error: Update type doesn't match current note type
// Solution: Use the exact type from get_note response
```

## Migration from Previous Version

### Before (Old API)
```typescript
// Old update without hash validation
await update_note({
  noteId: "myNote",
  content: oldContent  // No type or hash required
});
```

### After (New API)
```typescript
// New update with full validation
const note = await get_note({ noteId: "myNote" });
await update_note({
  noteId: "myNote",
  type: note.note.type,  // Required: matches note type
  content: newContent,
  expectedHash: note.contentHash  // Required: from get_note
});
```

## Benefits Summary

### Data Integrity
- ✅ Prevents concurrent modification conflicts
- ✅ Ensures content matches note type requirements
- ✅ Maintains consistent data state

### User Experience
- ✅ Automatic content correction and format detection
- ✅ Clear error messages with actionable guidance
- ✅ Safe revision control with backups

### Developer Experience
- ✅ Consistent API between create_note and update_note
- ✅ Predictable validation behavior
- ✅ Comprehensive error handling

### Performance
- ✅ Uses Trilium's native blobId system
- ✅ Efficient validation with minimal overhead
- ✅ Smart content processing when needed

This complete workflow ensures safe, reliable note management while providing a seamless developer experience with comprehensive validation and error handling.