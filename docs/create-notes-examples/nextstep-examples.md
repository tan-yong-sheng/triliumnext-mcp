# TriliumNext MCP - nextStep Examples for create_note

This document provides practical examples of how the enhanced `create_note` function will suggest `manage_attributes` operations through the `nextStep` field.

## Response Format Rationale

All enhanced MCP responses now use an extensible, typed array under the `content` field. Each object in the array has:
- `type`: Identifies the content (e.g., 'text', 'note', 'nextStep')
- `text`: Human-readable summary or message (optional except for 'text' type)
- `data`: Structured, machine-readable data (optional except for types that require it)

This format is:
- Extensible: New content types can be added without breaking existing clients.
- Machine-readable: Structured data is easy for clients to parse.
- Backward compatible: Human-readable text remains available for all responses.
- Clean: Each object in the array has a clear, single purpose.

### Full `create_note` Response Structure with `nextStep`
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "Example Note Title",
        "type": "book",
        "content": "Example note content",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch456",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 10
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Human-readable explanation",
        "attributes": [
          {
            "type": "label|relation",
            "name": "attribute_name",
            "value": "attribute_value",
            "position": 10,
            "description": "What this attribute does"
          }
        ],
        "priority": "low|medium|high"
      }
    }
  ]
}
```

## Examples by Note Type

### 1. Book Notes - Template Suggestions

#### Board Template
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Tasks",
    "type": "book",
    "content": ""
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "Project Tasks",
        "type": "book",
        "content": "",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch456",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 10
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Book notes work best with templates for organization",
        "attributes": [
          {
            "type": "relation",
            "name": "template",
            "value": "Board",
            "position": 10,
            "description": "Add Board template for task management"
          }
        ],
        "priority": "high"
      }
    }
  ]
}
```

#### Calendar Template
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "January 2024",
    "type": "book",
    "content": ""
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "January 2024",
        "type": "book",
        "content": "",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch789",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 20
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Date-based book notes work best with Calendar template",
        "attributes": [
          {
            "type": "relation",
            "name": "template",
            "value": "Calendar",
            "position": 10,
            "description": "Add Calendar template for date organization"
          }
        ],
        "priority": "high"
      }
    }
  ]
}
```

### 2. Code Notes - Language and Project Suggestions

#### Python Code
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "API Handler",
    "type": "code",
    "mime": "text/x-python",
    "content": "def api_handler():\n    pass"
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "API Handler",
        "type": "code",
        "mime": "text/x-python",
        "content": "def api_handler():\n    pass",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch101",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 30
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Python code notes benefit from language and project tagging",
        "attributes": [
          {
            "type": "label",
            "name": "language",
            "value": "python",
            "position": 10,
            "description": "Tag with programming language"
          },
          {
            "type": "label",
            "name": "project",
            "value": "api",
            "position": 20,
            "description": "Tag with project category"
          },
          {
            "type": "relation",
            "name": "template",
            "value": "Grid View",
            "position": 30,
            "description": "Use Grid View for code organization"
          }
        ],
        "priority": "medium"
      }
    }
  ]
}
```

#### JavaScript Code
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "React Component",
    "type": "code",
    "mime": "text/x-javascript",
    "content": "import React from \"react\";"
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "React Component",
        "type": "code",
        "mime": "text/x-javascript",
        "content": "import React from \"react\";",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch102",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 40
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "JavaScript code notes benefit from framework and project tagging",
        "attributes": [
          {
            "type": "label",
            "name": "language",
            "value": "javascript",
            "position": 10,
            "description": "Tag with programming language"
          },
          {
            "type": "label",
            "name": "framework",
            "value": "react",
            "position": 20,
            "description": "Tag with framework/library"
          },
          {
            "type": "label",
            "name": "project",
            "value": "frontend",
            "position": 30,
            "description": "Tag with project category"
          }
        ],
        "priority": "medium"
      }
    }
  ]
}
```

### 3. Search Notes - Categorization Suggestions

#### DevOps Search
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Docker Search",
    "type": "search",
    "content": "docker kubernetes containers"
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "Docker Search",
        "type": "search",
        "content": "docker kubernetes containers",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch103",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 50
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Search notes work better with categorization and organization",
        "attributes": [
          {
            "type": "label",
            "name": "category",
            "value": "devops",
            "position": 10,
            "description": "Categorize search by topic"
          },
          {
            "type": "label",
            "name": "tags",
            "value": "docker,kubernetes,containers",
            "position": 20,
            "description": "Tag with search keywords"
          },
          {
            "type": "relation",
            "name": "template",
            "value": "Grid View",
            "position": 30,
            "description": "Use Grid View for search results"
          }
        ],
        "priority": "medium"
      }
    }
  ]
}
```

### 4. Image Notes - Accessibility Suggestions

