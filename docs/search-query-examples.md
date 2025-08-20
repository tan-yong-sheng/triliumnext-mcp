# MCP Search Examples & Usage Guide

It's underlying principle for building search rule string at: src\modules\searchQueryBuilder.ts, with reference to the Trilium Note's documentation: https://triliumnext.github.io/Docs/Wiki/search.html

This guide shows how to call MCP `search_notes` using structured parameters. The function constructs the Trilium search string internally from the provided structured parameters.

---

## Function Contract: search_notes

Input parameters:
- text: string (full-text search token, uses Trilium's indexed search)
- attributes: array (label-based searches like #book, #author)
- noteProperties: array (note.isArchived, note.isProtected, note.title, note.content, note.dateCreated, note.dateModified searches)
- hierarchyType: string ('children' or 'descendants' for hierarchy searches)
- parentNoteId: string (parent note for hierarchy searches)
- limit: number (max results to return, e.g., 10)
- orderBy: string (sort order, e.g., 'note.dateCreated desc')

Query composition:
- text: `<token>` (bare token for full-text search)
- noteProperties: Individual `note.*` conditions joined with AND/OR based on logic parameter
- attributes: `#label` and `~relation` expressions with AND/OR logic
- hierarchyType: `note.parents.noteId` (children) or `note.ancestors.noteId` (descendants)
- limit: `limit <number>` (appended to query)
- Final query: join all groups with space separation, then append limit

**Important architectural change:**
- **Date searches now use noteProperties**: `{"noteProperties": [{"property": "dateCreated", "op": ">=", "value": "2024-01-01"}]}`
- **ISO date format required**: MUST use exact ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ). Smart expressions like 'TODAY-7' are NOT allowed in MCP interface
- **OR logic available**: Mix date searches with other properties using per-item logic

---

## Examples

### 1) Created in last 7 days (using noteProperties with ISO date)
- Params
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-12-13" }
  ]
}
```
- Composed query
```
note.dateCreated >= '2024-12-13'
```
- MCP call
```js
search_notes({ 
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2024-12-13" }
  ]
})
```

### 2) Modified in last 7 days (using noteProperties with ISO date)
- Params
```json
{
  "noteProperties": [
    { "property": "dateModified", "op": ">=", "value": "2024-12-13" }
  ]
}
```
- Composed query
```
note.dateModified >= '2024-12-13'
```
- MCP call
```js
search_notes({ 
  noteProperties: [
    { property: "dateModified", op: ">=", value: "2024-12-13" }
  ]
})
```

### 3) Created OR modified in last 7 days (using noteProperties with OR logic and ISO dates)
- Params
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-12-13", "logic": "OR" },
    { "property": "dateModified", "op": ">=", "value": "2024-12-13" }
  ]
}
```
- Composed query
```
~(note.dateCreated >= '2024-12-13' OR note.dateModified >= '2024-12-13')
```
- **Note**: The `~` prefix is automatically added by the query builder for OR expressions
- MCP call
```js
search_notes({ 
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2024-12-13", logic: "OR" },
    { property: "dateModified", op: ">=", value: "2024-12-13" }
  ]
})
```

