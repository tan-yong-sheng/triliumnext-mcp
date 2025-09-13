# MCP Search Examples & Usage Guide - One-Array Structure

This guide shows how to call MCP `search_notes` using a unified single-array structure. The function constructs the Trilium search string internally from the provided structured parameters.

**MAJOR ARCHITECTURAL CHANGE**: Unified single-array structure replaces the previous two-array separation (attributes + noteProperties). This enables complete boolean logic expressions across all search criteria types.

---

## Function Contract: search_notes (One-Array Structure)

Input parameters:
- text: string (full-text search token, uses Trilium's indexed search)
- searchCriteria: array (unified search criteria for all types: labels, relations, note properties, content, hierarchy navigation)
- limit: number (max results to return, e.g., 10)

Query composition:
- text: `<token>` (bare token for full-text search)
- searchCriteria: Individual conditions joined with AND/OR based on logic parameter (default: AND)
- limit: `limit <number>` (appended to query)
- Final query: join all groups with space separation, then append limit

**Key Benefits of Unified Structure:**
- **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic
- **No artificial barriers**: Between search criteria types (attributes vs noteProperties vs hierarchy)
- **Unified logic**: Single consistent logic system across all criteria
- **LLM-friendly**: Single array structure, consistent field names

---

## SearchCriteria Object Structure

```json
{
  "property": "string",     // Property name (book, author, title, content, dateCreated, etc.)
  "type": "string",         // Type: "label", "relation", "noteProperty", "fulltext"
  "op": "string",           // Operator: exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with, regex
  "value": "string",        // Value to compare against (optional for exists/not_exists)
  "logic": "string"         // Logic operator: "AND" or "OR" (combines with NEXT item)
}
```

**Type Reference:**
- `"label"`: User-defined labels (#book, #author)
- `"relation"`: User-defined relations (~author, ~template)
- `"noteProperty"`: System properties (isArchived, type, dateCreated, title, content, hierarchy navigation)
- `"fulltext"`: Full-text search tokens (alternative to text parameter)

---

## Examples

### 1) **ENABLED**: Cross-Type OR Logic (Previously Impossible)

**Use Case**: "search notes created this week with relation to template titled 'Grid View'"

**TriliumNext native (OR logic):**
```
~template.title = 'Grid View' OR note.dateCreated >= '2024-12-13'
```

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "Grid View", "logic": "OR"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```

**Generated Query:**
```
~(~template.title = 'Grid View' OR note.dateCreated >= '2024-12-13')
```

---

### 2) **ENABLED**: Complex TriliumNext Boolean Expression

**TriliumNext native query:**
```
~author.title *= Tolkien OR (#publicationDate >= 1954 AND #publicationDate <= 1960)
```

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien", "logic": "OR"},
    {"property": "publicationDate", "type": "label", "op": ">=", "value": "1954", "logic": "AND"},
    {"property": "publicationDate", "type": "label", "op": "<=", "value": "1960"}
  ]
}
```

---

### 3) **ENABLED**: Mixed Full-text + Attribute + Note Property OR

**TriliumNext pattern:**
```
note.content *=* rings OR note.content *=* tolkien OR #book OR ~author
```

**One-Array Structure:**
```json
{
  "text": "fantasy",
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "rings", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "tolkien", "logic": "OR"},
    {"property": "book", "type": "label", "op": "exists", "logic": "OR"},
    {"property": "author", "type": "relation", "op": "exists"}
  ]
}
```

---

### 4) Simple Date Search (Unchanged Functionality)

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```

**Generated Query:**
```
note.dateCreated >= '2024-12-13'
```

---

### 5) Label + Relation AND Logic (Unchanged Functionality)

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien"}
  ]
}
```

**Generated Query:**
```
#book ~author.title *=* 'Tolkien'
```

---

### 6) **ENABLED**: Complex Multi-Type Search

**TriliumNext query:**
```
towers (#book OR #article) AND note.dateCreated >= '2024-01-01' OR note.isArchived = true
```

**One-Array Structure:**
```json
{
  "text": "towers",
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "OR"},
    {"property": "article", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "OR"},
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "true"}
  ]
}
```

---

### 7) Note Properties OR Logic (Enhanced)

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "meeting", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "agenda", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```

**Generated Query:**
```
~(note.title *=* 'meeting' OR note.content *=* 'agenda' OR note.type = 'text')
```

---

### 8) **ENABLED**: Alternative Full-text Representation

Instead of separate `text` parameter, can use searchCriteria:

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "fulltext", "type": "fulltext", "value": "kubernetes", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01"}
  ]
}
```

---

### 9) Hierarchy Navigation with search_notes

**search_notes Structure:**
```json
{
  "searchCriteria": [
    {"property": "ancestors.noteId", "type": "noteProperty", "op": "=", "value": "root"}
  ],
  "limit": 50
}
```
- Use case: Simple hierarchy navigation without complex search criteria

---

### 10) **ENABLED**: Complex Real-World Query

**Use Case**: "Find notes that are either: (book by Tolkien) OR (recent tutorial with steps) OR (archived important notes)"

**One-Array Structure:**
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "tutorial", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-11-01", "logic": "AND"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "steps", "logic": "OR"},
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "true", "logic": "AND"},
    {"property": "important", "type": "label", "op": "exists"}
  ]
}
```

**Generated Query:**
```
~((#book ~author.title *=* 'Tolkien') OR (note.title *=* 'tutorial' note.dateCreated >= '2024-11-01' note.content *=* 'steps') OR (note.isArchived = true #important))
```

---

### 11) Title contains "Tolkien"
- Composed query
```
note.title *=* 'Tolkien'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "Tolkien"}
  ]
}
```
- Use case: Find notes whose title contains "Tolkien" anywhere

### 12) Title starts with "Project"
- Composed query
```
note.title =* 'Project'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "starts_with", "value": "Project"}
  ]
}
```
- Use case: Find all project-related notes by title prefix

### 13) Title ends with "Notes"
- Composed query
```
note.title *= 'Notes'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "ends_with", "value": "Notes"}
  ]
}
```
- Use case: Find all documents ending with "Notes"

### 14) Title does not equal "Backup"
- Composed query
```
note.title != 'Backup'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "not_equal", "value": "Backup"}
  ]
}
```
- Use case: Exclude backup-related notes from results

### 15) Content contains "dead letter"
- Composed query
```
note.content *=* 'dead letter'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "dead letter"}
  ]
}
```
- Use case: Find notes discussing dead letter patterns/queues

### 16) Complex multi-property search: Title starts with "Meeting" AND content contains "agenda"
- Composed query
```
note.title =* 'Meeting' AND note.content *=* 'agenda'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "starts_with", "value": "Meeting", "logic": "AND"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "agenda"}
  ]
}
```
- Use case: Find meeting notes that contain agenda items

### 17) Advanced combination: Full-text + mixed criteria with OR logic
- Composed query
```
setup guide ~(note.dateCreated >= '2024-01-01' OR note.title =* 'Tutorial' OR note.content *=* 'steps')
```
- One-Array Structure
```json
{
  "text": "setup guide",
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "starts_with", "value": "Tutorial", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "steps"}
  ]
}
```
- Use case: Find recent tutorial guides with step-by-step instructions (matches any of the criteria)

### 18) Content search: Notes containing specific phrases
- Composed query
```
note.content *=* 'machine learning'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "machine learning"}
  ]
}
```
- Use case: Find notes discussing machine learning concepts

### 19) Complex mixed search with date and content OR logic
- Composed query
```
note.dateCreated >= '2025-06-01' ~(note.title *=* 'n8n' OR note.content *=* 'n8n')
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2025-06-01", "logic": "AND"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "n8n", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "n8n"}
  ]
}
```
- Use case: Find recent notes with n8n in title or content

### 20) Combined full-text and content searches
- Composed query
```
machine learning note.title *= 'Notes' AND note.content *=* 'algorithm' limit 10
```
- One-Array Structure
```json
{
  "text": "machine learning",
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "ends_with", "value": "Notes", "logic": "AND"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "algorithm"}
  ],
  "limit": 10
}
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

