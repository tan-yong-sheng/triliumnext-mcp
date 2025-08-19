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
- "Show me what's in my 'n8n' note folder " → Uses `list_child_notes` with specific parentNoteId
- "What are the direct children of this note?" → `list_child_notes` for immediate children only
- "Show me everything I have" → Uses `list_descendant_notes` to recursively list all notes
- "Find all notes" → Uses `list_descendant_notes` with parentNoteId for subtree search

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

### When AI Should Use list_child_notes
- User asks for "direct children", "immediate children", "what's in this folder"
- Browsing/navigation scenarios
- When user wants to see folder structure (like `ls` command in Unix)

### When AI Should Use list_descendant_notes  
- User asks for "everything", "all notes"
- Discovery and bulk operations
- When user wants comprehensive search (like `find` command in Unix)

### When AI Should Use append_note
- User says "add", "append", "include", "attach"
- Preserving existing content is important
- Incremental updates (logs, journals, progress notes)

### When AI Should Use update_note
- User says "replace", "update", "rewrite", "change entirely"
- Complete content replacement needed
- Major document revisions

### Search Tool Selection
- Use `search_notes` for both simple keyword searches and advanced filtering
- `search_notes` automatically optimizes performance based on query complexity

## search_notes Parameters Guide

The `search_notes` function is the unified search tool with these key parameters:

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