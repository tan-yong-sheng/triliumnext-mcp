# Hierarchy Navigation Examples

This document covers hierarchy navigation, for example, list direct child notes under a note (equivalent to `ls` in Unix) or list all descendant notes under a note (equivalent to `find` in Unix)

---

1) List all notes 


2) List all notes, including subfolders


1) User query: "Show me all notes that are under the note titled 'Project Management'."

**Trilium DSL query:**
```
note.parents.title = 'Project Management'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "parents.title",
      "type": "noteProperty",
      "op": "=",
      "value": "Project Management",
      "logic": "AND"
    }
  ]
}
```

2) User query: "Show me all notes, including subfolders, that are under the note titled 'Project Management'."

**Trilium DSL query:**
```
note.ancestors.title = 'Project Management'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "ancestors.title",
      "type": "noteProperty",
      "op": "=",
      "value": "Project Management",
      "logic": "AND"
    }
  ]
}
```

3) User query: "Show me notes under 'Project Management' updated after Sep 1, 2025."

**Trilium DSL query:**
```
note.parents.title = 'Project Management' note.dateModified > '2025-09-01T00:00:00.000Z'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "parents.title",
      "type": "noteProperty",
      "op": "=",
      "value": "Project Management",
      "logic": "AND"
    },
    {
      "property": "dateModified",
      "type": "noteProperty",
      "op": ">",
      "value": "2025-09-01T00:00:00.000Z",
      "logic": "AND"
    }
  ]
}
```
