# TriliumNext MCP - Note Creation Guide

This guide provides a complete reference for creating and managing notes in TriliumNext using the MCP server's simplified, string-based content interface.

## Overview

The `create_note` and `update_note` tools use a simplified model where the `content` parameter is a single string. The server intelligently processes this string based on the note's `type`.

- **String-based Content**: The `content` parameter accepts a single string, not a complex object.
- **Smart Content Processing**: For `text` notes, the server auto-detects Markdown, HTML, or plain text.
- **Hash Validation**: `update_note` requires an `expectedHash` (the `blobId` from `get_note`) to prevent overwriting concurrent changes.
- **Update Modes**: `update_note` requires a `mode` parameter (`'overwrite'` or `'append'`) to specify how content should be updated.
- **Attribute Management**: Create notes with labels and relations in a single step for better performance.

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

| Note Type | Content Format | Processing Rules |
|---|---|---|
| **`text`** | String | Auto-detects format: Markdown is converted to HTML, plain text is wrapped in `<p>` tags, and HTML is passed through. |
| **`code`** | String | Plain text only. HTML tags will be rejected. `mime` type is required. |
| **`mermaid`**| String | Plain text only. Mermaid diagram syntax. |
| **`book`** | String | Content is optional. Can be an empty string `""`. |
| **Other Types**| String | Content is generally optional or follows HTML/text rules. |

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

```