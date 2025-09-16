# TriliumNext MCP - Migration Guide

This guide provides detailed instructions for migrating to the new enhanced note creation interface with array-only content parameters.

## Breaking Changes Overview

### ⚠️ Critical Changes

1. **Content Parameter**: `content` parameter now accepts **only `ContentItem[]` arrays**
3. **Required Migration**: All existing code using `create_note`, `update_note`, or `append_note` must be updated

## Content Parameter Migration

### Before (Deprecated String Format)

```typescript
// ❌ NO LONGER SUPPORTED
create_note({
  parentNoteId: 'root',
  title: 'Simple Note',
  type: 'text',
  content: '<h1>Hello World</h1>'  // String content - deprecated
});

update_note({
  noteId: 'abc123',
  content: 'Updated content here'  // String content - deprecated
});

append_note({
  noteId: 'abc123',
  content: 'Appended content here'  // String content - deprecated
});
```

### After (Required Array Format)

```typescript
// ✅ REQUIRED NEW FORMAT
create_note({
  parentNoteId: 'root',
  title: 'Simple Note',
  type: 'text',
  content: [
    { type: 'text', content: '<h1>Hello World</h1>' }  // Array format
  ]
});

update_note({
  noteId: 'abc123',
  content: [
    { type: 'text', content: 'Updated content here' }  // Array format
  ]
});

append_note({
  noteId: 'abc123',
  content: [
    { type: 'text', content: 'Appended content here' }  // Array format
  ]
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
  content: '<h1>Team Meeting</h1><br><p>Discussed project timeline and deliverables.</p>'
});
```

#### After
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

### Pattern 2: Code Content

#### Before
```typescript
create_note({
  parentNoteId: 'root',
  title: 'API Handler',
  type: 'code',
  mime: 'text/x-python',
  content: 'def api_handler():\n    return "Hello World"'
});
```

#### After
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

### Pattern 3: HTML Content

#### Before
```typescript
create_note({
  parentNoteId: 'root',
  title: 'HTML Document',
  type: 'text',
  content: '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello</h1></body></html>'
});
```

#### After
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

## Migration Helper Function

Create a helper function to ease the migration:

```typescript
/**
 * Migrate string content to ContentItem array format
 * @param content String content to migrate
 * @param contentType Type of content (default: 'text')
 * @returns ContentItem array
 */
function migrateContent(content: string, contentType: 'text' | 'code' = 'text'): ContentItem[] {
  return [
    {
      type: contentType,
      content: content
    }
  ];
}

// Usage examples:
create_note({
  parentNoteId: 'root',
  title: 'Migrated Note',
  type: 'text',
  content: migrateContent('<h1>Hello World</h1>')
});

create_note({
  parentNoteId: 'root',
  title: 'Migrated Code',
  type: 'code',
  mime: 'text/x-python',
  content: migrateContent('print("Hello World")', 'code')
});
```

## Batch Migration Script

