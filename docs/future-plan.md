# Future Development Plan for TriliumNext MCP

This document outlines planned features and enhancements for the TriliumNext MCP server.

## High Priority Features

### 1. Documentation Discovery Function (`get_documentation` or `get_help`)

**Purpose**: Provide users with comprehensive guidance on what they can accomplish using the TriliumNext MCP server.

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

### 2. Relation Support and Management

**Purpose**: Complete support for Trilium's relation system - the second major type of user-defined metadata alongside labels.

**Search Support Proposals**:
- Implement `type: "relation"` in the attributes parameter
- Support for relation queries like `~author.title *= 'Tolkien'`
- Complex relation chains: `~author.relations.son.title = 'Christopher Tolkien'`
- Relation-based hierarchy navigation and discovery

**Relation Management Operations** (Proposals):
- `list_relations`: Get all unique relation names used across notes (similar to `list_labels`)
- `create_relation`: Establish new relations between notes
- `update_relation`: Modify existing relation properties or targets
- `delete_relation`: Remove relations between notes
- `get_note_relations`: List all relations for a specific note (incoming and outgoing)

**Technical Considerations**:
- Relations are bidirectional in Trilium - need to handle both directions
- Relation target validation (ensure target notes exist)
- Relation type validation against Trilium's relation system
- Performance implications of relation traversal queries

### 3. Label Management System

**Purpose**: Comprehensive label lifecycle management beyond just searching.

**Label Management Operations** (Proposals):
- `create_label`: Add new labels to notes with optional values
- `update_label`: Modify label values on existing notes  
- `delete_label`: Remove labels from notes (with safety checks)
- `bulk_label_operations`: Batch operations for efficiency
- `get_label_usage`: Analyze label usage patterns and statistics
- `rename_label`: Rename labels across all notes (global operation)

**Advanced Label Features** (Proposals):
- Label inheritance and propagation rules
- Label templates for consistent tagging
- Label validation and constraints
- Label relationship mapping (which labels commonly appear together)

### 4. Advanced Search Templates
- Pre-built search templates for common use cases
- Template system for complex queries
- User-customizable search patterns

### 5. Bulk Operations
- Batch note creation/updates
- Bulk tagging and organization
- Mass export/import capabilities

### 6. Enhanced Content Processing
- Better Markdown detection and conversion
- Support for additional content types
- Content transformation utilities

## Low Priority Features

### 6. Search Query Optimization
- Query performance analysis
- Automatic query optimization suggestions
- Search result caching

### 7. Integration Enhancements
- Webhook support for real-time updates
- Integration with external note-taking systems
- Advanced synchronization capabilities

### 8. Analytics and Insights
- Note usage statistics
- Search pattern analysis
- Content organization insights

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