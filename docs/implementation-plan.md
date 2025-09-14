# TriliumNext MCP - Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for integrating two major enhancements into the TriliumNext MCP codebase:

1. **Enhanced create_note with nextStep suggestions** - Intelligent workflow guidance
2. **manage_attributes function** - Unified attribute management system

## Current Codebase Analysis

### Architecture Pattern
```
src/
├── index.ts                    # Main server with tool routing
├── modules/
│   ├── toolDefinitions.ts     # Tool schemas and permissions
│   ├── noteHandler.ts         # Request handlers (permission checks)
│   ├── noteManager.ts         # Business logic (API calls)
│   ├── searchHandler.ts       # Search request handling
│   ├── searchManager.ts       # Search business logic
│   ├── resolveHandler.ts      # Note resolution handling
│   ├── contentProcessor.ts    # Content processing utilities
│   ├── noteFormatter.ts       # Response formatting
│   └── responseUtils.ts       # Response utilities
```

### Key Integration Points
- **Tool Registration**: `index.ts` lines 90-116 (switch statement)
- **Permission System**: `PermissionChecker` interface used throughout
- **Response Format**: Consistent `{ content: Array<{ type: string; text: string }> }` pattern
- **Error Handling**: `McpError` with `ErrorCode` enum
- **Axios Instance**: Shared across all modules

## Phase 1: Enhanced create_note Implementation

### 1.1 New Files to Create

#### `src/modules/nextStepTypes.ts`
```typescript
// TypeScript interfaces for nextStep functionality
export interface NextStepSuggestion {
  suggested: boolean;
  operation: "manage_attributes";
  reason: string;
  attributes: SuggestedAttribute[];
  priority: "low" | "medium" | "high";
  examples: {
    curl: string;
    mcp: string;
  };
}

export interface SuggestedAttribute {
  type: "label" | "relation";
  name: string;
  value: string;
  position: number;
  description: string;
}

export interface NextStepConfig {
  enabled: boolean;
  level: "minimal" | "standard" | "comprehensive";
  includeExamples: boolean;
  maxSuggestions: number;
}
```

#### `src/modules/nextStepAnalyzer.ts`
```typescript
// Analysis engine for nextStep suggestions
import { NextStepSuggestion, SuggestedAttribute, NextStepConfig } from "./nextStepTypes.js";

export class NextStepAnalyzer {
  private config: NextStepConfig;
  
  constructor(config?: Partial<NextStepConfig>) {
    this.config = {
      enabled: true,
      level: "standard",
      includeExamples: true,
      maxSuggestions: 3,
      ...config
    };
  }
  
  analyzeNote(note: any, branch: any): NextStepSuggestion | null {
    // Implementation of analysis logic
  }
  
  private checkNoteType(note: any): NextStepSuggestion | null {
    // Note type-based suggestions
  }
  
  private checkContent(note: any): NextStepSuggestion | null {
    // Content-based suggestions
  }
  
  private checkMimeType(note: any): NextStepSuggestion | null {
    // MIME type-based suggestions
  }
}
```

### 1.2 Files to Modify

#### `src/modules/noteManager.ts`
**Changes Required:**
- Update `NoteCreateResponse` interface to include full note data and nextStep
- Modify `handleCreateNote` to return complete note and branch data
- Integrate nextStep analysis after successful note creation

**New Interface:**
```typescript
export interface NoteCreateResponse {
  noteId: string;
  message: string;
  note: any;                    // Full note data from API
  branch: any;                  // Branch data from API
  nextStep?: NextStepSuggestion; // New optional field
}
```

**Modified Function:**
```typescript
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse> {
  // ... existing logic ...
  
  const response = await axiosInstance.post("/create-note", {
    parentNoteId,
    title,
    type,
    content,
    mime,
  });

  // Get full note and branch data
  const note = response.data.note;
  const branch = response.data.branch;
  
  // Analyze for nextStep suggestions
  const analyzer = new NextStepAnalyzer();
  const nextStep = analyzer.analyzeNote(note, branch);
  
  return {
    noteId: note.noteId,
    message: `Created note: ${note.noteId}`,
    note,
    branch,
    nextStep
  };
}
```

