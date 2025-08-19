# Content Modification Guide

This guide explains how to safely and efficiently modify note content using the TriliumNext MCP server.

## Available Content Operations

### `update_note` - Complete Content Replacement
- **Purpose**: Replace entire note content
- **Default behavior**: `revision=true` (creates backup before overwriting)
- **Use cases**: Rewriting documents, major edits, complete content replacement
- **⚠️ WARNING**: Completely replaces note content

### `append_note` - Incremental Content Addition  
- **Purpose**: Add content while preserving existing content
- **Default behavior**: `revision=false` (optimized for performance)
- **Use cases**: Logs, journals, meeting notes, incremental updates
- **📝 RECOMMENDED**: For adding content without replacement

### `delete_note` - Permanent Removal
- **Purpose**: Permanently delete notes
- **⚠️ CAUTION**: Cannot be undone, permanently removes note and all content

## Revision Control Strategy

### Smart Defaults Based on Operation Risk

#### 🛡️ Safe Operations (Default: revision=true)
- **`update_note`** creates backups by default since it replaces entire content
- Protects against accidental data loss during major edits
- Override with `revision=false` only when explicitly requested

#### 🚀 Performance Operations (Default: revision=false)
- **`append_note`** skips revisions by default for efficiency  
- Optimized for frequent additions like logs, journals, meeting notes
- Override with `revision=true` for important incremental changes

## Best Practices

### When to Use Which Function
- **Use `append_note` for**:
  - Adding daily log entries
  - Appending meeting notes
  - Incremental journal updates
  - Adding progress updates

- **Use `update_note` for**:
  - Rewriting entire documents
  - Major content overhauls
  - Template replacements
  - Complete content changes

### Revision Control Guidelines
- **Let the defaults work for you** - they're designed for safety and performance
- **Override explicitly** when you need different behavior
- **Consider the impact** - high-risk operations default to safety

## Example Usage Scenarios

### Content Addition Examples
- "Add today's progress to my work log" → `append_note` (preserves existing entries)
- "Append this meeting summary to my notes" → `append_note` (adds without overwriting)
- "Add a new entry to my journal" → `append_note` (incremental addition)

### Content Replacement Examples  
- "Update my project plan with this new version" → `update_note` (complete replacement with backup)
- "Replace the entire document with this new content" → `update_note` (full replacement)
- "Rewrite this note completely" → `update_note` (total content change)

## Advanced Usage

### Explicit Revision Control
```javascript
// Force revision for append operation (important addition)
append_note(noteId, content, revision=true)

// Skip revision for update operation (quick fix, already backed up)
update_note(noteId, content, revision=false)
```

### Safety Considerations
- Always backup important notes before major operations
- Test with non-critical notes first
- Understand that `delete_note` is irreversible
- Use the revision system for important content changes