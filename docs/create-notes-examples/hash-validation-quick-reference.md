# Hash Validation & Content Type Safety - Quick Reference

## 🚀 Essential Workflow

### The Required Pattern
```javascript
// ALWAYS follow this pattern for updates:
const note = await get_note({ noteId: "myNote" });
await update_note({
  noteId: "myNote",
  type: note.note.type,           // Required: match current type
  content: newContent,
  expectedHash: note.contentHash   // Required: prevents conflicts
});
```

## 📋 Key Parameters

### create_note
```javascript
await create_note({
  parentNoteId: "root",
  title: "My Note",
  type: "text|code|mermaid|book|...",  // Required
  content: [...],                      // Required: ContentItem array
  mime: "text/x-python",               // Required for code notes
  attributes: [...]                    // Optional: labels/relations
});
```

### update_note (NEW REQUIREMENTS)
```javascript
await update_note({
  noteId: "myNote",                    // Required
  type: "text",                        // Required: must match current type
  content: [...],                      // Required: ContentItem array
  expectedHash: "blobId_123",          // Required: from get_note response
  revision: true                       // Optional: default true
});
```

### get_note (ENHANCED RESPONSE)
```javascript
const note = await get_note({
  noteId: "myNote",
  includeContent: true                 // Optional: default true
});

// Response includes:
// - contentHash: "blobId_123"           // Use for update_note
// - contentRequirements: {...}        // Validation rules
// - note.type: "text"                  // Use for update_note
```

## ⚡ Content Type Rules

### ✅ Text Notes (Smart Processing)
```javascript
// Auto-detects format and converts to HTML
content: "Plain text"           // → <p>Plain text</p>
content: "# Heading"            // → <h1>Heading</h1>
content: "**Bold**"            // → <strong>Bold</strong>
content: "<p>HTML</p>"         // → <p>HTML</p> (unchanged)
```

### ✅ Code Notes (Plain Text Only)
```javascript
// Passes through exactly as written
content: "print('Hello')"      // ✅ Valid
content: "def func():"         // ✅ Valid
content: "<p>print('Hello')</p>" // ❌ Rejected (HTML detected)
```

### ✅ Mermaid Notes (Plain Text Only)
```javascript
// Plain text diagram syntax only
content: "graph TD; A-->B"     // ✅ Valid
content: "flowchart LR"        // ✅ Valid
content: "<div>diagram</div>"  // ❌ Rejected (HTML detected)
```

## 🛡️ Safety Features

### Conflict Prevention
```javascript
// Prevents concurrent modifications
const note1 = await get_note({ noteId: "shared" });
const note2 = await get_note({ noteId: "shared" });

// User 1 updates successfully
await update_note({ noteId: "shared", ..., expectedHash: note1.contentHash });

// User 2 gets conflict error
await update_note({ noteId: "shared", ..., expectedHash: note2.contentHash });
// Error: "CONFLICT: Note has been modified by another user"
```

### Auto-Correction
```javascript
// Text notes: Plain text automatically wrapped
const result = await update_note({
  noteId: "text123",
  type: "text",
  content: [{ type: "text", content: "Hello world" }],
  expectedHash: currentHash
});
// Result: "Note updated successfully (content auto-corrected)"
// Content becomes: "<p>Hello world</p>"
```

### Type Validation
```javascript
// Code notes reject HTML
await update_note({
  noteId: "code123",
  type: "code",
  content: [{ type: "text", content: "<p>Hello</p>" }],
  expectedHash: currentHash
});
// Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only"
```

## 🔧 Common Patterns

### Safe Update Function
```javascript
async function safeUpdate(noteId, newContent) {
  const note = await get_note({ noteId, includeContent: true });
  try {
    return await update_note({
      noteId,
      type: note.note.type,
      content: [{ type: "text", content: newContent }],
      expectedHash: note.contentHash
    });
  } catch (error) {
    if (error.message.includes("CONFLICT")) {
      const latest = await get_note({ noteId, includeContent: true });
      return await update_note({
        noteId,
        type: latest.note.type,
        content: [{ type: "text", content: newContent }],
        expectedHash: latest.contentHash
      });
    }
    throw error;
  }
}
```

### Template Creation
```javascript
// One-step template creation
await create_note({
  parentNoteId: "root",
  title: "Project Board",
  type: "book",
  content: [{ type: "text", content: "" }],
  attributes: [{
    type: "relation",
    name: "template",
    value: "Board",
    position: 10
  }]
});
```

## 🚨 Error Handling

### Common Errors
```javascript
// Missing hash (always call get_note first)
"Missing required parameter 'expectedHash'"

// Conflict (note modified by another user)
"CONFLICT: Note has been modified by another user"

// Type mismatch (wrong content format)
"CONTENT_TYPE_MISMATCH: code notes require plain text only"

// Type mismatch (update type ≠ current type)
// (Update type must match get_note type)
```

### Error Handling Pattern
```javascript
try {
  await update_note({ noteId, type, content, expectedHash });
} catch (error) {
  if (error.message.includes("expectedHash")) {
    console.log("Solution: Call get_note before update_note");
  } else if (error.message.includes("CONFLICT")) {
    console.log("Solution: Get latest note and retry");
  } else if (error.message.includes("CONTENT_TYPE_MISMATCH")) {
    console.log("Solution: Fix content format for note type");
  }
}
```

## 📊 Note Type Reference

| Type | Content Format | Auto-Correction | Example |
|------|----------------|-----------------|---------|
| `text` | HTML/Markdown/Plain | ✅ Auto-wrap plain text | `<p>Hello</p>` |
| `code` | Plain text only | ❌ Rejects HTML | `print("Hi")` |
| `mermaid` | Plain text only | ❌ Rejects HTML | `graph TD; A-->B` |
| `book` | Optional | ✅ Flexible | `""` |
| `search` | Optional | ✅ Flexible | `""` |
| `relationMap` | Optional | ✅ Flexible | `""` |

## 🎯 Best Practices

### 1. Always Use Hash Validation
```javascript
// ✅ Correct
const note = await get_note({ noteId });
await update_note({ noteId, type: note.type, content, expectedHash: note.contentHash });

// ❌ Wrong (will error)
await update_note({ noteId, content });  // Missing type and expectedHash
```

### 2. Match Content to Note Type
```javascript
// ✅ Text notes benefit from auto-correction
type: "text", content: "Plain text becomes HTML"

// ✅ Code notes must be plain text
type: "code", content: "console.log('Hello')"

// ❌ Don't put HTML in code notes
type: "code", content: "<p>console.log('Hello')</p>"
```

### 3. Handle Conflicts Gracefully
```javascript
// Always implement retry logic for conflicts
// Use the safeUpdate function pattern shown above
```

## 🔄 Migration from Old API

### Before (No Validation)
```javascript
await update_note({
  noteId: "myNote",
  content: oldContent  // No type or hash needed
});
```

### After (Full Validation)
```javascript
const note = await get_note({ noteId: "myNote" });
await update_note({
  noteId: "myNote",
  type: note.note.type,        // Required
  content: newContent,
  expectedHash: note.contentHash  // Required
});
```

This quick reference covers the essential patterns for safe note creation and updates with hash validation and content type safety.