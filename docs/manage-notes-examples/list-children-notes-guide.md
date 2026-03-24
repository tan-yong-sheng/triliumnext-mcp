# TriliumNext MCP - List Children Notes Guide

This guide shows how to use `list_children_notes` to list the direct children of a note.

## Overview

`list_children_notes` is a focused hierarchy lookup tool.

What it does:
- lists direct child notes only
- returns a deterministic ordering
- keeps the response small and predictable for LLM use

What it does not do:
- it does not recursively expand descendants
- it does not return position metadata
- it does not reconstruct the full tree

## Tool Interface

```json
{
  "noteId": "string (required)"
}
```

## Output Shape

```json
{
  "parentNoteId": "string",
  "totalChildCount": 0,
  "fetchedCount": 0,
  "failedCount": 0,
  "children": [
    {
      "noteId": "string",
      "title": "string",
      "type": "string",
      "mime": "string",
      "dateModified": "string"
    }
  ]
}
```

## Ordering

Children are returned sorted by:
1. `dateCreated desc`
2. `title`

That means the result is deterministic, but it is **not** the same as Trilium's native manual position order.

## Examples

### List the Direct Children of a Folder

```json
{
  "noteId": "folder123"
}
```

### Expected Response Pattern

```json
{
  "parentNoteId": "folder123",
  "totalChildCount": 2,
  "fetchedCount": 2,
  "failedCount": 0,
  "children": [
    {
      "noteId": "child1",
      "title": "Alpha",
      "type": "text",
      "mime": "text/html",
      "dateModified": "2026-03-24T10:00:00.000Z"
    },
    {
      "noteId": "child2",
      "title": "Beta",
      "type": "book",
      "mime": "",
      "dateModified": "2026-03-23T09:00:00.000Z"
    }
  ]
}
```

## Best Practices

1. Use this tool when the model only needs the immediate children.
2. Use `search_notes` when you need a broader tree search.
3. Do not expect position metadata from this tool.
4. Treat the returned order as deterministic display order, not folder ordering.

## Notes

- This tool is intentionally lightweight.
- It is meant for listing, not rebuilding tree structure.
