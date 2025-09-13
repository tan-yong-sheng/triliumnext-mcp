# Reference Documentation

This document provides comprehensive reference information for the unified searchCriteria structure and migration guidance from previous implementations.

---

## Critical Testing Notes

### ✅ IMPLEMENTED: Unified Boolean Logic

**Implementation Benefits Achieved**:
- ✅ **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic
- ✅ **No artificial barriers**: Between search criteria types (attributes vs noteProperties)
- ✅ **Unified logic**: Single consistent logic system across all criteria
- ✅ **LLM-friendly**: Single array structure, consistent field names
- ✅ **ISO date format enforcement**: MCP interface requires exact ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ) to prevent LLM guessing errors
- ✅ **OR logic**: All search criteria can be mixed with per-item `logic: "OR"`

**Implementation Examples**:
- **Current Structure**: `{"searchCriteria": [{"property": "book", "type": "label", "op": "exists", "logic": "OR"}, {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-01-01"}]}`
- **Cross-Type OR**: `{"searchCriteria": [{"property": "template.title", "type": "relation", "op": "=", "value": "Grid View", "logic": "OR"}, {"property": "dateCreated", "type": "noteProperty", "op": ">=", "value": "2024-12-13"}]}`

**Important Change**: Smart date expressions (e.g., `TODAY-7`, `MONTH-1`) are NO LONGER supported in the MCP interface. Only exact ISO dates are accepted to ensure LLM consistency and prevent incorrect date calculations.

---

## resolve_note_id Examples (Simplified Implementation)

The `resolve_note_id` function has been simplified to focus on title-based search with user choice workflow for multiple matches.

### Current Parameters
- **noteName**: Note name/title to find (required)
- **exactMatch**: Require exact title match (default: false)
- **maxResults**: Maximum results in topMatches (default: 3)
- **autoSelect**: Auto-select best match vs user choice (default: false)

### Simple Prioritization
1. **Exact title matches** (highest priority)
2. **Folder-type notes (book)** (second priority)
3. **Most recent** (fallback)

### Simple Title-Based Search

The `resolve_note_id` function now uses simple title-based search only:
- Searches using `note.title contains 'searchTerm'`
- No template or type filtering
- Simple prioritization: exact matches → folders → most recent
- For complex searches, use `search_notes` with full searchCriteria support

### Key Benefits

1. **Simplified**: Focus on title-based search for note ID resolution
2. **Fast**: Simple search pattern for quick note identification
3. **User-friendly**: Supports both auto-selection and user choice workflows
4. **Clear separation**: Complex searches handled by `search_notes`, simple resolution by `resolve_note_id`
5. **Reliable**: Consistent behavior with simple prioritization logic

**Status**: ✅ **COMPLETED** - Simplified implementation with title-based search and user choice workflow

### 87) Fallback Suggestions for Failed Searches

When title-based searches return no results, `resolve_note_id` provides fallback suggestions:

#### Example: Failed Title Search
- Simple resolve_note_id usage
```json
{
  "noteName": "nonexistent"
}
```
- Response when no results found
```json
{
  "noteId": null,
  "title": null,
  "found": false,
  "matches": 0,
  "nextSteps": "No notes found matching the search criteria. Consider using search_notes for broader results: search_notes(text: 'nonexistent') to find notes containing 'nonexistent' in title or content."
}
```
- Use case: When title search fails, suggests using search_notes for broader content-based search

### Key Benefits of Fallback Guidance
1. **User-friendly**: Prevents dead-end searches with actionable suggestion
2. **Clear workflow**: Directs users to appropriate tool for broader searches
3. **Separation of concerns**: `resolve_note_id` for simple resolution, `search_notes` for complex searches
4. **Reduces confusion**: Clear guidance on next steps when simple search fails

### Missing TriliumNext Features
1. **Regex search** (`%=` operator) - not implemented
2. **Smart date expressions** (TODAY-30, MONTH+1) - not implemented
3. **✅ Relation searches** (`~author.title`) - **IMPLEMENTED**
4. **Negation operators** (`#!label`) - not implemented

