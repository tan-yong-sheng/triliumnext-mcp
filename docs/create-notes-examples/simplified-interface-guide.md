# Simplified Note Creation Guide

This guide demonstrates the simplified string-based interface for creating notes in TriliumNext MCP with smart content processing and hash validation.

## 🆕 String-Based Content Features

The note creation system now uses simple string content with intelligent processing:

- **String content only**: Content parameter accepts strings directly
- **Smart format detection**: Auto-detects Markdown, HTML, and plain text for text notes
- **Content type safety**: Validates content matches note type requirements
- **BlobId-based concurrency control**: Uses Trilium's native `blobId` to prevent conflicts
- **Automatic content correction**: Smart HTML wrapping for text notes

### Complete Workflow Example

```javascript
// 1. Create a note with smart content processing
const createdNote = await create_note({
  parentNoteId: "root",
  title: "Meeting Notes",
  type: "text",
  content: "# Q4 Planning\n\n- Budget review\n- Team performance"
});
// Returns: { noteId: "abc123", message: "Created note: abc123" }

// 2. Get note with hash information for safe updates
const noteInfo = await get_note({
  noteId: "abc123",
  includeContent: true
});
// Returns: { contentHash: "blobId_456", type: "text", ... }

// 3. Update with hash validation (prevents conflicts)
const updateResult = await update_note({
  noteId: "abc123",
  type: "text",  // Must match current note type
  content: "# Q4 Planning - Updated\n\n- Budget approved\n- Targets exceeded",
  expectedHash: noteInfo.contentHash  // Required for safety
});
// Success: "Note abc123 updated successfully"
```

## 🎯 Problem Solved

The old interface required complex ContentItem arrays:
```json
{
  "parentNoteId": "root",
  "title": "fibonacci function",
  "type": "code",
  "content": [
    {
      "type": "text",
      "content": "def fibonacci(n):..."
    }
  ]
}
```

## ✅ New Simplified Interface

### Direct String Content

The simplified interface uses simple string content directly:

```javascript
// Code note - content passes through unchanged
const codeNote = {
  parentNoteId: "root",
  title: "Fibonacci Function",
  type: "code",
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
};

// Text note with auto Markdown detection
const textNote = {
  parentNoteId: "root",
  title: "Meeting Notes",
  type: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified"
  // Auto-detected as Markdown → converted to HTML
};
```

### Key Benefits

1. **🎯 Simple Strings**: Content is just a string - no complex objects
2. **🧠 Smart Processing**: Automatic format detection for text notes
3. **🔧 Clear Intent**: Content format determined by note type
4. **📝 Markdown Support**: Automatic conversion to HTML for text notes
5. **🛡️ Type Safety**: Content validation based on note type

## 📋 Usage Examples

### Text Notes (Smart Format Detection)

```javascript
// HTML content (detected automatically)
const htmlNote = {
  parentNoteId: "root",
  title: "Project Documentation",
  type: "text",
  content: "<h1>Project Overview</h1><p>This project uses <strong>TypeScript</strong>.</p>"
};

// Markdown content (auto-converted to HTML)
const markdownNote = {
  parentNoteId: "root",
  title: "Meeting Notes",
  type: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified\n- [Follow-up required](https://example.com)"
};

// Plain text (auto-wrapped in HTML)
const plainTextNote = {
  parentNoteId: "root",
  title: "Quick Note",
  type: "text",
  content: "This is plain text that will be automatically wrapped in HTML tags."
};
```

### Code Notes (No Processing)

```javascript
const pythonNote = {
  parentNoteId: "root",
  title: "Data Analysis",
  type: "code",
  content: `import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())`,
  mime: "text/x-python"
  // Content passed through unchanged - no HTML detection
};

const javascriptNote = {
  parentNoteId: "root",
  title: "Data Processing",
  type: "code",
  content: `function processData(data) {
  return data.filter(item => item.active)
    .map(item => ({
      ...item,
      processed: true
    }));
}`,
  mime: "text/x-javascript"
};
```

