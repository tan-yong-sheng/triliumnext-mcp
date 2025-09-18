# TriliumNext MCP - Search and Replace Guide

This guide demonstrates how to use the `search_and_replace_note` tool to find and replace content within a single note while preserving data integrity through hash validation.

## Overview

The `search_and_replace_note` tool provides a safe way to perform content replacements within notes by:

- **Hash Validation**: Requires the current `blobId` (content hash) from `get_note` to prevent overwriting concurrent changes
- **Regex Support**: Full regular expression support with capture groups and flags
- **Flexible Search**: Simple string matching or complex pattern matching
- **Safe by Default**: Creates backup revisions before making changes

## Function Contract

```json
{
  "noteId": "string (required)",
  "searchPattern": "string (required)",
  "replacePattern": "string (required)",
  "useRegex": "boolean (optional, default: true)",
  "searchFlags": "string (optional, default: 'gi')",
  "expectedHash": "string (required)",
  "revision": "boolean (optional, default: true)"
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `noteId` | string | ✅ | ID of the note to perform search and replace on |
| `searchPattern` | string | ✅ | Pattern to search for in the note content |
| `replacePattern` | string | ✅ | Replacement text or pattern |
| `useRegex` | boolean | ❌ | Whether to use regex patterns (default: true) |
| `searchFlags` | string | ❌ | Search options (default: 'gi' - global, case-insensitive) |
| `expectedHash` | string | ✅ | Content hash from `get_note` response |
| `revision` | boolean | ❌ | Whether to create backup before replacing (default: true) |

## Workflow

### Step 1: Get Current Note State

```javascript
// Request
get_note({ noteId: "abc123" })

// Response includes contentHash (blobId)
{
  "note": { "id": "abc123", "title": "My Note" },
  "content": "<p>Hello world!</p>",
  "contentHash": "blobId_12345"
}
```

### Step 2: Perform Search and Replace

```json
{
  "noteId": "abc123",
  "searchPattern": "world",
  "replacePattern": "everyone",
  "expectedHash": "blobId_12345"
}
```

## Usage Examples

### Basic Text Replacement

Replace "Hello" with "Hi":

```json
{
  "noteId": "abc123",
  "searchPattern": "Hello",
  "replacePattern": "Hi",
  "useRegex": false,
  "expectedHash": "blobId_12345"
}
```

### Case-Sensitive Replacement

Replace only "World" (not "world"):

```json
{
  "noteId": "abc123",
  "searchPattern": "World",
  "replacePattern": "Everyone",
  "useRegex": false,
  "searchFlags": "g",  // Remove 'i' for case-sensitive
  "expectedHash": "blobId_12345"
}
```

### Regex with Capture Groups

Replace date formats using regex:

```json
{
  "noteId": "abc123",
  "searchPattern": "\\d{4}-\\d{2}-\\d{2}",
  "replacePattern": "DATE: $0",
  "useRegex": true,
  "searchFlags": "g",
  "expectedHash": "blobId_12345"
}
```

### Complex Regex Replacement

Extract and reformat URLs:

```json
{
  "noteId": "abc123",
  "searchPattern": "https?://([^\\s]+)",
  "replacePattern": "[$1]($0)",
  "useRegex": true,
  "searchFlags": "g",
  "expectedHash": "blobId_12345"
}
```

### Multiple Word Replacement

Replace common typos:

```json
{
  "noteId": "abc123",
  "searchPattern": "teh",
  "replacePattern": "the",
  "useRegex": false,
  "searchFlags": "gi",
  "expectedHash": "blobId_12345"
}
```

## Search Flags

| Flag | Description | Example |
|------|-------------|---------|
| `g` | Global - replace all occurrences | `"g"` |
| `i` | Case-insensitive matching | `"i"` |
| `gi` | Global and case-insensitive (default) | `"gi"` |
| `m` | Multiline mode | `"gm"` |

## Error Handling

### Hash Mismatch Error
If the note has been modified since you retrieved it:

```
CONFLICT: Note has been modified by another user. Current blobId: blobId_67890, expected: blobId_12345. Please get the latest note content and retry.
```

**Solution**: Call `get_note` again to get the current hash, then retry your replacement.

### Pattern Not Found
If the search pattern doesn't match anything:

```
Note abc123 updated successfully (0 replacements made)
```

This is not an error - the tool completed successfully but found nothing to replace.

## Best Practices

1. **Always Get Fresh Hash**: Always call `get_note` immediately before performing replacements
2. **Test Patterns**: Use simple patterns first, then add complexity
3. **Backup Important Notes**: Keep `revision: true` for important content
4. **Use Appropriate Flags**: Choose flags based on your specific needs
5. **Handle No Matches**: Check the result message for replacement count

## Common Use Cases

### Fixing Typos Throughout a Note
```json
{
  "noteId": "abc123",
  "searchPattern": "recieve",
  "replacePattern": "receive",
  "useRegex": false,
  "searchFlags": "gi",
  "expectedHash": "blobId_12345"
}
```

### Updating Technical Terms
```json
{
  "noteId": "abc123",
  "searchPattern": "JavaScript",
  "replacePattern": "TypeScript",
  "useRegex": false,
  "searchFlags": "gi",
  "expectedHash": "blobId_12345"
}
```

### Code Refactoring
```json
{
  "noteId": "abc123",
  "searchPattern": "var (\\w+)",
  "replacePattern": "let $1",
  "useRegex": true,
  "searchFlags": "g",
  "expectedHash": "blobId_12345"
}
```

### Standardizing Date Formats
```json
{
  "noteId": "abc123",
  "searchPattern": "(\\d{2})/(\\d{2})/(\\d{4})",
  "replacePattern": "$3-$1-$2",
  "useRegex": true,
  "searchFlags": "g",
  "expectedHash": "blobId_12345"
}
```