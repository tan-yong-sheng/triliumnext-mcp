# Hierarchy Navigation and Date Search Examples

This document covers hierarchy navigation through note relationships and enhanced date search capabilities using the unified searchCriteria structure.

---

## Hierarchy Navigation Examples (Unified searchCriteria Structure)

The unified `search_notes` function supports hierarchy navigation through the `searchCriteria` parameter using hierarchy-specific note properties.

### 31) Find notes with a specific parent name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Task Board"}
  ]
}
```
- Composed query
```
note.parents.title = 'Task Board'
```
- Use case: Find all notes that have a parent named "Task Board"

### 32) Find notes with a specific child name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "children.title", "type": "noteProperty", "op": "=", "value": "Task Board"}
  ]
}
```
- Composed query
```
note.children.title = 'Task Board'
```
- Use case: Find all notes that have a child named "Task Board"

### 33) Find notes with a specific ancestor name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Books"}
  ]
}
```
- Composed query
```
note.ancestors.title = 'Books'
```
- Use case: Find all notes that have an ancestor named "Books" (recursive search up the hierarchy)

### 34) Find notes with a specific grandparent name
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.parents.title", "type": "noteProperty", "op": "=", "value": "Project Root"}
  ]
}
```
- Composed query
```
note.parents.parents.title = 'Project Root'
```
- Use case: Find all notes whose grandparent is named "Project Root"

### 35) Combined hierarchy navigation with content search
- Unified Structure
```json
{
  "text": "docker",
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Development"}
  ]
}
```
- Composed query
```
docker note.parents.title = 'Development'
```
- Use case: Find notes containing "docker" that have a parent named "Development"

### 36) Multiple hierarchy conditions with OR logic
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "parents.title", "type": "noteProperty", "op": "=", "value": "Active Projects", "logic": "OR"},
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Archive"}
  ]
}
```
- Composed query
```
~(note.parents.title = 'Active Projects' OR note.ancestors.title = 'Archive')
```
- Use case: Find notes that either have "Active Projects" as parent OR "Archive" as ancestor

### 37) Hierarchy navigation with date filtering
- Unified Structure
```json
{
  "searchCriteria": [
    {"property": "ancestors.title", "type": "noteProperty", "op": "=", "value": "Workspace", "logic": "AND"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-12-01"}
  ]
}
```
- Composed query
```
note.ancestors.title = 'Workspace' note.dateModified >= '2024-12-01'
```
- Use case: Find all notes under "Workspace" ancestor that were modified recently

---

## Date Search Examples (Using searchCriteria with ISO Format)

### MCP Date Properties Reference
- **Date properties**: `dateCreated`, `dateModified` - note creation and modification timestamps
- **Supported operators**: `>=`, `<=`, `>`, `<`, `=`, `!=` for comparison operations
- **Required date format**: ISO date strings only - `'YYYY-MM-DD'` (e.g., '2024-01-01') or `'YYYY-MM-DDTHH:mm:ss.sssZ'` (e.g., '2024-01-01T00:00:00.000Z')
- **Smart date expressions**: NOT allowed in MCP interface (TriliumNext supports them natively, but MCP enforces ISO format for consistency)

### 55) Created in last 7 days (ISO date approach)
- Composed query
```
note.dateCreated >= '2024-12-13'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```
- Use case: Find recently created notes using exact ISO date (calculate date 7 days ago)

### 56) Created between specific dates (noteProperties approach)
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": "<", "value": "2024-12-31"}
  ]
}
```
- Use case: Date range queries with precise ISO date boundaries

### 57) Modified in last month (ISO date)
- Composed query
```
note.dateModified >= '2024-11-20'
```
- Search Structure
```json
{
  "searchCriteria": [
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-11-20"}
  ]
}
```
- Use case: Find recently modified notes using exact ISO date (calculate date 30 days ago)

### 58) Created OR modified in last week (unified OR logic with ISO dates)
- Composed query
```
~(note.dateCreated >= '2024-12-13' OR note.dateModified >= '2024-12-13')
```
- Search Structure with per-item OR logic
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13", "logic": "OR"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}
  ]
}
```
- Use case: Find notes with recent activity (created or modified) using exact ISO dates

### 59) Advanced date combinations with other properties (ISO dates)
- Composed query
```
note.type = 'text' AND note.dateCreated >= '2024-11-20' AND note.labelCount > 0
```
- Search Structure combining dates with other properties
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-11-20", "logic": "AND"},
    {"property": "labelCount", "type": "noteProperty", "op": ">", "value": "0"}
  ]
}
```
- Use case: Find well-tagged text notes created in the last month using exact ISO dates

### 61) Complex date logic with content search
- Composed query
```
kubernetes ~(note.dateCreated >= 'YEAR-1' OR note.dateModified >= 'MONTH-3') AND note.type = 'text'
```
- Search Structure with mixed search criteria
```json
{
  "text": "kubernetes",
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "YEAR-1", "logic": "OR"},
    {"property": "dateModified", "type": "noteProperty", "op": ">=", "value": "MONTH-3", "logic": "AND"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
  ]
}
```
- Use case: Find kubernetes-related text notes with recent activity

### 62) Date range with exclusions
- Composed query
```
note.dateCreated >= '2024-01-01' AND note.dateCreated < '2024-12-31' AND note.dateModified != '2024-06-15'
```
- Search Structure with date ranges and exclusions
```json
{
  "searchCriteria": [
    {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01", "logic": "AND"},
    {"property": "dateCreated", "type": "noteProperty", "op": "<", "value": "2024-12-31", "logic": "AND"},
    {"property": "dateModified", "type": "noteProperty", "op": "!=", "value": "2024-06-15"}
  ]
}
```
- Use case: Find notes in date range excluding specific modification dates