### Mermaid Diagrams

```javascript
const mermaidNote = {
  parentNoteId: "root",
  title: "System Architecture",
  type: "mermaid",
  content: `graph TD
  A[Client] --> B[Server]
  B --> C[Database]
  B --> D[Cache]
  C --> E[Backup]`
};
```

## 🔄 Migration from Old Interface

### Before (ContentItem Arrays)
```json
{
  "parentNoteId": "root",
  "title": "My Note",
  "type": "text",
  "content": [
    {
      "type": "text",
      "content": "<h1>Title</h1>"
    }
  ]
}
```

### After (String Content)
```json
{
  "parentNoteId": "root",
  "title": "My Note",
  "type": "text",
  "content": "<h1>Title</h1>"
}
```

## 🛠 Available Helper Functions

- `buildNoteParams()` - Universal function for text and code note types with automatic content mapping

### Using buildNoteParams Helper

```javascript
import { buildNoteParams } from 'triliumnext-mcp';

// Code note using helper
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

// Text note using helper
const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals"
});
```

## 🎯 Content Type Guidelines

### Content Processing by Note Type

| Note Type | Content Format | Processing | Example |
|-----------|----------------|------------|---------|
| `text` | String content | ✅ Smart format detection | `# Heading` → `<h1>Heading</h1>` |
| `code` | String content | ❌ No processing | `print("Hello")` → unchanged |
| `mermaid` | String content | ❌ No processing | `graph TD; A-->B` → unchanged |
| `book` | String content | ✅ Smart format detection | `<p>Folder</p>` |
| `render` | String content | ✅ Smart format detection | `<div>Content</div>` |
| `search` | String content | ✅ Smart format detection | `note.type = 'text'` |

### Content Validation Rules

1. **Text Notes**: Accept HTML, Markdown, or plain text - auto-converts to HTML
2. **Code Notes**: Plain text only - rejects HTML content with error
3. **Mermaid Notes**: Plain text diagram syntax only - rejects HTML content
4. **Container Notes** (book, search, etc.): Content optional, any format accepted

## 🛡️ Hash Validation Examples

### Content Auto-Correction

```javascript
// 1. Create a text note with plain text
const created = await create_note({
  parentNoteId: "root",
  title: "Project Status",
  type: "text",
  content: "Plain text that will be auto-wrapped"
});

// 2. Get the note for safe updates
const noteInfo = await get_note({ noteId: created.noteId });
// Returns: contentHash: "blob_123", type: "text"

// 3. Update with plain text (auto-corrected to HTML)
const result = await update_note({
  noteId: created.noteId,
  type: "text",
  content: "Updated plain text content",
  expectedHash: noteInfo.contentHash
});

// Result: "Note abc123 updated successfully (content auto-corrected)"
// Final content becomes: "<p>Updated plain text content</p>"
```

### Type Safety Enforcement

```javascript
// 1. Create a code note
const createdCode = await create_note({
  parentNoteId: "root",
  title: "Data Analysis",
  type: "code",
  content: `import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())`,
  mime: "text/x-python"
});

// 2. Get the code note
const codeInfo = await get_note({ noteId: createdCode.noteId });

// 3. Update with valid plain code (success)
await update_note({
  noteId: createdCode.noteId,
  type: "code",
  content: "print('Hello, World!')",
  expectedHash: codeInfo.contentHash
});

// 4. Try to update with HTML (rejected)
try {
  await update_note({
    noteId: createdCode.noteId,
    type: "code",
    content: "<p>print('HTML in code note')</p>",
    expectedHash: codeInfo.contentHash
  });
} catch (error) {
  // Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only"
}
```

### Conflict Detection

