# TriliumNext MCP - cURL Validation Examples

This document provides comprehensive cURL examples for validating the enhanced note creation and multi-modal content support using TriliumNext's ETAPI.

## Authentication Setup

### Environment Variables
```bash
# Set your TriliumNext server URL and token
export TRILIUM_URL="http://localhost:8080/etapi"
export TRILIUM_TOKEN="your-etapi-token-here"

# Common curl headers
AUTH_HEADER="Authorization: Bearer $TRILIUM_TOKEN"
CONTENT_HEADER="Content-Type: application/json"
```

## Basic Text Note Creation (New Array Format)

### Simple Text Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Simple Text Note",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<h1>Hello World</h1><p>This is a basic text note using the new array format.</p>"
      }
    ]
  }'
```

### HTML Content Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "HTML Content Note",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<div><h2>Project Documentation</h2><ul><li>Requirement Analysis</li><li>Design Phase</li><li>Implementation</li></ul></div>"
      }
    ]
  }'
```

## Multi-Modal Content Examples

### Text + Local Image (Mixed Content)
```bash
# NOTE: This requires the enhanced multi-modal content support to be implemented
# Current ETAPI only supports string content, so this is for future validation

curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Report with Chart",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<h1>Q3 Project Report</h1><p>Our quarterly performance exceeded expectations.</p>"
      },
      {
        "type": "image",
        "content": "/local/path/to/performance-chart.png",
        "mimeType": "image/png",
        "filename": "performance-chart.png"
      }
    ]
  }'
```

### Data URL Embedded Content
```bash
# NOTE: This requires the enhanced multi-modal content support to be implemented
# Current ETAPI only supports string content, so this is for future validation

curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Embedded SVG Diagram",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<h1>System Architecture</h1><p>Embedded SVG diagram:</p>"
      },
      {
        "type": "data-url",
        "content": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk15IERpYWdyYW08L3RleHQ+PC9zdmc+",
        "mimeType": "image/svg+xml",
        "filename": "architecture.svg"
      }
    ]
  }'
```

## Code Note Creation

### Python Code Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Python API Handler",
    "type": "code",
    "mime": "text/x-python",
    "content": [
      {
        "type": "code",
        "content": "import requests\nimport json\n\ndef api_handler():\n    \"\"\"Handle API requests\"\"\"\n    response = requests.get(\"https://api.example.com/data\")\n    return response.json()\n\nif __name__ == \"__main__\":\n    result = api_handler()\n    print(json.dumps(result, indent=2))"
      }
    ]
  }'
```

### JavaScript Code Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "JavaScript Utility Functions",
    "type": "code",
    "mime": "text/x-javascript",
    "content": [
      {
        "type": "code",
        "content": "// Utility functions for data processing\nfunction formatDate(date) {\n    return new Date(date).toISOString().split('T')[0];\n}\n\nfunction debounce(func, wait) {\n    let timeout;\n    return function executedFunction(...args) {\n        const later = () => {\n            clearTimeout(timeout);\n            func(...args);\n        };\n        clearTimeout(timeout);\n        timeout = setTimeout(later, wait);\n    };\n}"
      }
    ]
  }'
```

## Template-Based Note Creation

### Board Template Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Task Board",
    "type": "book",
    "content": [
      {
        "type": "text",
        "content": "<h1>Project Task Board</h1><p>Manage your project tasks and track progress.</p>"
      }
    ],
    "attributes": [
      {
        "type": "relation",
        "name": "template",
        "value": "Board",
        "position": 10
      },
      {
        "type": "label",
        "name": "project",
        "value": "web-development",
        "position": 20
      }
    ]
  }'
```

### Calendar Template Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Calendar",
    "type": "book",
    "content": [
      {
        "type": "text",
        "content": "<h1>Project Timeline</h1><p>Track project milestones and deadlines.</p>"
      }
    ],
    "attributes": [
      {
        "type": "relation",
        "name": "template",
        "value": "Calendar",
        "position": 10
      },
      {
        "type": "label",
        "name": "category",
        "value": "project-management",
        "position": 20
      }
    ]
  }'
```

## Enhanced Note Creation with Attributes

### Note with Multiple Attributes
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "API Documentation",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<h1>REST API Documentation</h1><p>Complete reference for our RESTful API endpoints.</p>"
      }
    ],
    "attributes": [
      {
        "type": "label",
        "name": "category",
        "value": "documentation",
        "position": 10
      },
      {
        "type": "label",
        "name": "priority",
        "value": "high",
        "position": 20
      },
      {
        "type": "label",
        "name": "status",
        "value": "active",
        "position": 30
      },
      {
        "type": "relation",
        "name": "template",
        "value": "Grid View",
        "position": 40
      }
    ]
  }'
