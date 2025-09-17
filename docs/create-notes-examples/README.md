# TriliumNext MCP - Note Creation Guide

This guide provides a complete reference for creating and managing notes in TriliumNext using the MCP server with simplified string-based content.

## Overview

The TriliumNext MCP server provides streamlined tools for note creation and management with the following key capabilities:

- **String-based Content**: Simple string content with automatic format detection
- **Smart Content Processing**: Auto-detects Markdown, HTML, and plain text for text notes
- **Hash Validation**: Safe updates with blobId-based concurrency control
- **Template Integration**: Built-in template support for specialized layouts
- **Attribute Management**: Full CRUD operations for labels and relations

## Content Format

### ⚠️ IMPORTANT: String Content Only

**The `content` parameter in `create_note`, `update_note`, and `append_note` now accepts strings only.** This is a significant simplification from the previous array-based approach.

### Content Requirements by Note Type

| Note Type | Content Required | Content Format | Auto-Processing | Examples |
|-----------|------------------|----------------|-----------------|----------|
| **`text`** | ✅ Required | String content | ✅ Smart format detection | `"# Hello World\n\nContent"` |
| **`code`** | ✅ Required | Plain text code | ❌ No processing | `"function test() { return true; }"` |
| **`render`** | ✅ Required | String content | ✅ Smart format detection | `"<div>Template content</div>"` |
| **`search`** | ⚠️ Optional | String content | ✅ Smart format detection | `"note.type = 'text' AND #important"` |
| **`book`** | ⚠️ Optional | String content | ✅ Smart format detection | `"<p>Project folder</p>"` (can be empty) |
| **`relationMap`** | ⚠️ Optional | String content | ✅ Smart format detection | JSON configuration |
| **`mermaid`** | ✅ Required | Plain text syntax | ❌ No processing | `"graph TD; A-->B; B-->C;"` |
| **`webView`** | ✅ Required | String content | ✅ Smart format detection | `"<iframe src='...'></iframe>"` |
| **`shortcut`** | ⚠️ Optional | String content | ✅ Smart format detection | Target reference |
| **`doc`** | ⚠️ Optional | String content | ✅ Smart format detection | Document content |
| **`contentWidget`** | ⚠️ Optional | String content | ✅ Smart format detection | Widget configuration |
| **`launcher`** | ⚠️ Optional | String content | ✅ Smart format detection | Launch parameters |

### Smart Content Processing

The system automatically detects content format for text notes:

- **HTML content**: Detected by HTML tags (`<h1>`, `<p>`, `<strong>`, etc.) - passed through as-is
- **Markdown content**: Detected by Markdown patterns (`#`, `**bold**`, `- lists`, `[links]()`) - converted to HTML
- **Plain text**: No special formatting detected - wrapped in `<p>` tags

#### Examples:

**Markdown content (automatically detected):**
```json
{
  "content": "# Note Title\n\nThis is **markdown** content with:\n- Lists\n- **Bold text**\n- *Italic text*\n- [Links](https://example.com)"
}
```

**HTML content (automatically detected):**
```json
{
  "content": "<h1>Note Title</h1><p>This is <strong>HTML</strong> content.</p>"
}
```

**Plain text (automatically detected):**
```json
{
  "content": "This is plain text content.\n\nLine breaks are preserved."
}
```

**Code content (no processing):**
```json
{
  "content": "function helloWorld() {\n  console.log('Hello, World!');\n  return true;\n}",
  "type": "code",
  "mime": "text/x-javascript"
}
```

**Mermaid content (no processing):**
```json
{
  "content": "graph TD\n  A[Start] --> B{Process}\n  B -->|Yes| C[End]\n  B -->|No| D[Continue]\n  D --> B",
  "type": "mermaid"
}
```

## Tool Interfaces

### create_note Interface

```json
{
  "parentNoteId": "string",
  "title": "string",
  "type": "text | code | render | search | relationMap | book | noteMap | mermaid | webView | shortcut | doc | contentWidget | launcher",
  "content": "string",
  "mime": "string (optional, required for code notes)",
  "attributes": "array (optional)"
}
```

### update_note Interface

```json
{
  "noteId": "string",
  "title": "string (optional)",
  "type": "string (required when updating content)",
  "content": "string (required for content updates)",
  "mime": "string (optional)",
  "expectedHash": "string (required)",
  "revision": "boolean (optional, default: true)"
}
```

### append_note Interface

```json
{
  "noteId": "string",
  "content": "string",
  "revision": "boolean (optional, default: false)"
}
```

## Usage Examples

### Text Notes

