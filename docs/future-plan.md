# Future Development Plan for TriliumNext MCP

This document outlines planned features and enhancements for the TriliumNext MCP server.

## High Priority Features

### 1. Advanced Search Templates
- Pre-built search templates for common use cases
- Template system for complex queries
- User-customizable search patterns
- Support regex search


### 2. search_replace feature
- Performs search-and-replace operations in a note.
- Proposed arguments: targetType, replacements, useRegex?, replaceAll?


### 3. Documentation Discovery Function (`get_documentation` or `get_help`)

**Purpose**: Provide users with comprehensive guidance on what they can accomplish using the TriliumNext MCP server.

**Challenge**: How to mantain docs of different versions for different users (e.g., breaking change in function name, etc...)?

**Implementation Plan**:
- Create a new MCP tool function that fetches documentation from a static GitHub raw URL
- URL would point to a comprehensive guide (e.g., `https://raw.githubusercontent.com/user/repo/main/docs/user-guide.md`)
- Function would cache the documentation locally for performance
- Support for different documentation sections (getting started, examples, troubleshooting)

**Benefits**:
- **User Discovery**: Helps users understand the full capabilities of the MCP server
- **Self-Service Help**: Reduces support burden by providing instant access to documentation
- **Up-to-Date Info**: GitHub-hosted docs can be updated independently of MCP releases
- **Context-Aware**: AI assistants can reference current documentation when helping users

**Technical Approach**:
```typescript
// Tool definition
{
  name: "get_documentation",
  description: "Get comprehensive documentation and examples for TriliumNext MCP capabilities",
  inputSchema: {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["overview", "getting-started", "examples", "troubleshooting", "api-reference"],
        description: "Specific documentation section to retrieve",
        default: "overview"
      }
    }
  }
}

// Implementation would:
// 1. Fetch from GitHub raw URL with caching
// 2. Parse markdown sections if needed
// 3. Return formatted documentation
// 4. Handle network errors gracefully with cached fallback
```

**Documentation Structure** (GitHub-hosted):
- **Overview**: What TriliumNext MCP can do
- **Getting Started**: Setup and basic usage
- **Examples**: Common use cases and code samples
- **API Reference**: Complete tool documentation
- **Troubleshooting**: Common issues and solutions

**Advantages of This Approach**:
- ✅ **Always Current**: Documentation updates don't require MCP releases
- ✅ **Version Control**: Documentation changes are tracked in Git
- ✅ **Collaborative**: Multiple contributors can improve docs
- ✅ **Discoverable**: Users can find capabilities they didn't know existed
- ✅ **AI-Friendly**: Assistants can provide better help with current info

## Medium Priority Features

### 4. Attribute Management System - **NEEDS REIMPLEMENTATION**

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
- **Performance**: Bulk operations should be efficient for large note collections

## Timeline

**Phase 1** (Immediate): Documentation discovery function
**Phase 2** (Next): Relation search support completion
**Phase 3** (Future): Label and relation management tools
**Phase 4** (Advanced): Bulk operations and analytics features

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