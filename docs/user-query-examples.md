# User Query Examples

This document provides examples of natural language queries that demonstrate how to use the TriliumNext MCP server effectively with the new unified search architecture.

## Modern Search Architecture

### Unified searchCriteria Structure
- **Complete boolean logic**: Cross-type OR/AND operations between labels, relations, note properties, and hierarchy navigation
- **Single array structure**: Unified `searchCriteria` parameter for maximum expressiveness
- **Type indicators**: Each criterion specifies `type` ("label", "relation", "noteProperty", "fulltext")
- **Per-item logic**: Each criterion can specify `logic: "OR"` to combine with the next item

### Tool Selection Guide
- **`list_notes`**: Simple hierarchy navigation and browsing (preferred for navigation)
- **`search_notes`**: Complex filtering with unified boolean logic (preferred for advanced queries)
- **`resolve_note_id`**: Convert note names to IDs for LLM workflows

## Search and Discovery

### Basic Search Queries
- "Find my most recent 10 notes about 'n8n' since the beginning of 2020"
- "Show me notes I've edited in the last 7 days"
- "What are the 5 most recently modified notes about 'docker' from last year?"
- "Find notes created in the last week"
- "Search for 'kubernetes' in notes created between January and June of this year"
- "List all notes I worked on in the last week, either created or modified"

### Advanced Search Queries (Using Unified searchCriteria)
- "Find notes with 'machine learning' in the title created this year" → Uses `search_notes` with unified `searchCriteria`
- "Show me notes containing 'API' that were modified in the last month" → Uses `search_notes` with date properties
- "Search for notes with 'project' in the title and 'deadline' in the content" → Uses `search_notes` with multiple noteProperty criteria
- "Find books by Tolkien OR notes created this week" → Uses `search_notes` with cross-type OR logic between labels and date properties
- "Search for notes with #book label AND ~author relation" → Uses `search_notes` with mixed attribute types

## Note Navigation and Browsing

### Hierarchical Navigation (Using list_notes)
- "Show me what's in my 'n8n' note folder" → Uses `list_notes` with `hierarchyType='children'` and specific `parentNoteId`
- "What are the direct children of this note?" → `list_notes` with `hierarchyType='children'` for immediate children only
- "Show me everything I have" → Uses `list_notes` with `hierarchyType='descendants'` to recursively list all notes
- "Find all notes under workspace folder" → Uses `list_notes` with `hierarchyType='descendants'` and specific `parentNoteId`

### Complex Navigation with Search (Using search_notes)
- "Find notes under 'Projects' folder that contain 'API'" → Uses `search_notes` with hierarchy navigation in `searchCriteria`
- "Show notes with parent 'Active Tasks' OR ancestor 'Archive'" → Uses `search_notes` with OR logic between hierarchy criteria

## Content Modification Examples (Exprimental)

### Content Addition (append_note)
- "Add today's progress to my work log" 
- "Append this meeting summary to my notes" 

### Content Replacement (update_note)
- "Update my project plan with this new version"
- "Rewrite this note with the corrected information"

### Content Retrieval (get_note)
- "Show me the content of note ABC123"

### Note Creation (create_note)
- "Create a new note called 'Weekly Review' in my journal folder"

### Note Management (delete_note)
- "Delete this old draft note named 'n8n Templates'" (⚠️ Permanent operation)

## Function Selection Guide (for Developer)

### When AI Should Use list_notes
- User asks for "direct children", "immediate children", "what's in this folder"
- Simple browsing/navigation scenarios without complex filtering
- Folder structure exploration (like `ls` command in Unix)
- Complete note inventory (with `parentNoteId='root'` and `hierarchyType='descendants'`)

### When AI Should Use search_notes
- Complex queries requiring boolean logic between multiple criteria types
- Cross-type OR operations (e.g., "books by Tolkien OR notes created this week")
- Advanced filtering with labels, relations, and note properties
- When sophisticated search criteria are needed beyond simple hierarchy navigation

### When AI Should Use resolve_note_id
- User provides note names instead of IDs (e.g., "update the 'project planning' note")
- Need to find note ID before using other tools
- Fuzzy matching when exact note names are uncertain

### When AI Should Use append_note
- User says "add", "append", "include", "attach"
- Preserving existing content is important
- Incremental updates (logs, journals, progress notes)

### When AI Should Use update_note
- User says "replace", "update", "rewrite", "change entirely"
- Complete content replacement needed
- Major document revisions

### Search Tool Selection
- Use `list_notes` for simple hierarchy navigation and browsing
- Use `search_notes` for complex queries with unified `searchCriteria` structure
- Use `resolve_note_id` when users provide note names instead of IDs
- `search_notes` automatically optimizes performance based on query complexity

## Unified searchCriteria Parameters Guide

The `search_notes` function uses a unified `searchCriteria` array with these key parameters:

### SearchCriteria Object Structure
```json
{
  "property": "string",     // Property name (book, author, title, content, dateCreated, etc.)
  "type": "string",         // Type: "label", "relation", "noteProperty", "fulltext"
  "op": "string",           // Operator: exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with, regex
  "value": "string",        // Value to compare against (optional for exists)
  "logic": "string"         // Logic operator: "AND" or "OR" (combines with NEXT item)
}
```

### Type Reference
- **"label"**: User-defined labels (#book, #author) - user-defined tags and categories
- **"relation"**: User-defined relations (~author.title, ~template.title) - connections between notes
- **"noteProperty"**: System properties (isArchived, type, dateCreated, title, content, hierarchy navigation)
- **"fulltext"**: Full-text search tokens (alternative to text parameter)

### Cross-Type Boolean Logic Examples
```json
// Books by Tolkien OR notes created this week
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien", "logic": "OR"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```

## Practical Examples: Before vs After Architecture

### Simple Navigation (Use list_notes)
**Dedicated tool**: `list_notes` with navigation-specific parameters

```json
// List direct children of a folder
{
  "parentNoteId": "abc123",
  "hierarchyType": "children",
  "limit": 20
}
```

### Complex Search (Use search_notes with unified searchCriteria)
**Current Architecture**: Unified `searchCriteria` array with complete boolean expressiveness

```json
// Find notes that are either: books by Tolkien OR recent tutorials with steps
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "tutorial", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-11-01", "logic": "AND"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "steps"}
  ]
}
```

### Note ID Resolution (Use resolve_note_id)
**New capability**: Convert user-provided note names to IDs

```json
// Find note ID when user says "update my project planning note"
{
  "noteName": "project planning",
  "exactMatch": false,
  "maxResults": 3
}
```