### 21) Book Label Search
- Composed query: Find all notes with "book" label
```
#book
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists"}
  ]
}
```
- Use case: Find all book-related notes

### 22) Combined Full-text and Attribute Search
- Composed query: Find notes containing "tolkien" with book label
```
tolkien #book
```
- One-Array Structure
```json
{
  "text": "tolkien",
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists"}
  ]
}
```

### 23) **ENABLED**: Cross-Type OR Logic - Book OR Author Label
- Composed query: Find notes containing "towers" with book OR author label
```
towers ~(#book OR #author)
```
- One-Array Structure
```json
{
  "text": "towers",
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "OR"},
    {"property": "author", "type": "label", "op": "exists"}
  ]
}
```
- Use case: Find notes about "towers" that are either books or authored content

### 24) Genre Contains Search
- Composed query: Find notes with genre containing "fan"
```
#genre *=* fan
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "genre", "type": "label", "op": "contains", "value": "fan"}
  ]
}
```

### 25) Numeric Range Search
- Composed query: Find books published in the 1950s
```
#book #publicationYear >= 1950 #publicationYear < 1960
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "publicationYear", "type": "label", "op": ">=", "value": "1950", "logic": "AND"},
    {"property": "publicationYear", "type": "label", "op": "<", "value": "1960"}
  ]
}
```