### 4) Created between 2024 and 2025 (using noteProperties)
- Params
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" },
    { "property": "dateCreated", "op": "<", "value": "2026-01-01" }
  ]
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2026-01-01'
```
- MCP call
```js
search_notes({ 
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2024-01-01" },
    { property: "dateCreated", op: "<", value: "2026-01-01" }
  ]
})
```

---

## Full-Text + Date Logic (AND/OR)

### 5) Created in last year AND full-text search "kubernetes" (using noteProperties with ISO date)
- Params
```json
{
  "text": "kubernetes",
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" }
  ]
}
```
- Composed query
```
kubernetes note.dateCreated >= '2024-01-01'
```
- MCP call
```js
search_notes({ 
  text: "kubernetes",
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2024-01-01" }
  ]
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

### 7) Search "n8n" notes created since 2020, ordered by creation date descending, limit 10 (using noteProperties)
- Params
```json
{
  "text": "n8n",
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2020-01-01" }
  ],
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
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2020-01-01" }
  ],
  orderBy: "note.dateCreated desc",
  limit: 10
})
```

### 8) ❌ INVALID: Search "n8n" with orderBy but no date property (orderBy will be skipped)
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
- Explanation: orderBy field `note.dateCreated` not found in noteProperties, so orderBy is ignored
- MCP call
```js
search_notes({ 
  text: "n8n",
  orderBy: "note.dateCreated desc",
  limit: 10
})
// orderBy skipped because note.dateCreated not used as noteProperty
```

### 9) Search "docker" notes modified in last year, ordered by modification date descending (using noteProperties)
- Params
```json
{
  "text": "docker",
  "noteProperties": [
    { "property": "dateModified", "op": ">=", "value": "YEAR-1" }
  ],
  "orderBy": "note.dateModified desc",
  "limit": 5
}
```
- Composed query
```
docker note.dateModified >= 'YEAR-1' orderBy note.dateModified desc limit 5
```
- MCP call
```js
search_notes({ 
  text: "docker",
  noteProperties: [
    { property: "dateModified", op: ">=", value: "YEAR-1" }
  ],
  orderBy: "note.dateModified desc",
  limit: 5
})
```

### 10) Search notes created since 2024, ordered by creation date ascending (using noteProperties)
- Params
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" }
  ],
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
  noteProperties: [
    { property: "dateCreated", op: ">=", value: "2024-01-01" }
  ],
  orderBy: "note.dateCreated asc",
  limit: 15
})
```

### 11) Search notes modified since 2024, ordered by modification date ascending (using noteProperties)
- Params
```json
{
  "noteProperties": [
    { "property": "dateModified", "op": ">=", "value": "2024-01-01" }
  ],
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
  noteProperties: [
    { property: "dateModified", op: ">=", value: "2024-01-01" }
  ],
  orderBy: "note.dateModified asc", 
  limit: 20
})
```

---

## Advanced noteProperties Search Examples (Using noteProperties)

These examples demonstrate advanced operators for title and content search using the `noteProperties` parameter. These provide more precise control than basic full-text search.

### noteProperties Operators Reference
- `contains` (maps to *=*) : contains substring
- `ends_with` (maps to *=) : ends with
- `starts_with` (maps to =*) : starts with  
- `not_equal` (maps to !=) : not equal to

### 12) Title contains "Tolkien"
- Composed query
```
note.title *=* 'Tolkien'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "title", "op": "contains", "value": "Tolkien" }
  ]
}
```
- Use case: Find notes whose title contains "Tolkien" anywhere

### 13) Title starts with "Project"
- Composed query
```
note.title =* 'Project'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "title", "op": "starts_with", "value": "Project" }
  ]
}
```
- Use case: Find all project-related notes by title prefix

### 14) Title ends with "Notes"
- Composed query
```
note.title *= 'Notes'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "title", "op": "ends_with", "value": "Notes" }
  ]
}
```
- Use case: Find all documents ending with "Notes"

### 15) Title does not equal "Backup"
- Composed query
```
note.title != 'Backup'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "title", "op": "not_equal", "value": "Backup" }
  ]
}
```
- Use case: Exclude backup-related notes from results

### 16) Content contains "dead letter"
- Composed query
```
note.content *=* 'dead letter'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "content", "op": "contains", "value": "dead letter" }
  ]
}
```
- Use case: Find notes discussing dead letter patterns/queues

### 17) Complex multi-property search: Title starts with "Meeting" AND content contains "agenda"
- Composed query
```
note.title =* 'Meeting' AND note.content *=* 'agenda'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "title", "op": "starts_with", "value": "Meeting" },
    { "property": "content", "op": "contains", "value": "agenda" }
  ]
}
```
- Use case: Find meeting notes that contain agenda items

### 18) Advanced combination: Full-text + noteProperties searches + date range (using noteProperties with default OR logic)
- Composed query
```
setup guide ~(note.dateCreated >= '2024-01-01' OR note.title =* 'Tutorial' OR note.content *=* 'steps')
```
- JSON structure for combined parameters (default OR logic when logic not specified)
```json
{
  "text": "setup guide",
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" },
    { "property": "title", "op": "starts_with", "value": "Tutorial" },
    { "property": "content", "op": "contains", "value": "steps" }
  ]
}
```
- Use case: Find recent tutorial guides with step-by-step instructions (matches any of the criteria)
- **Note**: Default logic is OR when not specified. For AND behavior, add `"logic": "AND"` to each item except the last.

### 19) Content search: Notes containing specific phrases
- Composed query
```
note.content *=* 'machine learning'
```
- JSON structure for noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "content", "op": "contains", "value": "machine learning" }
  ]
}
```
- Use case: Find notes discussing machine learning concepts

