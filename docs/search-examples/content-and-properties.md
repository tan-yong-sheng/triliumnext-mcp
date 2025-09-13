# Content and Note Property Search Examples

This document covers content searches (title and content), note property searches (system properties), and their combinations using the unified searchCriteria structure.

---

## Content Search Examples

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