```

## Attribute Management Examples

### Create Single Label
```bash
curl -X POST "$TRILIUM_URL/attributes" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "important",
    "position": 10
  }'
```

### Create Template Relation
```bash
curl -X POST "$TRILIUM_URL/attributes" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "relation",
    "name": "template",
    "value": "Board",
    "position": 10
  }'
```

### Create Multiple Labels (Batch via Individual Calls)
```bash
# Note: ETAPI requires individual calls for each attribute
# Create project label
curl -X POST "$TRILIUM_URL/attributes" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "project",
    "value": "api",
    "position": 10
  }'

# Create language label
curl -X POST "$TRILIUM_URL/attributes" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "language",
    "value": "python",
    "position": 20
  }'

# Create status label
curl -X POST "$TRILIUM_URL/attributes" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "label",
    "name": "status",
    "value": "in-progress",
    "position": 30
  }'
```

## Error Testing Examples

### Invalid Content Format (Old String Format - Should Fail)
```bash
# This should fail with the new array-only requirement
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Invalid Format",
    "type": "text",
    "content": "<h1>This should fail</h1>"
  }'
```

### Invalid Note Type
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Invalid Type",
    "type": "invalid_type",
    "content": [
      {
        "type": "text",
        "content": "<h1>Test</h1>"
      }
    ]
  }'
```

### Missing Required Fields
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Missing Content",
    "type": "text"
    # Missing content field
  }'
```

## Performance Testing

### Batch Creation Test
```bash
#!/bin/bash

echo "Testing batch note creation performance..."

START_TIME=$(date +%s)

# Create 5 test notes with different content types
for i in {1..5}; do
  RESPONSE=$(curl -s -X POST "$TRILIUM_URL/create-note" \
    -H "$AUTH_HEADER" \
    -H "$CONTENT_HEADER" \
    -d "{
      \"parentNoteId\": \"root\",
      \"title\": \"Batch Test Note $i\",
      \"type\": \"text\",
      \"content\": [
        {
          \"type\": \"text\",
          \"content\": \"<h1>Note $i</h1><p>Created at $(date)</p>\"
        }
      ]
    }")

  NOTE_ID=$(echo $RESPONSE | jq -r '.note.noteId')
  echo "Created note $i with ID: $NOTE_ID"
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Batch creation completed in $DURATION seconds"
echo "Average time per note: $(echo "scale=2; $DURATION / 5" | bc) seconds"
```

## Current Limitations

### ETAPI Limitations
1. **Single Content Field**: Current ETAPI only supports `content: string`
2. **No Built-in URL Fetching**: External content must be pre-processed
3. **No Attachment Creation**: Attachments require separate `/attachments` endpoint calls
4. **No Batch Attributes**: Each attribute requires individual API calls

### Multi-Modal Content Support
The examples above showing mixed content (text + images, data URLs) are for **future validation** once the enhanced multi-modal content support is implemented. The current ETAPI only supports string content.

### Validation Strategy
1. **Basic Note Creation**: Validate current array-format text content works
2. **Attribute Management**: Test individual and batch attribute operations
3. **Template Relations**: Verify template functionality works correctly
4. **Error Handling**: Confirm proper error messages for invalid requests
5. **Performance**: Measure timing for various operations

## Migration Validation

### String to Array Migration Test
```bash
#!/bin/bash

echo "Testing string to array format migration..."

# Test 1: Old format (should fail)
echo "Testing old string format..."
OLD_RESPONSE=$(curl -s -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Old Format Test",
    "type": "text",
    "content": "<h1>Old format</h1>"
  }')

echo "Old format response: $OLD_RESPONSE"

# Test 2: New format (should work)
echo "Testing new array format..."
NEW_RESPONSE=$(curl -s -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "New Format Test",
    "type": "text",
    "content": [
      {
        "type": "text",
        "content": "<h1>New format</h1>"
      }
    ]
  }')

NEW_NOTE_ID=$(echo $NEW_RESPONSE | jq -r '.note.noteId')
echo "New format response - Note ID: $NEW_NOTE_ID"

echo "Migration validation complete."
```

These cURL examples provide comprehensive validation for both current functionality and future enhanced features of the TriliumNext MCP server.