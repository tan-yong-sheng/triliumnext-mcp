# TriliumNext MCP - manage_attributes Function Design

This document provides the complete design specification and cURL examples for the `manage_attributes` function, which provides unified management of note attributes (labels, relations, MIME types).

**Note**: This document shows how to implement the `manage_attributes` function using the actual TriliumNext ETAPI endpoints (`/attributes`, `/notes/{noteId}`) rather than a hypothetical unified endpoint.

## Overview

The `manage_attributes` function is a unified interface for managing all types of note attributes in TriliumNext. It supports CRUD operations (Create, Read, Update, Delete) for labels and relations, enabling users to manage note metadata efficiently. The implementation maps to the existing TriliumNext ETAPI endpoints.

## Function Specification

### Function Name
`manage_attributes`

### Purpose
Unified management of note attributes including labels, relations, and metadata with support for batch operations and flexible filtering.

## JSON Parameters Design

### Complete Parameter Schema

```json
{
  "operation": "create|read|update|delete",
  "noteId": "string (required for all operations except list)",
  "attributes": [
    {
      "attributeId": "string (optional, auto-generated if not provided)",
      "type": "label|relation",
      "name": "string (attribute name, pattern: ^[^\\s]+)",
      "value": "string (attribute value)",
      "position": "number (optional, for ordering, default: 0)",
      "isInheritable": "boolean (optional, default: false)"
    }
  ],
  "filters": {
    "noteId": "string (required for read operation)",
    "type": "label|relation|all (optional, default: all)",
    "name": "string (optional, for filtering by attribute name pattern)"
  }
}
```

### Parameter Details

#### Operation Types
- **`create`** - Add new attributes to a note
- **`read`** - List all attributes for a note
- **`update`** - Modify existing attributes (by attributeId)
- **`delete`** - Remove attributes (by attributeId or name)

#### Attribute Object Properties
- **`attributeId`** - Optional, auto-generated if not provided
- **`type`** - Required: "label" or "relation"
- **`name`** - Required: Attribute name (e.g., "template", "author", "project")
- **`value`** - Required: Attribute value (e.g., "Board", "John Doe", "my-project")
- **`position`** - Optional: Integer for ordering (default: 0)
- **`isInheritable`** - Optional: Boolean for inheritance (default: false)

#### Filter Object Properties (for read operation)
- **`noteId`** - Required for read operation
- **`type`** - Filter by attribute type ("label", "relation", "all")
- **`name`** - Filter by attribute name pattern

## Response Format

### Extensible Typed Array Response Format

All MCP tool responses now use an extensible array of typed objects under the `content` field. Each object has:
- `type`: Identifies the content (e.g., 'text', 'attributes', 'nextStep', etc.)
- `text`: Human-readable summary or message (optional except for 'text' type)
- `data`: Structured, machine-readable data (optional except for types that require it)

#### Example: Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Attributes created successfully"
    },
    {
      "type": "attributes",
      "data": {
        "success": true,
        "operation": "create",
        "noteId": "abc123",
        "attributes": [
          {
            "attributeId": "attr456",
            "type": "relation",
            "name": "template",
            "value": "Board",
            "position": 10,
            "isInheritable": false,
            "utcDateModified": "2024-01-01T12:00:00.000Z"
          }
        ],
        "count": 1
      }
    }
  ]
}
```

#### Example: Error Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Attribute with ID attr456 not found"
    },
    {
      "type": "error",
      "data": {
        "success": false,
        "error": {
          "code": "ATTRIBUTE_NOT_FOUND",
          "message": "Attribute with ID attr456 not found",
          "details": "The specified attribute does not exist on the note"
        }
      }
    }
  ]
}
```

### Rationale
- **Extensible**: New content types can be added without breaking existing clients.
- **Machine-readable**: Structured data is easy for clients to parse.
- **Backward compatible**: Human-readable text remains available for all responses.
- **Separation of concerns**: Each object in the array has a clear, single purpose.

## cURL Examples

### Prerequisites

#### Authentication Setup
```bash
# Set your ETAPI token
export ETAPI_TOKEN="your_token_here"
export BASE_URL="http://localhost:37740/etapi"
```

### 1. Create Attributes

#### Create Single Template Relation
```bash
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "template",
    "value": "Board",
    "position": 10
  }'
```

#### Create Multiple Labels
```bash
# Create project label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "project",
    "value": "my-project",
    "position": 10
  }'

# Create priority label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "priority",
    "value": "high",
    "position": 20
  }'

# Create status label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "status",
    "value": "in-progress",
    "position": 30
  }'
```

#### Create Author Relation
```bash
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "author",
    "value": "John Doe",
    "position": 5,
    "isInheritable": true
  }'
```

