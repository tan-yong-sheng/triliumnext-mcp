# TriliumNext MCP - Enhanced Note Creation Implementation Plan

## Overview

This document outlines the consolidated implementation plan for enhanced note creation capabilities in the TriliumNext MCP server. The plan focuses on a two-phase approach: first implementing `manage_attributes` as a foundation, then enhancing `create_note` with integrated attribute support.

## Implementation Strategy

### Phase 1: manage_attributes Foundation (Week 1-2)

**Objective**: Create robust attribute management capabilities that will serve as the foundation for enhanced note creation.

#### Key Features to Implement:
1. **Core CRUD Operations**
   - Single attribute creation, update, deletion
   - Batch attribute operations (for enhanced create_note)
   - Support for both labels (`#tags`) and relations (`~template`)

2. **Interface Design**
   ```typescript
   interface ManageAttributesParams {
     noteId: string;
     operation: "create" | "update" | "delete" | "batch_create";
     attributes: Attribute[];
   }

   interface Attribute {
     type: "label" | "relation";
     name: string;
     value?: string;  // Optional for relations that reference notes
     position: number;
     isInheritable?: boolean;
   }
   ```

3. **ETAPI Integration**
   - Utilize `/attributes` endpoint (POST, GET, PATCH, DELETE)
   - Handle attribute creation for existing notes
   - Support template relation creation (`~template = "Board"`)

4. **Error Handling**
   - Validate attribute names and values
   - Handle duplicate attributes
   - Provide clear error messages for invalid operations

#### Success Criteria:
- ✅ Can create labels and relations on existing notes
- ✅ Batch operations work efficiently
- ✅ Template relations are properly applied and functional
- ✅ Comprehensive error handling and validation

### Phase 2: Enhanced create_note Integration (Week 3-4)

**Objective**: Enhance the `create_note` function to support optional attributes during creation, providing a seamless one-step user experience.

#### Key Features to Implement:
1. **Backward Compatible Interface**
   ```typescript
   interface EnhancedCreateNoteParams {
     parentNoteId: string;
     title: string;
     type: NoteType;  // Aligned with ETAPI
     content: string;
     mime?: string;
     attributes?: Attribute[];  // New optional parameter
   }
   ```

2. **Internal Architecture**
   ```typescript
   async function create_note_enhanced(params) {
     // Step 1: Create basic note (existing functionality)
     const note = await create_basic_note(params);

     // Step 2: Apply attributes using manage_attributes foundation
     if (params.attributes?.length) {
       await manage_attributes({
         noteId: note.noteId,
         operation: "batch_create",
         attributes: params.attributes
       });
     }

     return enhanced_response(note, params.attributes);
   }
   ```

3. **Note Type Alignment**
   - Update type enum to match ETAPI exactly:
     ```typescript
     type NoteType = "text" | "code" | "render" | "file" | "image" |
                    "search" | "relationMap" | "book" | "noteMap" |
                    "mermaid" | "webView" | "shortcut" | "doc" |
                    "contentWidget" | "launcher";
     ```
   - Remove `canvas` type (not supported by ETAPI)

4. **Performance Optimization**
   - Parallel processing of note creation and attribute preparation
   - Batch attribute creation to minimize HTTP calls
   - Transaction-like error handling

#### Success Criteria:
- ✅ Existing create_note usage remains unchanged
- ✅ New enhanced usage works with optional attributes
- ✅ Template relations applied during creation work correctly
- ✅ Performance optimized (30%+ improvement over manual two-step)

## Detailed Implementation Plan

### Week 1: manage_attributes Core Functionality

#### Day 1-2: Interface Design and Basic Operations
- [ ] Define TypeScript interfaces for manage_attributes
- [ ] Implement single attribute CRUD operations
- [ ] Create basic error handling and validation
- [ ] Write unit tests for core functionality

#### Day 3-4: Batch Operations and Performance
- [ ] Implement batch attribute creation
- [ ] Add parallel processing capabilities
- [ ] Optimize HTTP call patterns
- [ ] Performance testing and optimization

#### Day 5: Integration Testing
- [ ] Test with live TriliumNext instance
- [ ] Verify template relation functionality
- [ ] Test error scenarios and edge cases
- [ ] Documentation updates

### Week 2: manage_attributes Polish and Documentation

#### Day 6-7: Advanced Features
- [ ] Add attribute inheritance support
- [ ] Implement relation target resolution
- [ ] Add attribute validation rules
- [ ] Enhanced error messages and suggestions

#### Day 8-9: Testing and Bug Fixes
- [ ] Comprehensive testing of all operations
- [ ] Edge case handling
- [ ] Performance benchmarking
- [ ] Code review and optimization

#### Day 10: Documentation and Examples
- [ ] Update manage_attributes documentation
- [ ] Create practical examples
- [ ] Update CLAUDE.md with progress
- [ ] Prepare for Phase 2

