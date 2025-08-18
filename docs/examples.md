# MCP Search Examples & Usage Guide (Advanced Params)

This guide shows how to call MCP `search_notes_advanced` using structured parameters. The wrapper constructs the Trilium search string internally and passes it as `query` to the underlying `search_notes` function.

---

## Wrapper Contract: search_notes_advanced

Input parameters:
- created_date_start: string (ISO date, e.g., '2024-01-01')
- created_date_end: string (ISO date, exclusive upper bound, e.g., '2024-12-31')
- modified_date_start: string (ISO date)
- modified_date_end: string (ISO date, exclusive upper bound)
- text: string (full-text search token, uses Trilium's indexed search)
- searchFields: { content: string, title: string } (substring search using *=* operator)
- limit: number (max results to return, e.g., 10)
- includeArchivedNotes?: boolean

Query composition:
- created: [`note.dateCreated >= <start>`, `note.dateCreated < <end>`]
- modified: [`note.dateModified >= <start>`, `note.dateModified < <end>`]
- text: `<token>` (bare token for full-text search)
- searchFields: [`note.content *=* '<term>'`, `note.title *=* '<term>'`] (OR between fields)
- limit: `limit <number>` (appended to query)
- Final query: join groups with AND, date groups with OR if both present, then append limit
- Always calls underlying search_notes with fastSearch=false

**Important distinction:**
- `text`: Full-text indexed search (faster, finds whole words/tokens)
- `searchFields`: Substring search with *=* operator (slower, finds partial matches)
- Original `search_notes`: Always use fastSearch=true for basic queries
- New `search_notes_advanced`: Always use fastSearch=false for content search

---

## Examples

### 1) Created in last 7 days
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
  "fastSearch": false,
  "includeArchivedNotes": false
}
```
- Composed query
```
note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18'
```
- MCP call
```js
search_notes_advanced({ 
  created_date_start: "2024-08-11",
  created_date_end: "2024-08-18",
  includeArchivedNotes: false 
})
// Internally calls: search_notes({ query: "note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18'", fastSearch: false, includeArchivedNotes: false })
```

### 2) Modified in last 7 days
- Params
```json
{
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18"
}
```
- Composed query
```
note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18'
```
- MCP call
```js
search_notes({ 
  query: "note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18'", 
  fastSearch: false 
})
```

### 3) Created OR modified in last 7 days
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18"
}
```
- Composed query
```
(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')
```
- MCP call
```js
search_notes({ 
  query: "(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')", 
  fastSearch: false 
})
```

### 4) Created between 2024 and 2025
- Params
```json
{
  "created_date_start": "2024-01-01",
  "created_date_end": "2026-01-01"
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2026-01-01'
```
- MCP call
```js
search_notes({ query: "note.dateCreated >= '2024-01-01' AND note.dateCreated < '2026-01-01'" })
```

---

## Full-Text + Date Logic (AND/OR)

### 5) Created in last year AND full-text search "kubernetes"
- Params
```json
{
  "created_date_start": "2023-08-18",
  "created_date_end": "2024-08-18",
  "text": "kubernetes",
  "fastSearch": false
}
```
- Composed query
```
kubernetes note.dateCreated >= '2023-08-18' AND note.dateCreated < '2024-08-18'
```
- MCP call
```js
search_notes({ 
  query: "kubernetes note.dateCreated >= '2023-08-18' AND note.dateCreated < '2024-08-18'", 
  fastSearch: false 
})
```

### 6) Created in last year AND contains "n8n" substring in content/title
- Params
```json
{
  "created_date_start": "2023-08-18",
  "created_date_end": "2024-08-18",
  "searchFields": { "content": "n8n", "title": "n8n" },
  "fastSearch": false
}
```
- Composed query
```
note.dateCreated >= '2023-08-18' AND note.dateCreated < '2024-08-18' AND (note.content *=* 'n8n' OR note.title *=* 'n8n')
```
- MCP call
```js
search_notes({ 
  query: "note.dateCreated >= '2023-08-18' AND note.dateCreated < '2025-08-18' AND (note.content *=* 'n8n' OR note.title *=* 'n8n')", 
  fastSearch: false 
})
```

### 7) Modified in last 7 days AND contains "kubernetes" in content only
- Params
```json
{
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18",
  "searchFields": { "content": "kubernetes" },
  "fastSearch": false
}
```
- Composed query
```
note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.content *=* 'kubernetes'
```
- MCP call
```js
search_notes({ 
  query: "note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.content *=* 'kubernetes'", 
  fastSearch: false 
})
```

### 8) Created between 2024 and 2025 AND title contains "Docker"
- Params
```json
{
  "created_date_start": "2024-01-01",
  "created_date_end": "2026-01-01",
  "searchFields": { "title": "Docker" }
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2026-01-01' AND note.title *=* 'Docker'
```
- MCP call
```js
search_notes({ 
  query: "note.dateCreated >= '2024-01-01' AND note.dateCreated < '2026-01-01' AND note.title *=* 'Docker'", 
  fastSearch: false 
})
```

### 9) Created or modified in last 7 days AND title contains keyword: 'deployment'
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18",
  "searchFields": { "title": "deployment" }
}
```
- Composed query
```
note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.title *=* 'deployment'
```
- MCP call
```js
search_notes({ 
  query: "note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.title *=* 'deployment'", 
  fastSearch: false 
})
```

### 10) Created or modified in last 7 days AND content contains keyword: 'deployment'
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18",
  "searchFields": { "content": "deployment" }
}
```
- Composed query
```
note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.content *=* 'deployment'
```
- MCP call
```js
search_notes({ 
  query: "note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.content *=* 'deployment'", 
  fastSearch: false 
})
```


### 11) Created or modified in last 7 days AND both title OR content contains keyword: 'deployment'
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
  "modified_date_start": "2024-08-11",
  "modified_date_end": "2024-08-18",
  "searchFields": { "title": "deployment", "content": "deployment" }
}
```
- Composed query
```
note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND (note.title *=* 'deployment' OR note.content *=* 'deployment')
```
- MCP call
```js
search_notes({ 
  query: "note.dateCreated >= '2024-08-11' AND note.dateCreated < '2025-08-18' AND note.dateModified >= '2024-08-11' AND note.dateModified < '2025-08-18' AND note.content *=* 'deployment'", 
  fastSearch: false 
})
```


### 12) Full-text search with limit
- Params
```json
{
  "text": "kubernetes",
  "limit": 5
}
```
- Composed query
```
kubernetes limit 5
```
- MCP call
```js
search_notes_advanced({ 
  text: "kubernetes",
  limit: 5
})
// Internally calls: search_notes({ query: "kubernetes limit 5", fastSearch: false })
```

---

## Notes
- `search_notes_advanced` always sets fastSearch=false internally for proper content search.
- Original `search_notes` should use fastSearch=true for basic queries.
- Quote search terms to handle special characters properly.
- Always use *=* (contains) operator for searchFields.
- Always use parentheses for OR statements to avoid precedence errors.
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `searchFields` parameter: Substring search with *=* operator (slower, more precise)
- Multiple searchFields are joined with OR within the text group.