### 26) Combined Attributes Search - TriliumNext Pattern
- Composed query: Find Tolkien books
```
#author=Tolkien limit 10
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author", "type": "label", "op": "=", "value": "Tolkien"}
  ],
  "limit": 10
}
```
- Use case: Attribute-based searches with limit

### 27) Multiple OR Attributes with Values
- Composed query: Find notes with genre fantasy OR science fiction
```
~(#genre = 'fantasy' OR #genre = 'science fiction')
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "genre", "type": "label", "op": "=", "value": "fantasy", "logic": "OR"},
    {"property": "genre", "type": "label", "op": "=", "value": "science fiction"}
  ]
}
```
- Use case: Find notes in either of two specific genres

### 28) **ENABLED**: Mixed Label and Note Properties OR Logic
- Composed query: Find archived notes OR text notes
```
~(note.isArchived = true OR note.type = 'text')
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "true", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```
- Use case: Find notes that are either archived or text type

### 29) **ENABLED**: Mixed Attributes AND Note Properties Cross-Type Query
- Composed query: Find book notes with high label count
```
towers #book AND note.labelCount > 3
```
- One-Array Structure
```json
{
  "text": "towers",
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "labelCount", "type": "noteProperty", "op": ">", "value": "3"}
  ]
}
```
- Use case: Find well-tagged book notes about towers

### 30) Archive Status Search
- Composed query for archived notes
```
note.isArchived = true
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "true"}
  ]
}
```
- Use case: Filter notes by archive status using note properties
- Note: `search_notes` always includes archived notes - use `note.isArchived = false` to exclude them

---

## Relation Search Examples

Relations in TriliumNext allow connecting notes to other notes. The MCP supports searching by relations using the `~` syntax.

### 31) Basic Relation Search - Find notes with author relation
- Composed query: Find all notes that have an "author" relation
```
~author
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author", "type": "relation", "op": "exists"}
  ]
}
```
- Use case: Find all notes that reference an author

### 32) Relation with Property Search - Find notes by author's title
- Composed query: Find notes connected to authors containing "Tolkien"
```
~author.title *=* 'Tolkien'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien"}
  ]
}
```
- Use case: Find books/notes written by Tolkien

### 33) Relation Value Comparison - Find notes by specific author ID
- Composed query: Find notes connected to a specific author note
```
~author = 'authorNoteId123'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author", "type": "relation", "op": "=", "value": "authorNoteId123"}
  ]
}
```
- Use case: Find all works by a specific author note

### 34) **ENABLED**: Mixed Label and Relation Search
- Composed query: Find books by Tolkien
```
#book ~author.title *=* 'Tolkien'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "author.title", "type": "relation", "op": "contains", "value": "Tolkien"}
  ]
}
```
- Use case: Find book notes authored by Tolkien

### 35) **ENABLED**: Relation OR Logic - Find notes with multiple possible relations
- Composed query: Find notes with author OR editor relations
```
~(~author OR ~editor)
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author", "type": "relation", "op": "exists", "logic": "OR"},
    {"property": "editor", "type": "relation", "op": "exists"}
  ]
}
```
- Use case: Find notes that have either author or editor connections

### 36) Complex Relation Property Search
- Composed query: Find notes connected to authors with specific properties
```
~author.relations.publisher.title = 'Penguin Books'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "author.relations.publisher.title", "type": "relation", "op": "=", "value": "Penguin Books"}
  ]
}
```
- Use case: Find books by authors published by specific publishers

### 37) Relation String Operations
- Composed query: Find notes with relations starting with "co-"
```
~collaborator =* 'co-'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "collaborator", "type": "relation", "op": "starts_with", "value": "co-"}
  ]
}
```
- Use case: Find collaborative relationships

### 38) Combined Full-text and Relation Search
- Composed query: Find Tolkien content with author relations
```
tolkien ~author
```
- One-Array Structure
```json
{
  "text": "tolkien",
  "searchCriteria": [
    {"property": "author", "type": "relation", "op": "exists"}
  ]
}
```
- Use case: Find Tolkien-related content that has author metadata

