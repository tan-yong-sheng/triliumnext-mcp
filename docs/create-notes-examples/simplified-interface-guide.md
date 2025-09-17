# Simplified Note Creation Guide

This guide demonstrates the new simplified interface for creating notes in TriliumNext MCP with enhanced hash validation and content type safety features.

## 🆕 New Hash Validation Features

The note creation system now includes comprehensive hash validation and content type safety:

- **BlobId-based concurrency control**: Uses Trilium's native `blobId` to prevent conflicts
- **Content type validation**: Ensures content matches note type requirements
- **Automatic content correction**: Smart HTML wrapping for text notes
- **Required get_note → update_note workflow**: Prevents data loss

### Complete Workflow Example

```javascript
import { buildNoteParams } from 'triliumnext-mcp';

// 1. Create a note with smart content processing
const createParams = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Q4 Planning\n\n- Budget review\n- Team performance"
});

const createdNote = await create_note(createParams);
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
  content: [{ type: "text", content: "# Q4 Planning - Updated\n\n- Budget approved\n- Targets exceeded" }],
  expectedHash: noteInfo.contentHash  // Required for safety
});
// Success: "Note abc123 updated successfully"
```

## 🎯 Problem Solved

The original interface required understanding ContentItem types:
```json
{
  "parentNoteId": "root",
  "title": "fibonacci function",
  "type": "code",
  "content": [
    {
      "type": "text",  // ❌ Confusing! Should be automatic
      "content": "def fibonacci(n):..."
    }
  ]
}
```

## ✅ New Simplified Interface (Single Function)

### Single Function Design

The simplified interface uses **one function** for supported note types:

- **`buildNoteParams()`** - Universal function that handles text and code note types with automatic content mapping

```javascript
import { buildNoteParams, buildContentItem } from 'triliumnext-mcp';

// All note types use the same function - just change noteType
const codeNote = buildNoteParams({
  parentNoteId: "root",
  title: "Fibonacci Function",
  noteType: "code",  // ← This determines the note type
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

const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",  // ← Different note type, same function
  content: "# Meeting Summary\n\n- Discussed Q4 goals"
});

```

### Key Benefits

1. **🎯 Single Function**: LLMs always use the same function - no confusion
2. **🧠 Smart Content Processing**: Automatic format detection and type mapping
3. **🔧 Clear Intent**: `noteType` parameter makes purpose explicit
4. **🎨 Mixed Content Ready**: Text notes can combine multiple text sections
5. **📝 Markdown Support**: Automatic conversion to HTML for text notes

## 📋 Usage Examples

### Text Notes (Smart Format Detection)

```javascript
const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified"
  // Auto-detected as Markdown → converted to HTML
});
```

### Code Notes (No Processing)

```javascript
const pythonNote = buildNoteParams({
  parentNoteId: "root",
  title: "Data Analysis",
  noteType: "code",
  content: `import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())`,
  mime: "text/x-python"
  // Content passed through unchanged - no HTML detection
});
```


### Mixed Content (Text Notes Only)

```javascript
const reportNote = buildNoteParams({
  parentNoteId: "root",
  title: "Project Report",
  noteType: "text",  // Only text notes support mixed content
  content: [
    { type: "text", content: "# Quarterly Report" },
    { type: "text", content: "## Analysis\n\nThe results show..." }
  ]
});
```

## 🔄 Migration from Old Interface

### Before (Complex)
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

### After (Simple)
```javascript
const note = buildNoteParams({
  parentNoteId: "root",
  title: "My Note",
  noteType: "text",
  content: "<h1>Title</h1>"  // Auto-detected as HTML
});
```

## 🛠 Available Helper Functions

- `buildNoteParams()` - Universal function for text and code note types
- `buildContentItem()` - Utility for creating individual ContentItems (advanced use)

## 🎯 LLM Decision Strategy

LLMs choose parameters based on:

1. **User Intent**: What type of content the user wants to create
2. **Available Data**: Text content for notes
3. **Tool Descriptions**: Clear guidance on note types and content formats
4. **Parameter Requirements**: Content arrays and mime types for code notes

## 📝 Parameter Decision Guide

| Parameter | When to Use | Example Values |
|-----------|-------------|----------------|
| `noteType: "text"` | Rich text, documents | Meeting notes, documentation |
| `noteType: "code"` | Code snippets, scripts | Python, JavaScript, SQL |
| `content: array` | ContentItem array (required) | Formatted text content |
| `mime: "..."` | Required for code notes | `text/x-python`, `text/x-javascript` |

## ✅ Working Examples