### 21) Advanced field-specific search with noteProperties parameter
- Params (using noteProperties parameter)
```json
{
  "noteProperties": [
    { "property": "title", "op": "contains", "value": "Tutorial" },
    { "property": "content", "op": "contains", "value": "steps" }
  ],
  "created_date_start": "2024-01-01"
}
```
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.title *=* 'Tutorial' AND note.content *=* 'steps'
```
- Use case: Find recent tutorials with step-by-step instructions using structured noteProperties

### 22) Multiple noteProperties searches with different operators
- Params (using noteProperties parameter)
```json
{
  "noteProperties": [
    { "property": "title", "op": "starts_with", "value": "Project" },
    { "property": "content", "op": "not_equal", "value": "incomplete" },
    { "property": "content", "op": "contains", "value": "documentation" }
  ]
}
```
- Composed query
```
note.title =* 'Project' AND note.content != 'incomplete' AND note.content *=* 'documentation'
```
- Use case: Find project notes with documentation that are not marked incomplete

### 23) Combined full-text and noteProperties searches
- Params (using noteProperties parameter)
```json
{
  "text": "machine learning",
  "noteProperties": [
    { "property": "title", "op": "ends_with", "value": "Notes" },
    { "property": "content", "op": "contains", "value": "algorithm" }
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

Trilium supports searching by attributes (labels and relations) using the `#` and `~` syntax. These examples show how to combine full-text search with attribute filtering.

### Attribute Search Reference
- `#label`: Search for notes with a specific label
- `#!label`: Search for notes WITHOUT a specific label  
- `#label = value`: Search for notes with label set to specific value
- `#label >= value`: Numeric comparison operators (>=, <=, >, <, !=)
- `#label *=* substring`: String operators (contains, starts_with, ends_with)
- `~relation`: Search for notes with a specific relation
- `~relation.property`: Search relations by target note properties
- `~relation *=* value`: String operators for relation searches

## Relation Search Examples

Relations in TriliumNext allow connecting notes to other notes. The MCP supports searching by relations using the `~` syntax.

### 63) Basic Relation Search - Find notes with author relation
- Composed query: Find all notes that have an "author" relation
```
~author
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "relation", "name": "author" }
  ]
}
```
- Use case: Find all notes that reference an author

### 64) Relation with Property Search - Find notes by author's title
- Composed query: Find notes connected to authors containing "Tolkien"
```
~author.title *=* 'Tolkien'
```
- JSON structure for attributes parameter  
```json
{
  "attributes": [
    { "type": "relation", "name": "author.title", "op": "contains", "value": "Tolkien" }
  ]
}
```
- Use case: Find books/notes written by Tolkien

### 65) Relation Value Comparison - Find notes by specific author ID
- Composed query: Find notes connected to a specific author note
```
~author = 'authorNoteId123'
```
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "relation", "name": "author", "op": "=", "value": "authorNoteId123" }
  ]
}
```
- Use case: Find all works by a specific author note

### 66) Mixed Label and Relation Search
- Composed query: Find books by Tolkien
```
#book ~author.title *=* 'Tolkien'
```  
- JSON structure for attributes parameter
```json
{
  "attributes": [
    { "type": "label", "name": "book" },
    { "type": "relation", "name": "author.title", "op": "contains", "value": "Tolkien" }
  ]
}
```
- Use case: Find book notes authored by Tolkien

### 67) Relation OR Logic - Find notes with multiple possible relations
- Composed query: Find notes with author OR editor relations
```
~(~author OR ~editor)
```
- JSON structure with per-item logic for relations
```json
{
  "attributes": [
    { "type": "relation", "name": "author", "logic": "OR" },
    { "type": "relation", "name": "editor" }
  ]
}
```
- Use case: Find notes that have either author or editor connections

### 68) Complex Relation Property Search
- Composed query: Find notes connected to authors with specific properties
```
~author.relations.publisher.title = 'Penguin Books'
```
- JSON structure for nested relation property
```json
{
  "attributes": [
    { "type": "relation", "name": "author.relations.publisher.title", "op": "=", "value": "Penguin Books" }
  ]
}
```
- Use case: Find books by authors published by specific publishers

### 69) Relation String Operations
- Composed query: Find notes with relations starting with "co-"
```
~collaborator =* 'co-'
```
- JSON structure for relation string search
```json
{
  "attributes": [
    { "type": "relation", "name": "collaborator", "op": "starts_with", "value": "co-" }
  ]
}
```
- Use case: Find collaborative relationships

### 70) Combined Full-text and Relation Search
- Composed query: Find Tolkien content with author relations
```
tolkien ~author
```
- JSON structure combining text and relation search
```json
{
  "text": "tolkien", 
  "attributes": [
    { "type": "relation", "name": "author" }
  ]
}
```
- Use case: Find Tolkien-related content that has author metadata

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

### 32) List descendants with date filtering (using noteProperties)
- Params
```json
{
  "hierarchyType": "descendants", 
  "parentNoteId": "workspaceId",
  "noteProperties": [
    { "property": "dateModified", "op": ">=", "value": "MONTH-1" }
  ]
}
```
- Composed query
```
note.dateModified >= 'MONTH-1' AND note.ancestors.noteId = 'workspaceId'
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