#### Simple Text Note
```json
{
  "parentNoteId": "root",
  "title": "Meeting Notes",
  "type": "text",
  "content": "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified\n- [Follow-up required](https://example.com)"
}
```

#### HTML Text Note
```json
{
  "parentNoteId": "root",
  "title": "Project Documentation",
  "type": "text",
  "content": "<h1>Project Overview</h1><p>This project uses <strong>TypeScript</strong> for development.</p>"
}
```

#### Plain Text Note (auto-wrapped)
```json
{
  "parentNoteId": "root",
  "title": "Quick Note",
  "type": "text",
  "content": "This is plain text that will be automatically wrapped in HTML tags."
}
```

### Code Notes

#### Python Code
```json
{
  "parentNoteId": "root",
  "title": "Fibonacci Function",
  "type": "code",
  "content": "def fibonacci(n):\n    if n <= 0:\n        return []\n    elif n == 1:\n        return [0]\n    else:\n        fib = [0, 1]\n        while len(fib) < n:\n            fib.append(fib[-1] + fib[-2])\n        return fib",
  "mime": "text/x-python"
}
```

#### JavaScript Code
```json
{
  "parentNoteId": "root",
  "title": "Data Processing",
  "type": "code",
  "content": "function processData(data) {\n  return data.filter(item => item.active)\n    .map(item => ({\n      ...item,\n      processed: true\n    }));\n}",
  "mime": "text/x-javascript"
}
```

### Mermaid Diagrams
```json
{
  "parentNoteId": "root",
  "title": "System Architecture",
  "type": "mermaid",
  "content": "graph TD\n  A[Client] --> B[Server]\n  B --> C[Database]\n  B --> D[Cache]\n  C --> E[Backup]"
}
```

### Container Notes (book, search, etc.)
```json
{
  "parentNoteId": "root",
  "title": "Project Folder",
  "type": "book",
  "content": "<p>Container for project-related notes</p>"
}
```

### Empty Container Notes
```json
{
  "parentNoteId": "root",
  "title": "Empty Folder",
  "type": "book",
  "content": ""
}
```

## Hash Validation & Safe Updates

### Essential Update Workflow

```javascript
// 1. Get current note state with hash
const note = await get_note({
  noteId: "abc123",
  includeContent: true
});
// Returns: { contentHash: "blobId_123", type: "text", ... }

// 2. Update with hash validation
const result = await update_note({
  noteId: "abc123",
  type: note.note.type,           // Required: match current type
  content: "# Updated Content\n\nNew information added",
  expectedHash: note.contentHash   // Required: prevents conflicts
});
```

### Content Auto-Correction

```javascript
// Plain text automatically corrected to HTML for text notes
await update_note({
  noteId: "abc123",
  type: "text",
  content: "This is plain text content",
  expectedHash: note.contentHash
});
// Result: "Note abc123 updated successfully (content auto-corrected)"
// Final content: "<p>This is plain text content</p>"
```

### Conflict Detection

```javascript
// If another user modifies the note concurrently
try {
  await update_note({
    noteId: "abc123",
    type: "text",
    content: "My changes",
    expectedHash: "old_blobId"  // Stale hash
  });
} catch (error) {
  // Error: "CONFLICT: Note has been modified by another user"
  // Solution: Get latest note and retry
  const latestNote = await get_note({ noteId: "abc123" });
  await update_note({
    noteId: "abc123",
    type: "text",
    content: "My changes with latest merge",
    expectedHash: latestNote.contentHash
  });
}
```

## Template Integration

### Creating Template Notes

#### Task Board
```json
{
  "parentNoteId": "root",
  "title": "Project Tasks",
  "type": "book",
  "content": "<h1>Project Board</h1>",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 10
    },
    {
      "type": "label",
      "name": "project",
      "value": "web-development",
      "position": 20
    }
  ]
}
```

#### Calendar
```json
{
  "parentNoteId": "root",
  "title": "2024 Event Calendar",
  "type": "book",
  "content": "<h1>Event Calendar</h1>",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar",
      "position": 10
    }
  ]
}
```

#### Text Snippet Repository
```json
{
  "parentNoteId": "root",
  "title": "Code Snippets",
  "type": "text",
  "content": "<h1>Reusable Code Snippets</h1>",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Text Snippet",
      "position": 10
    },
    {
      "type": "label",
      "name": "language",
      "value": "javascript",
      "position": 20
    }
  ]
}
```

## Attribute Management

### Create Note with Attributes