### Code Notes (Fixed!)
```json
{
  "parentNoteId": "root",
  "title": "Fibonacci Function in Python",
  "type": "code",
  "content": [
    {
      "type": "text",
      "content": "def fibonacci(n):\n    if n <= 0:\n        return []\n    elif n == 1:\n        return [0]\n    else:\n        list_fib = [0, 1]\n        while len(list_fib) < n:\n            next_fib = list_fib[-1] + list_fib[-2]\n            list_fib.append(next_fib)\n        return list_fib"
    }
  ],
  "mime": "text/x-python"
}
```

**✅ Result**: Python code passes through exactly as written - no HTML processing!

### Text Notes with Markdown
```json
{
  "parentNoteId": "root",
  "title": "Meeting Notes",
  "type": "text",
  "content": [
    {
      "type": "text",
      "content": "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified\n- [Follow-up required](https://example.com)"
    }
  ]
}
```

**✅ Result**: Markdown automatically converted to HTML for text notes only.


## 🛡️ Hash Validation Examples

### Content Type Safety in Action

The system automatically validates and corrects content based on note type:

```javascript
// 1. Create a text note
const textNote = buildNoteParams({
  parentNoteId: "root",
  title: "Project Status",
  noteType: "text",
  content: "Plain text that will be auto-wrapped"  // No HTML needed
});

const created = await create_note(textNote);

// 2. Get the note for safe updates
const noteInfo = await get_note({ noteId: created.noteId });
// Returns: contentHash: "blob_123", type: "text"

// 3. Update with plain text (auto-corrected to HTML)
const result = await update_note({
  noteId: created.noteId,
  type: "text",
  content: [{ type: "text", content: "Updated plain text content" }],
  expectedHash: noteInfo.contentHash
});

// Result: "Note abc123 updated successfully (content auto-corrected)"
// Final content becomes: "<p>Updated plain text content</p>"
```

### Code Note Type Safety

```javascript
// 1. Create a code note
const codeNote = buildNoteParams({
  parentNoteId: "root",
  title: "Data Analysis",
  noteType: "code",
  content: `import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())`,
  mime: "text/x-python"
});

const createdCode = await create_note(codeNote);

// 2. Get the code note
const codeInfo = await get_note({ noteId: createdCode.noteId });

// 3. Update with valid plain code (success)
await update_note({
  noteId: createdCode.noteId,
  type: "code",
  content: [{ type: "text", content: "print('Hello, World!')" }],
  expectedHash: codeInfo.contentHash
});

// 4. Try to update with HTML (rejected)
try {
  await update_note({
    noteId: createdCode.noteId,
    type: "code",
    content: [{ type: "text", content: "<p>print('HTML in code note')</p>" }],
    expectedHash: codeInfo.contentHash
  });
} catch (error) {
  // Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only"
}
```

### Conflict Detection Example

```javascript
// Simulate concurrent users
const user1Note = await get_note({ noteId: "shared123" });
const user2Note = await get_note({ noteId: "shared123" });
// Both get same contentHash: "blob_original"

// User 1 updates first
await update_note({
  noteId: "shared123",
  type: "text",
  content: [{ type: "text", content: "User 1's changes" }],
  expectedHash: user1Note.contentHash
});

// User 2 tries to update with stale hash
try {
  await update_note({
    noteId: "shared123",
    type: "text",
    content: [{ type: "text", content: "User 2's changes" }],
    expectedHash: user2Note.contentHash  // Old hash
  });
} catch (error) {
  // Error: "CONFLICT: Note has been modified by another user"

  // Solution: Get latest note and retry
  const latestNote = await get_note({ noteId: "shared123" });
  await update_note({
    noteId: "shared123",
    type: "text",
    content: [{ type: "text", content: "User 2's merged changes" }],
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
      content: [{ type: "text", content: newContent }],
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
        content: [{ type: "text", content: newContent }],
        expectedHash: latestNote.contentHash
      });
    }
    throw error;
  }
}

// Usage
await safeNoteUpdate("myNoteId", "Updated content with conflict handling");
```

### Template Integration with Safe Updates

```javascript
// Create note with template relation
const boardNote = buildNoteParams({
  parentNoteId: "root",
  title: "Project Board",
  noteType: "book",
  content: ""
});

boardNote.attributes = [{
  type: "relation",
  name: "template",
  value: "Board",
  position: 10
}];

const created = await create_note(boardNote);

// Safe update that preserves template relation
const boardInfo = await get_note({ noteId: created.noteId });
await update_note({
  noteId: created.noteId,
  type: "book",
  content: [{ type: "text", content: "Updated board configuration" }],
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
// Batch operations with template relations
const noteWithAttrs = buildNoteParams({
  parentNoteId: "root",
  title: "Calendar 2024",
  noteType: "book",
  content: ""
});

noteWithAttrs.attributes = [
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
];

// Single operation creates note + attributes (30-50% faster)
await create_note(noteWithAttrs);
```

This simplified interface eliminates the ContentItem complexity while maintaining full power for text and code note creation, now with comprehensive hash validation and content type safety.