### 39) **ENABLED**: Multiple Search Types with Default AND Logic
- Composed query: Find books published in 1954 (demonstrates default AND behavior)
```
#book #publicationYear = 1954
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "publicationYear", "type": "label", "op": "=", "value": "1954"}
  ]
}
```
- Use case: Find notes that have BOTH the book label AND publicationYear set to 1954
- **Note**: When logic is not specified, default is AND (TriliumNext default behavior)

### 40) **ENABLED**: Multiple Note Properties with Default AND Logic
- Composed query: Find text notes that are not archived and have content
```
note.type = 'text' AND note.isArchived = false AND note.contentSize > 0
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "AND"},
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "false", "logic": "AND"},
    {"property": "contentSize", "type": "noteProperty", "op": ">", "value": "0"}
  ]
}
```
- Use case: Find active text notes with content (ALL conditions must be met)
- **Note**: When logic is not specified, default is AND (TriliumNext default behavior)


---

## Regex Search Examples

Trilium supports regex searches using the `%=` operator. This is now supported in the MCP.

### 73) Regex on Labels
- Composed query: Find books published in the 1900s
```
#publicationYear %= '19[0-9]{2}'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "publicationYear", "type": "label", "op": "regex", "value": "19[0-9]{2}"}
  ]
}
```

### 74) Regex on Note Title
- Composed query: Find notes with titles starting with "Project" and ending with "2024"
```
note.title %= '^Project.*2024$'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "regex", "value": "^Project.*2024$"}
  ]
}
```

### 75) Regex on Note Content
- Composed query: Find notes containing an email address in the content.
```
note.content %= '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "regex", "value": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}"}
  ]
}
```

---

## Hierarchy Navigation Examples (Unified searchCriteria Structure)

The unified `search_notes` function supports hierarchy navigation through the `searchCriteria` parameter using hierarchy-specific note properties.

### 31) Find notes with a specific parent name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Task Board"}
  ]
}
```
- Composed query
```
note.parents.title = 'Task Board'
```
- Use case: Find all notes that have a parent named "Task Board"

### 32) Find notes with a specific child name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "children.title", "type": "noteProperty", "op": "=", "value": "Task Board"}
  ]
}
```
- Composed query
```
note.children.title = 'Task Board'
```
- Use case: Find all notes that have a child named "Task Board"

### 33) Find notes with a specific ancestor name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Books"}
  ]
}
```
- Composed query
```
note.ancestors.title = 'Books'
```
- Use case: Find all notes that have an ancestor named "Books" (recursive search up the hierarchy)

### 34) Find notes with a specific grandparent name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.parents.title", "type": "noteProperty", "op": "=", "value": "Project Root"}
  ]
}
```
- Composed query
```
note.parents.parents.title = 'Project Root'
```
- Use case: Find all notes whose grandparent is named "Project Root"

### 35) Combined hierarchy navigation with content search
- Unified Structure
```json
{
  "text": "docker",
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Development"}
  ]
}
```
- Composed query
```
docker note.parents.title = 'Development'
```
- Use case: Find notes containing "docker" that have a parent named "Development"

### 36) Multiple hierarchy conditions with OR logic
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Active Projects", "logic": "OR"},
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Archive"}
  ]
}
```
- Composed query
```
~(note.parents.title = 'Active Projects' OR note.ancestors.title = 'Archive')
```
- Use case: Find notes that either have "Active Projects" as parent OR "Archive" as ancestor

### 37) Hierarchy navigation with date filtering
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Workspace", "logic": "AND"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-12-01"}
  ]
}
```
- Composed query
```
note.ancestors.title = 'Workspace' note.dateModified >= '2024-12-01'
```
- Use case: Find all notes under "Workspace" ancestor that were modified recently

---

## Note Properties Search Examples

Trilium supports searching by built-in note properties using the `searchCriteria` parameter. These properties include metadata like archive status, protection status, note type, and various count metrics.

### Note Properties Reference
- **Boolean properties**: `isArchived`, `isProtected` - use `"true"` or `"false"` values
- **String properties**: `type`, `title` - use string values like `"text"`, `"code"`, `"book"`
- **Content properties**: `content` - searchable text content within notes
- **Date properties**: `dateCreated`, `dateModified` - creation and modification timestamps
- **Numeric properties**: `labelCount`, `ownedLabelCount`, `attributeCount`, `relationCount`, `parentCount`, `childrenCount`, `contentSize`, `revisionCount` - use numeric values without quotes
- **Hierarchy properties**: `parents.title`, `children.title`, `ancestors.title`, `parents.parents.title` - navigate note hierarchy relationships
- **Operators**: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `starts_with`, `ends_with`

