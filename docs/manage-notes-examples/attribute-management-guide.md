# TriliumNext MCP - Attribute Management Guide

This guide demonstrates how to use the `read_attributes` and `manage_attributes` tools to work with note attributes (labels and relations) in TriliumNext.

## Overview

Attributes in TriliumNext are metadata that can be attached to notes:

- **Labels** (`#tags`): User-defined tags and categories (e.g., `#important`, `#project`)
- **Relations** (`~connections`): Links between notes (e.g., `~template`, `~author`)

The MCP server provides two tools for attribute management:

- **`read_attributes`**: View existing attributes on a note (READ permission)
- **`manage_attributes`**: Create, update, and delete attributes (WRITE permission)

## Tool Interfaces

### `read_attributes`

```json
{
  "noteId": "string (required)"
}
```

### `manage_attributes`

```json
{
  "noteId": "string (required)",
  "operation": "create | update | delete | batch_create (required)",
  "attributes": "array (required for all operations)"
}
```

## Permission-Based Access

| Permission | Available Tools |
|------------|----------------|
| **READ only** | `read_attributes` |
| **WRITE only** | `manage_attributes` |
| **READ + WRITE** | Both tools |

## Attribute Structure

```json
{
  "type": "label | relation",
  "name": "string",
  "value": "string (optional for labels, required for relations)",
  "position": "number (optional, default: 10)",
  "isInheritable": "boolean (optional, default: false)"
}
```

### Labels vs Relations

| Property | Labels | Relations |
|----------|--------|-----------|
| **Prefix** | `#` | `~` |
| **Purpose** | Tags, categories, metadata | Connections to other notes |
| **Value Required** | No | Yes |
| **Examples** | `#important`, `#project=web` | `~template=Board`, `~author=Tolkien` |

## Reading Attributes

### Basic Read Operation

```json
{
  "noteId": "abc123"
}
```

### Response Format

```json
{
  "noteId": "abc123",
  "labels": [
    {
      "name": "priority",
      "value": "high",
      "position": 10
    }
  ],
  "relations": [
    {
      "name": "template",
      "value": "Board",
      "targetNoteId": "def456",
      "position": 5
    }
  ],
  "summary": {
    "totalLabels": 1,
    "totalRelations": 1,
    "hasInheritableAttributes": false
  }
}
```

## Managing Attributes

### 1. Create Operation

Create a single attribute:

```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "label",
      "name": "priority",
      "value": "high",
      "position": 10
    }
  ]
}
```

### 2. Batch Create Operation

Create multiple attributes efficiently (30-50% faster):

```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "label",
      "name": "project",
      "value": "website-redesign",
      "position": 10
    },
    {
      "type": "label",
      "name": "status",
      "value": "in-progress",
      "position": 20
    },
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 5
    }
  ]
}
```

### 3. Update Operation

**Important**: Update limitations apply:
- **Labels**: Can update `value` and `position` only
- **Relations**: Can update `position` only
- **To change name or inheritable**: Delete and recreate

```json
{
  "noteId": "abc123",
  "operation": "update",
  "attributes": [
    {
      "type": "label",
      "name": "priority",  // Cannot change name
      "value": "critical",  // Can update value
      "position": 5         // Can update position
    }
  ]
}
```

### 4. Delete Operation

```json
{
  "noteId": "abc123",
  "operation": "delete",
  "attributes": [
    {
      "type": "label",
      "name": "priority"
    }
  ]
}
```

## Common Use Cases

### Template Relations

Enable specialized note layouts:

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

### Project Organization

Organize notes with project tags:

```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "label",
      "name": "project",
      "value": "mobile-app",
      "position": 10
    },
    {
      "type": "label",
      "name": "component",
      "value": "frontend",
      "position": 20
    },
    {
      "type": "label",
      "name": "priority",
      "value": "high",
      "position": 30
    }
  ]
}
```

### Content Relationships

Link related content:

```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "relation",
      "name": "author",
      "value": "J.R.R. Tolkien",
      "position": 10
    },
    {
      "type": "relation",
      "name": "series",
      "value": "The Lord of the Rings",
      "position": 20
    }
  ]
}
```

### Status Tracking

Track document status:

```json
{
  "noteId": "abc123",
  "operation": "update",
  "attributes": [
    {
      "type": "label",
      "name": "status",
      "value": "completed",  // Changed from "in-progress"
      "position": 10
    }
  ]
}
```

## Built-in Templates

TriliumNext includes several built-in templates:

| Template | Description | Best Note Type |
|----------|-------------|----------------|
| `Board` | Task board with kanban columns | `book` |
| `Calendar` | Calendar interface for scheduling | `book` |
| `Text Snippet` | Reusable text snippets | `text` |
| `Grid View` | Grid-based layout | `book` |
| `List View` | List-based layout | `book` |
| `Table` | Spreadsheet-like table | `book` |
| `Geo Map` | Geographic map | `book` |

## Error Handling

### Permission Errors
```
Permission denied: Not authorized to manage attributes.
```

**Solution**: Ensure you have WRITE permission.

### Attribute Not Found
```
Attribute 'priority' not found on note abc123
```

**Solution**: Check existing attributes with `read_attributes` first.

### Invalid Update
```
Cannot update relation 'value' field. Only position can be updated for relations.
```

**Solution**: Delete and recreate the relation to change the value.

### Template Not Found
```
Template relation 'InvalidTemplate' not found
```

**Solution**: Use valid template names from the built-in list.

## Best Practices

1. **Read Before Write**: Use `read_attributes` to check existing attributes
2. **Use Batch Creation**: Create multiple attributes at once for better performance
3. **Position Management**: Use consistent position values (10, 20, 30) for ordering
4. **Template Relations**: Use built-in templates for specialized functionality
5. **Inheritable Attributes**: Set `isInheritable: true` for attributes that should apply to child notes

## Advanced Examples

### Inheritable Project Attributes

```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "label",
      "name": "project",
      "value": "enterprise-system",
      "position": 10,
      "isInheritable": true  // All child notes inherit this
    },
    {
      "type": "label",
      "name": "department",
      "value": "engineering",
      "position": 20,
      "isInheritable": true
    }
  ]
}
```

### Complex Template Setup

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
      "value": "q4-planning",
      "position": 20
    },
    {
      "type": "label",
      "name": "stakeholder",
      "value": "product-team",
      "position": 30
    },
    {
      "type": "relation",
      "name": "depends-on",
      "value": "Market Research",
      "position": 40
    }
  ]
}
```

## Workflow Integration

### Creating a Note with Attributes

```json
// Step 1: Create the note
{
  "parentNoteId": "root",
  "title": "Q4 Planning Board",
  "type": "book",
  "content": "<h1>Q4 2024 Planning</h1>"
}

// Step 2: Add attributes (or use attributes parameter in create_note)
{
  "noteId": "new-note-id",
  "operation": "batch_create",
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