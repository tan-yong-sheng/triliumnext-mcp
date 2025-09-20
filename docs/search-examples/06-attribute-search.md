# Attribute Search Examples

This document covers searches using attributes (labels and relations) and their combinations with other search criteria.

Trilium supports searching by attributes (labels and relations) using the `#` and `~` syntax. These examples show how to combine keyword search with attribute filtering.
 
**Label and Relation Search Reference**
- `#label`: Search for notes with a specific label
- `#!label`: Search for notes WITHOUT a specific label
- `#label = value`: Search for notes with label set to specific value
- `#label >= value`: Numeric comparison operators (>=, <=, >, <, !=)
- `#label *=* substring`: String operators (contains, starts_with, ends_with)
- `~relation`: Search for notes with a specific relation
- `~relation.property`: Search relations by target note properties
- `~relation *=* value`: String operators for relation searches

---

## Part 1: Label Search

Labels in Trilium Note is a simple key-value text attribute assigned to a note that provides metadata for organization, categorizes notes, for example, you can add a #genre="sci-fi" label to a book note for categorization

1) User query: "Show me notes that are labeled as 'collection'."

**Trilium DSL query:**
```
#collection
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "collection",
      "type": "label",
      "logic": "AND"
    }
  ]
}
```

2) User query: "Show me notes titled 'Study' that are labeled as collection"

**Trilium DSL query:**
```
#collection note.title = 'Study'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "title",
      "type": "noteProperty",
      "op": "=",
      "value": "Study",
      "logic": "AND"
    },
    {
      "property": "collection",
      "type": "label",
      "op": "exists",
      "logic": "AND"
    }
  ]
}
```

3) User query: "search notes with label status equal to 'In Progress'."

**Trilium DSL query:**
```
#status = 'In Progress'
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "status",
      "type": "label",
      "op": "=",
      "value": "In Progress",
      "logic": "AND"
    }
  ]
}
```

## Part 2: Relation Search Examples

Relations in Trilium Note allow connecting notes to other notes. The MCP supports searching by relations using the `~` syntax with automatic property enhancement.

4) User query: "Show me all the notes that have a template relation."

**Trilium DSL query:**
```
~template
```

**Search Structure:**
```json
{
  "searchCriteria": [
    {
      "property": "template",
      "type": "relation",
      "op": "exists",
      "logic": "AND"
    }
  ]
}
```

5) User query: "Show me all the notes that are linked to the 'Grid View' template."

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