## noteProperties OR Logic Test Examples (Using noteProperties)

These examples test OR logic for noteProperties searches using the unified `noteProperties` parameter with per-item logic support.

### 47) TriliumNext Example: Content OR Search
- TriliumNext native query (from docs)
```
note.content *=* rings OR note.content *=* tolkien
```
- Expected behavior: Find notes containing "rings" OR "tolkien" in content
- Current MCP structure (with OR logic support)
```json
{
  "noteProperties": [
    { "property": "content", "op": "contains", "value": "rings", "logic": "OR" },
    { "property": "content", "op": "contains", "value": "tolkien" }
  ]
}
```
- **Status**: ✅ IMPLEMENTED - noteProperties parameter supports OR logic

### 48) TriliumNext Example: Mixed Field OR Search  
- TriliumNext native query pattern
```
note.title *=* project OR note.content *=* documentation
```
- Expected behavior: Find notes with "project" in title OR "documentation" in content
- Current MCP structure (with OR logic support)
```json
{
  "noteProperties": [
    { "property": "title", "op": "contains", "value": "project", "logic": "OR" },
    { "property": "content", "op": "contains", "value": "documentation" }
  ]
}
```
- **Status**: ✅ IMPLEMENTED - noteProperties parameter supports OR logic across different properties

### 49) Boolean Expression with Parentheses (from TriliumNext docs)
- TriliumNext native query (requires ~ prefix)
```
~author.title *= Tolkien OR (#publicationDate >= 1954 AND #publicationDate <= 1960)
```
- Expected behavior: Complex OR with grouped AND conditions
- Note: Expressions starting with parentheses need "expression separator sign" (# or ~)

### 50) Multiple Content OR Searches
- TriliumNext pattern for multiple OR conditions
```
note.content *=* docker OR note.content *=* kubernetes OR note.content *=* containers
```
- Current MCP structure 
```json
{
  "noteProperties": [
    { "property": "content", "op": "contains", "value": "docker", "logic": "OR" },
    { "property": "content", "op": "contains", "value": "kubernetes", "logic": "OR" },
    { "property": "content", "op": "contains", "value": "containers" }
  ]
}
```
- **Status**: ✅ IMPLEMENTED - noteProperties parameter supports multiple OR conditions

### 51) Title OR Content Mixed Search
- TriliumNext pattern
```
note.title *=* meeting OR note.content *=* agenda OR note.title =* "Project"
```
- Current MCP structure
```json
{
  "noteProperties": [
    { "property": "title", "op": "contains", "value": "meeting", "logic": "OR" },
    { "property": "content", "op": "contains", "value": "agenda", "logic": "OR" },
    { "property": "title", "op": "starts_with", "value": "Project" }
  ]
}
```
- **Status**: ✅ IMPLEMENTED - noteProperties parameter supports mixed property OR logic

### 52) Negation with OR Logic
- TriliumNext example with NOT
```
towers #!book
```
- Shows negation support in native syntax
- Our equivalent for noteProperties search:
```json
{
  "noteProperties": [
    { "property": "title", "op": "contains", "value": "towers" },
    { "property": "content", "op": "not_equal", "value": "book" }
  ]
}
```

---

## Enhanced Date Search Examples (Using noteProperties with ISO Format)

### MCP Date Properties Reference
- **Date properties**: `dateCreated`, `dateModified` - note creation and modification timestamps
- **Supported operators**: `>=`, `<=`, `>`, `<`, `=`, `!=` for comparison operations
- **Required date format**: ISO date strings only - `'YYYY-MM-DD'` (e.g., '2024-01-01') or `'YYYY-MM-DDTHH:mm:ss.sssZ'` (e.g., '2024-01-01T00:00:00.000Z')
- **Smart date expressions**: NOT allowed in MCP interface (TriliumNext supports them natively, but MCP enforces ISO format for consistency)
- **UTC support**: `dateCreatedUtc`, `dateModifiedUtc` for timezone-aware searches

### 55) Created in last 7 days (ISO date approach)
- Composed query
```
note.dateCreated >= '2024-12-13'
```
- JSON structure using noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-12-13" }
  ]
}
```
- Use case: Find recently created notes using exact ISO date (calculate date 7 days ago)

### 56) Created between specific dates (noteProperties approach)
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31'
```
- JSON structure using noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" },
    { "property": "dateCreated", "op": "<", "value": "2024-12-31" }
  ]
}
```
- Use case: Date range queries with precise ISO date boundaries

### 57) Modified in last month (ISO date)
- Composed query
```
note.dateModified >= '2024-11-20'
```
- JSON structure using noteProperties parameter
```json
{
  "noteProperties": [
    { "property": "dateModified", "op": ">=", "value": "2024-11-20" }
  ]
}
```
- Use case: Find recently modified notes using exact ISO date (calculate date 30 days ago)

### 58) Created OR modified in last week (unified OR logic with ISO dates)
- Composed query
```
~(note.dateCreated >= '2024-12-13' OR note.dateModified >= '2024-12-13')
```
- JSON structure with per-item OR logic
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-12-13", "logic": "OR" },
    { "property": "dateModified", "op": ">=", "value": "2024-12-13" }
  ]
}
```
- Use case: Find notes with recent activity (created or modified) using exact ISO dates

