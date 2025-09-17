# TriliumNext MCP - Migration Guide

This guide provides detailed instructions for migrating to the new simplified string-based content interface for note creation, updates, and appending.

## Breaking Changes Overview

### ⚠️ Critical Changes

1. **Content Parameter**: `content` parameter now accepts **only strings** instead of ContentItem arrays
2. **Smart Processing**: Automatic format detection for text notes (Markdown, HTML, plain text)
3. **Type Safety**: Enhanced content validation based on note type
4. **Required Migration**: All existing code using `create_note`, `update_note`, or `append_note` must be updated

## Content Parameter Migration

### Before (Deprecated Array Format)

```typescript
// ❌ NO LONGER SUPPORTED
create_note({
  parentNoteId: 'root',
  title: 'Simple Note',
  type: 'text',
  content: [
    { type: 'text', content: '<h1>Hello World</h1>' }  // Array format - deprecated
  ]
});

update_note({
  noteId: 'abc123',
  type: 'text',
  content: [
    { type: 'text', content: 'Updated content here' }  // Array format - deprecated
  ],
  expectedHash: 'blobId_123'
});

append_note({
  noteId: 'abc123',
  content: [
    { type: 'text', content: 'Appended content here' }  // Array format - deprecated
  ]
});
```

### After (Required String Format)

```typescript
// ✅ REQUIRED NEW FORMAT
create_note({
  parentNoteId: 'root',
  title: 'Simple Note',
  type: 'text',
  content: '<h1>Hello World</h1>'  // String format only
});

update_note({
  noteId: 'abc123',
  type: 'text',
  content: 'Updated content here',  // String format only
  expectedHash: 'blobId_123'
});

append_note({
  noteId: 'abc123',
  content: 'Appended content here'  // String format only
});
```

## Migration Patterns

### Pattern 1: Simple Text Content

#### Before
```typescript
create_note({
  parentNoteId: 'root',
  title: 'Meeting Notes',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<h1>Team Meeting</h1><br><p>Discussed project timeline and deliverables.</p>'
    }
  ]
});
```

#### After
```typescript
create_note({
  parentNoteId: 'root',
  title: 'Meeting Notes',
  type: 'text',
  content: '<h1>Team Meeting</h1><br><p>Discussed project timeline and deliverables.</p>'
});
```

### Pattern 2: Code Content

#### Before
```typescript
create_note({
  parentNoteId: 'root',
  title: 'API Handler',
  type: 'code',
  mime: 'text/x-python',
  content: [
    {
      type: 'code',
      content: 'def api_handler():\n    return "Hello World"'
    }
  ]
});
```

#### After
```typescript
create_note({
  parentNoteId: 'root',
  title: 'API Handler',
  type: 'code',
  mime: 'text/x-python',
  content: 'def api_handler():\n    return "Hello World"'
});
```

### Pattern 3: HTML Content

#### Before
```typescript
create_note({
  parentNoteId: 'root',
  title: 'HTML Document',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body></html>'
    }
  ]
});
```

#### After
```typescript
create_note({
  parentNoteId: 'root',
  title: 'HTML Document',
  type: 'text',
  content: '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body></html>'
});
```

### Pattern 4: Markdown Content (New Feature)

#### Before (Required Manual HTML Conversion)
```typescript
create_note({
  parentNoteId: 'root',
  title: 'Markdown Note',
  type: 'text',
  content: [
    {
      type: 'text',
      content: '<h1>Meeting Notes</h1>\n<p><strong>Key Points:</strong></p>\n<ul>\n  <li>Discussed Q4 goals</li>\n  <li>Planning timeline</li>\n</ul>'
    }
  ]
});
```

#### After (Auto-Detected Markdown)
```typescript
create_note({
  parentNoteId: 'root',
  title: 'Markdown Note',
  type: 'text',
  content: '# Meeting Notes\n\n**Key Points:**\n- Discussed Q4 goals\n- Planning timeline'
  // Auto-converted to HTML by the system
});
```

## Migration Helper Function

Create a helper function to ease the migration:

```typescript
/**
 * Migrate ContentItem array to string format
 * @param content ContentItem array to migrate
 * @returns String content
 */
function migrateContent(content: Array<{type: string, content: string}>): string {
  if (!Array.isArray(content) || content.length === 0) {
    return '';
  }

  // For text notes, concatenate all text content
  return content.map(item => item.content).join('');
}

// Usage examples:
create_note({
  parentNoteId: 'root',
  title: 'Migrated Note',
  type: 'text',
  content: migrateContent([
    { type: 'text', content: '<h1>Hello World</h1>' }
  ])
});

create_note({
  parentNoteId: 'root',
  title: 'Migrated Code',
  type: 'code',
  mime: 'text/x-python',
  content: migrateContent([
    { type: 'code', content: 'print("Hello World")' }
  ])
});
```

## Batch Migration Script

