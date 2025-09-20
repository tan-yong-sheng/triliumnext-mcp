# Basic Search Examples

This guide shows how to call MCP `search_notes`. The function constructs the Trilium search string internally from the provided structured parameters.

---

## Function Contract: search_notes

**Input parameters:**
- `text`: keyword search token (uses Trilium's indexed search)  
- `searchCriteria`: array of structured conditions (labels, relations, note properties, content, hierarchy navigation)  
- `limit`: number of results to return (e.g., 10)

---

## Basic Examples

1) User query: "I want all notes under 'Notes' folder"

**Trilium DSL query:**
```
note.parents.noteId = '<noteId>'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "parents.noteId",
      "type": "noteProperty",
      "op": "=",
      "value": "<noteId>",
      "logic": "AND"
    }
  ]
}
```

2) User query: "Show me notes where the content contains either n8n or google."

**Trilium DSL query:**
```
~(note.content *=* 'n8n' OR note.content *=* 'google')
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "content",
      "type": "noteProperty",
      "op": "contains",
      "value": "n8n",
      "logic": "OR"
    },
    {
      "property": "content",
      "type": "noteProperty",
      "op": "contains",
      "value": "google",
      "logic": "AND"
    }
  ]
}
```

3) User query: "Find all notes created on or after December 13th, 2024."

**Trilium DSL query:**
```
note.dateCreated >= '2024-12-13T00:00:00.000Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2024-12-13T00:00:00.000Z",
      "logic": "AND"
    }
  ]
}
```

4) User query: "Find all notes where the title contains n8n."

**Trilium DSL query:**
```
note.title *=* 'n8n'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "contains",
      "value": "n8n",
      "logic": "AND"
    }
  ]
}
```

5) User query: "Search for notes that were created on or after January 1st, 2024, or are archived."

**Trilium DSL query:**
```
~(note.dateCreated >= '2024-01-01T00:00:00.000Z' OR note.isArchived = true)
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "type": "noteProperty",
      "property": "dateCreated",
      "op": ">=",
      "value": "2024-01-01T00:00:00.000Z",
      "logic": "OR"
    },
    {
      "type": "noteProperty",
      "property": "isArchived",
      "op": "=",
      "value": "true",
      "logic": "AND"
    }
  ]
}
```


6) User query: "Find notes where the title contains meeting, or the content contains agenda, or the note type equals text."

**Trilium DSL query:**
```
~(note.type = 'text' OR note.title *=* 'meeting' OR note.content *=* 'agenda')
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "type": "noteProperty",
      "property": "title",
      "op": "contains",
      "value": "meeting",
      "logic": "OR"
    },
    {
      "type": "noteProperty",
      "property": "content",
      "op": "contains",
      "value": "agenda",
      "logic": "OR"
    },
    {
      "type": "noteProperty",
      "property": "type",
      "op": "=",
      "value": "text"
    }
  ]
}
```

7) User query: "Find notes that mention kubernetes in their text, and were created on or after January 1st, 2024."

**Trilium DSL query:**
```
note.content *=* 'kubernetes' note.dateCreated >= '2024-01-01T00:00:00.000Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "content",
      "type": "noteProperty",
      "op": "contains",
      "value": "kubernetes",
      "logic": "AND"
    },
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

8) User query: "Get the first 50 notes that are direct or indirect children of the root note."

**Trilium DSL query:**
```
note.ancestors.noteId = 'root' limit 50
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "ancestors.noteId",
      "type": "noteProperty",
      "op": "=",
      "value": "root",
      "logic": "AND"
    }
  ],
  "limit": 50
}
```