#### `src/modules/noteHandler.ts`
**Changes Required:**
- Update `handleCreateNoteRequest` to format enhanced response with nextStep
- Maintain backward compatibility

**Modified Function:**
```typescript
export async function handleCreateNoteRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // ... existing permission and error handling ...
  
  const result = await handleCreateNote(noteOperation, axiosInstance);
  
  // Format enhanced response
  const responseData = {
    note: result.note,
    branch: result.branch,
    ...(result.nextStep && { nextStep: result.nextStep })
  };
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify(responseData, null, 2)
    }]
  };
}
```

### 1.3 Implementation Steps

1. **Create Type Definitions** (`nextStepTypes.ts`)
   - Define all interfaces for nextStep functionality
   - Include configuration options

2. **Implement Analysis Engine** (`nextStepAnalyzer.ts`)
   - Create rule-based analysis system
   - Implement note type, content, and MIME type analysis
   - Add suggestion generation logic

3. **Update Note Manager** (`noteManager.ts`)
   - Modify `NoteCreateResponse` interface
   - Update `handleCreateNote` to return full data
   - Integrate nextStep analysis

4. **Update Note Handler** (`noteHandler.ts`)
   - Modify response formatting to include nextStep
   - Ensure backward compatibility

5. **Testing**
   - Test with various note types
   - Verify nextStep suggestions work correctly
   - Ensure backward compatibility

## Phase 2: manage_attributes Implementation

### 2.1 New Directory Structure

```
src/modules/attributes/
├── createAttributes.ts    # Create operation logic
├── readAttributes.ts      # Read operation logic  
├── updateAttributes.ts    # Update operation logic
├── deleteAttributes.ts    # Delete operation logic
├── manageAttributes.ts    # Unified interface orchestrator
└── manageAttributesTypes.ts # TypeScript interfaces
```

### 2.2 New Files to Create

#### `src/modules/attributes/manageAttributesTypes.ts`
```typescript
// TypeScript interfaces for manage_attributes functionality
export interface ManageAttributesParams {
  operation: "create" | "read" | "update" | "delete";
  noteId?: string;
  attributes?: Attribute[];
  filters?: AttributeFilters;
}

export interface Attribute {
  attributeId?: string;
  type: "label" | "relation";
  name: string;
  value: string;
  position?: number;
  isInheritable?: boolean;
}

export interface AttributeFilters {
  noteId: string;
  type?: "label" | "relation" | "all";
  name?: string;
}

export interface ManageAttributesResponse {
  success: boolean;
  operation: string;
  noteId?: string;
  attributes?: Attribute[];
  message: string;
  count?: number;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
```

#### `src/modules/attributes/createAttributes.ts`
```typescript
// Create operation logic
import { Attribute, ManageAttributesResponse } from "./manageAttributesTypes.js";

export async function createAttributes(
  noteId: string, 
  attributes: Attribute[], 
  axiosInstance: any
): Promise<Attribute[]> {
  // Implementation for creating attributes
  // Maps to POST /attributes for each attribute
}
```

#### `src/modules/attributes/readAttributes.ts`
```typescript
// Read operation logic
import { Attribute, AttributeFilters } from "./manageAttributesTypes.js";

export async function readAttributes(
  noteId: string, 
  filters?: AttributeFilters, 
  axiosInstance: any
): Promise<Attribute[]> {
  // Implementation for reading attributes
  // Maps to GET /notes/{noteId} and extracts attributes
}
```

#### `src/modules/attributes/updateAttributes.ts`
```typescript
// Update operation logic
import { Attribute } from "./manageAttributesTypes.js";

export async function updateAttributes(
  attributes: Attribute[], 
  axiosInstance: any
): Promise<Attribute[]> {
  // Implementation for updating attributes
  // Maps to PATCH /attributes/{attributeId} for each attribute
}
```