```javascript
// Simulate concurrent users
const user1Note = await get_note({ noteId: "shared123" });
const user2Note = await get_note({ noteId: "shared123" });
// Both get same contentHash: "blob_original"

// User 1 updates first
await update_note({
  noteId: "shared123",
  type: "text",
  content: "User 1's changes",
  expectedHash: user1Note.contentHash
});

// User 2 tries to update with stale hash
try {
  await update_note({
    noteId: "shared123",
    type: "text",
    content: "User 2's changes",
    expectedHash: user2Note.contentHash  // Old hash
  });
} catch (error) {
  // Error: "CONFLICT: Note has been modified by another user"

  // Solution: Get latest note and retry
  const latestNote = await get_note({ noteId: "shared123" });
  await update_note({
    noteId: "shared123",
    type: "text",
    content: "User 2's merged changes",
    expectedHash: latestNote.contentHash  // Current hash
  });
}
```

## 🔄 Safe Update Patterns

### Always Follow Get → Update Pattern

```javascript
async function safeNoteUpdate(noteId, newContent) {
  // 1. Always get current state first
  const currentNote = await get_note({ noteId, includeContent: true });

  // 2. Update with hash validation
  try {
    return await update_note({
      noteId,
      type: currentNote.note.type,
      content: newContent,
      expectedHash: currentNote.contentHash,
      revision: true  // Create backup for safety
    });
  } catch (error) {
    if (error.message.includes("CONFLICT")) {
      // Handle conflicts gracefully
      console.log("Conflict detected, retrying with latest version...");
      const latestNote = await get_note({ noteId, includeContent: true });
      return await update_note({
        noteId,
        type: latestNote.note.type,
        content: newContent,
        expectedHash: latestNote.contentHash
      });
    }
    throw error;
  }
}

// Usage
await safeNoteUpdate("myNoteId", "Updated content with conflict handling");
```

### Template Integration

```javascript
// Create note with template relation
const boardNote = {
  parentNoteId: "root",
  title: "Project Board",
  type: "book",
  content: "<h1>Project Board</h1>",
  attributes: [
    {
      type: "relation",
      name: "template",
      value: "Board",
      position: 10
    }
  ]
};

const created = await create_note(boardNote);

// Safe update that preserves template relation
const boardInfo = await get_note({ noteId: created.noteId });
await update_note({
  noteId: created.noteId,
  type: "book",
  content: "<h1>Updated Project Board</h1><p>New configuration</p>",
  expectedHash: boardInfo.contentHash
});
```

## 📋 Best Practices

### 1. Content Format Guidelines

| Note Type | Content Format | Auto-Correction | Example |
|-----------|----------------|-----------------|---------|
| `text` | HTML, Markdown, or plain text | ✅ Auto-wraps plain text | `<p>Hello</p>` |
| `code` | Plain text only | ❌ Rejects HTML | `print("Hello")` |
| `mermaid` | Plain text diagram syntax | ❌ Rejects HTML | `graph TD; A-->B` |
| `book` | Optional content | ✅ Flexible | Empty string allowed |

### 2. Error Handling Patterns

```javascript
// Handle common validation errors
try {
  await update_note({
    noteId: "myNote",
    type: "text",
    content: newContent,
    expectedHash: noteHash
  });
} catch (error) {
  if (error.message.includes("Missing required parameter 'expectedHash'")) {
    console.log("Error: Always call get_note before update_note");
  } else if (error.message.includes("CONFLICT")) {
    console.log("Error: Note was modified by another user");
  } else if (error.message.includes("CONTENT_TYPE_MISMATCH")) {
    console.log("Error: Content doesn't match note type requirements");
  }
}
```

### 3. Performance Optimization

```javascript
// Batch operations with template relations (30-50% faster)
const noteWithAttrs = {
  parentNoteId: "root",
  title: "Calendar 2024",
  type: "book",
  content: "<h1>2024 Event Calendar</h1>",
  attributes: [
    {
      type: "relation",
      name: "template",
      value: "Calendar",
      position: 10
    },
    {
      type: "label",
      name: "year",
      value: "2024",
      position: 20
    }
  ]
};

// Single operation creates note + attributes
await create_note(noteWithAttrs);
```

This simplified string-based interface eliminates complexity while maintaining full power for note creation with comprehensive content validation and hash-based safety.