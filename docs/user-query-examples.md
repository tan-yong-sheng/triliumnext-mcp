# User Query Examples

This document provides examples of natural language queries that demonstrate how to use the TriliumNext MCP server effectively.

## Search and Discovery

### Basic Search Queries
- "Find my most recent 10 notes about 'n8n' since the beginning of 2020"
- "Show me notes I've edited in the last 7 days"
- "What are the 5 most recently modified notes about 'docker' from last year?"
- "Find notes created in the last week"
- "Search for 'kubernetes' in notes created between January and June of this year"
- "List all notes I worked on in the last week, either created or modified"

### Advanced Search Queries
- "Find notes with 'machine learning' in the title created this year"
- "Show me notes containing 'API' that were modified in the last month"
- "Search for notes with 'project' in the title and 'deadline' in the content"

## Note Navigation and Browsing

### Hierarchical Navigation
- "List all notes" → Uses `list_child_notes` with parentNoteId="root" to show top-level notes
- "Show me what's in my project folder" → Uses `list_child_notes` with specific parentNoteId
- "Browse my note hierarchy" → Uses `list_child_notes` for directory-style navigation
- "What are the direct children of this note?" → `list_child_notes` for immediate children only

### Complete Note Inventory
- "Show me everything I have" → Uses `list_descendant_notes` to recursively list all notes
- "Find all notes in my project" → Uses `list_descendant_notes` with parentNoteId for subtree search
- "Get complete note inventory" → Uses `list_descendant_notes` for bulk operations and analysis
- "List every note in the database" → `list_descendant_notes` for comprehensive overview

## Content Modification Examples

### Content Addition (append_note)
- "Add today's progress to my work log"
- "Append this meeting summary to my notes"
- "Add a new entry to my journal"
- "Include this update in my project notes"
- "Attach this code snippet to my development log"

### Content Replacement (update_note)
- "Update my project plan with this new version"
- "Replace the entire document with this new content"
- "Rewrite this note with the corrected information"
- "Update the entire specification document"
- "Replace my draft with the final version"

### Content Retrieval (get_note)
- "Show me the content of note ABC123"
- "What's in my meeting notes from yesterday?"
- "Display the full content of my project plan"

### Note Creation (create_note)
- "Create a new note called 'Weekly Review' in my journal folder"
- "Make a new code note with this Python script"
- "Add a new text note about the client meeting"

### Note Management (delete_note)
- "Delete this old draft note" (⚠️ Permanent operation)
- "Remove the test note I created" (⚠️ Cannot be undone)

## Function Selection Guide

### When AI Should Use list_child_notes
- User asks for "direct children", "immediate children", "what's in this folder"
- Browsing/navigation scenarios
- When user wants to see folder structure (like `ls` command)

### When AI Should Use list_descendant_notes  
- User asks for "everything", "all notes", "complete inventory"
- Discovery and bulk operations
- When user wants comprehensive search (like `find` command)

### When AI Should Use append_note
- User says "add", "append", "include", "attach"
- Preserving existing content is important
- Incremental updates (logs, journals, progress notes)

### When AI Should Use update_note
- User says "replace", "update", "rewrite", "change entirely"
- Complete content replacement needed
- Major document revisions

### Search Tool Selection
- Use `search_notes` for simple keyword searches
- Use `search_notes_advanced` for date ranges, field-specific searches, or complex queries

## search_notes_advanced Parameters Guide

The `search_notes_advanced` function is the most powerful search tool with these key parameters:

### Keyword Search
- **keyword**: Basic text search across all note content
- Example: `"machine learning"`, `"docker"`, `"API integration"`

### Title Filtering
- **title**: Search specifically in note titles
- Operators: `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=)
- Example: Title contains "project", title starts with "2024-"

### Content Filtering  
- **content**: Search specifically in note body content
- Same operators as title filtering
- Example: Content contains "kubernetes", content not equal to "draft"

### Date Filtering
- **dateModified**: Filter by last modification date
- **dateCreated**: Filter by note creation date
- Format: ISO date strings (YYYY-MM-DD) with operators
- Operators: `>=` (after), `<=` (before), `=` (exact date)
- Example: Modified after "2024-01-01", created before "2023-12-31"

### Common LLM Parameter Combinations
```
keyword: "docker" + dateModified >= "2024-01-01"
title contains "meeting" + dateCreated >= "2024-08-01"  
content contains "API" + title starts_with "Project"
dateModified >= "2024-08-15" + dateModified <= "2024-08-19"
```

These parameters can be combined to create precise searches that match user intent more accurately than simple keyword searches.