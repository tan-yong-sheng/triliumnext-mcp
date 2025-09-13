# Attribute and Relation Search Examples

This document covers searches using attributes (labels and relations) and their combinations with other search criteria.

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