### 34) Find archived notes
- Composed query
```
note.isArchived = true
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "true"}
  ]
}
```
- Use case: Find all notes that have been archived

### 35) Find non-archived notes
- Composed query
```
note.isArchived = false
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "false"}
  ]
}
```
- Use case: Exclude archived notes from search results

### 36) Find protected notes
- Composed query
```
note.isProtected = true
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "isProtected", "type": "noteProperty", "op": "=", "value": "true"}
  ]
}
```
- Use case: Find all password-protected notes

### 37) Find text notes only
- Composed query
```
note.type = 'text'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```
- Use case: Filter to only text-type notes

### 38) Find code notes
- Composed query
```
note.type = 'code'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code"}
  ]
}
```
- Use case: Find all code notes for development references

### 39) Find notes with many labels (more than 5)
- Composed query
```
note.labelCount > 5
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "labelCount", "type": "noteProperty", "op": ">", "value": "5"}
  ]
}
```
- Use case: Find heavily tagged notes for content organization review

### 40) Find notes with specific label count
- Composed query
```
note.ownedLabelCount = 3
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "ownedLabelCount", "type": "noteProperty", "op": "=", "value": "3"}
  ]
}
```
- Use case: Find notes with exactly 3 owned labels

### 41) Find notes with many children (folders/books)
- Composed query
```
note.childrenCount >= 10
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "childrenCount", "type": "noteProperty", "op": ">=", "value": "10"}
  ]
}
```
- Use case: Find folder-like notes that contain many sub-notes

### 42) Find large content notes
- Composed query
```
note.contentSize > 50000
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "contentSize", "type": "noteProperty", "op": ">", "value": "50000"}
  ]
}
```
- Use case: Find notes with substantial content (larger than 50KB)

### 43) Find notes with many revisions
- Composed query
```
note.revisionCount >= 5
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "revisionCount", "type": "noteProperty", "op": ">=", "value": "5"}
  ]
}
```
- Use case: Find frequently edited notes with many revision history

### 44) Combined note properties search
- Composed query
```
note.type = 'text' AND note.labelCount > 0 AND note.isArchived = false
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "AND"},
    {"property": "labelCount", "type": "noteProperty", "op": ">", "value": "0", "logic": "AND"},
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "false"}
  ]
}
```
- Use case: Find active text notes that have been labeled/tagged

### 45) Complex query with multiple property types
- Composed query
```
kubernetes note.type = 'text' AND note.labelCount >= 2 AND note.contentSize > 1000
```
- One-Array Structure combining text search and note properties
```json
{
  "text": "kubernetes",
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "AND"},
    {"property": "labelCount", "type": "noteProperty", "op": ">=", "value": "2", "logic": "AND"},
    {"property": "contentSize", "type": "noteProperty", "op": ">", "value": "1000"}
  ]
}
```
- Use case: Find substantial, well-tagged text notes about kubernetes

### 46) Find notes without labels
- Composed query
```
note.labelCount = 0
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "labelCount", "type": "noteProperty", "op": "=", "value": "0"}
  ]
}
```
- Use case: Find untagged notes that might need organization

---

## SearchCriteria OR Logic Test Examples (Using searchCriteria)

These examples test OR logic for note properties searches using the unified `searchCriteria` parameter with per-item logic support.

