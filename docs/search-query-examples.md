# MCP Search Examples & Usage Guide (Advanced Params)

It's underlying principle for building search rule string at: src\modules\searchQueryBuilder.ts, with reference to the Trilium Note's documentation: https://triliumnext.github.io/Docs/Wiki/search.html

This guide shows how to call MCP `search_notes_advanced` using structured parameters. The wrapper constructs the Trilium search string internally and passes it as `query` to the underlying `search_notes` function.

---

## Wrapper Contract: search_notes_advanced

Input parameters:
- created_date_start: string (ISO date, e.g., '2024-01-01')
- created_date_end: string (ISO date, exclusive upper bound, e.g., '2024-12-31')
- modified_date_start: string (ISO date)
- modified_date_end: string (ISO date, exclusive upper bound)
- text: string (full-text search token, uses Trilium's indexed search)
- limit: number (max results to return, e.g., 10)
- includeArchivedNotes?: boolean

Query composition:
- created: [`note.dateCreated >= <start>`, `note.dateCreated < <end>`]
- modified: [`note.dateModified >= <start>`, `note.dateModified < <end>`]
- text: `<token>` (bare token for full-text search)
- limit: `limit <number>` (appended to query)
- Final query: join groups with AND, date groups with OR if both present, then append limit

**Important distinction:**
- `text`: Full-text indexed search (faster, finds whole words/tokens)

---

## Examples

### 1) Created in last 7 days
- Params
```json
{
  "created_date_start": "2024-08-11",
  "created_date_end": "2024-08-18",
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
// Internally calls: search_notes({ query: "note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18'", includeArchivedNotes: false })
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
  query: "note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18'"
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
~(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')
```
- **Note**: The `~` prefix is required by Trilium when expressions start with parentheses
- MCP call
```js
search_notes({ 
  query: "~(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')"
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
  "text": "kubernetes"
}
```
- Composed query
```
kubernetes note.dateCreated >= '2023-08-18' AND note.dateCreated < '2024-08-18'
```
- MCP call
```js
search_notes({ 
  query: "kubernetes note.dateCreated >= '2023-08-18' AND note.dateCreated < '2024-08-18'"
})
```

### 6) Full-text search with limit
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
// Internally calls: search_notes({ query: "kubernetes limit 5" })
```

### 7) Search "n8n" notes created since 2020, ordered by creation date descending, limit 10
- Params
```json
{
  "text": "n8n",
  "created_date_start": "2020-01-01",
  "orderBy": "note.dateCreated desc",
  "limit": 10
}
```
- Composed query
```
n8n note.dateCreated >= '2020-01-01' orderBy note.dateCreated desc limit 10
```
- MCP call
```js
search_notes_advanced({ 
  text: "n8n",
  created_date_start: "2020-01-01",
  orderBy: "note.dateCreated desc",
  limit: 10
})
// Internally calls: search_notes({ query: "n8n note.dateCreated >= '2020-01-01' orderBy note.dateCreated desc limit 10" })
```

### 8) ❌ INVALID: Search "n8n" with orderBy but no date filter (orderBy will be skipped)
- Params
```json
{
  "text": "n8n",
  "orderBy": "note.dateCreated desc",
  "limit": 10
}
```
- Composed query (orderBy skipped due to validation)
```
n8n limit 10
```
- Explanation: orderBy field `note.dateCreated` not found in filters, so orderBy is ignored
- MCP call
```js
search_notes_advanced({ 
  text: "n8n",
  orderBy: "note.dateCreated desc",
  limit: 10
})
// Internally calls: search_notes({ query: "n8n limit 10" })
// orderBy skipped because note.dateCreated not used as filter
```

### 9) Search "docker" notes modified in last year, ordered by modification date descending
- Params
```json
{
  "text": "docker",
  "modified_date_start": "2023-08-18",
  "modified_date_end": "2024-08-18",
  "orderBy": "note.dateModified desc",
  "limit": 5
}
```
- Composed query
```
docker note.dateModified >= '2023-08-18' AND note.dateModified < '2024-08-18' orderBy note.dateModified desc limit 5
```
- MCP call
```js
search_notes_advanced({ 
  text: "docker",
  modified_date_start: "2023-08-18",
  modified_date_end: "2024-08-18",
  orderBy: "note.dateModified desc",
  limit: 5
})
```

### 10) Search notes created since 2024, ordered by creation date ascending
- Params
```json
{
  "created_date_start": "2024-01-01",
  "orderBy": "note.dateCreated asc",
  "limit": 15
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' orderBy note.dateCreated asc limit 15
```
- MCP call
```js
search_notes_advanced({ 
  created_date_start: "2024-01-01",
  orderBy: "note.dateCreated asc",
  limit: 15
})
```

### 11) Search notes modified since 2024, ordered by modification date ascending
- Params
```json
{
  "modified_date_start": "2024-01-01",
  "orderBy": "note.dateModified asc",
  "limit": 20
}
```
- Composed query
```
note.dateModified >= '2024-01-01' orderBy note.dateModified asc limit 20
```
- MCP call
```js
search_notes_advanced({ 
  modified_date_start: "2024-01-01",
  orderBy: "note.dateModified asc", 
  limit: 20
})
```

---

## Advanced Field-Specific Search Examples

These examples demonstrate advanced field-specific operators for title and content search. These provide more precise control than basic full-text search.

### Field Operators Reference
- `*=*` : contains substring
- `*=` : ends with
- `=*` : starts with
- `!=` : not equal to

### 12) Title contains "Tolkien"
- Composed query
```
note.title *=* 'Tolkien'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "contains", "value": "Tolkien" }
  ]
}
```
- Use case: Find notes whose title contains "Tolkien" anywhere

### 13) Title starts with "Project"
- Composed query
```
note.title =* 'Project'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Project" }
  ]
}
```
- Use case: Find all project-related notes by title prefix

### 14) Title ends with "Notes"
- Composed query
```
note.title *= 'Notes'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "ends_with", "value": "Notes" }
  ]
}
```
- Use case: Find all documents ending with "Notes"

### 15) Title does not contain "Backup"
- Composed query
```
note.title != 'Backup'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "not_equal", "value": "Backup" }
  ]
}
```
- Use case: Exclude backup-related notes from results

### 16) Content contains "dead letter"
- Composed query
```
note.content *=* 'dead letter'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "content", "op": "contains", "value": "dead letter" }
  ]
}
```
- Use case: Find notes discussing dead letter patterns/queues

### 17) Complex multi-field search: Title starts with "Meeting" AND content contains "agenda"
- Composed query
```
note.title =* 'Meeting' AND note.content *=* 'agenda'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Meeting" },
    { "field": "content", "op": "contains", "value": "agenda" }
  ]
}
```
- Use case: Find meeting notes that contain agenda items

### 18) Advanced combination: Full-text + field filters + date range
- Composed query
```
note.dateCreated >= '2024-01-01' AND setup guide note.title =* 'Tutorial' AND note.content *=* 'steps'
```
- JSON structure for future filters parameter
```json
{
  "text": "setup guide",
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Tutorial" },
    { "field": "content", "op": "contains", "value": "steps" }
  ],
  "created_date_start": "2024-01-01"
}
```
- Use case: Find recent tutorial guides with step-by-step instructions

### 19) Exclude temporary files: Title does not end with "Temp"
- Composed query
```
NOT note.title *= 'Temp'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "not_ends_with", "value": "Temp" }
  ]
}
```
- Use case: Filter out all temporary files from search results

### 20) Combined search: Notes about "Tolkien" with specific title patterns
- Composed query
```
Tolkien note.title *=* 'Lord' AND note.content != 'Incomplete'
```
- JSON structure for future filters parameter
```json
{
  "text": "Tolkien",
  "filters": [
    { "field": "title", "op": "contains", "value": "Lord" },
    { "field": "content", "op": "not_equal", "value": "Incomplete" }
  ]
}
```
- Use case: Find complete Tolkien notes mentioning "Lord" in title

### 21) Complex business logic: Documentation that's not outdated
- Composed query
```
documentation note.title =* 'Guide' AND note.content *=* 'instructions' AND NOT note.content *=* 'outdated'
```
- JSON structure for future filters parameter
```json
{
  "text": "documentation",
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Guide" },
    { "field": "content", "op": "contains", "value": "instructions" },
    { "field": "content", "op": "not_contains", "value": "outdated" }
  ]
}
```
- Use case: Find current (non-outdated) documentation guides

---

## Notes
- Quote search terms to handle special characters properly.
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `orderBy` parameter: Sort results by specified field and direction (asc/desc)  
- **Important**: orderBy field must also be used as a filter in the query
- Valid orderBy examples: `note.dateCreated desc`, `note.dateModified asc`
- The searchQueryBuilder validates that orderBy fields are present in filters
- **Field operators**: Use `note.title` and `note.content` with operators `*=*`, `=*`, `*=`, `!=` for precise field matching
- **Boolean logic**: Combine field filters with `AND`, `OR`, and `NOT` for complex queries
- **Critical**: Trilium requires an "expression separator sign" (`~` or `#`) before parentheses when they start an expression - this is automatically handled by the searchQueryBuilder for OR date queries
