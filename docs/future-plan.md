# Future Development Plan for TriliumNext MCP

This document outlines planned features and enhancements for the TriliumNext MCP server.

## High Priority Features

### 1. Double check search notes by relation (~author.title)

**Status**: Currently implemented, but still needs testing if it works properly or not

## Medium Priority Features

### 2. Attribute Management System - **NEEDS REIMPLEMENTATION**

**Status**: Removed due to reliability issues - requires redesign and testing

**Reliability Issues Identified**:
- ❌ **List operation confusion**: Implementation unclear about noteId requirements vs database-wide discovery
- ❌ **ETAPI compatibility concerns**: Uncertain reliability with TriliumNext External API endpoints
- ❌ **Error handling gaps**: Insufficient validation and error recovery mechanisms  
- ❌ **Testing gaps**: Insufficient validation against actual TriliumNext instances
- ❌ **User experience issues**: Confusing operation semantics (list vs get operations)

**Future Implementation Requirements**:
- **Thorough ETAPI testing**: Validate all operations against live TriliumNext instances
- **Clear operation semantics**: Redesign with unambiguous operation purposes and requirements
- **Comprehensive error handling**: Robust validation and user-friendly error messages
- **Progressive rollout**: Implement and test one operation at a time (starting with read-only operations)
- **Documentation first**: Complete API documentation before implementation
- **User feedback integration**: Design based on actual user needs and workflows

**Proposed Features for Future Implementation**:
- ⏳ `list_attributes`: Database-wide attribute discovery with clear semantics
- ⏳ `get_attribute`: Specific attribute instance details with attributeId
- ⏳ `create_attribute`: Add labels and relations with full validation
- ⏳ `update_attribute`: Modify existing attributes with constraint checking
- ⏳ `delete_attribute`: Remove attributes with safety confirmations

After adding this function to manage attributes, create_note(), update_note() should natively support adding labels + relation...


### 3. Negation Support Enhancement for search_note() function

**Status**: Future consideration - `not()` syntax support

**Current Implementation**:
- ✅ **`!=` operator**: Already implemented for attributes and noteProperties (e.g., `note.type != 'archived'`, `#status != 'completed'`)
- ✅ **`not_exists` operator**: Available for attributes to check absence (e.g., `#private not_exists`)
- ✅ **`not_equal` operator**: Available for title/content searches in noteProperties

**Proposed Enhancement**:
- ⏳ **`not()` function syntax**: Support TriliumNext's `not()` wrapper for complex negation expressions
- ⏳ **Examples**: `not(#book OR #article)`, `not(note.isArchived = true AND note.type = 'text')`
- ⏳ **Benefits**: More intuitive negation of complex grouped conditions vs. current De Morgan's law transformations

**Implementation Considerations**:
- **TriliumNext compatibility**: Verify `not()` function support in current TriliumNext versions
- **Query builder enhancement**: Extend searchQueryBuilder to handle `not()` wrapper syntax
- **User interface**: Design schema for specifying negation at expression group level
- **Documentation**: Provide clear examples showing `not()` vs. existing `!=` approaches

**Priority**: Low - existing `!=` and `not_exists` operators cover most negation use cases effectively

### 4. OrderBy/Sorting Support for search_notes() function - **NEEDS REIMPLEMENTATION** (But perhaps not support natively for noteProperties like what I think before, so may not be re-implemented if still don't know its rule)

**Status**: Removed due to complexity and inconsistencies - requires redesign and testing

**Issues Identified**:
- ❌ **Query generation complexity**: Structured orderBy created complex query building logic with multiple edge cases
- ❌ **TriliumNext compatibility issues**: Uncertain behavior with different combinations of note properties and attributes in sorting
- ❌ **Expression separator conflicts**: Confusion with `~` prefix usage for OR expressions vs sorting requirements
- ❌ **LLM consistency challenges**: Despite structured approach, still prone to user confusion about field naming
- ❌ **FastSearch integration**: Additional complexity in fastSearch logic detection with sorting parameters