#### Create Custom Relations
```bash
# Create parent relation
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "parent",
    "value": "def456",
    "position": 10
  }'

# Create category relation
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "category",
    "value": "documentation",
    "position": 20
  }'
```

### 2. Update Attributes

#### Update by Attribute ID
```bash
curl -X PATCH "$BASE_URL/attributes/attr456" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "urgent",
    "position": 5
  }'
```

#### Update Multiple Attributes
```bash
# Update first attribute
curl -X PATCH "$BASE_URL/attributes/attr456" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "urgent",
    "position": 5
  }'

# Update second attribute
curl -X PATCH "$BASE_URL/attributes/attr789" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "Calendar",
    "position": 10
  }'
```

### 3. Delete Attributes

#### Delete by Attribute ID
```bash
curl -X DELETE "$BASE_URL/attributes/attr456" \
  -H "Authorization: $ETAPI_TOKEN"
```

#### Delete by Name and Type
```bash
# Note: TriliumNext ETAPI requires attributeId for deletion
# You need to first get the attributeId by listing attributes, then delete by ID

# First, get all attributes to find the IDs
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes[] | select(.name == "old-tag" and .type == "label") | .attributeId'

# Then delete using the found attributeId
curl -X DELETE "$BASE_URL/attributes/FOUND_ATTRIBUTE_ID" \
  -H "Authorization: $ETAPI_TOKEN"
```

#### Delete Multiple Attributes
```bash
# Delete by attribute IDs
curl -X DELETE "$BASE_URL/attributes/attr456" \
  -H "Authorization: $ETAPI_TOKEN"

curl -X DELETE "$BASE_URL/attributes/attr789" \
  -H "Authorization: $ETAPI_TOKEN"

# For deletion by name, first find the attributeId
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes[] | select(.name == "temp-tag" and .type == "label") | .attributeId'

# Then delete using the found attributeId
curl -X DELETE "$BASE_URL/attributes/FOUND_ATTRIBUTE_ID" \
  -H "Authorization: $ETAPI_TOKEN"
```

### 4. Read Attributes

#### Read All Attributes
```bash
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes'
```

#### Read Only Labels
```bash
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes[] | select(.type == "label")'
```

#### Read Only Relations
```bash
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes[] | select(.type == "relation")'
```

#### Read Attributes by Name Pattern
```bash
curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq '.attributes[] | select(.name | contains("project"))'
```

## Common Use Cases

### 1. Template Management

#### Add Board Template to Note
```bash
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "template",
    "value": "Board",
    "position": 10
  }'
```

#### Switch Template
```bash
# First, find the current template attribute ID
TEMPLATE_ID=$(curl -X GET "$BASE_URL/notes/abc123" \
  -H "Authorization: $ETAPI_TOKEN" | jq -r '.attributes[] | select(.name == "template" and .type == "relation") | .attributeId')

# Delete old template
curl -X DELETE "$BASE_URL/attributes/$TEMPLATE_ID" \
  -H "Authorization: $ETAPI_TOKEN"

# Then add new template
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "template",
    "value": "Calendar",
    "position": 10
  }'
```

### 2. Project Organization

#### Add Project Labels
```bash
# Add project label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "project",
    "value": "trilium-mcp",
    "position": 10
  }'

# Add version label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "version",
    "value": "1.0.0",
    "position": 20
  }'

# Add status label
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "status",
    "value": "active",
    "position": 30
  }'
```

### 3. Note Relationships

#### Create Note Hierarchy
```bash
# Add parent relation
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "child123",
    "type": "relation",
    "name": "parent",
    "value": "parent456",
    "position": 10
  }'

# Add category relation
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "child123",
    "type": "relation",
    "name": "category",
    "value": "subtask",
    "position": 20
  }'
```

### 4. Bulk Operations

#### Add Multiple Labels to Multiple Notes
```bash
# Note 1
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "note1",
    "type": "label",
    "name": "batch",
    "value": "2024-01-01",
    "position": 10
  }'

# Note 2
curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "note2",
    "type": "label",
    "name": "batch",
    "value": "2024-01-01",
    "position": 10
  }'
```

## Error Handling

### Common Error Scenarios

#### Note Not Found (404)
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Note with ID abc123 not found"
    },
    {
      "type": "error",
      "data": {
        "success": false,
        "error": {
          "code": "NOTE_NOT_FOUND",
          "message": "Note with ID abc123 not found",
          "details": "The specified note does not exist"
        }
      }
    }
  ]
}
```

#### Attribute Not Found (404)
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Attribute with ID attr456 not found"
    },
    {
      "type": "error",
      "data": {
        "success": false,
        "error": {
          "code": "ATTRIBUTE_NOT_FOUND",
          "message": "Attribute with ID attr456 not found",
          "details": "The specified attribute does not exist on the note"
        }
      }
    }
  ]
}
```