### Recommended Next Steps
1. **✅ COMPLETED** - Unified searchCriteria structure with complete boolean logic
2. **Test unified implementation** - Verify cross-type OR logic works correctly (examples 1-10)
3. **Consider implementing regex and smart date features** for completeness with TriliumNext native capabilities
4. **Performance testing** - Ensure unified searchCriteria approach maintains good search performance

## SearchCriteria Parameter Reference

The unified `searchCriteria` parameter handles all search criteria types:
- `text` parameter: Full-text indexed search (bare tokens, faster)
- `searchCriteria` parameter: Unified array for all search criteria types
  - **Type: "label"**: User-defined labels (#book, #author) - user-defined tags and categories
  - **Type: "relation"**: User-defined relations (~author.title) - connections between notes
  - **Type: "noteProperty"**: System properties (isArchived, type, dateCreated, title, content, hierarchy navigation) - built into every note
  - **Type: "fulltext"**: Full-text search tokens (alternative to text parameter)
  - **Supported operators**: exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with, regex
  - **Per-item logic**: Each item can specify `logic: "OR"` to create OR groups with the next item
  - **Default logic**: AND when logic not specified (matches TriliumNext behavior)
  - **Complete boolean expressiveness**: Can represent any TriliumNext query including cross-type OR logic

**Field Mapping**:
- **Labels**: `#property` syntax - any user-defined label name
- **Relations**: `~property` syntax - any user-defined relation name, supports nested (author.title)
- **Note Properties**: `note.property` syntax - system properties like note.isArchived, note.type, note.title, note.content, note.dateCreated
- **Hierarchy Navigation**: `note.parents.title`, `note.children.title`, `note.ancestors.title`, `note.parents.parents.title` - navigate note hierarchy relationships
- **Full-text**: bare token for indexed search

**Critical**: Trilium requires an "expression separator sign" (`~` or `#`) before parentheses when they start an expression - this is automatically handled by the searchQueryBuilder for OR queries

---

## Testing Status

### Testing Status
- ⚠️ **NEEDS TESTING**: Regex search examples in `docs/search-query-examples.md` need validation against actual TriliumNext instances
- ⚠️ **NEEDS TESTING**: Relation search examples in `docs/search-query-examples.md` (examples 63-70) need validation against actual TriliumNext instances
- ⚠️ **UNTESTED**: Attribute search examples from "## Attribute Search Examples" section (examples 24-33) have not been tested against actual TriliumNext instances
- ⚠️ **UNTESTED**: Two-parameter approach with per-item logic needs validation
- ✅ **COMPLETED**: Field-specific search unification - `filters` parameter removed and `title`/`content` moved to `noteProperties`
- ✅ **UPDATED**: All documentation examples migrated from `filters` to `noteProperties` syntax (examples 12-23, 47-52)
- ✅ **RESEARCHED**: Date parameter unification feasibility - confirmed TriliumNext native support for date properties and smart date expressions
- ✅ **DOCUMENTED**: Date search examples (examples 55-62) showing unified noteProperties approach with smart dates and UTC support
- ✅ **IMPLEMENTED**: Date parameter unification - removed legacy date parameters and unified into noteProperties with smart date support
- ✅ **MIGRATED**: All date examples (1-11, 18, 32) updated to use noteProperties syntax with smart date expressions
- ✅ **IMPLEMENTED - UNTESTED**: Relation search support - full implementation with comprehensive examples and updated schemas, but not validated against live TriliumNext instances
- **Reminder**: All attribute and relation examples need validation to ensure the generated Trilium search strings work correctly with the ETAPI
- **Priority**: Test unified `noteProperties` implementation and new relation search functionality
- **Next**: Consider performance testing of unified approach vs legacy specialized parameters

---

## Split File Structure Summary

The original large documentation file has been split into 6 focused files:

1. **basic-search.md**: Function contract, basic examples (1-10), and core concepts
2. **content-and-properties.md**: Content searches (title/content) and note property searches (11-52)
3. **attributes-and-relations.md**: Attribute searches (labels) and relation searches (21-40)
4. **advanced-queries.md**: Regex patterns, note types, MIME types, and complex OR logic (73-90)
5. **hierarchy-and-dates.md**: Hierarchy navigation and date searches (31-37, 55-62)
6. **reference-and-migration.md**: Documentation, migration guide, and testing status

This structure maintains all original content while providing logical organization and preventing future file proliferation.