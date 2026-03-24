# TriliumNext MCP - Patch Note Guide

This guide shows how to use `patch_note` for targeted, batched edits with one shared schema.

## Overview

`patch_note` is the precision-edit tool. It supports:
- CSS selectors for HTML/text notes
- limited XPath expressions for simple structure lookups
- line and fragment targeting for code/plaintext notes
- literal and regex search-replace for text-level edits
- literal-only disambiguation with `occurrence` and optional `context`

The tool is atomic:
- all patches are validated first
- nothing is written if any patch is invalid
- `expectedHash` is required to prevent concurrent overwrite

## Patch Item Shape

```json
{
  "mode": "css | xpath | line | fragment | literal | regex",
  "operation": "replace | insert_after | delete",
  "selector": "string",
  "content": "string (required for replace/insert_after)",
  "scope": "one | all (optional, literal/regex only)",
  "flags": "string (optional, literal/regex only)",
  "occurrence": "number (optional, literal only, 1-based)",
  "context": {
    "before": "string (optional, literal only)",
    "after": "string (optional, literal only)"
  }
}
```

## Workflow

### 1. Get the current note

```javascript
get_note({ noteId: "abc123" })
```

### 2. Apply patches

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "css",
      "operation": "replace",
      "selector": "h1",
      "content": "<h1>Updated Title</h1>"
    }
  ]
}
```

## Modes

| Mode | Best for | Notes |
|---|---|---|
| `css` | HTML/text structure | Best default for most note edits |
| `xpath` | Structure fallback | Use when CSS is not expressive enough |
| `line` | Code/plaintext line edits | Targets exact line numbers or unique line fragments |
| `fragment` | Code/plaintext snippets | Useful when the line number is not known |
| `literal` | Exact text replacement | Best for small repeated phrases with `occurrence`/`context` |
| `regex` | Pattern-based replacement | Use when exact text is not enough |

## Examples

### CSS Replacement

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "css",
      "operation": "replace",
      "selector": "p.intro",
      "content": "<p class=\"intro\">Updated intro</p>"
    }
  ]
}
```

### Multiple Independent Patches

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "css",
      "operation": "replace",
      "selector": "h1",
      "content": "<h1>New Title</h1>"
    },
    {
      "mode": "literal",
      "operation": "replace",
      "selector": "Todo",
      "content": "Done",
      "scope": "all"
    }
  ]
}
```

### Literal Disambiguation

Use `occurrence` when the same word appears multiple times:

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "literal",
      "operation": "replace",
      "selector": "Draft",
      "content": "Final",
      "occurrence": 2
    }
  ]
}
```

Use `context` when the repeated text is near a unique heading or block:

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "literal",
      "operation": "replace",
      "selector": "Draft",
      "content": "Final",
      "context": {
        "before": "<h2>Project B</h2>",
        "after": "</div>"
      }
    }
  ]
}
```

### Code Note Line Replacement

```json
{
  "noteId": "code123",
  "expectedHash": "blobId_98765",
  "patches": [
    {
      "mode": "line",
      "operation": "replace",
      "selector": "3",
      "content": "const updatedVariable = 'new value';"
    }
  ]
}
```

### Regex Replacement

```json
{
  "noteId": "abc123",
  "expectedHash": "blobId_12345",
  "patches": [
    {
      "mode": "regex",
      "operation": "replace",
      "selector": "https?://([^\\s]+)",
      "content": "[$1]($0)",
      "scope": "all",
      "flags": "g"
    }
  ]
}
```

## Best Practices

1. Call `get_note` immediately before patching.
2. Use `css` first, `xpath` only when necessary.
3. Use `line` or `fragment` for code/plaintext edits.
4. Use `literal` before `regex` when possible.
5. Use `occurrence` or `context` before falling back to `regex`.
6. Use `scope: "all"` only when you explicitly want every match replaced.
7. Keep patches independent inside one call.

## Error Handling

### Conflict Error

If the note changed since retrieval:

```text
CONFLICT: Note has been modified. Current blobId: ..., expected: ....
```

### Validation Error

If any patch is invalid, the whole batch is rejected before writing.

### No Match Error

If a patch target matches nothing, the tool returns an error instead of silently writing.

## Notes

- `patch_note` replaces the old search-and-replace flow.
- `patch_note` is the only public note-editing tool for targeted edits.
