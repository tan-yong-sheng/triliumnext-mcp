# Basic Search Examples

This guide shows how to call MCP `search_notes`. The function constructs the Trilium search string internally from the provided structured parameters.

**Input parameters:**
- `text`: keyword search token (uses Trilium's indexed search)  
- `searchCriteria`: array of structured conditions (labels, relations, note properties, content, hierarchy navigation)  
- `limit`: number of results to return (e.g., 10)

---

## Basic Examples

1) User query: "Show me notes that mention 'hello kitty'."

**Trilium DSL query:**
```
hello kitty
```

**Search Structure:**
```json
{
  "text": "hello kitty"
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

3) User query: "Find all notes where the title contains n8n."

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

3) User query: "Find notes where the title contains meeting, or the content contains agenda, or the note type equals text."

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
