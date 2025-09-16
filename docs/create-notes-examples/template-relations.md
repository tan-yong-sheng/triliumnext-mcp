# TriliumNext MCP - Template Relations Guide

This guide demonstrates how to create and manage template relations in TriliumNext notes using the MCP server. Template relations enable specialized note layouts and functionality like task boards, calendars, and text snippets.

## Overview

Template relations in TriliumNext are created using the `~template` relation type, which connects notes to built-in templates that provide specialized functionality:

### Available Built-in Templates

| Template | Description | Best For | Note Type |
|----------|-------------|----------|-----------|
| **Board** | Task board with kanban-style columns | Project management, task tracking | `book` |
| **Calendar** | Calendar interface with date navigation | Scheduling, event planning, journals | `book` |
| **Text Snippet** | Reusable text snippet management | Code snippets, templates, standard text | `text` |
| **Grid View** | Grid-based layout with customizable cells | Data organization, visual collections | `book` |
| **List View** | List-based layout with filtering | Task lists, inventories, directories | `book` |
| **Table** | Spreadsheet-like table structure | Tabular data, comparisons, specifications | `book` |
| **Geo Map** | Geographic map with location markers | Travel planning, location-based data | `book` |

## Methods for Creating Template Relations

### Method 1: One-Step Creation with `create_note` (Recommended)

The `create_note` tool supports an optional `attributes` parameter that allows you to create template relations in a single operation. **Note**: This functionality was recently fixed to properly handle attribute creation - previous versions may not have worked correctly.

#### Basic Template Relation Creation

