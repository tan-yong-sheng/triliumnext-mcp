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

The `create_note` tool supports an optional `attributes` parameter that allows you to create template relations in a single operation. This is the most efficient method.

#### Basic Template Relation Creation

```json
// Create a Board template note (Task Management)
{
  "parentNoteId": "root",
  "title": "Project Tasks",
  "type": "book",
  "content": "<p>A board for managing project tasks.</p>",
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

```json
// Create a Calendar template note (Event Planning)
{
  "parentNoteId": "root",
  "title": "2024 Event Calendar",
  "type": "book",
  "content": "",
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

```json
// Create a Task Board with project labels
{
  "parentNoteId": "root",
  "title": "Development Sprint",
  "type": "book",
  "content": "",
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

```json
// First create a basic book note
{
  "parentNoteId": "root",
  "title": "Code Snippets Library",
  "type": "book",
  "content": ""
}
```

#### Step 2: Add template relation

```json
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

## Working with Template Relations

### Reading Template Relations

Use the `read_attributes` tool to inspect existing template relations:

```json
{
  "noteId": "note-id"
}
```

### Updating Template Relations

Use the `manage_attributes` tool with the `"update"` operation. Note that for relations, only the `position` can be updated. To change the `value`, you must delete and recreate the relation.

```json
{
  "noteId": "note-id",
  "operation": "update",
  "attributes": [
    {
      "type": "relation",
      "name": "template",
      "position": 5 // Change position
    }
  ]
}
```

### Deleting Template Relations

```json
{
  "noteId": "note-id",
  "operation": "delete",
  "attributes": [
    {
      "type": "relation",
      "name": "template"
    }
  ]
}
```

## Best Practices

1.  **Choose the Right Template**: Match the template to your content and organizational needs.
2.  **Combine with Labels**: Add descriptive labels alongside template relations for better searchability.
3.  **Use Appropriate Note Types**: `book` notes are best for most container-like templates (Board, Calendar, etc.), while `text` notes are suitable for `Text Snippet`.
4.  **Use One-Step Creation**: Using the `attributes` parameter in `create_note` is 30-50% more performant than creating the note and then adding attributes in a separate step.