### 59) Advanced date combinations with other properties (ISO dates)
- Composed query
```
note.type = 'text' AND note.dateCreated >= '2024-11-20' AND note.labelCount > 0
```
- JSON structure combining dates with other properties
```json
{
  "noteProperties": [
    { "property": "type", "op": "=", "value": "text" },
    { "property": "dateCreated", "op": ">=", "value": "2024-11-20" },
    { "property": "labelCount", "op": ">", "value": "0" }
  ]
}
```
- Use case: Find well-tagged text notes created in the last month using exact ISO dates

### 60) UTC date search for timezone-aware applications
- Composed query
```
note.dateCreatedUtc >= '2024-01-01T00:00:00Z'
```
- JSON structure using UTC date properties
```json
{
  "noteProperties": [
    { "property": "dateCreatedUtc", "op": ">=", "value": "2024-01-01T00:00:00Z" }
  ]
}
```
- Use case: Timezone-aware date searches for global applications

### 61) Complex date logic with content search
- Composed query
```
kubernetes ~(note.dateCreated >= 'YEAR-1' OR note.dateModified >= 'MONTH-3') AND note.type = 'text'
```
- JSON structure with mixed search criteria
```json
{
  "text": "kubernetes",
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "YEAR-1", "logic": "OR" },
    { "property": "dateModified", "op": ">=", "value": "MONTH-3" },
    { "property": "type", "op": "=", "value": "text" }
  ]
}
```
- Use case: Find kubernetes-related text notes with recent activity