### 47) TriliumNext Example: Content OR Search
- TriliumNext native query (from docs)
```
note.content *=* rings OR note.content *=* tolkien
```
- Expected behavior: Find notes containing "rings" OR "tolkien" in content
- One-Array Structure (with OR logic support)
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "rings", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "tolkien"}
  ]
}
```
- **Status**: ✅ IMPLEMENTED - searchCriteria parameter supports OR logic

### 48) TriliumNext Example: Mixed Field OR Search  
- TriliumNext native query pattern
```
note.title *=* project OR note.content *=* documentation
```
- Expected behavior: Find notes with "project" in title OR "documentation" in content
- One-Array Structure (with OR logic support)
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "project", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "documentation"}
  ]
}
```
- **Status**: ✅ IMPLEMENTED - searchCriteria parameter supports OR logic across different properties

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
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "docker", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "kubernetes", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "containers"}
  ]
}
```
- **Status**: ✅ IMPLEMENTED - searchCriteria parameter supports multiple OR conditions

### 51) Title OR Content Mixed Search
- TriliumNext pattern
```
note.title *=* meeting OR note.content *=* agenda OR note.title =* "Project"
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "meeting", "logic": "OR"},
    {"property": "content", "type": "noteProperty", "op": "contains", "value": "agenda", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "starts_with", "value": "Project"}
  ]
}
```
- **Status**: ✅ IMPLEMENTED - searchCriteria parameter supports mixed property OR logic

### 52) Negation with OR Logic
- TriliumNext example with NOT
```
towers #!book
```
- Shows negation support in native syntax
- Our equivalent using searchCriteria:
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "towers", "logic": "AND"},
    {"property": "content", "type": "noteProperty", "op": "not_equal", "value": "book"}
  ]
}
```

---

## Enhanced Date Search Examples (Using searchCriteria with ISO Format)

### MCP Date Properties Reference
- **Date properties**: `dateCreated`, `dateModified` - note creation and modification timestamps
- **Supported operators**: `>=`, `<=`, `>`, `<`, `=`, `!=` for comparison operations
- **Required date format**: ISO date strings only - `'YYYY-MM-DD'` (e.g., '2024-01-01') or `'YYYY-MM-DDTHH:mm:ss.sssZ'` (e.g., '2024-01-01T00:00:00.000Z')
- **Smart date expressions**: NOT allowed in MCP interface (TriliumNext supports them natively, but MCP enforces ISO format for consistency)

### 55) Created in last 7 days (ISO date approach)
- Composed query
```
note.dateCreated >= '2024-12-13'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```
- Use case: Find recently created notes using exact ISO date (calculate date 7 days ago)

### 56) Created between specific dates (noteProperties approach)
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": "<", "value": "2024-12-31"}
  ]
}
```
- Use case: Date range queries with precise ISO date boundaries

### 57) Modified in last month (ISO date)
- Composed query
```
note.dateModified >= '2024-11-20'
```
- One-Array Structure
```json
{
  "searchCriteria": [
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-11-20"}
  ]
}
```
- Use case: Find recently modified notes using exact ISO date (calculate date 30 days ago)

### 58) Created OR modified in last week (unified OR logic with ISO dates)
- Composed query
```
~(note.dateCreated >= '2024-12-13' OR note.dateModified >= '2024-12-13')
```
- One-Array Structure with per-item OR logic
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13", "logic": "OR"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```
- Use case: Find notes with recent activity (created or modified) using exact ISO dates

### 59) Advanced date combinations with other properties (ISO dates)
- Composed query
```
note.type = 'text' AND note.dateCreated >= '2024-11-20' AND note.labelCount > 0
```
- One-Array Structure combining dates with other properties
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-11-20", "logic": "AND"},
    {"property": "labelCount", "type": "noteProperty", "op": ">", "value": "0"}
  ]
}
```
- Use case: Find well-tagged text notes created in the last month using exact ISO dates

### 61) Complex date logic with content search
- Composed query
```
kubernetes ~(note.dateCreated >= 'YEAR-1' OR note.dateModified >= 'MONTH-3') AND note.type = 'text'
```
- One-Array Structure with mixed search criteria
```json
{
  "text": "kubernetes",
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "YEAR-1", "logic": "OR"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "MONTH-3", "logic": "AND"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```
- Use case: Find kubernetes-related text notes with recent activity

### 62) Date range with exclusions
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31' AND note.dateModified != '2024-06-15'
```
- One-Array Structure with date ranges and exclusions
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": "<", "value": "2024-12-31", "logic": "AND"},
    {"property": "dateModified", "type": "noteProperty", "op": "!=", "value": "2024-06-15"}
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
- **Note**: Our MCP now supports the regex operator `%=`.
- **Status**: ✅ IMPLEMENTED in current MCP search


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

### ✅ IMPLEMENTED: One-Array Structure Unified Boolean Logic

**Implementation Benefits Achieved**:
- ✅ **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic
- ✅ **No artificial barriers**: Between search criteria types (attributes vs noteProperties)
- ✅ **Unified logic**: Single consistent logic system across all criteria
- ✅ **LLM-friendly**: Single array structure, consistent field names
- ✅ **ISO date format enforcement**: MCP interface requires exact ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ) to prevent LLM guessing errors
- ✅ **Enhanced OR logic**: All search criteria can be mixed with per-item `logic: "OR"`

