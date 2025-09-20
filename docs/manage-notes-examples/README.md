# TriliumNext MCP - Note Creation Guide

This guide provides a complete reference for creating and managing notes in TriliumNext using the MCP server's simplified, string-based content interface.

## Overview

The `create_note` and `update_note` tools use a simplified string-based interface for content. While the internal TypeScript interfaces support more complex structures, the MCP tools expose a streamlined string-based API that's easier to use.

- **String-based Content**: The `content` parameter accepts a single string for all note types.
- **Smart Content Processing**: For `text` notes, the server auto-detects Markdown, HTML, or plain text and processes accordingly.
- **Hash Validation**: `update_note` requires an `expectedHash` (the `blobId` from `get_note`) to prevent overwriting concurrent changes.
- **Update Modes**: `update_note` requires a `mode` parameter (`'overwrite'` or `'append'`) to specify how content should be updated.
- **Attribute Management**: Create notes with labels and relations in a single step for better performance.

## Internal vs External Content Interfaces

### MCP Tool Interface (What Users See)
```json
{
  "content": "string"  // Simple string for all note types
}
```

The server automatically converts the simple string input to the appropriate internal structure based on the note type.

## Tool Interfaces

### `create_note`
```json
{
  "parentNoteId": "string",
  "title": "string",
  "type": "text | code | render | search | relationMap | book | noteMap | mermaid | webView",
  "content": "string",
  "mime": "string (optional, required for code notes)",
  "attributes": "array (optional)"
}
```

### `update_note`
```json
{
  "noteId": "string",
  "expectedHash": "string (required)",
  "mode": "overwrite | append (required)",
  "title": "string (optional)",
  "type": "string (required when updating content)",
  "content": "string (optional)",
  "mime": "string (optional)",
  "revision": "boolean (optional, default: true)"
}
```

## Content Processing Rules

| Note Type | Input Format | Processing Rules | Examples |
|---|---|---|---|
| **`text`** | String | Auto-detects format: Markdown → HTML, plain text → `<p>` tags, HTML → passed through | `"# Hello"` → `<h1>Hello</h1>` |
| **`code`** | String | Plain text only. HTML tags rejected. `mime` type required. | `"console.log('hi')"` with `mime: "text/javascript"` |
| **`mermaid`**| String | Plain text only. Mermaid diagram syntax. Auto-detected. | `"graph TD; A-->B"` |
| **`book`** | String | Optional. Can be empty string `""` or HTML content. | `""` or `"<h1>Folder</h1>"` |
| **`render`** | String | HTML/JS content for custom rendering. | `"<div>Custom HTML</div>"` |
| **`search`** | String | Trilium search query syntax. | `"note.title = 'project'"` |
| **`relationMap`** | String | Optional. Can be empty. | `""` |
| **`noteMap`** | String | Optional. Can be empty. | `""` |
| **`webView`** | String | URL or HTML for web content. | `"https://example.com"` |

---

## Usage Examples

### Creating a Text Note (Markdown)
```json
{
  "parentNoteId": "root",
  "title": "Meeting Summary",
  "type": "text",
  "content": "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified"
}
```

### Creating a Code Note (Python)
```json
{
  "parentNoteId": "root",
  "title": "Fibonacci Function",
  "type": "code",
  "content": "def fibonacci(n):\n    a, b = 0, 1\n    while a < n:\n        print(a, end=' ')\n        a, b = b, a+b",
  "mime": "text/x-python"
}
```

### Creating a Note with Attributes
```json
{
  "parentNoteId": "root",
  "title": "Project Board",
  "type": "book",
  "content": "<h1>Project Task Board</h1>",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board"
    },
    {
      "type": "label",
      "name": "project",
      "value": "website-redesign"
    }
  ]
}
```

### Creating Different Note Types

#### Render Note
```json
{
  "parentNoteId": "root",
  "title": "Custom Widget",
  "type": "render",
  "content": "<div id='widget'>Hello from custom HTML!</div>"
}
```

#### Search Note
```json
{
  "parentNoteId": "root",
  "title": "All Project Notes",
  "type": "search",
  "content": "note.parents.title = 'Projects' AND #project"
}
```

#### WebView Note
```json
{
  "parentNoteId": "root",
  "title": "Documentation",
  "type": "webView",
  "content": "https://docs.example.com"
}
```

### Updating a Note (Safe Workflow)

**1. Get the note's current state and hash:**
```javascript
// Request
get_note({ noteId: "abc123", includeContent: true })

// Response includes a `contentHash` (e.g., "blobId_456")
```

**2. Call `update_note` with the hash and a mode:**

*To overwrite the entire content:*
```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_456",
  "mode": "overwrite",
  "type": "text",
  "content": "<h1>New Content</h1><p>This replaces everything.</p>"
}
```

*To append to the existing content:*
```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_456",
  "mode": "append",
  "type": "text",
  "content": "<p>This text will be added to the end.</p>"
}
```

### Conflict Detection
If you try to update a note with a stale `expectedHash`, the operation will fail with a conflict error. This prevents you from accidentally overwriting changes made by another process. To resolve this, you must call `get_note` again to get the latest hash and then retry your update.

## Content Type Safety

The server enforces content type safety to ensure data integrity:

### Text Notes
- **Auto-conversion**: Markdown and plain text are converted to HTML
- **HTML validation**: Invalid HTML is corrected automatically
- **Example**: `"Hello world"` → `"<p>Hello world</p>"`

### Code Notes
- **Plain text only**: HTML content is rejected with clear error messages
- **MIME required**: Must specify appropriate MIME type
- **Example**: `"console.log('hi')"` with `mime: "text/javascript"`

### Other Types
- **Flexible**: Accept appropriate content formats based on type
- **Empty allowed**: Most types can have empty content `""`

For detailed error handling and content validation rules, see the individual tool documentation.

## Related Documentation

- **[Note Type Reference](./note-type-reference.md)** - Detailed information about supported note types
- **[Template Relations Guide](./template-guide.md)** - Working with built-in templates
- **[Attribute Management Guide](./attribute-management-guide.md)** - Managing labels and relations
- **[Search and Replace Guide](./search-and-replace-guide.md)** - Advanced content editing
```