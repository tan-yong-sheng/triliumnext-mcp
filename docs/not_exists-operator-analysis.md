# Analysis: `not_exists` vs `!=` Operators for Label Searches in TriliumNext MCP

## Overview

This document provides a detailed analysis of how the `not_exists` and `!=` operators work differently for label searches in the TriliumNext MCP server. The distinction is crucial for correct search functionality.

## Key Findings

### 1. **CORRECT USAGE: `not_exists` operator**

**Purpose**: Find notes that do NOT have a specific label at all

**JSON Structure**:
```json
{
  "property": "collection",
  "type": "label",
  "op": "not_exists",
  "logic": "AND"
}
```

**Generated Trilium Query**: `#!collection`

**Meaning**: Find all notes that do NOT have the `#collection` label attached to them

**Use Case**: When you want to exclude notes with a specific label, e.g., "find all notes that are not part of any collection"

---

### 2. **INCORRECT USAGE: `!=` operator for label existence**

**Purpose**: Find notes that HAVE the label but with a different value (rare use case)

**JSON Structure**:
```json
{
  "property": "collection",
  "type": "label",
  "op": "!=",
  "value": "collection",
  "logic": "AND"
}
```

**Generated Trilium Query**: `#collection != 'collection'`

**Meaning**: Find notes that HAVE the `#collection` label BUT the label's value is NOT exactly "collection"

**Why This Is Wrong**: This is a very specific edge case that most users don't intend. It only matches notes that actually have the label but exclude those with a specific value.

---

### 3. **CORRECT USAGE: `!=` operator for note properties**

**Purpose**: Find notes where a note property has a specific value

**JSON Structure**:
```json
{
  "property": "type",
  "type": "noteProperty",
  "op": "!=",
  "value": "book",
  "logic": "AND"
}
```

**Generated Trilium Query**: `note.type != 'book'`

**Meaning**: Find all notes where the note type is not "book"

**Use Case**: When you want to filter by note properties like type, mime, dateCreated, etc.

## Implementation Details

### Code Analysis (searchQueryBuilder.ts)

The key logic is in the `buildAttributeQuery` function:

```typescript
switch (op) {
  case 'not_exists':
    return `${prefix}!${escapedName}`;  // Generates #!collection
  case '!=':
    return `${prefix}${escapedName} != '${value.replace(/'/g, "\\'")}'`;  // Generates #collection != 'collection'
}
```

### Operator Semantics

| Operator | Purpose | For Labels | For Note Properties |
|----------|---------|------------|-------------------|
| `not_exists` | Check if property exists at all | ✅ **CORRECT**: `#!collection` | ✅ **CORRECT**: `note.isArchived != true` |
| `!=` | Check property value when it exists | ⚠️ **EDGE CASE**: `#collection != 'value'` | ✅ **CORRECT**: `note.type != 'book'` |
| `exists` | Check if property exists | ✅ **CORRECT**: `#collection` | ✅ **CORRECT**: `note.isArchived = true` |

## Practical Examples

### Example 1: Find notes without a specific label
```json
{
  "searchCriteria": [
    {"property": "private", "type": "label", "op": "not_exists", "logic": "AND"}
  ]
}
```
**Query**: `#!private`
**Meaning**: Find all notes that are not marked as private

### Example 2: Find notes without label A but with label B
```json
{
  "searchCriteria": [
    {"property": "private", "type": "label", "op": "not_exists", "logic": "AND"},
    {"property": "important", "type": "label", "op": "exists", "logic": "AND"}
  ]
}
```
**Query**: `#!private #important`
**Meaning**: Find notes that are not private but are important

### Example 3: Find notes with status label but status != "completed"
```json
{
  "searchCriteria": [
    {"property": "status", "type": "label", "op": "exists", "logic": "AND"},
    {"property": "status", "type": "label", "op": "!=", "value": "completed", "logic": "AND"}
  ]
}
```
**Query**: `#status #status != 'completed'`
**Meaning**: Find notes that have a status but the status is not "completed"

## User Guidance

### ✅ **DO THIS**: When you want to find notes WITHOUT a label
```json
{"property": "labelname", "type": "label", "op": "not_exists", "logic": "AND"}
```

### ❌ **DON'T DO THIS**: When you want to find notes WITHOUT a label
```json
{"property": "labelname", "type": "label", "op": "!=", "value": "labelname", "logic": "AND"}
```

### ✅ **DO THIS**: When you want to find notes with a label that has a specific value
```json
{"property": "labelname", "type": "label", "op": "!=", "value": "unwanted", "logic": "AND"}
```

## TriliumNext Search Syntax Mapping

| JSON | Trilium Query | Meaning |
|------|---------------|---------|
| `{"property":"collection","type":"label","op":"not_exists"}` | `#!collection` | Notes without #collection label |
| `{"property":"collection","type":"label","op":"exists"}` | `#collection` | Notes with #collection label |
| `{"property":"collection","type":"label","op":"!=","value":"value"}` | `#collection != 'value'` | Notes with #collection label but value != 'value' |
| `{"property":"type","type":"noteProperty","op":"!=","value":"book"}` | `note.type != 'book'` | Notes where type is not book |

## Conclusion

The user's assessment is **CORRECT**:

- **Wrong**: `{"property":"collection","type":"label","op":"!=","value":"collection","logic":"AND"}`
- **Correct**: `{"property":"collection","type":"label","op":"not_exists", "logic":"AND"}`

**Reason**: The `not_exists` operator checks if the label exists at all (generates `#!collection`), while the `!=` operator assumes the label exists and checks its value (generates `#collection != 'collection'`). For most use cases where users want to find notes without a specific label, `not_exists` is the correct operator.