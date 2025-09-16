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


This simplified interface eliminates the ContentItem complexity while maintaining full power for text and code note creation.