### 62) Date range with exclusions
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31' AND note.dateModified != '2024-06-15'
```
- JSON structure with date ranges and exclusions
```json
{
  "noteProperties": [
    { "property": "dateCreated", "op": ">=", "value": "2024-01-01" },
    { "property": "dateCreated", "op": "<", "value": "2024-12-31" },
    { "property": "dateModified", "op": "!=", "value": "2024-06-15" }
  ]
}
```
- Use case: Find notes in date range excluding specific modification dates

---

## Regex Search Examples (From TriliumNext Docs)
- TriliumNext native query
```
#publicationYear %= '19[0-9]{2}'
```
- Finds labels matching regex pattern for years 1900-1999
- **Note**: Our MCP doesn't support regex operator `%=` yet
- **Status**: ⚠️ NOT IMPLEMENTED in current MCP search

### 54) Smart Date Search (TriliumNext Feature)
- TriliumNext native query
```
#dateNote >= TODAY-30
```
- Finds notes with dateNote label within last 30 days
- Supported smart values: NOW ± seconds, TODAY ± days, MONTH ± months, YEAR ± years
- **Status**: ⚠️ NOT IMPLEMENTED in current MCP search

---

## Critical Testing Notes

### ✅ IMPLEMENTED: Date Parameter Unification with ISO Format Enforcement
**Architectural Change Completed**: Date parameters (`created_date_start`, `created_date_end`, `modified_date_start`, `modified_date_end`) have been removed and replaced with the unified `noteProperties` parameter approach.

**Implementation Benefits Achieved**:
- ✅ **Unified API**: All search criteria now use consistent `noteProperties` pattern
- ✅ **Enhanced OR logic**: Date searches can be mixed with other properties using per-item `logic: "OR"`
- ✅ **ISO date format enforcement**: MCP interface now requires exact ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ) to prevent LLM guessing errors
- ✅ **UTC timezone support**: Added `dateCreatedUtc`, `dateModifiedUtc` properties for global applications  
- ✅ **Simplified codebase**: Removed complex date-specific query building logic
- ✅ **Consistent OR logic**: Same logic pattern works across all noteProperties (dates + content + system properties)
- ✅ **Date validation**: Added strict ISO date validation in searchQueryBuilder to reject smart expressions

**Migration Examples**:
- **Before**: `{"created_date_start": "2024-01-01", "created_date_end": "2024-12-31"}`
- **After**: `{"noteProperties": [{"property": "dateCreated", "op": ">=", "value": "2024-01-01"}, {"property": "dateCreated", "op": "<", "value": "2024-12-31"}]}`
- **ISO format required**: `{"noteProperties": [{"property": "dateCreated", "op": ">=", "value": "2024-12-13"}]}`
- **Complex OR**: `{"noteProperties": [{"property": "dateCreated", "op": ">=", "value": "2024-12-13", "logic": "OR"}, {"property": "dateModified", "op": ">=", "value": "2024-12-13"}]}`

**Important Change**: Smart date expressions (e.g., `TODAY-7`, `MONTH-1`) are NO LONGER supported in the MCP interface. Only exact ISO dates are accepted to ensure LLM consistency and prevent incorrect date calculations.

**Status**: ✅ **COMPLETED** - Full implementation with updated schemas, query builders, handlers, date validation, and comprehensive documentation

### ✅ IMPLEMENTED: noteProperties Parameter Unified Field/Content Search

**Current Implementation**:
- ✅ `noteProperties` parameter: Unified support for all note.* properties including title and content
- ✅ **Content properties**: `note.title`, `note.content` - for field-specific content searches with operators: `contains`, `starts_with`, `ends_with`, `not_equal`
- ✅ **System properties**: `note.isArchived`, `note.type`, `note.labelCount` - built into every note with comparison operators
- ✅ **Per-item logic**: Each property can specify `logic: "OR"` to create OR groups with the next property
- ✅ **OR logic implementation**: Full support for complex OR expressions like `~(note.title *=* meeting OR note.content *=* agenda)`

**Benefits Achieved**:
1. **Unified API**: Single parameter handles both system properties and content searches
2. **Consistent logic**: Same OR logic pattern as `attributes` parameter 
3. **Simplified usage**: No need to distinguish between filters vs noteProperties for different search types
4. **Enhanced capabilities**: All noteProperties now support OR logic including title/content searches

### Missing TriliumNext Features
1. **Regex search** (`%=` operator) - not implemented
2. **Smart date expressions** (TODAY-30, MONTH+1) - not implemented  
3. **✅ Relation searches** (`~author.title`) - **IMPLEMENTED**
4. **Negation operators** (`#!label`) - not implemented

