# Advanced Search Examples

This document covers advanced search patterns including regex searches, note type and MIME type filtering, and complex OR logic expressions.

---


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
