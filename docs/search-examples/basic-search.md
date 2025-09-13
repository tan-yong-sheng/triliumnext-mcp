# Basic Search Examples & Function Contract

This guide shows how to call MCP `search_notes` using a unified single-array structure. The function constructs the Trilium search string internally from the provided structured parameters.

This guide demonstrates how to use the unified searchCriteria structure for complete boolean logic expressions across all search criteria types.

---

## Function Contract: search_notes

Input parameters:
- text: string (full-text search token, uses Trilium's indexed search)
- searchCriteria: array (unified search criteria for all types: labels, relations, note properties, content, hierarchy navigation)
- limit: number (max results to return, e.g., 10)

Query composition:
- text: `<token>` (bare token for full-text search)
- searchCriteria: Individual conditions joined with AND/OR based on logic parameter (default: AND)
- limit: `limit <number>` (appended to query)
- Final query: join all groups with space separation, then append limit

**Key Benefits:**
- **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic
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

## Basic Examples

### 1) Cross-Type OR Logic

**Use Case**: "search notes created this week with relation to template titled 'Grid View'"

**TriliumNext native (OR logic):**
```
~template.title = 'Grid View' OR note.dateCreated >= '2024-12-13'
```

**Search Structure:**
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

### 2) Complex TriliumNext Boolean Expression

**TriliumNext native query:**
```
~author.title *= Tolkien OR (#publicationDate >= 1954 AND #publicationDate <= 1960)
```

**Search Structure:**
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

### 3) Mixed Full-text + Attribute + Note Property OR

**TriliumNext pattern:**
```
note.content *=* rings OR note.content *=* tolkien OR #book OR ~author
```

**Search Structure:**
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

**Search Structure:**
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

**Search Structure:**
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

### 6) Complex Multi-Type Search

**TriliumNext query:**
```
towers (#book OR #article) AND note.dateCreated >= '2024-01-01' OR note.isArchived = true
```

**Search Structure:**
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

### 7) Note Properties OR Logic

**Search Structure:**
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

### 8) Alternative Full-text Representation

Instead of separate `text` parameter, can use searchCriteria:

**Search Structure:**
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

### 10) Complex Real-World Query

**Use Case**: "Find notes that are either: (book by Tolkien) OR (recent tutorial with steps) OR (archived important notes)"

**Search Structure:**
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