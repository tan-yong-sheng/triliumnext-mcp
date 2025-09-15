# Advanced Search Examples

This document covers advanced search patterns including regex searches, note type and MIME type filtering, and complex OR logic expressions.

---

## Regex Search Examples

Trilium supports regex searches using the `%=` operator. This is now supported in the MCP.

### 73) Regex on Labels
- Composed query: Find books published in the 1900s
```
#publicationYear %= '19[0-9]{2}'
```
- Search Structure
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
- Search Structure
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
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "regex", "value": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.\\\\.[a-zA-Z]{2,}"}
  ]
}
```

---

## Note Type and MIME Type Search Examples

TriliumNext supports different note types and MIME types that can be searched using the unified searchCriteria structure. These examples show how to find specific note types and filter by MIME types for code notes.

### Note Type Search Reference
- **text**: Regular text notes (default type)
- **code**: Code notes with syntax highlighting
- **mermaid**: Mermaid diagram notes
- **canvas**: Canvas/drawing notes (Excalidraw)
- **book**: Book/folder notes (containers)
- **image**: Image notes
- **file**: File attachment notes
- **search**: Saved search notes
- **relationMap**: Relation map notes
- **render**: Render notes

### MIME Type Search Reference
- **JavaScript**: `text/javascript`
- **Python**: `text/x-python`
- **Java**: `text/x-java`
- **TypeScript**: `text/x-typescript`
- **CSS**: `text/css`
- **HTML**: `text/html`
- **SQL**: `text/x-sql`
- **YAML**: `text/x-yaml`
- **Markdown**: `text/x-markdown`
- **Mermaid**: `text/vnd.mermaid`
- **JSON**: `application/json`

### 76) Find All Text Notes
- Composed query
```
note.type = 'text'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```
- Use case: Find all regular text notes

### 77) Find All Code Notes
- Composed query
```
note.type = 'code'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code"}
  ]
}
```
- Use case: Find all code notes with syntax highlighting

### 78) Find Mermaid Diagrams
- Composed query
```
note.type = 'mermaid'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid"}
  ]
}
```
- Use case: Find all Mermaid diagram notes

### 79) Find Canvas/Drawing Notes
- Composed query
```
note.type = 'canvas'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "canvas"}
  ]
}
```
- Use case: Find all canvas/Excalidraw drawing notes

### 80) Find Book/Folder Notes
- Composed query
```
note.type = 'book'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "book"}
  ]
}
```
- Use case: Find all book/folder container notes

### 81) Find JavaScript Code Notes
- Composed query
```
note.type = 'code' AND note.mime = 'text/javascript'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "AND"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/javascript"}
  ]
}
```
- Use case: Find JavaScript code files specifically

### 82) Find Python Code Notes
- Composed query
```
note.type = 'code' AND note.mime = 'text/x-python'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "AND"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-python"}
  ]
}
```
- Use case: Find Python code files specifically

### 83) Find TypeScript Code Notes
- Composed query
```
note.type = 'code' AND note.mime = 'text/x-typescript'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "AND"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-typescript"}
  ]
}
```
- Use case: Find TypeScript code files specifically

### 84) Find Multiple Code Types (OR Logic)
- Composed query
```
~(note.mime = 'text/javascript' OR note.mime = 'text/x-python' OR note.mime = 'text/x-typescript')
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/javascript", "logic": "OR"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-python", "logic": "OR"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-typescript"}
  ]
}
```
- Use case: Find JavaScript, Python, or TypeScript code notes

### 85) Find Visual Note Types (Canvas OR Mermaid)
- Composed query
```
~(note.type = 'canvas' OR note.type = 'mermaid')
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "canvas", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid"}
  ]
}
```
- Use case: Find all visual diagram notes (canvas drawings or Mermaid diagrams)

### 86) Find Content with Specific Note Type
- Composed query
```
kubernetes note.type = 'code'
```
- Search Structure
```json
{
  "text": "kubernetes",
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code"}
  ]
}
```
- Use case: Find code notes containing "kubernetes"

### 87) Find Web Development Files
- Composed query
```
~(note.mime = 'text/html' OR note.mime = 'text/css' OR note.mime = 'text/javascript')
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/html", "logic": "OR"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/css", "logic": "OR"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/javascript"}
  ]
}
```
- Use case: Find all web development related code files

### 88) Complex Note Type and Content Search
- Composed query
```
project ~(note.type = 'text' OR note.type = 'code') AND note.dateCreated >= '2024-01-01'
```
- Search Structure
```json
{
  "text": "project",
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01"}
  ]
}
```
- Use case: Find recent text or code notes containing "project"

### 89) Find All Non-Text Notes
- Composed query
```
note.type != 'text'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "!=", "value": "text"}
  ]
}
```
- Use case: Find all specialized note types (excluding regular text notes)

### 90) Find Image and File Attachments
- Composed query
```
~(note.type = 'image' OR note.type = 'file')
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "image", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "file"}
  ]
}
```
- Use case: Find all attachment notes (images and files)

---

## Negation Operator Examples

TriliumNext supports two types of negation operators with different semantics: `not_exists` (finds notes WITHOUT a property) and `!=` (finds notes WITH a property but excluding specific values).

### 91) Find Notes Without a Specific Label (not_exists)
- Composed query: Find all notes that do NOT have the "private" label
```
#!private
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "private", "type": "label", "op": "not_exists"}
  ]
}
```
- Use case: Find all notes that are not tagged as private
- **Key distinction**: This finds notes that completely lack the "private" label

### 92) Find Notes Without Label but With Another Label
- Composed query: Find notes that are not private but are important
```
#!private #important
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "private", "type": "label", "op": "not_exists", "logic": "AND"},
    {"property": "important", "type": "label", "op": "exists"}
  ]
}
```
- Use case: Find important notes that are not tagged as private

### 93) Find Notes With Label But Excluding Specific Value (!=)
- Composed query: Find notes with status label but status is not "completed"
```
#status #status != 'completed'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "status", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "status", "type": "label", "op": "!=", "value": "completed"}
  ]
}
```
- Use case: Find notes that have a status but are not completed
- **Key distinction**: This only finds notes that HAVE the "status" label, excluding those with value "completed"

### 94) Find Notes Without Collection Label (not_exists)
- Composed query: Find all notes that are not part of any collection
```
#!collection
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "collection", "type": "label", "op": "not_exists"}
  ]
}
```
- Use case: Find standalone notes not organized into collections

### 95) Mixed Negation - Label and Note Property
- Composed query: Find non-book notes that are not archived
```
#!book note.isArchived = false
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "book", "type": "label", "op": "not_exists", "logic": "AND"},
    {"property": "isArchived", "type": "noteProperty", "op": "=", "value": "false"}
  ]
}
```
- Use case: Find active notes that are not book containers

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