**Future Implementation Requirements**:
- **Simple string-based approach**: Return to simple `orderBy: string` parameter format for better reliability
- **TriliumNext validation**: Comprehensive testing of orderBy syntax with live TriliumNext instances
- **Clear documentation**: Explicit examples showing valid orderBy patterns and field names
- **Error handling**: Graceful handling of invalid orderBy syntax rather than complex validation
- **Reduced complexity**: Focus on common use cases rather than comprehensive sorting capabilities

**Proposed Features for Future Implementation**:
- ⏳ **Simple orderBy parameter**: `"orderBy": "note.dateModified desc"` format
- ⏳ **Basic sorting**: Support for note properties (`note.dateCreated`, `note.title`) only initially
- ⏳ **Validation removal**: Let TriliumNext handle orderBy validation rather than pre-validating
- ⏳ **Clear field mapping**: Simple documentation showing exact field names to use
- ⏳ **Progressive enhancement**: Add attribute sorting (`#label desc`) only after note property sorting is stable

**Implementation Strategy**:
1. **Research phase**: Test simple orderBy strings directly with TriliumNext to understand native behavior
2. **Basic implementation**: Add simple string orderBy parameter without complex validation
3. **Testing phase**: Validate common orderBy patterns with real TriliumNext instances
4. **Documentation**: Create clear examples showing working orderBy syntax
5. **Gradual enhancement**: Add more advanced sorting only after basic implementation is proven stable

**Why Simple Approach is Better**:
- ✅ **Matches TriliumNext native syntax**: Direct string format aligns with TriliumNext documentation examples
- ✅ **Reduced complexity**: No complex query building logic or interface definitions needed
- ✅ **Easier debugging**: Query issues are immediately visible in debug output
- ✅ **Better reliability**: Less chance for edge cases and parameter interaction issues
- ✅ **Lower maintenance**: Fewer moving parts and integration points


**Implementation Strategy**:
1. **Research phase**: Comprehensive ETAPI endpoint analysis and testing
2. **Design phase**: Clear API design with unambiguous operation semantics  
3. **Read-only phase**: Implement and test list/get operations first
4. **Write operations phase**: Add create/update/delete with extensive validation
5. **Integration testing**: Full workflow testing with real TriliumNext instances
6. **Documentation and guides**: Complete usage documentation with examples


## Implementation Notes

### Documentation Function Requirements
- **Error Handling**: Graceful fallback to cached/local docs if GitHub is unavailable
- **Caching Strategy**: Local cache with TTL to balance freshness and performance
- **Content Validation**: Ensure fetched documentation is valid and safe
- **Rate Limiting**: Respect GitHub API limits and implement appropriate backoff

### Future Architecture Considerations
- Maintain backward compatibility with existing tools
- Design APIs for extensibility
- Consider performance impact of new features
- Ensure robust error handling and logging

### Relation and Label Management Considerations
- **ETAPI Compatibility**: Ensure all operations work within TriliumNext's External API limitations
- **Atomic Operations**: Label/relation changes should be transactional where possible
- **Permission Handling**: Respect note protection and access controls
- **Conflict Resolution**: Handle concurrent modifications gracefully
- **Data Integrity**: Validate relation targets and label constraints

## Timeline

**Phase 1** (Immediate): Documentation discovery function
**Phase 2** (Next): Relation search support completion
**Phase 3** (Future): Label and relation management tools

## Implementation Status

**Current**: Two-parameter search architecture with per-item logic support
**Implemented**: Labels search (`#book`, `#author OR #editor`), note properties search
**Ready for**: Relation search implementation in attributes parameter
**Proposed**: Full CRUD operations for both labels and relations

---

**Note**: All relation and label management features are proposals and not determined plans yet. Implementation will depend on:
- User feedback and demand
- ETAPI capabilities and limitations  
- Technical feasibility assessment
- Resource availability and priorities

*This plan is subject to change based on user feedback and technical constraints.*


---

## DISPOSED PLAN:

### search_and_replace feature [Don't want, it's hard to implement because Trilium Note doesn't support it natively]
- Performs search-and-replace operations in a note.
- Proposed arguments: targetType, replacements, useRegex?, replaceAll?

