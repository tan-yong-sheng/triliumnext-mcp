
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
- **JavaScript**: `application/typescript`
- **Python**: `text/x-python`
- **Java**: `text/x-java`
- **TypeScript**: `application/typescript`
- **CSS**: `text/css`
- **HTML**: `text/html`
- **SQL**: `text/x-sql`
- **YAML**: `text/x-yaml`
- **Markdown**: `text/x-markdown`
- **Mermaid**: `text/vnd.mermaid`
- **JSON**: `application/json`


1) User query: "Find all text notes."

**Trilium DSL query:**
```
note.type = 'text'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "text",
      "logic": "AND"
    }
  ]
}
```

2) User query: "Show me all folder notes." / "Show me all collection notes."

**Trilium DSL query:**
```
note.type = 'book'
```

**Search Structure:**
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

3) User query: "Show me all code notes."

**Trilium DSL query:**
```
note.type = 'code'
```

**Search Structure:**
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

4) User query: "Show me all Python code notes."

**Trilium DSL query:**
```
note.type = 'code' note.mime = 'text/x-python'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "code",
      "logic": "AND"
    },
    {
      "property": "mime",
      "type": "noteProperty",
      "op": "=",
      "value": "text/x-python",
      "logic": "AND"
    }
  ]
}
```

5) User query: "Show me all Javascript code notes."

**Trilium DSL query:**
```
note.type = 'code' AND note.mime = 'application/typescript'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "code",
      "logic": "AND"
    },
    {
      "property": "mime",
      "type": "noteProperty",
      "op": "=",
      "value": "application/typescript",
      "logic": "AND"
    }
  ]
}
```

6) User query: "Show me all Typescript code notes."

**Trilium DSL query:**
```
note.type = 'code' note.mime = 'application/typescript'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "code",
      "logic": "AND"
    },
    {
      "property": "mime",
      "type": "noteProperty",
      "op": "=",
      "value": "application/typescript",
      "logic": "AND"
    }
  ]
}
```

7) User query: "Show me all Mermaid notes."

**Trilium DSL query:**
```
note.type = 'mermaid'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "mermaid",
      "logic": "AND"
    }
  ]
}
```

8) User query: "Show me all Calendar notes."

**Trilium DSL query:**
```
~template.title = 'Calendar'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "Calendar",
      "logic": "AND"
    }
  ]
}
```

And then, you could ask it to show all notes under that Calendar Note(s).

9) User query: "Show me all Board notes."

**Trilium DSL query:**
```
~template.title = 'Board'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "Board",
      "logic": "AND"
    }
  ]
}
```

And then, you could ask it to show all notes under that Board Note(s).

10) User query: "Show me all Grid View notes."

**Trilium DSL query:**
```
~template.title = 'Grid View'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "Grid View",
      "logic": "AND"
    }
  ]
}
```

And then, you could ask it to show all notes under that Grid View Note(s).

11) User query: "Show me all List View notes."

**Trilium DSL query:**
```
~template.title = 'List View'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "List View",
      "logic": "AND"
    }
  ]
}
```

And then, you could ask it to show all notes under that List View Note(s).