```typescript
/**
 * Batch migration script for existing note creation calls
 * Search for patterns like:
 * - create_note({ content: [{ type: 'text', content: "..." }] })
 * - update_note({ content: [{ type: 'text', content: "..." }] })
 * - append_note({ content: [{ type: 'text', content: "..." }] })
 */

// Migration patterns to search for:
const migrationPatterns = [
  /create_note\(\{\s*[^}]*content:\s*\[\s*\{[^}]*\}\s*\]/g,
  /update_note\(\{\s*[^}]*content:\s*\[\s*\{[^}]*\}\s*\]/g,
  /append_note\(\{\s*[^}]*content:\s*\[\s*\{[^}]*\}\s*\]/g
];

// Example automated migration (use with caution):
function autoMigrateContent(code: string): string {
  return code
    .replace(/(create_note|update_note|append_note)\(\{\s*([^}]*content:\s*\[\s*\{[^}]*content:\s*)["']([^"']*)["'][^}]*\}\s*\][^}]*\})/g,
      (match, func, before, content) => {
        return `${func}({${before}"${content}"}`;
      });
}
```

## Testing Migration

### Migration Test Suite

```typescript
// Test cases to verify migration
const migrationTests = [
  {
    name: 'Simple text note',
    before: {
      parentNoteId: 'root',
      title: 'Test',
      type: 'text',
      content: [{ type: 'text', content: 'Hello World' }]
    },
    after: {
      parentNoteId: 'root',
      title: 'Test',
      type: 'text',
      content: 'Hello World'
    }
  },
  {
    name: 'Code note with MIME type',
    before: {
      parentNoteId: 'root',
      title: 'Code Test',
      type: 'code',
      mime: 'text/x-python',
      content: [{ type: 'code', content: 'print("test")' }]
    },
    after: {
      parentNoteId: 'root',
      title: 'Code Test',
      type: 'code',
      mime: 'text/x-python',
      content: 'print("test")'
    }
  },
  {
    name: 'Multi-item content',
    before: {
      parentNoteId: 'root',
      title: 'Complex Note',
      type: 'text',
      content: [
        { type: 'text', content: '<h1>Title</h1>' },
        { type: 'text', content: '<p>Content</p>' }
      ]
    },
    after: {
      parentNoteId: 'root',
      title: 'Complex Note',
      type: 'text',
      content: '<h1>Title</h1><p>Content</p>'
    }
  }
];

// Run tests
function runMigrationTests() {
  for (const test of migrationTests) {
    console.log(`Testing: ${test.name}`);

    // Test migration function
    const migrated = migrateContent(test.before.content);
    const expected = test.after.content;

    if (migrated === expected) {
      console.log('✅ PASSED');
    } else {
      console.log('❌ FAILED');
      console.log('Expected:', expected);
      console.log('Got:', migrated);
    }
  }
}
```

## New Features After Migration

### Smart Content Processing (Automatic)

```typescript
// Text notes now auto-detect content format
create_note({
  parentNoteId: 'root',
  title: 'Smart Content',
  type: 'text',
  content: '# Auto-Converted Markdown\n\nThis **markdown** is automatically converted to HTML'
  // Becomes: <h1>Auto-Converted Markdown</h1><p>This <strong>markdown</strong> is automatically converted to HTML</p>
});

// Plain text auto-wrapping
create_note({
  parentNoteId: 'root',
  title: 'Plain Text',
  type: 'text',
  content: 'This plain text will be auto-wrapped in HTML tags'
  // Becomes: <p>This plain text will be auto-wrapped in HTML tags</p>
});
```

### Enhanced Type Safety

```typescript
// Code notes reject HTML content
try {
  create_note({
    parentNoteId: 'root',
    title: 'Invalid Code',
    type: 'code',
    mime: 'text/x-javascript',
    content: '<p>function test() {}</p>'  // Will be rejected
  });
} catch (error) {
  // Error: Content type mismatch - code notes require plain text only
}
```

### Required Hash Validation

```typescript
// Updates now require hash validation
const note = await get_note({ noteId: 'abc123', includeContent: true });
await update_note({
  noteId: 'abc123',
  type: note.note.type,
  content: 'Updated content',
  expectedHash: note.contentHash  // Required parameter
});
```

## Common Migration Issues

### Issue 1: Missing Type Parameter in Updates

#### Problem
```typescript
// ❌ Incorrect - missing type parameter for content updates
update_note({
  noteId: 'abc123',
  content: 'Updated content',  // Missing required type parameter
  expectedHash: 'blobId_123'
});
```

#### Solution
```typescript
// ✅ Correct - include type parameter
const note = await get_note({ noteId: 'abc123' });
update_note({
  noteId: 'abc123',
  type: note.note.type,  // Required when updating content
  content: 'Updated content',
  expectedHash: note.contentHash
});
```

### Issue 2: Missing Expected Hash

#### Problem
```typescript
// ❌ Incorrect - missing hash validation
update_note({
  noteId: 'abc123',
  type: 'text',
  content: 'Updated content'  // Missing required expectedHash
});
```

#### Solution
```typescript
// ✅ Correct - include hash validation
const note = await get_note({ noteId: 'abc123', includeContent: true });
update_note({
  noteId: 'abc123',
  type: note.note.type,
  content: 'Updated content',
  expectedHash: note.contentHash  // Required for safety
});
```

### Issue 3: HTML in Code Notes

#### Problem
```typescript
// ❌ Incorrect - HTML content in code note
create_note({
  parentNoteId: 'root',
  title: 'Code with HTML',
  type: 'code',
  mime: 'text/x-python',
  content: '<p>print("Hello")</p>'  // Will be rejected
});
```

#### Solution
```typescript
// ✅ Correct - plain text for code notes
create_note({
  parentNoteId: 'root',
  title: 'Code with HTML',
  type: 'code',
  mime: 'text/x-python',
  content: 'print("Hello")'  // Plain text only
});
```

## Migration Checklist

### Pre-Migration
- [ ] Identify all uses of `create_note`, `update_note`, `append_note` in codebase
- [ ] Catalog all current content parameter formats (arrays vs strings)
- [ ] Set up test environment with new MCP server version
- [ ] Create backup of existing code
- [ ] Review new hash validation requirements

### Migration Process
- [ ] Update all array content to string format
- [ ] Add required `type` parameter to `update_note` calls
- [ ] Add `expectedHash` parameter to all `update_note` calls
- [ ] Update content type validation logic
- [ ] Test basic note creation functionality
- [ ] Test update and append operations with hash validation
- [ ] Verify existing workflows still work

### Post-Migration
- [ ] Run comprehensive test suite
- [ ] Validate all note creation scenarios
- [ ] Test error handling for invalid formats and hash conflicts
- [ ] Update documentation and examples
- [ ] Train team on new interface and hash validation requirements

## Migration Tools

### Automated Migration Script

```bash
#!/bin/bash
# migrate-to-strings.sh - Automated content parameter migration to strings

echo "Starting content parameter migration to strings..."

# Find all files with note creation calls
FILES=$(grep -l "create_note\|update_note\|append_note" --include="*.ts" --include="*.js" -r .)

for file in $FILES; do
    echo "Processing: $file"

    # Create backup
    cp "$file" "$file.backup"

    # Apply migration patterns - convert ContentItem arrays to strings
    sed -i '' 's/content: \[\s*{[^}]*content:[[:space:]]*"\([^"]*\)"[^}]*}\s*\]/content: "\1"/g' "$file"
    sed -i '' 's/content: \[\s*{[^}]*content:[[:space:]]*'\''\([^'\'']*\)'\''[^}]*}\s*\]/content: "\1"/g' "$file"

    echo "Updated: $file"
done

echo "Migration complete. Backups created with .backup extension"
```

### Validation Script

```bash
#!/bin/bash
# validate-migration.sh - Validate migrated code

echo "Validating migration to strings..."

# Check for remaining array content patterns
echo "Checking for remaining array content..."
grep -n "content: \[" --include="*.ts" --include="*.js" -r . || echo "No array content found"

# Check for missing type parameters in updates
echo "Checking for update_note without type parameter..."
grep -A 5 -B 1 "update_note" --include="*.ts" --include="*.js" -r . | grep -B 5 -A 5 "content:" | grep -v "type:" || echo "All updates have type parameters"

# Check for missing expectedHash in updates
echo "Checking for update_note without expectedHash..."
grep -A 10 "update_note" --include="*.ts" --include="*.js" -r . | grep -A 10 -B 2 "content:" | grep -v "expectedHash" | head -20 || echo "All updates have expectedHash"

echo "Validation complete."
```

## Support and Troubleshooting

### Common Errors After Migration

#### Error: "content must be a string"
**Cause**: Still using array content format
**Solution**: Convert to string content using the helper function

#### Error: "Missing required parameter 'type'"
**Cause**: Missing type parameter in update_note calls
**Solution**: Add `type: currentNote.note.type` parameter

#### Error: "Missing required parameter 'expectedHash'"
**Cause**: Missing hash validation in update_note calls
**Solution**: Add `expectedHash: currentNote.contentHash` parameter

#### Error: "CONTENT_TYPE_MISMATCH: code notes require plain text only"
**Cause**: Using HTML content in code notes
**Solution**: Remove HTML tags from code note content

#### Error: "CONFLICT: Note has been modified by another user"
**Cause**: Using stale hash for update
**Solution**: Get latest note and retry with current hash

### Getting Help

1. **Documentation**: See README.md for complete usage examples
2. **Examples**: Check simplified-interface-guide.md for detailed examples
3. **Hash Validation**: See hash-validation-workflow-guide.md for safety patterns
4. **Community**: Check project issues and discussions

This migration guide provides everything needed to successfully transition to the new simplified string-based note creation interface.