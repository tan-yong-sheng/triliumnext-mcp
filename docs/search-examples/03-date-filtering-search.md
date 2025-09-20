# Date Filtering Search Examples

This document covers enhanced date filtering search capabilities.

- **Date properties**: `dateCreated`, `dateModified` - note creation and modification timestamps
- **Supported operators**: `>=`, `<=`, `>`, `<`, `=`, `!=` for comparison operations
- **Required date format**: ISO date strings only - `'YYYY-MM-DDTHH:mm:ss.sssZ'` (e.g., '2024-01-01T00:00:00.000Z')
- **Smart date expressions**: NOT allowed in MCP interface (TriliumNext supports them natively, but MCP enforces ISO format for consistency)

---

1) User query: "Find all notes created on or after December 13th, 2024."

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

2) User query: "Show me notes created in 2024."

**Trilium DSL query:**
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31'
```

**Search Structure**
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01T00:00:00.000Z", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": "<", "value": "2024-12-31T00:00:00.000Z"}
  ]
}
```

3) User query: "Show me notes modified in the last month."

**Trilium DSL query:**
```
note.dateModified > '2025-08-20T10:16:34.349Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "dateModified",
      "type": "noteProperty",
      "op": ">",
      "value": "2025-08-20T10:16:34.349Z",
      "logic": "AND"
    }
  ]
}
```

4) User query: "Show me notes created or modified in the last week."

**Trilium DSL query:**
```
~(note.dateCreated >= '2024-12-13' OR note.dateModified >= '2024-12-13')
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2025-09-13T10:19:36.088Z",
      "logic": "OR"
    },
    {
      "property": "dateModified",
      "type": "noteProperty",
      "op": ">=",
      "value": "2025-09-13T10:19:36.088Z",
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

6) User query: "Find notes that mention kubernetes in their text, and were created on or after January 1st, 2024."

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

7) Show me my notes that are either created after 1 Jan 2024, or have a title starting with 'n8n', or contain the word 'template' in the content.

**Trilium DSL query:**
```
~(note.title =* 'n8n' OR note.content *=* 'template' OR note.dateCreated >= '2024-01-01T00:00:00.000Z')
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
      "logic": "OR"
    },
    {
      "property": "title",
      "type": "noteProperty",
      "op": "starts_with",
      "value": "n8n",
      "logic": "OR"
    },
    {
      "property": "content",
      "type": "noteProperty",
      "op": "contains",
      "value": "template",
      "logic": "AND"
    }
  ]
}
```