#### Screenshot
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "UI Screenshot",
    "type": "image",
    "mime": "image/png",
    "content": "base64_encoded_image_data"
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "UI Screenshot",
        "type": "image",
        "mime": "image/png",
        "content": "base64_encoded_image_data",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch104",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 60
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Image notes benefit from accessibility and organization attributes",
        "attributes": [
          {
            "type": "label",
            "name": "alt",
            "value": "Screenshot of user interface showing main dashboard",
            "position": 10,
            "description": "Add alt text for accessibility"
          },
          {
            "type": "label",
            "name": "category",
            "value": "screenshot",
            "position": 20,
            "description": "Categorize image type"
          },
          {
            "type": "label",
            "name": "format",
            "value": "png",
            "position": 30,
            "description": "Tag with image format"
          }
        ],
        "priority": "low"
      }
    }
  ]
}
```

### 5. File Notes - Format Suggestions

#### Markdown File
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "README.md",
    "type": "file",
    "mime": "text/x-markdown",
    "content": "# My Project\n\nThis is a README file."
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "README.md",
        "type": "file",
        "mime": "text/x-markdown",
        "content": "# My Project\n\nThis is a README file.",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch105",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 70
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Markdown files benefit from format and documentation tagging",
        "attributes": [
          {
            "type": "label",
            "name": "format",
            "value": "markdown",
            "position": 10,
            "description": "Tag with file format"
          },
          {
            "type": "label",
            "name": "category",
            "value": "documentation",
            "position": 20,
            "description": "Categorize as documentation"
          },
          {
            "type": "label",
            "name": "type",
            "value": "readme",
            "position": 30,
            "description": "Tag with file type"
          }
        ],
        "priority": "low"
      }
    }
  ]
}
```

### 6. No Suggestion Cases

#### Simple Text Note
**Create Note:**
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Random Note",
    "type": "text",
    "content": "<p>Just a simple text note</p>"
  }'
```

**Enhanced Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Created note: abc123"
    },
    {
      "type": "note",
      "data": {
        "noteId": "abc123",
        "title": "Random Note",
        "type": "text",
        "content": "<p>Just a simple text note</p>",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "branch",
      "data": {
        "branchId": "branch106",
        "noteId": "abc123",
        "parentNoteId": "root",
        "notePosition": 80
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": false,
        "reason": "No specific attributes recommended for this note type and content"
      }
    }
  ]
}
```

## Workflow Examples

### Complete Workflow: Create Note + Add Attributes

#### Step 1: Create Note
```bash
# Create a project folder
RESPONSE=$(curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "My Project",
    "type": "book",
    "content": ""
  }')

# Extract noteId
NOTE_ID=$(echo $RESPONSE | jq -r '.content[] | select(.type == "note") | .data.noteId')
echo "Created note: $NOTE_ID"

# Removed 'nextStep' extraction as 'examples' field is removed.
```

#### Step 2: Follow nextStep Suggestion
```bash
# Example assuming NEXTSTEP_CURL was extracted from previous step
if [ -n "$NEXTSTEP_CURL" ]; then
  eval "$NEXTSTEP_CURL"
fi
```

### Automated Workflow Script

```bash
#!/bin/bash

# Function to create note and follow suggestions
create_note_with_suggestions() {
  local parent_id="$1"
  local title="$2"
  local type="$3"
  local content="$4"
  local mime="$5"
  
  # Create note
  local response=$(curl -X POST "http://localhost:37740/etapi/create-note" \
    -H "Authorization: $ETAPI_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"parentNoteId\": \"$parent_id\",
      \"title\": \"$title\",
      \"type\": \"$type\",
      \"content\": \"$content\",
      \"mime\": \"$mime\"
    }")
  
  # Extract noteId from the new format
  local note_id=$(echo $response | jq -r '.content[] | select(.type == "note") | .data.noteId')
  echo "Created note: $note_id"
  
  # Check if nextStep is suggested
  local next_step_data=$(echo $response | jq -c '.content[] | select(.type == "nextStep") | .data')
  local suggested=$(echo $next_step_data | jq -r '.suggested')
  
  if [ "$suggested" = "true" ]; then
    echo "Following nextStep suggestions..."
    
    # Get suggested attributes
    local attributes=$(echo $next_step_data | jq -c '.attributes[]')
    
    # Add each suggested attribute
    echo $attributes | jq -c . | while read -r attr; do
      local attr_type=$(echo $attr | jq -r '.type')
      local attr_name=$(echo $attr | jq -r '.name')
      local attr_value=$(echo $attr | jq -r '.value')
      local attr_position=$(echo $attr | jq -r '.position')
      
      echo "Adding $attr_type: $attr_name = $attr_value"
      
      curl -X POST "http://localhost:37740/etapi/attributes" \
        -H "Authorization: $ETAPI_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"noteId\": \"$note_id\",
          \"type\": \"$attr_type\",
          \"name\": \"$attr_name\",
          \"value\": \"$attr_value\",
          \"position\": $attr_position
        }"
    done
  else
    echo "No suggestions for this note type"
  fi
}

# Example usage
create_note_with_suggestions "root" "Project Tasks" "book" "" ""
create_note_with_suggestions "root" "API Handler" "code" "def handler():\n    pass" "text/x-python"
```

## Best Practices

### 1. Always Check nextStep
- Always check the `content` array for `type: "nextStep"` and then its `data.suggested` field.
- Follow high-priority suggestions for better organization.
- Manually construct `manage_attributes` call based on `data.attributes` for quick implementation.

### 2. Customize Suggestions
- Modify suggested values to match your project structure.
- Add additional attributes beyond the suggestions.
- Use consistent naming conventions.

### 3. Batch Operations
- Use the `manage_attributes` function for multiple attributes.
- Combine related attributes in single calls.
- Use appropriate positioning for attribute order.

### 4. Error Handling
- Check for `type: "error"` in the `content` array for detailed error information.
- Handle cases where attributes already exist.
- Validate attribute names and values.

## Related Documentation

- [Enhanced create_note Design](enhanced-create-note-design.md) - Complete design specification
- [manage_attributes Design](../manage-attributes-design.md) - Attribute management function
- [Note Types](note-types.md) - Complete list of supported note types
- [cURL Examples](curl-examples.md) - Basic note creation examples
