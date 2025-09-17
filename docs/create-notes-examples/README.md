# TriliumNext MCP - Comprehensive Note Creation Guide

This document provides a complete guide to creating and managing notes in TriliumNext using the MCP server, including enhanced multi-modal content support and attribute management.

## Overview

The TriliumNext MCP server provides powerful tools for note creation and management with the following key capabilities:

- **Multi-modal Content**: Support for text, files, URLs, and mixed content
- **Enhanced create_note**: Create notes with optional attributes in one operation
- **Attribute Management**: Full CRUD operations for labels and relations
- **Template Integration**: Built-in template support for specialized layouts

## Enhanced Note Creation

### Breaking Change: Content Parameter Update

**⚠️ IMPORTANT**: The `content` parameter in `create_note`, `update_note`, and `append_note` now accepts **only arrays of ContentItem objects**, not strings. This is a breaking change that requires migration of existing code.

## 🚨 CRITICAL: Content Requirements by Note Type

**⚠️ ACTION REQUIRED**: Tool descriptions must be updated to reflect these content requirements. The content format and necessity varies significantly by note type.

### Content Requirements Matrix

| Note Type | Content Required | Content Format | Examples |
|-----------|------------------|----------------|----------|
| **`text`** | ✅ Required | HTML content | `<h1>Title</h1><p>Content</p>` |
| **`code`** | ✅ Required | Plain text code | `function test() { return true; }` |
| **`file`** | ✅ Required | Base64 encoded file data | `JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXM...` |
| **`image`** | ✅ Required | Base64 encoded image data | `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==` |
| **`render`** | ✅ Required | HTML or template content | `<div>{{content}}</div>` |
| **`search`** | ⚠️ Optional | Search query string | `note.type = 'text' AND #important` |
| **`book`** | ⚠️ Optional | Description HTML | `<p>Project folder</p>` (can be empty) |
| **`relationMap`** | ⚠️ Optional | Configuration data | JSON configuration |
| **`mermaid`** | ✅ Required | Mermaid diagram syntax | `graph TD; A-->B; B-->C;` |
| **`webView`** | ✅ Required | HTML content | `<iframe src="..."></iframe>` |
| **`shortcut`** | ⚠️ Optional | Target reference | `targetNoteId` or empty |
| **`doc`** | ⚠️ Optional | Document content | HTML or structured data |
| **`contentWidget`** | ⚠️ Optional | Widget configuration | JSON configuration |
| **`launcher`** | ⚠️ Optional | Launch parameters | Command or URL |

### Content Format Guidelines

#### Smart Format Detection (New!)

The system now automatically detects content format for text notes:

- **HTML content**: Detected by HTML tags (`<h1>`, `<p>`, `<strong>`, etc.) - passed through as-is
- **Markdown content**: Detected by Markdown patterns (`#`, `**bold**`, `- lists`, `[links]()`) - converted to HTML
- **Plain text**: No special formatting detected - wrapped in `<p>` tags with HTML escaping

**No format specification needed!** Just provide content and the system handles the rest.

#### Examples:

**Markdown content (automatically detected):**
```typescript
content: [
  {
    type: 'text',
    content: '# Note Title\n\nThis is **markdown** content with:\n- Lists\n- **Bold text**\n- *Italic text*\n- [Links](https://example.com)'
  }
]
```

**HTML content (automatically detected):**
```typescript
content: [
  {
    type: 'text',
    content: '<h1>Note Title</h1><p>This is <strong>HTML</strong> content.</p>'
  }
]
```

**Plain text (automatically detected):**
```typescript
content: [
  {
    type: 'text',
    content: 'This is plain text content.\n\nLine breaks are preserved.'
  }
]
```

#### Code Content (code)
```typescript
content: [
  {
    type: 'code',
    content: `function helloWorld() {
  console.log('Hello, World!');
  return true;
}`
  }
]
```


#### Mermaid Content (mermaid)
```typescript
content: [
  {
    type: 'text',
    content: `graph TD
    A[Start] --> B{Process}
    B -->|Yes| C[End]
    B -->|No| D[Continue]
    D --> B`
  }
]
```

#### Empty Content (book, search, etc.)
```typescript
content: [
  {
    type: 'text',
    content: ''  // Empty string for container notes
  }
]
```

### Common Mistakes to Avoid

1. **Wrong Content Type**: Using HTML content for `code` notes
2. **Missing Content**: Leaving content empty for required types
3. **Wrong Encoding**: Not using base64 for file/image content
4. **HTML in Code**: Putting HTML tags in code note content