#### Validation Error (400)
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Invalid attribute name"
    },
    {
      "type": "error",
      "data": {
        "success": false,
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "Invalid attribute name",
          "details": "Attribute name must not contain spaces and match pattern ^[^\\s]+"
        }
      }
    }
  ]
}
```

#### Permission Error (403)
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Insufficient permissions to modify attributes"
    },
    {
      "type": "error",
      "data": {
        "success": false,
        "error": {
          "code": "PERMISSION_DENIED",
          "message": "Insufficient permissions to modify attributes",
          "details": "You do not have write access to this note"
        }
      }
    }
  ]
}
```

### Error Handling in Scripts
```bash
# Function to handle API responses
handle_response() {
  local response="$1"
  local http_code=$(echo "$response" | jq -r '.success // false')
  
  if [ "$http_code" = "true" ]; then
    echo "Success: $response"
  else
    echo "Error: $response"
    exit 1
  fi
}

# Example usage
RESPONSE=$(curl -X POST "$BASE_URL/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "test",
    "value": "example"
  }')

handle_response "$RESPONSE"
```

## Implementation Notes

### Code Architecture Design

#### Modular Structure
The `manage_attributes` function is implemented using a **modular architecture** that provides both clean internal organization and a unified external interface:

```
src/modules/attributes/
├── createAttributes.ts    # Create operation logic
├── readAttributes.ts      # Read/List operation logic  
├── updateAttributes.ts    # Update operation logic
├── deleteAttributes.ts    # Delete operation logic
└── manageAttributes.ts    # Unified interface orchestrator
```

#### Benefits of This Design

1. **Separation of Concerns**: Each file handles one specific CRUD operation
2. **Single Responsibility**: Each module has a focused, well-defined purpose
3. **Maintainability**: Changes to one operation don't affect others
4. **Testability**: Individual operations can be tested in isolation
5. **Reusability**: Individual functions can be imported and used elsewhere
6. **Unified Interface**: External users get a single, consistent API
7. **Future Extensibility**: Easy to add new operations or modify existing ones

#### Implementation Strategy

- **Individual Modules**: Each CRUD operation is implemented as a separate, focused module
- **Consolidated Interface**: The `manageAttributes.ts` file orchestrates calls to the appropriate individual modules
- **Clean Abstraction**: External users interact with one function, internal implementation is modular
- **Best of Both Worlds**: Clean internal structure + unified external interface

### Backend API Mapping

#### Create Operation (`createAttributes.ts`)
- Maps to `POST /attributes` for each attribute
- Each attribute requires individual API call
- Returns created attribute with generated attributeId
- Handles batch creation by calling individual create functions

#### Read Operation (`readAttributes.ts`)
- Maps to `GET /notes/{noteId}` and extracts attributes from response
- Applies client-side filtering for type and name patterns
- Returns formatted attribute list with optional filtering

#### Update Operation (`updateAttributes.ts`)
- Maps to `PATCH /attributes/{attributeId}` for each attribute
- Requires existing attributeId from previous create/read operation
- Only allows updating `value` and `position` for labels
- Only allows updating `position` for relations
- Handles batch updates by calling individual update functions

#### Delete Operation (`deleteAttributes.ts`)
- Maps to `DELETE /attributes/{attributeId}` for each attribute
- Requires existing attributeId (cannot delete by name+type directly)
- Must first read attributes to find attributeId for deletion by name
- Handles batch deletion by calling individual delete functions

#### Unified Interface (`manageAttributes.ts`)
- Orchestrates calls to appropriate individual modules based on operation type
- Provides consistent error handling across all operations
- Maintains unified response format
- Handles operation-specific validation and routing

### Implementation Details

#### File Structure and Responsibilities

**`src/modules/attributes/createAttributes.ts`**
```typescript
// Handles attribute creation logic
export async function createAttributes(noteId: string, attributes: Attribute[]): Promise<Attribute[]>
```
- Validates input parameters for create operations
- Maps to `POST /attributes` ETAPI calls
- Handles batch creation with individual API calls
- Returns created attributes with generated IDs

**`src/modules/attributes/readAttributes.ts`**
```typescript
// Handles attribute reading/listing logic
export async function readAttributes(noteId: string, filters?: AttributeFilters): Promise<Attribute[]>
```
- Maps to `GET /notes/{noteId}` ETAPI call
- Applies client-side filtering for type and name patterns
- Returns formatted attribute list

**`src/modules/attributes/updateAttributes.ts`**
```typescript
// Handles attribute update logic
export async function updateAttributes(attributes: AttributeUpdate[]): Promise<Attribute[]>
```
- Maps to `PATCH /attributes/{attributeId}` ETAPI calls
- Validates update restrictions (value/position only)
- Handles batch updates with individual API calls

