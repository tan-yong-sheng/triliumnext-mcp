# Search Operators Guide

This guide shows how to use search operators in MCP `search_notes`. The function constructs the Trilium search string internally from the provided structured parameters.

**Available operators:**
- `exists`, `not_exists` - property existence
- `=`, `!=` - exact match/exclude
- `>=`, `<=`, `>`, `<` - numeric/date comparisons
- `contains`, `starts_with`, `ends_with` - text matching
- `regex` - regular expressions

---

1) User query: "Find all notes with the #collection label."

Search operator involved: `exists`

**Trilium DSL query:**
```
#collection
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "book",
      "type": "label",
      "op": "exists",
      "logic": "AND"
    }
  ]
}
```

2) User query: "Find notes that are NOT archived."

Search operator involved: `!=`

**Trilium DSL query:**
```
note.isArchived != true
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "isArchived",
      "type": "noteProperty",
      "op": "!=",
      "value": "true",
      "logic": "AND"
    }
  ]
}
```

3) User query: "Find notes created on or after January 1, 2024."

Search operator involved: `>=`

**Trilium DSL query:**
```
note.dateCreated >= '2024-01-01T00:00:00.000Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2024-01-01T00:00:00.000Z",
      "logic": "AND"
    }
  ]
}
```

4) User query: "Find notes whose titles start with 'Meeting'."

Search operator involved: `starts_with`

**Trilium DSL query:**
```
note.title =* 'Meeting'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "starts_with",
      "value": "Meeting",
      "logic": "AND"
    }
  ]
}
```

5) User query: "Show me all the notes that have the status label set to In Progress and were created after June 2024?"

Search operator involved: `=`, `>=`

**Trilium DSL query:**
```
note.parents.title = 'Projects' AND #status = 'In Progress' AND note.dateCreated >= '2024-06-01T00:00:00.000Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "status",
      "type": "label",
      "op": "=",
      "value": "In Progress",
      "logic": "AND"
    },
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2024-06-01T00:00:00.000Z",
      "logic": "AND"
    }
  ]
}
```

6) User query: "Find notes containing email address in the content."

Search operator involved: `regex`

**Trilium DSL query:**
```
note.content %= '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "content",
      "type": "noteProperty",
      "op": "regex",
      "value": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      "logic": "AND"
    }
  ]
}
```

7) User query: "Search all notes containing URLs in the content."

**Trilium DSL query:**
```
note.content %= 'https?://[a-zA-Z0-9.-]+.[a-zA-Z]{2,}'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "content",
      "type": "noteProperty",
      "op": "regex",
      "value": "https?://[a-zA-Z0-9.-]+.[a-zA-Z]{2,}",
      "logic": "AND"
    }
  ]
}
```

---

## Key Notes

- **exists vs !=**: `exists` finds notes WITHOUT property, `!=` finds notes WITH property but excluding values
- **Text operators**: `contains`, `starts_with`, `ends_with`, `regex` work only with text properties
- **Numeric operators**: `>=`, `<=`, `>`, `<` work with dates and numbers
- **Universal operators**: `exists`, `not_exists`, `=`, `!=` work with all property types