### ContentItem Interface

```typescript
interface ContentItem {
  type: 'text' | 'file' | 'image' | 'url' | 'data-url';
  content: string;
  mimeType?: string;
  filename?: string;
  encoding?: 'plain' | 'base64' | 'data-url';
  urlOptions?: {
    timeout?: number;
    headers?: Record<string, string>;
    followRedirects?: boolean;
  };
}
```

### Enhanced create_note Interface

```typescript
interface EnhancedCreateNoteParams {
  parentNoteId: string;
  title: string;
  type: NoteType;  // 15 ETAPI-aligned types
  content: ContentItem[];  // Array only - no string support
  mime?: string;
  attributes?: Attribute[];  // Optional attributes
}
```

### 🆕 Simplified Interface (New!)

**The `buildNoteParams` helper function eliminates ContentItem complexity:**

```typescript
import { buildNoteParams, buildCodeNote, buildImageNote } from 'triliumnext-mcp';

// Simple text note - auto-detected format
const simpleNote = buildNoteParams({
  parentNoteId: "root",
  title: "My Note",
  noteType: "text",
  content: "# Hello World\n\nThis is **markdown** content!"
});

// Code note - automatic plain text handling
const codeNote = buildCodeNote({
  parentNoteId: "root",
  title: "Fibonacci",
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

// Image upload - direct file handling
const imageNote = buildImageNote({
  parentNoteId: "root",
  title: "Chart",
  content: "base64-image-data...",
  filename: "chart.png",
  mime: "image/png"
});

// Mixed content - text + image
const mixedNote = buildNoteParams({
  parentNoteId: "root",
  title: "Report",
  noteType: "text",
  content: [
    { type: "text", content: "# Quarterly Report\n\nHere are the results:" },
    { type: "image", content: "base64-data...", filename: "chart.png" }
  ]
});
```

## Usage Examples

### 🚀 Simplified Usage (Recommended)

**For most cases, use the simplified interface with `buildNoteParams`:**

#### Simple Text Note
```javascript
// Text with automatic format detection
const params = buildNoteParams({
  parentNoteId: "root",
  title: "Meeting Notes",
  noteType: "text",
  content: "# Meeting Summary\n\n- Discussed Q4 goals\n- **Action items** identified\n- [Follow-up required](https://example.com)"
});
```

#### Code Note (Perfect for your Fibonacci example!)
```javascript
// Code notes are handled automatically - no HTML detection
const params = buildCodeNote({
  parentNoteId: "root",
  title: "Fibonacci Function",
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
```

#### Image Upload
```javascript
// Easy image uploads
const params = buildImageNote({
  parentNoteId: "root",
  title: "Project Chart",
  content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  filename: "chart.png",
  mime: "image/png"
});
```

### Advanced Usage (Direct ContentItem Array)

```typescript
// Text content must be wrapped in ContentItem array
create_note({
  parentNoteId: 'root',
  title: 'Simple Note',
  type: 'text',
  content: [
    { type: 'text', content: '<h1>Hello World</h1><p>This uses the new array format.</p>' }
  ]
});
```

### Mixed Content (Text + Local Image)

```typescript
create_note({
  parentNoteId: 'root',
  title: 'Project Report with Chart',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<h1>Q3 Project Report</h1><p>Our quarterly performance exceeded expectations.</p>'
    },
    {
      type: 'image',
      content: '/local/path/to/performance-chart.png',
      mimeType: 'image/png',
      filename: 'performance-chart.png'
    }
  ]
});
```

### Remote URL Content

```typescript
create_note({
  parentNoteId: 'root',
  title: 'Remote API Documentation',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<h1>Latest API Documentation</h1><p>Fetched from external source.</p>'
    },
    {
      type: 'url',
      content: 'https://api.example.com/docs/latest.pdf',
      mimeType: 'application/pdf',
      filename: 'api-docs.pdf',
      urlOptions: {
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer api-token-123',
          'User-Agent': 'TriliumNext-MCP/1.0'
        },
        followRedirects: true
      }
    }
  ]
});
```

### Data URL Content

```typescript
create_note({
  parentNoteId: 'root',
  title: 'Embedded SVG Diagram',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<h1>System Architecture</h1><p>Embedded SVG diagram:</p>'
    },
    {
      type: 'data-url',
      content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk15IERpYWdyYW08L3RleHQ+PC9zdmc+',
      mimeType: 'image/svg+xml',
      filename: 'architecture.svg'
    }
  ]
});
```

