## Regex Search Examples

Trilium supports regex searches using the `%=` operator.

---

1) User query: "Find notes with titles starting with 'Project' and ending with "2024"

**Trilium DSL query:**
```
note.title %= '^Project.*2024
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {"property": "title", "type": "noteProperty", "op": "regex", "value": "^Project.*2024$"}
  ]
}
```

2) User query: "Find notes containing an email address in the content."

**Trilium DSL query:**
```
note.content %= '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {"property": "content", "type": "noteProperty", "op": "regex", "value": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"}
  ]
}
```

3) Search all notes with URLs inside

**Trilium DSL query:**
```
```

**Search Structure:**
```json
```