```typescript
/**
 * Batch migration script for existing note creation calls
 * Search for patterns like:
 * - create_note({ content: "string" })
 * - update_note({ content: "string" })
 * - append_note({ content: "string" })
 */

// Migration patterns to search for:
const migrationPatterns = [
  /create_note\(\{\s*[^}]*content:\s*"([^"]*)"/g,
  /update_note\(\{\s*[^}]*content:\s*"([^"]*)"/g,
  /append_note\(\{\s*[^}]*content:\s*"([^"]*)"/g,
  /create_note\(\{\s*[^}]*content:\s*'([^']*)'/g,
  /update_note\(\{\s*[^}]*content:\s*'([^']*)'/g,
  /append_note\(\{\s*[^}]*content:\s*'([^']*)'/g
];

// Example automated migration (use with caution):
function autoMigrateContent(code: string): string {
  return code
    .replace(/(create_note|update_note|append_note)\(\{\s*([^}]*content:\s*)["']([^"']*)["']([^}]*\})/g,
      (match, func, before, content, after) => {
        return `${func}({${before}[\n    { type: 'text', content: '${content}' }\n  ]${after}`;
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
      content: 'Hello World'
    },
    after: {
      parentNoteId: 'root',
      title: 'Test',
      type: 'text',
      content: [{ type: 'text', content: 'Hello World' }]
    }
  },
  {
    name: 'Code note with MIME type',
    before: {
      parentNoteId: 'root',
      title: 'Code Test',
      type: 'code',
      mime: 'text/x-python',
      content: 'print("test")'
    },
    after: {
      parentNoteId: 'root',
      title: 'Code Test',
      type: 'code',
      mime: 'text/x-python',
      content: [{ type: 'code', content: 'print("test")' }]
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

    if (JSON.stringify(migrated) === JSON.stringify(expected)) {
      console.log('✅ PASSED');
    } else {
      console.log('❌ FAILED');
      console.log('Expected:', expected);
      console.log('Got:', migrated);
    }
  }
}
```

## Common Migration Issues

### Issue 1: Missing Content Type

#### Problem
```typescript
// ❌ Incorrect - missing type specification
content: [
  { content: 'Hello World' }  // Missing 'type' field
]
```

#### Solution
```typescript
// ✅ Correct - include type field
content: [
  { type: 'text', content: 'Hello World' }
]
```

### Issue 2: Wrong Content Type

#### Problem
```typescript
// ❌ Incorrect - using wrong type for code
content: [
  { type: 'text', content: 'function test() {}' }  // Should be 'code' type
]
```

#### Solution
```typescript
// ✅ Correct - use appropriate type
content: [
  { type: 'code', content: 'function test() {}' }
]
```

### Issue 3: Empty Array

#### Problem
```typescript
// ❌ Incorrect - empty content array
content: []  // Must have at least one ContentItem
```

#### Solution
```typescript
// ✅ Correct - include content
content: [
  { type: 'text', content: '' }  // Empty string is acceptable
]
```

## Advanced Migration Scenarios

### Multi-Content Migration

#### Future Enhancement (when multi-modal content is supported)
```typescript
// This will be possible in the future:
create_note({
  parentNoteId: 'root',
  title: 'Mixed Content Note',
  type: 'text',
  content: [
    { type: 'text', content: '<h1>Report</h1>' },
    { type: 'image', content: '/path/to/chart.png', mimeType: 'image/png' },
    { type: 'text', content: '<p>Analysis complete.</p>' }
  ]
});
```

### Attribute Migration

#### Before (Multi-step)
```typescript
// Step 1: Create note
const note = create_note({
  parentNoteId: 'root',
  title: 'Project',
  type: 'book',
  content: '<h1>Project</h1>'
});

// Step 2: Add attributes separately
manage_attributes({
  noteId: note.noteId,
  operation: 'create',
  attributes: [
    { type: 'relation', name: 'template', value: 'Board', position: 10 }
  ]
});
```

#### After (One-step)
```typescript
// Single operation with attributes
const note = create_note({
  parentNoteId: 'root',
  title: 'Project',
  type: 'book',
  content: [
    { type: 'text', content: '<h1>Project</h1>' }
  ],
  attributes: [
    { type: 'relation', name: 'template', value: 'Board', position: 10 }
  ]
});
```

## Migration Checklist

### Pre-Migration
- [ ] Identify all uses of `create_note`, `update_note`, `append_note` in codebase
- [ ] Catalog all current content parameter formats
- [ ] Set up test environment with new MCP server version
- [ ] Create backup of existing code

### Migration Process
- [ ] Update all string content to array format
- [ ] Verify ContentItem type specifications are correct
- [ ] Test basic note creation functionality
- [ ] Test update and append operations
- [ ] Verify existing workflows still work

### Post-Migration
- [ ] Run comprehensive test suite
- [ ] Validate all note creation scenarios
- [ ] Test error handling for invalid formats
- [ ] Update documentation and examples
- [ ] Train team on new interface

## Migration Tools

### Automated Migration Script

```bash
#!/bin/bash
# migrate-content.sh - Automated content parameter migration

echo "Starting content parameter migration..."

# Find all files with note creation calls
FILES=$(grep -l "create_note\|update_note\|append_note" --include="*.ts" --include="*.js" -r .)

for file in $FILES; do
    echo "Processing: $file"

    # Create backup
    cp "$file" "$file.backup"

    # Apply migration patterns
    sed -i '' 's/content: '\''\([^'\'']*\)'\'',/content: [\n    { type: '\''text'\'', content: '\''\1'\'' }\n  ],/g' "$file"
    sed -i '' 's/content: "\([^"]*\)",/content: [\n    { type: '\''text'\'', content: '\''\1'\'' }\n  ],/g' "$file"

    echo "Updated: $file"
done

echo "Migration complete. Backups created with .backup extension"
```

### Validation Script

```bash
#!/bin/bash
# validate-migration.sh - Validate migrated code

echo "Validating migration..."

# Check for remaining string content patterns
echo "Checking for remaining string content..."
grep -n "content: ['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" -r . || echo "No string content found"

# Check for missing type fields
echo "Checking for ContentItem without type..."
grep -A 2 -B 2 "content: \[" --include="*.ts" --include="*.js" -r . | grep -B 2 -A 2 "content:" | grep -v "type:" || echo "All ContentItems have types"

echo "Validation complete."
```

## Support and Troubleshooting

### Common Errors After Migration

#### Error: "content must be an array of ContentItem objects"
**Cause**: Still using string content format
**Solution**: Wrap string content in array with appropriate type

#### Error: "ContentItem missing required 'type' field"
**Cause**: ContentItem object missing type specification
**Solution**: Add `type: 'text'` or `type: 'code'` as appropriate

#### Error: "Invalid ContentItem type"
**Cause**: Used unsupported type value
**Solution**: Use only: 'text', 'file', 'image', 'url', 'data-url'

### Getting Help

1. **Documentation**: See README.md for complete usage examples
2. **Examples**: Check curl-validation-examples.md for cURL examples
3. **Troubleshooting**: Review error messages and common issues above
4. **Community**: Check project issues and discussions

This migration guide provides everything needed to successfully transition to the new enhanced note creation interface.