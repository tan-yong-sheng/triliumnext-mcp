# Content and Note Property Search Examples

This document covers content searches (title and content), note property searches (system properties), and their combinations using the unified searchCriteria structure.

---

1) User query: "Show me all notes with their titles containing 'n8n'"

**Trilium DSL query:**
```
~(note.type = 'text' OR note.title *=* 'meeting' OR note.content *=* 'agenda')
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "type": "noteProperty",
      "property": "title",
      "op": "contains",
      "value": "n8n"
    }
  ]
}
```

2) User query: "Show me all notes that start with 'Project' in the title."

**Trilium DSL query:**
```
note.title =* 'Project'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "starts_with",
      "value": "Project",
      "logic": "AND"
    }
  ]
}
```

3) User query: "Show me all notes that end with 'Notes' in the title."

**Trilium DSL query:**
```
note.title *= 'Notes'
```

**Search Structure**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "ends_with",
      "value": "Notes",
      "logic": "AND"
    }
  ]
}
```

4)  User query: "Show me all notes that their titles do not equal 'Tutorial'"

**Trilium DSL query:**
```
note.title != 'Tutorial'
```
- Search Structure
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "!=",
      "value": "Tutorial",
      "logic": "AND"
    }
  ]
}
```

6) Find all meeting notes where the title starts with 'Meeting' and the content includes an agenda.

**Trilium DSL query:**
```
note.title =* 'Meeting' note.content *=* 'agenda'
```

**Search Structure**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "starts_with",
      "value": "Meeting",
      "logic": "AND"
    },
    {
      "property": "content",
      "type": "noteProperty",
      "op": "contains",
      "value": "agenda",
      "logic": "AND"
    }
  ]
}
```

7) Find all archived notes

**Trilium DSL query:**
```
note.isArchived = true
```

**Search Structure**
```json
{
  "searchCriteria": [
    {
      "property": "isArchived",
      "type": "noteProperty",
      "op": "=",
      "value": "true",
      "logic": "AND"
    }
  ]
}
```