### Week 3: Enhanced create_note Integration

#### Day 11-12: Interface Enhancement
- [ ] Update create_note interface with optional attributes
- [ ] Implement internal attribute processing
- [ ] Ensure backward compatibility
- [ ] Basic integration testing

#### Day 13-14: Performance Optimization
- [ ] Implement parallel processing
- [ ] Add batch attribute operations
- [ ] Transaction-like error handling
- [ ] Performance testing and tuning

#### Day 15: Template Integration
- [ ] Test template application during creation
- [ ] Verify template functionality
- [ ] Test multiple attribute scenarios
- [ ] Error handling for invalid templates

### Week 4: Final Polish and Documentation

#### Day 16-17: Comprehensive Testing
- [ ] End-to-end testing of enhanced workflows
- [ ] Template functionality verification
- [ ] Performance benchmarking
- [ ] Edge case testing

#### Day 18-19: Documentation and Examples
- [ ] Update create_note documentation
- [ ] Create enhanced usage examples
- [ ] Update CLAUDE.md with final status
- [ ] User guide for enhanced features

#### Day 20: Final Review and Release
- [ ] Code review and optimization
- [ ] Final testing and validation
- [ ] Documentation completeness check
- [ ] Release preparation

## Template Relation Test Plan

### Test Cases to Execute:

#### TC1: Basic Template Application
- **Action**: Create book note with `~template = "Board"`
- **Expected**: Note appears as functional Board template
- **Verification**: Board columns and task management available

#### TC2: Calendar Template Creation
- **Action**: Create book note with `~template = "Calendar"`
- **Expected**: Calendar interface with date navigation
- **Verification**: Monthly/weekly view functionality

#### TC3: Multiple Attributes with Template
- **Action**: Create note with template + labels
- **Expected**: Both template functional and labels searchable
- **Verification**: Template works + labels appear in search

#### TC4: Invalid Template Handling
- **Action**: Create with `~template = "NonExistent"`
- **Expected**: Graceful error with suggestions
- **Verification**: Error message and template recommendations

#### TC5: Template Switching
- **Action**: Create with one template, then change to another
- **Expected**: New template applied correctly
- **Verification**: Template functionality updates properly

## Expected Benefits

### User Experience Improvements
1. **Single-Step Creation**: Users can create notes with templates in one call
2. **Intuitive Interface**: Optional attributes parameter is natural to use
3. **Backward Compatibility**: Existing code continues to work unchanged
4. **Better Organization**: Encourages proper template usage from creation

### Performance Improvements
1. **Reduced Latency**: 30-50% faster than manual two-step approach
2. **Optimized API Calls**: Parallel processing and batch operations
3. **Better Error Handling**: Transaction-like behavior with rollback capability

### Developer Experience
1. **Clean Architecture**: Separation of concerns between creation and attribute management
2. **Reusable Components**: manage_attributes serves multiple use cases
3. **Comprehensive Testing**: Each component tested independently
4. **Clear Documentation**: Practical examples and best practices

## Risk Assessment

### Technical Risks
- **ETAPI Limitations**: Confirmed that attributes require separate endpoint calls
- **Template Functionality**: Templates are relations, need to verify proper application
- **Performance**: Multiple HTTP calls inherent, but can be optimized

### Mitigation Strategies
- **Modular Design**: Each component can be tested and optimized independently
- **Error Handling**: Comprehensive validation and graceful failure modes
- **Backward Compatibility**: Existing functionality preserved during enhancement

## Success Metrics

### Functional Metrics
- [ ] All basic CRUD operations work for manage_attributes
- [ ] Batch operations reduce HTTP calls by 30%+
- [ ] Enhanced create_note maintains backward compatibility
- [ ] Template relations work correctly in all test cases

### Performance Metrics
- [ ] Enhanced creation is 30% faster than manual two-step
- [ ] Attribute operations complete within acceptable latency
- [ ] Memory usage remains within acceptable limits
- [ ] Error handling doesn't significantly impact performance

### User Experience Metrics
- [ ] Users can create notes with templates in single call
- [ ] Error messages are clear and actionable
- [ ] Documentation provides practical examples
- [ ] Existing workflows remain unchanged

## Related Documentation

- [manage_attributes Design](./manage-attributes-design.md) - Detailed attribute management specification
- [Note Types Reference](./note-types.md) - Updated note type enumeration
- [ETAPI OpenAPI Specification](../openapi.yaml) - Official API documentation
- [Implementation Examples](./implementation-examples.md) - Practical code examples

## Next Steps

1. **Begin Phase 1 Implementation**: Start with manage_attributes core functionality
2. **Set Up Testing Environment**: Prepare TriliumNext instance for validation
3. **Establish Performance Baselines**: Measure current performance for comparison
4. **Create Test Scripts**: Automated testing for template functionality

This plan provides a clear roadmap for implementing enhanced note creation capabilities while maintaining code quality, performance, and user experience standards.