```json
{
  "parentNoteId": "root",
  "title": "API Documentation",
  "type": "text",
  "content": "<h1>REST API Documentation</h1>",
  "attributes": [
    {
      "type": "label",
      "name": "category",
      "value": "documentation",
      "position": 10
    },
    {
      "type": "label",
      "name": "priority",
      "value": "high",
      "position": 20
    },
    {
      "type": "relation",
      "name": "template",
      "value": "Grid View",
      "position": 30
    }
  ]
}
```

### Using manage_attributes Tool

#### Create Labels
```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "label",
      "name": "important",
      "position": 10
    }
  ]
}
```

#### Batch Create Multiple Attributes
```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 10
    },
    {
      "type": "label",
      "name": "project",
      "value": "web-development",
      "position": 20
    },
    {
      "type": "label",
      "name": "status",
      "value": "active",
      "position": 30
    }
  ]
}
```

## Note Types Reference

### Supported Note Types (ETAPI-aligned)

1. **`text`** - Rich text notes with smart format detection
2. **`code`** - Code snippets with syntax highlighting
3. **`render`** - Rendered content notes
4. **`search`** - Saved search queries
5. **`relationMap`** - Relationship mapping notes
6. **`book`** - Folders/containers for organizing notes
7. **`noteMap`** - Note mapping layouts
8. **`mermaid`** - Mermaid diagram notes
9. **`webView`** - Web content embedding
10. **`shortcut`** - Navigation shortcuts
11. **`doc`** - Document containers
12. **`contentWidget`** - Interactive widgets
13. **`launcher`** - Application launchers

### Common MIME Types for Code Notes

- `text/x-javascript` - JavaScript
- `text/x-python` - Python
- `text/x-typescript` - TypeScript
- `text/x-java` - Java
- `text/x-csrc` - C
- `text/x-c++src` - C++
- `text/x-html` - HTML
- `text/x-css` - CSS
- `text/x-sql` - SQL
- `text/x-yaml` - YAML
- `text/x-json` - JSON
- `text/x-markdown` - Markdown
- `text/x-shellscript` - Shell scripts
- `text/x-powershell` - PowerShell
- `text/x-rust` - Rust
- `text/x-go` - Go
- `text/x-ruby` - Ruby
- `text/x-php` - PHP

## Best Practices

### Content Organization

1. **Use appropriate note types** - Choose the right type for your content
2. **Leverage smart format detection** - Use Markdown for readability, let the system handle HTML conversion
3. **Keep code notes pure** - Never include HTML in code notes
4. **Use meaningful titles** - Helps with search and organization
5. **Organize with folders** - Use `book` type notes as containers

### Safe Updates

1. **Always use get_note before update_note** - Get the current hash
2. **Handle conflicts gracefully** - Implement retry logic
3. **Use revision backups** - Enable `revision: true` for important changes
4. **Validate content types** - Ensure content matches note type requirements

### Template Usage

1. **Pair templates with labels** - Better organization and searchability
2. **Use batch operations** - Create attributes with the note for better performance
3. **Choose appropriate templates** - Match template to content type
4. **Test template functionality** - Verify templates work as expected

### Performance

1. **Batch attribute creation** - 30-50% faster than separate calls
2. **Use appropriate content formats** - Let smart processing handle format detection
3. **Organize hierarchically** - Use parent-child relationships for better navigation

## Error Handling

### Common Content Errors

- **Content type mismatch**: Using HTML content in code notes
- **Missing expectedHash**: Always required for update operations
- **Hash conflicts**: Note modified by another user
- **Invalid note types**: Must be one of the supported ETAPI types

### Common Attribute Errors

- **Permission denied**: WRITE permission required
- **Invalid attribute names**: No spaces allowed
- **Template not found**: Template must exist
- **Duplicate attributes**: Some attributes must be unique

## Migration from Previous Versions

### Before (ContentItem Arrays)
```json
{
  "parentNoteId": "root",
  "title": "Note",
  "type": "text",
  "content": [
    {
      "type": "text",
      "content": "<h1>Hello World</h1>"
    }
  ]
}
```

### After (String Content)
```json
{
  "parentNoteId": "root",
  "title": "Note",
  "type": "text",
  "content": "<h1>Hello World</h1>"
}
```

The new approach is much simpler while maintaining all the functionality through smart content processing.

## Related Documentation

- [Hash Validation Guide](./hash-validation-workflow-guide.md) - Complete workflow examples
- [Template Relations Guide](./template-relations.md) - Built-in template usage
- [Search Examples](../search-examples/) - Advanced search capabilities
- [Implementation Details](../../CLAUDE.md) - Architecture and development guide