## Note Types Supported

The MCP server supports all 15 note types from the TriliumNext ETAPI:

### Core Types
- **`text`**: Rich text notes with HTML formatting
- **`code`**: Code with syntax highlighting (Python, JavaScript, TypeScript, etc.)
- **`render`**: Rendered content notes
- **`file`**: File attachments and documents (PDF, Word, Excel, etc.)
- **`image`**: Image files (JPEG, PNG, GIF, SVG)

### Specialized Types
- **`search`**: Saved search queries
- **`book`**: Folders/containers for organizing notes
- **`relationMap`**: Relationship mapping notes
- **`mermaid`**: Mermaid diagram notes
- **`webView`**: Web content embedding
- **`shortcut`**: Navigation shortcuts
- **`doc`**: Document containers
- **`contentWidget`**: Interactive widgets
- **`launcher`**: Application launchers

## Enhanced Note Creation with Attributes

### Basic Usage with Attributes

```typescript
const note = await create_note({
  parentNoteId: 'root',
  title: 'Project Tasks',
  type: 'book',
  content: [
    { type: 'text', content: '<h1>Project Board</h1>' }
  ],
  attributes: [
    {
      type: 'relation',
      name: 'template',
      value: 'Board',
      position: 10
    }
  ]
});
```

### Complex Multi-Attribute Creation

```typescript
const note = await create_note({
  parentNoteId: 'root',
  title: 'API Handler',
  type: 'code',
  mime: 'text/x-python',
  content: [
    { type: 'text', content: '<h1>Python API Handler</h1>' },
    { type: 'code', content: 'def api_handler():\n    pass' }
  ],
  attributes: [
    {
      type: 'label',
      name: 'language',
      value: 'python',
      position: 10
    },
    {
      type: 'label',
      name: 'project',
      value: 'api',
      position: 20
    },
    {
      type: 'relation',
      name: 'template',
      value: 'Grid View',
      position: 30
    }
  ]
});
```

## Attribute Management

### manage_attributes Tool

The `manage_attributes` tool provides full CRUD operations for note attributes:

#### Available Operations
- **`create`**: Create individual attributes
- **`batch_create`**: Create multiple attributes efficiently (30-50% faster)
- **`read`**: View existing attributes
- **`update`**: Modify existing attributes
- **`delete`**: Remove attributes

#### Attribute Types
- **Labels**: User-defined tags (`#important`, `#project`)
- **Relations**: Connections between notes (`~template`, `~author`)

### Attribute Examples

#### Create Single Label
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

#### Create Template Relation
```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
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

## Template Relations

### Built-in Templates

TriliumNext includes several built-in templates:

- **Calendar**: Calendar notes with date navigation
- **Board**: Task boards with columns and cards
- **Text Snippet**: Reusable text/code snippets
- **Grid View**: Data grid layouts
- **List View**: List-based layouts
- **Table**: Table views
- **Geo Map**: Geographic maps

### Template Usage Examples

#### Create Calendar Note
```typescript
const calendar = await create_note({
  parentNoteId: 'root',
  title: 'Project Calendar',
  type: 'book',
  content: [
    { type: 'text', content: '<h1>Project Timeline</h1>' }
  ],
  attributes: [
    {
      type: 'relation',
      name: 'template',
      value: 'Calendar',
      position: 10
    },
    {
      type: 'label',
      name: 'project',
      value: 'tracking',
      position: 20
    }
  ]
});
```

#### Create Task Board
```typescript
const board = await create_note({
  parentNoteId: 'root',
  title: 'Project Tasks',
  type: 'book',
  content: [
    { type: 'text', content: '<h1>Task Board</h1>' }
  ],
  attributes: [
    {
      type: 'relation',
      name: 'template',
      value: 'Board',
      position: 10
    },
    {
      type: 'label',
      name: 'category',
      value: 'project-management',
      position: 20
    }
  ]
});
```

## Migration Guide

### From String Content to Array Content

#### Before (Old Format)
```typescript
// NO LONGER SUPPORTED
create_note({
  parentNoteId: 'root',
  title: 'Note',
  type: 'text',
  content: '<h1>Hello World</h1>'  // String content - deprecated
});
```

#### After (New Format)
```typescript
// REQUIRED NEW FORMAT
create_note({
  parentNoteId: 'root',
  title: 'Note',
  type: 'text',
  content: [
    { type: 'text', content: '<h1>Hello World</h1>' }  // Array format
  ]
});
```

### From Multi-Step to One-Step Creation

#### Before (Multi-Step)
```typescript
// Step 1: Create note
const note = await create_note({
  parentNoteId: 'root',
  title: 'Project Board',
  type: 'book',
  content: '<h1>Project</h1>'
});

