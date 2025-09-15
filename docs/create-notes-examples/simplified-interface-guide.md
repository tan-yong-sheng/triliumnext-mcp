# Simplified Note Creation Guide

This guide demonstrates the new simplified interface for creating notes in TriliumNext MCP.

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

The simplified interface uses **one function** for all note types:

- **`buildNoteParams()`** - Universal function that handles all note types and content formats

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

const imageNote = buildNoteParams({
  parentNoteId: "root",
  title: "Screenshot",
  noteType: "image",  // ← Another note type, same function
  content: "base64-image-data...",
  filename: "screenshot.png",
  mime: "image/png"
});
```

### Key Benefits

1. **🎯 Single Function**: LLMs always use the same function - no confusion
2. **🧠 Smart Content Processing**: Automatic format detection and type mapping
3. **🔧 Clear Intent**: `noteType` parameter makes purpose explicit
4. **📁 Universal File Support**: Simple string content for base64 files
5. **🎨 Mixed Content Ready**: Text notes can combine text, images, files

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

### Image Notes

```javascript
const imageNote = buildNoteParams({
  parentNoteId: "root",
  title: "Screenshot",
  noteType: "image",
  content: "base64-image-data...",
  filename: "screenshot.png",
  mime: "image/png"
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
    { type: "image", content: "base64-data...", filename: "chart.png" },
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

- `buildNoteParams()` - Universal function for all note types
- `buildContentItem()` - Utility for creating individual ContentItems (advanced use)

## 🎯 LLM Decision Strategy

LLMs choose parameters based on:

1. **User Intent**: What type of content the user wants to create
2. **Available Data**: Text content, files, images, or mixed content
3. **Tool Descriptions**: Clear guidance on note types and content formats
4. **Parameter Requirements**: When to use arrays vs strings, when to specify mime types

## 📝 Parameter Decision Guide

| Parameter | When to Use | Example Values |
|-----------|-------------|----------------|
| `noteType: "text"` | Rich text, documents, mixed content | Meeting notes, documentation |
| `noteType: "code"` | Code snippets, scripts | Python, JavaScript, SQL |
| `noteType: "image"` | Image files | PNG, JPEG, SVG |
| `noteType: "file"` | Document attachments | PDF, Word, Excel |
| `content: "string"` | Single content item | Plain text, Markdown, code |
| `content: [array]` | Multiple content items (text notes only) | Text + images in one note |
| `mime: "..."` | Required for code notes, optional for others | `text/x-python`, `image/png` |

This simplified interface eliminates the ContentItem complexity while maintaining full power for advanced use cases.