**Migration Examples**:
- **Before (Two-Array - Limited)**: `{"attributes": [{"type": "label", "name": "book"}], "noteProperties": [{"property": "dateCreated", "op": ">=", "value": "2024-01-01"}]}`
- **After (One-Array - Complete Boolean Logic)**: `{"searchCriteria": [{"property": "book", "type": "label", "op": "exists", "logic": "OR"}, {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01"}]}`
- **Cross-Type OR**: `{"searchCriteria": [{"property": "template.title", "type": "relation", "op": "=", "value": "Grid View", "logic": "OR"}, {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}]}`

**Important Change**: Smart date expressions (e.g., `TODAY-7`, `MONTH-1`) are NO LONGER supported in the MCP interface. Only exact ISO dates are accepted to ensure LLM consistency and prevent incorrect date calculations.

---

## Enhanced resolve_note_id Examples (Template and Type Awareness)

The `resolve_note_id` function has been enhanced with template and type awareness to better handle specialized TriliumNext note types.

### Enhanced Parameters
- **noteName**: Note name/title to find (required)
- **exactMatch**: Require exact title match (default: false)
- **maxResults**: Maximum results in topMatches (default: 3)
- **autoSelect**: Auto-select best match vs user choice (default: false)
- **noteType**: Optional note type filter ("text", "code", "book", "canvas", "mermaid", "mindMap", etc.)
- **templateHint**: Optional template hint ("calendar", "board", "text snippet")

### Enhanced Prioritization
1. **Template matches** (highest priority when templateHint provided)
2. **Type matches** (when noteType provided)
3. **Exact title matches**
4. **Folder-type notes (book)**
5. **Most recent** (fallback)

### Template-Based Resolution Examples

#### 76) Find Calendar Template Note
- Enhanced resolve_note_id usage
```json
{
  "noteName": "calendar",
  "templateHint": "calendar"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "_template_calendar", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "calendar"}
  ]
}
```
- Use case: Find calendar notes using template relation with title fallback
- **Priority**: Template matches ranked highest, then title matches

#### 77) Find Task Board Template Note
- Enhanced resolve_note_id usage
```json
{
  "noteName": "board",
  "templateHint": "board"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "_template_board", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "board"}
  ]
}
```
- Use case: Find task board notes using template relation with title fallback
- **Priority**: Template matches ranked highest, then title matches

#### 78) Find Text Snippet Template Note
- Enhanced resolve_note_id usage
```json
{
  "noteName": "snippet",
  "templateHint": "text snippet"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "_template_text_snippet", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "snippet"}
  ]
}
```
- Use case: Find text snippet notes using template relation with title fallback
- **Priority**: Template matches ranked highest, then title matches

### Type-Based Resolution Examples

#### 79) Find Canvas Note by Type
- Enhanced resolve_note_id usage
```json
{
  "noteName": "diagram",
  "noteType": "canvas"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "canvas", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "diagram"}
  ]
}
```
- Use case: Find canvas diagrams with type filtering
- **Priority**: Canvas type matches ranked highest, then title matches

#### 80) Find Mermaid Diagram by Type
- Enhanced resolve_note_id usage
```json
{
  "noteName": "flowchart",
  "noteType": "mermaid"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "flowchart"}
  ]
}
```
- Use case: Find mermaid flowcharts with type filtering
- **Priority**: Mermaid type matches ranked highest, then title matches

#### 81) Find Mind Map by Type
- Enhanced resolve_note_id usage
```json
{
  "noteName": "brainstorm",
  "noteType": "mindMap"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mindMap", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "brainstorm"}
  ]
}
```
- Use case: Find mind map notes for brainstorming sessions
- **Priority**: MindMap type matches ranked highest, then title matches

#### 82) Find Code Note by Type
- Enhanced resolve_note_id usage
```json
{
  "noteName": "script",
  "noteType": "code"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "script"}
  ]
}
```
- Use case: Find code scripts with type filtering
- **Priority**: Code type matches ranked highest, then title matches

### Combined Template and Type Examples

#### 83) Find Calendar with Combined Criteria
- Enhanced resolve_note_id usage
```json
{
  "noteName": "calendar",
  "noteType": "book",
  "templateHint": "calendar"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "_template_calendar", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "book", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "calendar"}
  ]
}
```
- Use case: Find calendar template notes with book type and title fallback
- **Priority**: Template matches → Type matches → Title matches

