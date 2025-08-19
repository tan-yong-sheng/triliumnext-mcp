# MCP Search Examples & Usage Guide

It's underlying principle for building search rule string at: src\modules\searchQueryBuilder.ts, with reference to the Trilium Note's documentation: https://triliumnext.github.io/Docs/Wiki/search.html

This guide shows how to call MCP `search_notes` using structured parameters. The function constructs the Trilium search string internally from the provided structured parameters.

---

## Function Contract: search_notes

Input parameters:
- created_date_start: string (ISO date, e.g., '2024-01-01')
- created_date_end: string (ISO date, exclusive upper bound, e.g., '2024-12-31')
- modified_date_start: string (ISO date)
- modified_date_end: string (ISO date, exclusive upper bound)
- text: string (full-text search token, uses Trilium's indexed search)
- filters: array (field-specific title/content searches)
- attributes: array (label-based searches like #book, #author)
- noteProperties: array (note.isArchived, note.isProtected searches)
- hierarchyType: string ('children' or 'descendants' for hierarchy searches)
- parentNoteId: string (parent note for hierarchy searches)
- limit: number (max results to return, e.g., 10)
- orderBy: string (sort order, e.g., 'note.dateCreated desc')

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
  "created_date_end": "2024-08-18"
}
```
- Composed query
```
note.dateCreated >= '2024-08-11' AND note.dateCreated < '2024-08-18'
```
- MCP call
```js
search_notes({ 
  created_date_start: "2024-08-11",
  created_date_end: "2024-08-18"
})
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
  modified_date_start: "2024-08-11",
  modified_date_end: "2024-08-18"
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
  created_date_start: "2024-08-11",
  created_date_end: "2024-08-18",
  modified_date_start: "2024-08-11",
  modified_date_end: "2024-08-18"
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
search_notes({ 
  created_date_start: "2024-01-01",
  created_date_end: "2026-01-01"
})
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
  text: "kubernetes",
  created_date_start: "2023-08-18",
  created_date_end: "2024-08-18"
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
search_notes({ 
  text: "kubernetes",
  limit: 5
})
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
search_notes({ 
  text: "n8n",
  created_date_start: "2020-01-01",
  orderBy: "note.dateCreated desc",
  limit: 10
})
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
search_notes({ 
  text: "n8n",
  orderBy: "note.dateCreated desc",
  limit: 10
})
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
search_notes({ 
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
search_notes({ 
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
search_notes({ 
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
- JSON structure for filters parameter
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
- JSON structure for filters parameter
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
- JSON structure for filters parameter
```json
{
  "filters": [
    { "field": "title", "op": "ends_with", "value": "Notes" }
  ]
}
```
- Use case: Find all documents ending with "Notes"

### 15) Title does not equal "Backup"
- Composed query
```
note.title != 'Backup'
```
- JSON structure for filters parameter
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
- JSON structure for filters parameter
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
- JSON structure for filters parameter
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
setup guide note.dateCreated >= '2024-01-01' AND note.title =* 'Tutorial' AND note.content *=* 'steps'
```
- JSON structure for filters parameter
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

### 19) Content search: Notes containing specific phrases
- Composed query
```
note.content *=* 'machine learning'
```
- JSON structure for filters parameter
```json
{
  "filters": [
    { "field": "content", "op": "contains", "value": "machine learning" }
  ]
}
```
- Use case: Find notes discussing machine learning concepts

### 21) Advanced field-specific search with filters parameter
- Params (using filters parameter)
```json
{
  "filters": [
    { "field": "title", "op": "contains", "value": "Tutorial" },
    { "field": "content", "op": "contains", "value": "steps" }
  ],
  "created_date_start": "2024-01-01"
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.title *=* 'Tutorial' AND note.content *=* 'steps'
```
- Use case: Find recent tutorials with step-by-step instructions using structured filters

### 22) Multiple field filters with different operators
- Params (using filters parameter)
```json
{
  "filters": [
    { "field": "title", "op": "starts_with", "value": "Project" },
    { "field": "content", "op": "not_equal", "value": "incomplete" },
    { "field": "content", "op": "contains", "value": "documentation" }
  ]
}
```
- Composed query
```
note.title =* 'Project' AND note.content != 'incomplete' AND note.content *=* 'documentation'
```
- Use case: Find project notes with documentation that are not marked incomplete

### 23) Combined full-text and field filters
- Params (using filters parameter)
```json
{
  "text": "machine learning",
  "filters": [
    { "field": "title", "op": "ends_with", "value": "Notes" },
    { "field": "content", "op": "contains", "value": "algorithm" }
  ],
  "limit": 10
}
```
- Composed query
```
machine learning note.title *= 'Notes' AND note.content *=* 'algorithm' limit 10
```
- Use case: Find machine learning notes with algorithms, limited to 10 results

---

## Attribute Search Examples

Trilium supports searching by attributes (labels and relations) using the `#` syntax. These examples show how to combine full-text search with attribute filtering.

### Attribute Search Reference
- `#label`: Search for notes with a specific label
- `#!label`: Search for notes WITHOUT a specific label
- `#label = value`: Search for notes with label set to specific value
- `#label >= value`: Numeric comparison operators (>=, <=, >, <, !=)
- `#label *=* substring`: String operators (contains, starts_with, ends_with)

### 24) Book Label Search
- Composed query: Find all notes with "book" label
```
#book
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "label", "name": "book" }
  ]
}
```
- Use case: Find all book-related notes

### 25) Book with Publication Year
- Composed query: Find books published in 1954
```
#book #publicationYear = 1954
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "label", "name": "book" },
    { "type": "label", "name": "publicationYear", "op": "=", "value": "1954" }
  ]
}
```

### 26) Combined Full-text and Attribute Search
- Composed query: Find notes containing "tolkien" with book label
```
tolkien #book
```
- Composed query: Find notes containing "towers" with book OR author label
```
towers #book or #author
```
- Composed query: Find notes containing "towers" but NOT having book label
```
towers #!book
```

### 27) Genre Contains Search
- Composed query: Find notes with genre containing "fan"
```
#genre *=* fan
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "label", "name": "genre", "op": "contains", "value": "fan" }
  ]
}
```

### 28) Numeric Range Search
- Composed query: Find books published in the 1950s
```
#book #publicationYear >= 1950 #publicationYear < 1960
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "label", "name": "book" },
    { "type": "label", "name": "publicationYear", "op": ">=", "value": "1950" },
    { "type": "label", "name": "publicationYear", "op": "<", "value": "1960" }
  ]
}
```

### 29) Combined Attributes with Ordering
- Composed query: Find Tolkien books ordered by publication date
```
#author=Tolkien orderBy #publicationDate desc, note.title limit 10
```
- Use case: Sorted attribute-based searches with secondary ordering

### 30) Attribute OR Logic - Book OR Author Label
- Composed query: Find notes containing "towers" with book OR author label
```
towers ~(#book OR #author)
```
- JSON structure with per-item logic for attributes
```json
{
  "text": "towers",
  "attributes": [
    { "type": "label", "name": "book", "logic": "OR" },
    { "type": "label", "name": "author" }
  ]
}
```
- Use case: Find notes about "towers" that are either books or authored content

### 31) Multiple OR Attributes with Values
- Composed query: Find notes with genre fantasy OR science fiction
```
~(#genre = 'fantasy' OR #genre = 'science fiction')
```
- JSON structure with per-item logic for attributes
```json
{
  "attributes": [
    { "type": "label", "name": "genre", "op": "=", "value": "fantasy", "logic": "OR" },
    { "type": "label", "name": "genre", "op": "=", "value": "science fiction" }
  ]
}
```
- Use case: Find notes in either of two specific genres

### 32) Note Properties OR Logic
- Composed query: Find archived notes OR text notes
```
~(note.isArchived = true OR note.type = 'text')
```
- JSON structure with per-item logic for note properties
```json
{
  "noteProperties": [
    { "property": "isArchived", "op": "=", "value": "true", "logic": "OR" },
    { "property": "type", "op": "=", "value": "text" }
  ]
}
```
- Use case: Find notes that are either archived or text type

### 33) Mixed Attributes AND Note Properties
- Composed query: Find book notes with high label count
```
towers #book AND note.labelCount > 3
```
- JSON structure with separate attributes and noteProperties
```json
{
  "text": "towers",
  "attributes": [
    { "type": "label", "name": "book" }
  ],
  "noteProperties": [
    { "property": "labelCount", "op": ">", "value": "3" }
  ]
}
```
- Use case: Find well-tagged book notes about towers

### 34) Archive Status Search
- Composed query for archived notes
```
note.isArchived = true
```
- Composed query for non-archived notes
```
note.isArchived = false
```
- Combined with other filters (e.g., archived notes with title "Work")
```
note.isArchived = true AND note.title = 'Work'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "isArchived", "op": "=", "value": "true" }
  ]
}
```
- Use case: Filter notes by archive status using note properties
- Note: `search_notes` always includes archived notes - use `note.isArchived = false` to exclude them

---

## Hierarchy Search Examples

The unified `search_notes` function also supports hierarchy searches when combined with `hierarchyType` and `parentNoteId` parameters.

### 31) List direct children with additional filters
- Params
```json
{
  "hierarchyType": "children",
  "parentNoteId": "projectFolderId",
  "text": "docker"
}
```
- Composed query
```
docker note.parents.noteId = 'projectFolderId'
```
- Use case: Find children containing "docker" in a specific folder

### 32) List descendants with date filtering
- Params
```json
{
  "hierarchyType": "descendants", 
  "parentNoteId": "workspaceId",
  "modified_date_start": "2024-08-01"
}
```
- Composed query
```
note.dateModified >= '2024-08-01' AND note.ancestors.noteId = 'workspaceId'
```
- Use case: Find all descendants modified recently in a workspace

---

## Note Properties Search Examples

Trilium supports searching by built-in note properties using the `noteProperties` parameter. These properties include metadata like archive status, protection status, note type, and various count metrics.

### Note Properties Reference
- **Boolean properties**: `isArchived`, `isProtected` - use `"true"` or `"false"` values
- **String properties**: `type`, `title` - use string values like `"text"`, `"code"`, `"book"`
- **Numeric properties**: `labelCount`, `ownedLabelCount`, `attributeCount`, `relationCount`, `parentCount`, `childrenCount`, `contentSize`, `revisionCount` - use numeric values without quotes
- **Operators**: `=`, `!=`, `>`, `<`, `>=`, `<=`

### 34) Find archived notes
- Composed query
```
note.isArchived = true
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "isArchived", "op": "=", "value": "true" }
  ]
}
```
- Use case: Find all notes that have been archived

### 35) Find non-archived notes
- Composed query
```
note.isArchived = false
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "isArchived", "op": "=", "value": "false"}
  ]
}
```
- Use case: Exclude archived notes from search results

### 36) Find protected notes
- Composed query
```
note.isProtected = true
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "isProtected", "op": "=", "value": "true" }
  ]
}
```
- Use case: Find all password-protected notes

### 37) Find text notes only
- Composed query
```
note.type = 'text'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "type", "op": "=", "value": "text" }
  ]
}
```
- Use case: Filter to only text-type notes

### 38) Find code notes
- Composed query
```
note.type = 'code'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "type", "op": "=", "value": "code" }
  ]
}
```
- Use case: Find all code notes for development references

### 39) Find notes with many labels (more than 5)
- Composed query
```
note.labelCount > 5
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "labelCount", "op": ">", "value": "5" }
  ]
}
```
- Use case: Find heavily tagged notes for content organization review

### 40) Find notes with specific label count
- Composed query
```
note.ownedLabelCount = 3
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "ownedLabelCount", "op": "=", "value": "3" }
  ]
}
```
- Use case: Find notes with exactly 3 owned labels

### 41) Find notes with many children (folders/books)
- Composed query
```
note.childrenCount >= 10
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "childrenCount", "op": ">=", "value": "10" }
  ]
}
```
- Use case: Find folder-like notes that contain many sub-notes

### 42) Find large content notes
- Composed query
```
note.contentSize > 50000
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "contentSize", "op": ">", "value": "50000" }
  ]
}
```
- Use case: Find notes with substantial content (larger than 50KB)

### 43) Find notes with many revisions
- Composed query
```
note.revisionCount >= 5
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "revisionCount", "op": ">=", "value": "5" }
  ]
}
```
- Use case: Find frequently edited notes with many revision history

### 44) Combined note properties search
- Composed query
```
note.type = 'text' AND note.labelCount > 0 AND note.isArchived = false
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "type", "op": "=", "value": "text" },
    { "property": "labelCount", "op": ">", "value": "0" },
    { "property": "isArchived", "op": "=", "value": "false" }
  ]
}
```
- Use case: Find active text notes that have been labeled/tagged

### 45) Complex query with multiple property types
- Composed query
```
kubernetes note.type = 'text' AND note.labelCount >= 2 AND note.contentSize > 1000
```
- JSON structure combining text search and note properties
```json
{
  "text": "kubernetes",
  "noteProperties": [
    { "property": "type", "op": "=", "value": "text" },
    { "property": "labelCount", "op": ">=", "value": "2" },
    { "property": "contentSize", "op": ">", "value": "1000" }
  ]
}
```
- Use case: Find substantial, well-tagged text notes about kubernetes

### 46) Find notes without labels
- Composed query
```
note.labelCount = 0
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "labelCount", "op": "=", "value": "0" }
  ]
}
```
- Use case: Find untagged notes that might need organization

---

## Notes
- Quote search terms to handle special characters properly.
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `filters` parameter: Array of field-specific conditions with structured operators
  - Supported fields: `title`, `content`
  - Supported operators: `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=)
  - **Limitation**: `not_contains` (does not contain) is not reliably supported in Trilium's search DSL
- `attributes` parameter: Array for Trilium user-defined metadata (labels and relations)
  - **Labels**: Use `#book`, `#author` syntax - user-defined tags and categories
  - **Relations**: Use `~author.title` syntax - connections between notes (future support)
  - Supported operators: `exists`, `not_exists`, `=`, `!=`, `>=`, `<=`, `>`, `<`, `contains`, `starts_with`, `ends_with`
  - **Per-item logic**: Each item can specify `logic: "OR"` to create OR groups with the next item
- `noteProperties` parameter: Array for Trilium built-in note metadata (note.* properties)
  - **System properties**: `note.isArchived`, `note.type`, `note.labelCount` - built into every note
  - **Different namespace**: Always prefixed with `note.` in Trilium DSL
  - Supported operators: `=`, `!=`, `>`, `<`, `>=`, `<=`
  - **Per-item logic**: Each item can specify `logic: "OR"` to create OR groups with the next item
- **Conceptual separation**: Attributes are user-defined, noteProperties are system-defined
- `orderBy` parameter: Sort results by specified field and direction (asc/desc)  
- **Important**: orderBy field must also be used as a filter in the query
- Valid orderBy examples: `note.dateCreated desc`, `note.dateModified asc`
- The searchQueryBuilder validates that orderBy fields are present in filters
- **Field operators**: Use `note.title` and `note.content` with operators `*=*`, `=*`, `*=`, `!=` for precise field matching
- **Boolean logic**: Combine field filters with `AND`, `OR`, and `NOT` for complex queries
- **Critical**: Trilium requires an "expression separator sign" (`~` or `#`) before parentheses when they start an expression - this is automatically handled by the searchQueryBuilder for OR date queries
