# TriliumNext MCP - manage_attributes Examples

This document provides practical examples for using the `manage_attributes` tool to manage note labels and relations in TriliumNext.

## Overview

The `manage_attributes` tool provides full CRUD operations for note attributes:
- **Labels**: User-defined tags and categories (`#important`, `#project`)
- **Relations**: Connections between notes (`~template`, `~author`)
- **Batch Operations**: Efficient creation of multiple attributes in parallel

## Basic Operations

### 1. Create a Single Label

**Use Case**: Tag a note as important
```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "label",
      "name": "important",
      "position": 10
    }
  ]
}
```

**Expected Response**:
```
✅ Successfully created label 'important' on note abc123

📋 Created attributes:
#important [position: 10]
```

### 2. Create a Template Relation

**Use Case**: Apply Board template to a note
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

**Expected Response**:
```
✅ Successfully created relation 'template' on note abc123

📋 Created attributes:
~template = "Board" [position: 10]

🎯 Template relation detected: Board
Note: Template functionality depends on the target note existing in your Trilium instance.
```

### 3. Create Multiple Labels (Batch)

**Use Case**: Add project metadata to a code note
```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "label",
      "name": "project",
      "value": "api",
      "position": 10
    },
    {
      "type": "label",
      "name": "language",
      "value": "python",
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

**Expected Response**:
```
✅ Created 3/3 attributes successfully

📋 Created attributes:
#project = "api" [position: 10]
#language = "python" [position: 20]
#priority = "high" [position: 30]

📊 Summary: 3 attributes processed for note abc123
```

### 4. Create Complex Template with Labels

**Use Case**: Create a fully configured project note
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
      "value": "web-development",
      "position": 20
    },
    {
      "type": "label",
      "name": "status",
      "value": "active",
      "position": 30
    },
    {
      "type": "label",
      "name": "category",
      "value": "frontend",
      "position": 40
    }
  ]
}
```

**Expected Response**:
```
✅ Created 4/4 attributes successfully

📋 Created attributes:
~template = "Board" [position: 10]
#project = "web-development" [position: 20]
#status = "active" [position: 30]
#category = "frontend" [position: 40]

📊 Summary: 4 attributes processed for note abc123

🎯 Template relation detected: Board
Note: Template functionality depends on the target note existing in your Trilium instance.
```

## Read Operations

### 5. Read All Attributes

**Use Case**: View all attributes on a note
```json
{
  "noteId": "abc123",
  "operation": "read"
}
```

**Expected Response**:
```
✅ Retrieved 5 attributes for note abc123

📋 Current attributes:
~template = "Board" [position: 10]
#project = "web-development" [position: 20]
#status = "active" [position: 30]
#category = "frontend" [position: 40]
#language = "python" [position: 50]
```

## Update Operations

### 6. Update Attribute Position

**Use Case**: Change the display order of an attribute
```json
{
  "noteId": "abc123",
  "operation": "update",
  "attributes": [
    {
      "type": "label",
      "name": "status",
      "position": 15
    }
  ]
}
```

**Expected Response**:
```
✅ Successfully updated label 'status' on note abc123

📋 Updated attributes:
#status = "active" [position: 15]
```

### 7. Update Label Value

**Use Case**: Change project status
```json
{
  "noteId": "abc123",
  "operation": "update",
  "attributes": [
    {
      "type": "label",
      "name": "status",
      "value": "completed",
      "position": 30
    }
  ]
}
```

**Expected Response**:
```
✅ Successfully updated label 'status' on note abc123

📋 Updated attributes:
#status = "completed" [position: 30]
```

## Delete Operations

### 8. Delete a Label

**Use Case**: Remove a priority tag
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

**Expected Response**:
```
✅ Successfully deleted label 'priority' from note abc123
```

### 9. Delete a Template Relation

**Use Case**: Remove template association
```json
{
  "noteId": "abc123",
  "operation": "delete",
  "attributes": [
    {
      "type": "relation",
      "name": "template"
    }
  ]
}
```

**Expected Response**:
```
✅ Successfully deleted relation 'template' from note abc123
```

## Template-Specific Examples

### 10. Calendar Template Setup

**Use Case**: Create a calendar note for project tracking
```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar",
      "position": 10
    },
    {
      "type": "label",
      "name": "project",
      "value": "project-tracking",
      "position: 20
    }
  ]
}
```

### 11. Text Snippet Template

**Use Case**: Create a reusable code snippet
```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Text Snippet",
      "position": 10
    },
    {
      "type": "label",
      "name": "language",
      "value": "javascript",
      "position": 20
    },
    {
      "type": "label",
      "name": "category",
      "value": "utility-functions",
      "position": 30
    }
  ]
}
```

### 12. Grid View Template

**Use Case**: Create a data grid for project overview
```json
{
  "noteId": "abc123",
  "operation": "batch_create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Grid View",
      "position": 10
    },
    {
      "type": "label",
      "name": "view-type",
      "value": "project-grid",
      "position": 20
    }
  ]
}
```

## Error Handling Examples

### 13. Validation Error - Missing Value for Relation

**Request**:
```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "position": 10
    }
  ]
}
```

**Expected Response**:
```
❌ Attribute validation failed
📋 Error details:
1. Relation attributes require a value
```

### 14. Attribute Not Found - Update Error

**Request**:
```json
{
  "noteId": "abc123",
  "operation": "update",
  "attributes": [
    {
      "type": "label",
      "name": "nonexistent",
      "position": 50
    }
  ]
}
```

**Expected Response**:
```
❌ Attribute 'nonexistent' of type 'label' not found on note abc123
📋 Error details:
1. Attribute not found
```

### 15. Permission Error

**Request** (without WRITE permission):
```json
{
  "noteId": "abc123",
  "operation": "create",
  "attributes": [
    {
      "type": "label",
      "name": "test"
    }
  ]
}
```

**Expected Response**:
```
❌ Permission denied: WRITE permission required for attribute management operations
```

## Best Practices

### Performance Tips
1. **Use batch_create** for multiple attributes (30-50% faster than individual calls)
2. **Set appropriate positions** to control display order
3. **Use descriptive label names** for better searchability
4. **Validate template existence** before creating template relations

### Common Patterns
1. **Project Organization**: Use `#project`, `#status`, `#priority` labels
2. **Template Setup**: Always pair template relations with relevant labels
3. **Content Categorization**: Use `#category`, `#language`, `#type` labels
4. **Workflow Management**: Use `#status` with values like `active`, `completed`, `pending`

## Related Documentation

- [Implementation Plan](implementation-plan.md) - Overall design and architecture
- [Enhanced create_note Design](enhanced-create-note-design.md) - Future one-step workflow
- [Note Types Reference](note-types.md) - Supported note types and their uses
- [Tool Definitions](../../src/modules/toolDefinitions.ts) - Complete schema definitions