#### 84) Find Task Board with Combined Criteria
- Enhanced resolve_note_id usage
```json
{
  "noteName": "project board",
  "noteType": "book",
  "templateHint": "board"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "_template_board", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "book", "logic": "OR"},
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "project board"}
  ]
}
```
- Use case: Find project board template notes with comprehensive matching
- **Priority**: Template matches → Type matches → Title matches

### Backward Compatibility Examples

#### 85) Simple Resolution (Unchanged)
- Enhanced resolve_note_id usage
```json
{
  "noteName": "project"
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "contains", "value": "project"}
  ]
}
```
- Use case: Simple note resolution by title (existing behavior preserved)
- **Priority**: Standard prioritization (exact matches → folders → recent)

#### 86) Exact Match with User Choice
- Enhanced resolve_note_id usage
```json
{
  "noteName": "meeting",
  "exactMatch": true,
  "autoSelect": false,
  "maxResults": 5
}
```
- Internal searchCriteria generated
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "=", "value": "meeting"}
  ]
}
```
- Use case: Precise title matching with user choice for multiple results
- **Behavior**: Returns top 5 matches for user selection when multiple found

### Template Mapping Reference

- **"calendar"** → `~template.title = '_template_calendar'`
- **"board"** → `~template.title = '_template_board'`
- **"text snippet"** → `~template.title = '_template_text_snippet'`

### Supported Note Types

- **"text"**: Regular text notes
- **"code"**: Code notes with syntax highlighting
- **"book"**: Book/folder notes
- **"canvas"**: Canvas notes (application/json)
- **"mermaid"**: Mermaid diagram notes
- **"mindMap"**: Mind map notes
- **"file"**: File attachments
- **"image"**: Image notes
- **"search"**: Search notes
- **"relationMap"**: Relation map notes
- **"render"**: Render notes

### Key Benefits

1. **Template-aware**: Finds template-based notes using relation searches
2. **Type-aware**: Filters by specific note types for precise matching
3. **Enhanced prioritization**: Template and type matches ranked higher than title matches
4. **Backward compatible**: All existing usage patterns continue to work
5. **User-friendly**: Supports both auto-selection and user choice workflows
6. **Comprehensive**: Combines multiple search criteria with intelligent OR logic

**Status**: ✅ **COMPLETED** - Full implementation with enhanced prioritization and comprehensive template/type support

### Missing TriliumNext Features
1. **Regex search** (`%=` operator) - not implemented
2. **Smart date expressions** (TODAY-30, MONTH+1) - not implemented  
3. **✅ Relation searches** (`~author.title`) - **IMPLEMENTED**
4. **Negation operators** (`#!label`) - not implemented

### Recommended Next Steps
1. **✅ COMPLETED** - Unified searchCriteria structure with complete boolean logic
2. **Test unified implementation** - Verify cross-type OR logic works correctly (examples 1-10)
3. **Consider implementing regex and smart date features** for completeness with TriliumNext native capabilities
4. **Performance testing** - Ensure unified searchCriteria approach maintains good search performance

## SearchCriteria Parameter Reference

The unified `searchCriteria` parameter handles all search criteria types:
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `searchCriteria` parameter: Unified array for all search criteria types
  - **Type: "label"**: User-defined labels (#book, #author) - user-defined tags and categories
  - **Type: "relation"**: User-defined relations (~author.title) - connections between notes
  - **Type: "noteProperty"**: System properties (isArchived, type, dateCreated, title, content, hierarchy navigation) - built into every note
  - **Type: "fulltext"**: Full-text search tokens (alternative to text parameter)
  - **Supported operators**: exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with, regex
  - **Per-item logic**: Each item can specify `logic: "OR"` to create OR groups with the next item
  - **Default logic**: AND when logic not specified (matches TriliumNext behavior)
  - **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic

**Field Mapping**:
- **Labels**: `#property` syntax - any user-defined label name
- **Relations**: `~property` syntax - any user-defined relation name, supports nested (author.title)
- **Note Properties**: `note.property` syntax - system properties like note.isArchived, note.type, note.title, note.content, note.dateCreated
- **Hierarchy Navigation**: `note.parents.title`, `note.children.title`, `note.ancestors.title`, `note.parents.parents.title` - navigate note hierarchy relationships
- **Full-text**: bare token for indexed search

**Critical**: Trilium requires an "expression separator sign" (`~` or `#`) before parentheses when they start an expression - this is automatically handled by the searchQueryBuilder for OR queries

---