#### `src/modules/attributes/deleteAttributes.ts`
```typescript
// Delete operation logic
import { Attribute } from "./manageAttributesTypes.js";

export async function deleteAttributes(
  attributes: Attribute[], 
  axiosInstance: any
): Promise<{ success: boolean; deletedCount: number }> {
  // Implementation for deleting attributes
  // Maps to DELETE /attributes/{attributeId} for each attribute
}
```

#### `src/modules/attributes/manageAttributes.ts`
```typescript
// Unified interface orchestrator
import { 
  ManageAttributesParams, 
  ManageAttributesResponse 
} from "./manageAttributesTypes.js";
import { createAttributes } from "./createAttributes.js";
import { readAttributes } from "./readAttributes.js";
import { updateAttributes } from "./updateAttributes.js";
import { deleteAttributes } from "./deleteAttributes.js";

export async function manageAttributes(
  params: ManageAttributesParams,
  axiosInstance: any
): Promise<ManageAttributesResponse> {
  // Orchestrates calls to appropriate individual modules
  // Provides unified error handling and response formatting
}
```

### 2.3 Files to Modify

#### `src/modules/toolDefinitions.ts`
**Changes Required:**
- Add `manage_attributes` tool definition to `createWriteTools()`
- Include comprehensive parameter schema

**New Tool Definition:**
```typescript
{
  name: "manage_attributes",
  description: "Unified management of note attributes including labels, relations, and metadata with support for CRUD operations and flexible filtering.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["create", "read", "update", "delete"],
        description: "Operation type: create (add attributes), read (list attributes), update (modify attributes), delete (remove attributes)"
      },
      noteId: {
        type: "string",
        description: "Note ID (required for all operations except read)"
      },
      attributes: {
        type: "array",
        description: "Array of attributes to create/update/delete",
        items: {
          type: "object",
          properties: {
            attributeId: { type: "string", description: "Attribute ID (optional, auto-generated if not provided)" },
            type: { type: "string", enum: ["label", "relation"], description: "Attribute type" },
            name: { type: "string", description: "Attribute name (pattern: ^[^\\s]+)" },
            value: { type: "string", description: "Attribute value" },
            position: { type: "number", description: "Position for ordering (default: 0)" },
            isInheritable: { type: "boolean", description: "Whether attribute is inheritable (default: false)" }
          },
          required: ["type", "name", "value"]
        }
      },
      filters: {
        type: "object",
        description: "Filters for read operation",
        properties: {
          noteId: { type: "string", description: "Note ID (required for read operation)" },
          type: { type: "string", enum: ["label", "relation", "all"], description: "Filter by attribute type" },
          name: { type: "string", description: "Filter by attribute name pattern" }
        }
      }
    },
    required: ["operation"]
  }
}
```

#### `src/modules/noteHandler.ts`
**Changes Required:**
- Add `handleManageAttributesRequest` function
- Implement permission checking based on operation type
- Add to imports

**New Function:**
```typescript
export async function handleManageAttributesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Check permissions based on operation type
  if (args.operation !== "read" && !permissionChecker.hasPermission("WRITE")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to modify attributes.");
  }
  
  if (args.operation === "read" && !permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to read attributes.");
  }
  
  try {
    const result = await manageAttributes(args, axiosInstance);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    // Error handling
  }
}
```

#### `src/index.ts`
**Changes Required:**
- Add import for `handleManageAttributesRequest`
- Add case for `manage_attributes` in switch statement

**New Import:**
```typescript
import { 
  handleCreateNoteRequest,
  handleUpdateNoteRequest, 
  handleAppendNoteRequest,
  handleDeleteNoteRequest,
  handleGetNoteRequest,
  handleManageAttributesRequest  // New import
} from "./modules/noteHandler.js";
```

**New Case:**
```typescript
case "manage_attributes":
  return await handleManageAttributesRequest(request.params.arguments, this.axiosInstance, this);
```

### 2.4 Implementation Steps

1. **Create Type Definitions** (`manageAttributesTypes.ts`)
   - Define all interfaces for attribute management
   - Include comprehensive parameter and response types