**`src/modules/attributes/deleteAttributes.ts`**
```typescript
// Handles attribute deletion logic
export async function deleteAttributes(attributes: AttributeDelete[]): Promise<DeleteResult>
```
- Maps to `DELETE /attributes/{attributeId}` ETAPI calls
- Handles finding attributeIds by name+type when needed
- Handles batch deletion with individual API calls

**`src/modules/attributes/manageAttributes.ts`**
```typescript
// Unified interface orchestrator
export async function manageAttributes(params: ManageAttributesParams): Promise<ManageAttributesResponse>
```
- Routes to appropriate individual modules based on operation type
- Provides unified error handling and response formatting
- Validates operation-specific requirements
- Maintains consistent API interface

#### Benefits of Modular Architecture

1. **Clean Code Organization**: Each file has a single, clear responsibility
2. **Easier Testing**: Individual operations can be unit tested independently
3. **Better Debugging**: Issues can be isolated to specific operation modules
4. **Maintainability**: Changes to one operation don't affect others
5. **Reusability**: Individual functions can be imported and used in other contexts
6. **Scalability**: Easy to add new operations or modify existing ones
7. **Code Review**: Smaller, focused files are easier to review
8. **Documentation**: Each module can have focused, operation-specific documentation

#### Error Handling Strategy

- **Individual Modules**: Handle operation-specific errors and validation
- **Unified Interface**: Provides consistent error formatting and handling
- **Error Propagation**: Errors from individual modules are properly formatted and returned
- **Validation**: Input validation happens at both individual and unified levels

### Validation Rules

1. **Required Fields for Create**:
   - `noteId` - Note ID where attribute will be created
   - `type` - Must be "label" or "relation"
   - `name` - Must match pattern `^[^\s]+` (no spaces)
   - `value` - Attribute value

2. **Optional Fields**:
   - `position` - Integer for ordering (default: 0)
   - `isInheritable` - Boolean for inheritance (default: false)

3. **Update Restrictions**:
   - Labels: Only `value` and `position` can be updated
   - Relations: Only `position` can be updated
   - Cannot change `type`, `name`, or `noteId`

4. **Delete Requirements**:
   - Must provide `attributeId` (cannot delete by name+type)
   - Must first list attributes to find the correct attributeId

5. **Business Rules**:
   - Attribute names cannot contain spaces
   - Position must be non-negative integer
   - Each attribute requires individual API call
   - No batch operations in ETAPI

## Best Practices

### General Usage
1. **Handle individual API calls** - ETAPI doesn't support batch operations
2. **Always check responses** for success/error status
3. **Use meaningful attribute names** that follow naming conventions (no spaces)
4. **Set appropriate positions** for attribute ordering
5. **Handle errors gracefully** with proper error messages
6. **Cache attributeIds** when possible to avoid repeated read operations
7. **Validate input** before making API calls
8. **Use consistent naming** across your application
9. **Use jq for filtering** when listing attributes by type or name
10. **Plan for sequential operations** when managing multiple attributes

### Modular Development Best Practices

#### Code Organization
1. **Single Responsibility**: Each module should handle only one CRUD operation
2. **Clear Interfaces**: Define well-documented function signatures for each module
3. **Consistent Error Handling**: Use the same error format across all modules
4. **Type Safety**: Define TypeScript interfaces for all parameters and responses
5. **Documentation**: Each module should have focused, operation-specific documentation

#### Testing Strategy
1. **Unit Tests**: Test each individual module in isolation
2. **Integration Tests**: Test the unified interface with various operation combinations
3. **Mock ETAPI**: Use mocks for ETAPI calls in unit tests
4. **Error Scenarios**: Test error handling in each module
5. **Edge Cases**: Test boundary conditions and edge cases

#### Development Workflow
1. **Start with Individual Modules**: Implement and test each CRUD operation separately
2. **Build Unified Interface**: Create the orchestrator after individual modules are stable
3. **Incremental Development**: Add new operations by creating new modules
4. **Refactoring**: Individual modules make refactoring safer and easier
5. **Code Review**: Smaller, focused files are easier to review thoroughly

#### Maintenance Guidelines
1. **Isolated Changes**: Modify one operation without affecting others
2. **Version Control**: Smaller files create cleaner git history
3. **Debugging**: Issues can be isolated to specific operation modules
4. **Performance**: Optimize individual operations independently
5. **Documentation**: Update module-specific documentation when making changes

## Related Documentation

- [Note Types](note-types.md) - Complete list of supported note types
- [cURL Examples](create-notes-examples/curl-examples.md) - Note creation examples
- [Search Examples](search-examples/) - How to search for notes with attributes