```typescript
// Create a Board template note (Task Management)
{
  "parentNoteId": "root",
  "title": "Project Tasks",
  "type": "book",
  "content": [{"type": "text", "content": ""}],
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

```typescript
// Create a Calendar template note (Event Planning)
{
  "parentNoteId": "root",
  "title": "2024 Event Calendar",
  "type": "book",
  "content": [{"type": "text", "content": ""}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar",
      "position": 10
    }
  ]
}
```

#### Template Relations with Labels

```typescript
// Create a Task Board with project labels
{
  "parentNoteId": "root",
  "title": "Development Sprint",
  "type": "book",
  "content": [{"type": "text", "content": ""}],
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
      "value": "Website Redesign",
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

### Method 2: Two-Step Creation with `manage_attributes`

This method allows you to add template relations to existing notes.

#### Step 1: Create the base note

```typescript
// First create a basic book note
{
  "parentNoteId": "root",
  "title": "Code Snippets Library",
  "type": "book",
  "content": [{"type": "text", "content": ""}]
}
```

#### Step 2: Add template relation

```typescript
// Then add the Text Snippet template
{
  "noteId": "created-note-id",
  "operation": "create",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Text Snippet",
      "position": 10
    }
  ]
}
```

### Method 3: Batch Creation with Multiple Templates

Create multiple template relations in a single operation:

```typescript
// Create multiple template relations efficiently
{
  "noteId": "note-id",
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
      "name": "category",
      "value": "project",
      "position": 20
    },
    {
      "type": "label",
      "name": "status",
      "value": "active",
      "position": 30
    }
  ]
}
```

## Complete Examples by Template Type

### 1. Board Template - Project Management

```typescript
// Project Task Board
{
  "parentNoteId": "root",
  "title": "Q4 2024 Project Board",
  "type": "book",
  "content": [{"type": "text", "content": "Project tracking and task management for Q4 2024"}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 10
    },
    {
      "type": "label",
      "name": "quarter",
      "value": "Q4 2024",
      "position": 20
    },
    {
      "type": "label",
      "name": "department",
      "value": "Engineering",
      "position": 30
    }
  ]
}
```

**Result**: Creates a kanban-style task board perfect for project management with columns like "To Do", "In Progress", and "Done".

### 2. Calendar Template - Event Planning

```typescript
// Event Calendar
{
  "parentNoteId": "root",
  "title": "Team Meetings & Events",
  "type": "book",
  "content": [{"type": "text", "content": "Schedule of team meetings, deadlines, and events"}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar",
      "position": 10
    },
    {
      "type": "label",
      "name": "scope",
      "value": "team",
      "position": 20
    },
    {
      "type": "label",
      "name": "year",
      "value": "2024",
      "position": 30
    }
  ]
}
```

**Result**: Creates a calendar interface for managing dates, events, and schedules with month/year navigation.

### 3. Text Snippet Template - Code Library

```typescript
// Code Snippets Collection
{
  "parentNoteId": "root",
  "title": "JavaScript Utility Functions",
  "type": "text",
  "content": [{"type": "text", "content": "Collection of reusable JavaScript utility functions and snippets"}],
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
      "value": "JavaScript",
      "position": 20
    },
    {
      "type": "label",
      "name": "category",
      "value": "utilities",
      "position": 30
    }
  ]
}
```

**Result**: Creates a specialized text snippet note optimized for storing and managing reusable code snippets.

### 4. Grid View Template - Data Organization

```typescript
// Product Comparison Grid
{
  "parentNoteId": "root",
  "title": "Software Tools Comparison",
  "type": "book",
  "content": [{"type": "text", "content": "Comparison grid of different software tools and features"}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Grid View",
      "position": 10
    },
    {
      "type": "label",
      "name": "category",
      "value": "software",
      "position": 20
    },
    {
      "type": "label",
      "name": "purpose",
      "value": "comparison",
      "position": 30
    }
  ]
}
```

**Result**: Creates a grid-based layout perfect for comparing items, features, or data points.

### 5. Table Template - Structured Data

```typescript
// Specification Table
{
  "parentNoteId": "root",
  "title": "API Endpoints Documentation",
  "type": "book",
  "content": [{"type": "text", "content": "Structured documentation of API endpoints and parameters"}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Table",
      "position": 10
    },
    {
      "type": "label",
      "name": "document_type",
      "value": "API",
      "position": 20
    },
    {
      "type": "label",
      "name": "version",
      "value": "v2.0",
      "position": 30
    }
  ]
}
```

**Result**: Creates a spreadsheet-like table structure perfect for structured data, specifications, or documentation.

### 6. Geo Map Template - Location Data

```typescript
// Travel Planning Map
{
  "parentNoteId": "root",
  "title": "European Trip 2024",
  "type": "book",
  "content": [{"type": "text", "content": "Travel itinerary and locations for European trip"}],
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Geo Map",
      "position": 10
    },
    {
      "type": "label",
      "name": "trip_type",
      "value": "vacation",
      "position": 20
    },
    {
      "type": "label",
      "name": "region",
      "value": "Europe",
      "position": 30
    }
  ]
}
```

**Result**: Creates a geographic map interface for planning trips, tracking locations, or managing geographic data.

## Working with Template Relations

### Reading Template Relations

Use the `read_attributes` tool to inspect existing template relations:

```typescript
{
  "noteId": "note-id"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Retrieved 3 attributes for note abc123 (2 labels, 1 relations)",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board",
      "position": 10,
      "isInheritable": false
    },
    {
      "type": "label",
      "name": "project",
      "value": "Q4 Planning",
      "position": 20,
      "isInheritable": false
    }
  ],
  "summary": {
    "total": 3,
    "labels": 2,
    "relations": 1,
    "noteId": "abc123"
  }
}
```

### Updating Template Relations

Use the `manage_attributes` tool with `"update"` operation:

```typescript
{
  "noteId": "note-id",
  "operation": "update",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Calendar", // Change from Board to Calendar
      "position": 10
    }
  ]
}
```

### Deleting Template Relations

```typescript
{
  "noteId": "note-id",
  "operation": "delete",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board"
    }
  ]
}
```

## Best Practices

### 1. Choose the Right Template
- **Board**: Best for task management and project tracking
- **Calendar**: Ideal for time-based data and scheduling
- **Text Snippet**: Perfect for code libraries and template text
- **Grid View**: Great for visual comparisons and data organization
- **Table**: Best for structured data and specifications
- **Geo Map**: Ideal for location-based planning and tracking

### 2. Combine with Labels
Always add relevant labels to help with organization and search:

```typescript
// Good practice: Template + descriptive labels
{
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board"
    },
    {
      "type": "label",
      "name": "project",
      "value": "Website Redesign"
    },
    {
      "type": "label",
      "name": "status",
      "value": "active"
    }
  ]
}
```

### 3. Use Appropriate Note Types
- **Book notes**: Best for Board, Calendar, Grid View, Table, and Geo Map templates
- **Text notes**: Best for Text Snippet templates
- **Content**: Can be empty for container templates or include descriptive text

### 4. Position Management
Use position numbers to control the order of attributes (lower numbers appear first):

```typescript
// Template relation typically comes first
{
  "type": "relation",
  "name": "template",
  "value": "Board",
  "position": 10  // Early position
}
```

## Performance Considerations

### One-Step vs Two-Step Creation
- **One-Step (Recommended)**: Use `create_note` with `attributes` parameter for 30-50% better performance
- **Two-Step**: Use when adding templates to existing notes or when you need more control

### Batch Operations
When creating multiple notes with templates, use batch creation where possible:

```typescript
// Efficient batch creation
{
  "operation": "batch_create",
  "attributes": [
    // Multiple attributes created in parallel
  ]
}
```

## Troubleshooting

### Common Issues

**Attributes Not Created with create_note**
- **Fixed in latest version**: The `create_note` function was using incorrect API endpoint
- **Solution**: Update to latest version and ensure `/attributes` endpoint is used (not `/notes/${noteId}/attributes`)
- **Verification**: Enable `VERBOSE=true` to see attribute creation logs

**Template Not Found**
- Ensure template name exactly matches: "Board", "Calendar", "Text Snippet", etc.
- Check capitalization - template names are case-sensitive

**Permission Errors**
- Verify WRITE permission is enabled
- Check that you have proper API access

**Attribute Creation Fails**
- Ensure note exists before adding attributes
- Verify attribute structure is correct
- Check for duplicate template relations

### Debug Template Relations

1. **Check existing attributes**: Use `read_attributes` to see current template relations
2. **Verify template names**: Use exact built-in template names
3. **Test with simple cases**: Start with basic template creation before adding complexity

## Searching for Template Relations

Use the `search_notes` tool to find notes with specific templates:

```typescript
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "Board"
    }
  ]
}
```

This allows you to find all Board template notes, all Calendar notes, etc.

## Advanced Usage

### Combining Templates with Other Relations

```typescript
// Template relations can coexist with other relation types
{
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "value": "Board"
    },
    {
      "type": "relation",
      "name": "author",
      "value": "John Doe"
    },
    {
      "type": "relation",
      "name": "publisher",
      "value": "Engineering Team"
    }
  ]
}
```

### Inheritable Template Relations

```typescript
// Make template relation inheritable by child notes
{
  "type": "relation",
  "name": "template",
  "value": "Board",
  "isInheritable": true,  // Child notes inherit this template
  "position": 10
}
```

## Conclusion

Template relations provide powerful functionality for creating specialized note types in TriliumNext. By using the `create_note` tool with the `attributes` parameter, you can efficiently create notes with template relations in a single operation. This approach provides better performance and a cleaner workflow compared to the traditional two-step process.

The key to success with template relations is:
1. **Choose the right template** for your use case
2. **Combine with labels** for better organization
3. **Use one-step creation** for better performance
4. **Follow naming conventions** for built-in templates

## Related Documentation

- [Simplified Interface Guide](simplified-interface-guide.md) - Using `buildNoteParams` helper
- [Note Types Reference](note-types.md) - Complete list of supported note types
- [User Query Examples](../user-query-examples.md) - Common usage patterns
- [Search Examples](../search-query-examples.md) - Advanced search techniques