2. **Implement Individual CRUD Modules**
   - `createAttributes.ts` - Handle attribute creation
   - `readAttributes.ts` - Handle attribute reading/listing
   - `updateAttributes.ts` - Handle attribute updates
   - `deleteAttributes.ts` - Handle attribute deletion

3. **Create Unified Interface** (`manageAttributes.ts`)
   - Orchestrate calls to individual modules
   - Provide unified error handling
   - Maintain consistent response format

4. **Add Tool Definition** (`toolDefinitions.ts`)
   - Add comprehensive tool schema
   - Include all parameter definitions
   - Add to write tools (requires WRITE permission)

5. **Add Request Handler** (`noteHandler.ts`)
   - Implement permission checking
   - Add error handling
   - Format responses consistently

6. **Register Tool** (`index.ts`)
   - Add import for handler
   - Add case to switch statement

7. **Testing**
   - Test all CRUD operations
   - Verify permission checking
   - Test error handling scenarios

## Integration Considerations

### Response Structure Consistency
Both enhancements follow the existing response pattern:
```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify(data, null, 2)
  }]
}
```

### Error Handling Consistency
Both enhancements use existing error handling patterns:
- `McpError` with `ErrorCode` enum
- Permission-based error messages
- Consistent error formatting

### Permission System Integration
- **Enhanced create_note**: No additional permissions required
- **manage_attributes**: Uses existing READ/WRITE permissions based on operation type

### Backward Compatibility
- **Enhanced create_note**: Fully backward compatible (nextStep is optional)
- **manage_attributes**: Completely additive (new tool)

## Testing Strategy

### Phase 1 Testing (Enhanced create_note)
1. **Unit Tests**
   - Test nextStep analysis with various note types
   - Test configuration options
   - Test suggestion generation logic

2. **Integration Tests**
   - Test with existing create_note functionality
   - Verify response format consistency
   - Test backward compatibility

3. **End-to-End Tests**
   - Test complete workflow from note creation to nextStep suggestion
   - Verify examples are correct and usable

### Phase 2 Testing (manage_attributes)
1. **Unit Tests**
   - Test each CRUD operation individually
   - Test error handling scenarios
   - Test permission checking

2. **Integration Tests**
   - Test unified interface with various operation combinations
   - Test with existing tools
   - Verify response format consistency

3. **End-to-End Tests**
   - Test complete attribute management workflows
   - Test with enhanced create_note nextStep suggestions
   - Verify cURL examples work correctly

## Deployment Strategy

### Phase 1 Deployment
1. Implement enhanced create_note
2. Test thoroughly
3. Deploy with nextStep disabled by default
4. Enable nextStep via configuration
5. Monitor performance and usage

### Phase 2 Deployment
1. Implement manage_attributes
2. Test thoroughly
3. Deploy alongside enhanced create_note
4. Update documentation
5. Monitor usage and performance

## Risk Mitigation

### Performance Risks
- **Mitigation**: nextStep analysis is lightweight and can be disabled
- **Monitoring**: Track response times and resource usage

### Compatibility Risks
- **Mitigation**: Both enhancements are fully backward compatible
- **Testing**: Comprehensive testing before deployment

### Complexity Risks
- **Mitigation**: Modular architecture keeps complexity manageable
- **Documentation**: Comprehensive documentation for maintenance

## Success Metrics

### Enhanced create_note
- User adoption of nextStep suggestions
- Reduction in manual attribute management
- Improved note organization

### manage_attributes
- Tool usage frequency
- Successful attribute management operations
- User satisfaction with unified interface

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating both enhancements into the existing TriliumNext MCP codebase. The modular approach ensures minimal disruption while providing maximum functionality and maintainability.

The plan is designed to be implemented in phases, allowing for thorough testing and validation at each step. Both enhancements follow existing codebase patterns and maintain full backward compatibility.

## Related Documentation

- [Enhanced create_note Design](create-notes-examples/enhanced-create-note-design.md)
- [nextStep Examples](create-notes-examples/nextstep-examples.md)
- [manage_attributes Design](manage-attributes-design.md)
- [Note Types](create-notes-examples/note-types.md)
