
## Note Type and MIME Type Search Examples

Trilium Note supports different note types and MIME types that can be searched. These examples show how to find specific note types and filter by MIME types for code notes.

### Note Type Search Reference
- **text**: Regular text notes (default type)
- **code**: Code notes with syntax highlighting
- **mermaid**: Mermaid diagram notes
- **book**: Book/folder notes (containers)
- **render**: Render notes
- **search**: Search notes
- **relationMap**: Relation map notes
- **noteMap**: Note map notes
- **webView**: Web view notes

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

1) Show me all notes that are code snippets.

**Trilium DSL query:**
```
note.type = 'code'
```

**Search Structure**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "code",
      "logic": "AND"
    }
  ]
}
```

9) Show me all folder notes / Show me all collection notes

**Trilium DSL query:**
```
note.type = 'book'
```

**Search Structure**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "book",
      "logic": "AND"
    }
  ]
}
```

2) Find All Text Notes
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

### 79) Find Book/Folder Notes
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

### 85) Find Visual Note Types (RelationMap OR Mermaid)
- Composed query
```
~(note.type = 'relationMap' OR note.type = 'mermaid')
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "relationMap", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid"}
  ]
}
```
- Use case: Find all visual diagram notes (relation maps or Mermaid diagrams)

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

### 90) Find Non-Text Notes
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