### Recommended Next Steps
1. **✅ COMPLETED** - Unified field/content search architecture with noteProperties parameter
2. **Test unified implementation** - Verify OR logic works correctly for title/content searches (examples 47-52)
3. **Consider implementing regex and smart date features** for completeness with TriliumNext native capabilities
4. **Performance testing** - Ensure unified noteProperties approach maintains good search performance
- Quote search terms to handle special characters properly.
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `noteProperties` parameter: Array for Trilium built-in note metadata and content searches (note.* properties)
  - **System properties**: `note.isArchived`, `note.type`, `note.labelCount` - built into every note
  - **Content properties**: `note.title`, `note.content` - for field-specific content searches
  - **Supported operators**: `=`, `!=`, `>`, `<`, `>=`, `<=` for system properties; `contains` (*=*), `starts_with` (=*), `ends_with` (*=), `not_equal` (!=) for title/content
  - **Different namespace**: Always prefixed with `note.` in Trilium DSL
  - **Per-item logic**: Each item can specify `logic: "OR"` to create OR groups with the next item
- `attributes` parameter: Array for Trilium user-defined metadata (labels and relations)
  - **Labels**: Use `#book`, `#author` syntax - user-defined tags and categories
  - **Relations**: Use `~author.title` syntax - connections between notes (**IMPLEMENTED**)
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
- **noteProperties operators**: Use `note.title` and `note.content` with operators `*=*`, `=*`, `*=`, `!=` for precise field matching
- **Boolean logic**: Combine noteProperties searches with `AND`, `OR`, and `NOT` for complex queries
- **Critical**: Trilium requires an "expression separator sign" (`~` or `#`) before parentheses when they start an expression - this is automatically handled by the searchQueryBuilder for OR date queries