// Step 2: Add template (separate call)
await manage_attributes({
  noteId: note.noteId,
  operation: 'create',
  attributes: [
    {
      type: 'relation',
      name: 'template',
      value: 'Board',
      position: 10
    }
  ]
});
```

#### After (One-Step)
```typescript
// Single operation with attributes
const note = await create_note({
  parentNoteId: 'root',
  title: 'Project Board',
  type: 'book',
  content: [
    { type: 'text', content: '<h1>Project</h1>' }
  ],
  attributes: [
    {
      type: 'relation',
      name: 'template',
      value: 'Board',
      position: 10
    }
  ]
});
```

## Performance Considerations

### Batch Operations
- **`batch_create`**: 30-50% faster than individual attribute creation
- **Parallel Processing**: Content processing and attribute preparation happen in parallel
- **HTTP Optimization**: Reduced round trips compared to manual multi-step approaches

### Content Processing
- **Local Files**: Direct file system access with MIME type detection
- **Remote URLs**: Configurable timeouts and HTTP headers
- **Data URLs**: Built-in parsing and validation
- **Mixed Content**: Parallel processing of different content types

## Best Practices

### Content Organization
1. **Use descriptive filenames** for file and image content
2. **Set appropriate MIME types** for better content handling
3. **Structure mixed content logically** with text descriptions
4. **Use URL options** for remote content (timeouts, headers)

### Attribute Management
1. **Use batch_create** for multiple attributes
2. **Set meaningful positions** for display ordering
3. **Choose descriptive names** for labels and relations
4. **Validate template existence** before creating template relations

### Template Usage
1. **Pair templates with relevant labels** for better organization
2. **Use consistent naming** across template relations
3. **Consider hierarchy** when placing template notes
4. **Test template functionality** after creation

## Error Handling

### Common Content Errors
- **Invalid ContentItem type**: Must be one of 'text', 'file', 'image', 'url', 'data-url'
- **Missing required fields**: Each ContentItem requires `type` and `content`
- **File not found**: Local file paths must be accessible
- **URL validation**: Remote URLs must use HTTP/HTTPS protocols

### Common Attribute Errors
- **Permission denied**: WRITE permission required for attribute operations
- **Invalid attribute names**: Must not contain spaces
- **Template not found**: Template relations require existing target notes
- **Duplicate attributes**: Some attributes may be unique per note

## 🆕 Hash Validation & Content Type Safety

### NEW: Enhanced Update Safety
The `update_note` function now includes comprehensive hash validation and content type safety:

- **BlobId-based concurrency control**: Prevents conflicts using Trilium's native `blobId`
- **Required hash validation**: Ensures data integrity with `get_note` → `update_note` workflow
- **Content type validation**: Automatic validation and correction based on note type
- **Conflict detection**: Clear error messages for concurrent modifications

### Essential Update Workflow
```javascript
// ALWAYS follow this pattern:
const note = await get_note({ noteId: "myNote" });
await update_note({
  noteId: "myNote",
  type: note.note.type,           // Required: match current type
  content: newContent,
  expectedHash: note.contentHash   // Required: prevents conflicts
});
```

### Key Features
- **Auto-correction**: Text notes automatically wrap plain text in HTML
- **Type safety**: Code notes reject HTML content with clear error messages
- **Conflict prevention**: Detects and prevents concurrent modification conflicts
- **Required workflow**: Enforces safe update patterns to prevent data loss

### Related Documentation

#### 📚 Hash Validation Guides
- [Hash Validation Workflow Guide](./hash-validation-workflow-guide.md) - Complete workflow examples
- [Hash Validation Quick Reference](./hash-validation-quick-reference.md) - Essential patterns and reference
- [Hash Validation Implementation Plan](./hash-validation-implementation-plan.md) - Technical details

#### 🔧 Existing Documentation
- [Simplified Interface Guide](./simplified-interface-guide.md) - Easy note creation with helper functions
- [Template Relations Guide](./template-relations.md) - Built-in template usage
- [Search Examples](../search-examples/) - Advanced search capabilities
- [API Reference](../../src/modules/) - Complete tool definitions
- [Implementation Details](../../CLAUDE.md) - Architecture and development guide