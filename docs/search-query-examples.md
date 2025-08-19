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
- Always calls underlying search_notes with fastSearch=false

**Important distinction:**
- `text`: Full-text indexed search (faster, finds whole words/tokens)
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
(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')
```
- MCP call
```js
search_notes({ 
  query: "(note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18') OR (note.dateModified >= '2024-08-11' AND note.dateModified < '2024-08-18')"
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
// Internally calls: search_notes({ query: "kubernetes limit 5", fastSearch: false })
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
// Internally calls: search_notes({ query: "n8n note.dateCreated >= '2020-01-01' orderBy note.dateCreated desc limit 10", fastSearch: false })
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
// Internally calls: search_notes({ query: "n8n limit 10", fastSearch: false })
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
- `=*` : ends with
- `*=` : starts with
- `!=` : not equal to
- `=%` : regex search

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

### 14) Title ends with "Draft"
- Composed query
```
note.title *= 'Draft'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "ends_with", "value": "Draft" }
  ]
}
```
- Use case: Find all draft documents

### 15) Title does not contain "Archived"
- Composed query
```
note.title != 'Archived'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "not_equal", "value": "Archived" }
  ]
}
```
- Use case: Exclude archived notes from results

### 16) Title matches regex pattern (case-insensitive "setup guide")
- Composed query
```
note.title =% '(?i)setup.*guide'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "regex", "value": "(?i)setup.*guide" }
  ]
}
```
- Use case: Find setup or installation guides with flexible matching

### 17) Content contains "dead letter" (case-insensitive)
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

### 18) Content regex search for "dead-letter" or "deadletter" (case-insensitive)
- Composed query
```
note.content =% '(?i)dead[- ]?letter'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "content", "op": "regex", "value": "(?i)dead[- ]?letter" }
  ]
}
```
- Use case: Flexible matching for hyphenated or compound terms

### 19) Complex multi-field search: Title starts with "API" AND content contains "REST"
- Composed query
```
note.title *= 'API' AND note.content *=* 'REST'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "starts_with", "value": "API" },
    { "field": "content", "op": "contains", "value": "REST" }
  ]
}
```
- Use case: Find API documentation specifically about REST

### 20) Advanced combination: Full-text + field filters + date range
- Composed query
```
setup guide note.title *= 'Installation' AND note.content *=* 'Docker' AND note.dateCreated >= '2024-01-01'
```
- JSON structure for future filters parameter
```json
{
  "text": "setup guide",
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Installation" },
    { "field": "content", "op": "contains", "value": "Docker" }
  ],
  "created_date_start": "2024-01-01"
}
```
- Use case: Find recent installation guides mentioning Docker

### 21) Exclude drafts: Title does not end with "Draft"
- Composed query
```
NOT note.title =* 'Draft'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "not_ends_with", "value": "Draft" }
  ]
}
```
- Use case: Filter out all draft documents from search results

### 22) Case-insensitive content search with regex
- Composed query
```
note.content =% '(?i)(kubernetes|k8s|docker|container)'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "content", "op": "regex", "value": "(?i)(kubernetes|k8s|docker|container)" }
  ]
}
```
- Use case: Find any container-related content with multiple synonyms

### 23) Combined search: Notes about "Tolkien" with specific title patterns
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

### 24) Advanced regex: Find notes with version numbers in title
- Composed query
```
note.title =% 'v[0-9]+\\.[0-9]+\\.[0-9]+'
```
- JSON structure for future filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "regex", "value": "v[0-9]+\\.[0-9]+\\.[0-9]+" }
  ]
}
```
- Use case: Find all notes with semantic version numbers

### 25) Complex business logic: API documentation that's not deprecated
- Composed query
```
API documentation note.title *= 'API' AND note.content *=* 'endpoint' AND NOT note.content *=* 'deprecated'
```
- JSON structure for future filters parameter
```json
{
  "text": "API documentation",
  "filters": [
    { "field": "title", "op": "starts_with", "value": "API" },
    { "field": "content", "op": "contains", "value": "endpoint" },
    { "field": "content", "op": "not_contains", "value": "deprecated" }
  ]
}
```
- Use case: Find current (non-deprecated) API documentation

---

## Notes
- `search_notes_advanced` always sets fastSearch=false internally for proper content search.
- Original `search_notes` should use fastSearch=true for basic queries.
- Quote search terms to handle special characters properly.
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `orderBy` parameter: Sort results by specified field and direction (asc/desc)  
- **Important**: orderBy field must also be used as a filter in the query
- Valid orderBy examples: `note.dateCreated desc`, `note.dateModified asc`
- The searchQueryBuilder validates that orderBy fields are present in filters
- **Field operators**: Use `note.title` and `note.content` with operators `*=*`, `=*`, `*=`, `!=`, `=%` for precise field matching
- **Regex patterns**: Use `=%` operator for complex pattern matching (supports case-insensitive with `(?i)` flag)
- **Boolean logic**: Combine field filters with `AND`, `OR`, and `NOT` for complex queries
