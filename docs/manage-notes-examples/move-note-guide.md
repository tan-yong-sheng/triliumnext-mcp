# TriliumNext MCP - Move Note Guide

This guide shows how to use `move_note` to move a note from one parent folder to another.

## Overview

`move_note` is a hierarchy operation, not a content-edit operation.

What it does:
- moves a note to a new parent
- handles notes that exist in multiple locations
- asks for `branchId` when a note has multiple parent branches

What it does not do:
- it does not preserve folder position metadata as a primary feature
- it does not set precise sibling order
- it does not rewrite note content

## Tool Interface

```json
{
  "noteId": "string (required)",
  "newParentNoteId": "string (required)",
  "branchId": "string (optional, only for multi-parent notes)"
}
```

## Workflow

### 1. Move the note

```json
{
  "noteId": "abc123",
  "newParentNoteId": "folder456"
}
```

### 2. If the note has multiple parents

The tool returns the available branches and asks you to choose one:

```json
{
  "noteId": "abc123",
  "message": "Note abc123 exists in 3 locations. Specify 'branchId' to indicate which parent link to move.",
  "requiresBranchId": true,
  "branches": [
    {
      "branchId": "branch1",
      "parentNoteId": "folderA",
      "notePosition": 10
    }
  ]
}
```

Then call it again with the chosen branch:

```json
{
  "noteId": "abc123",
  "newParentNoteId": "folder456",
  "branchId": "branch1"
}
```

## Examples

### Simple Folder Move

```json
{
  "noteId": "draft123",
  "newParentNoteId": "archive456"
}
```

### Move One Branch of a Multi-Parent Note

```json
{
  "noteId": "shared789",
  "newParentNoteId": "team999",
  "branchId": "branch-abc"
}
```

### Reuse an Existing Destination Branch

If the note already exists under the destination parent through another branch, the tool removes the old branch instead of creating a duplicate.

## Best Practices

1. Treat `move_note` as a parent change, not a position editor.
2. Use `branchId` only when Trilium says the note has multiple parent branches.
3. Do not rely on this tool for stable sibling ordering.
4. If ordering matters, keep that as a separate future feature.

## Notes

- This tool is intentionally narrow.
- The main LLM workflow is: choose parent folder, move note, stop there.
