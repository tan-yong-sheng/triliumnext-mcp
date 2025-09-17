# TriliumNext MCP - cURL Validation Examples

This document provides comprehensive cURL examples for validating the string-based note creation and content processing using TriliumNext's ETAPI.

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

## Content Requirements by Note Type

**⚠️ IMPORTANT**: Content requirements vary significantly by note type.

### Content Requirements Summary
- **String Content**: All note types accept simple string content
- **Smart Processing**: Text notes auto-detect Markdown, HTML, or plain text
- **Plain Text Only**: Code and Mermaid notes reject HTML content
- **Optional Content**: Container notes (book, search, etc.) can be empty

## Basic Text Note Creation

### Simple Text Note (Smart Processing)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Simple Text Note",
    "type": "text",
    "content": "<h1>Hello World</h1><p>This is a basic text note using string content.</p>"
  }'
```

### Markdown Content (Auto-Converted)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Markdown Note",
    "type": "text",
    "content": "# Project Documentation\n\n## Overview\nThis project uses **TypeScript** for development.\n\n### Features\n- Type safety\n- Modern syntax\n- Tooling support"
  }'
```

### Plain Text Content (Auto-Wrapped)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Plain Text Note",
    "type": "text",
    "content": "This is plain text content that will be automatically wrapped in HTML tags by the system."
  }'
```

## Code Note Creation

### Python Code Note (Plain Text Required)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Python API Handler",
    "type": "code",
    "mime": "text/x-python",
    "content": "import requests\nimport json\n\ndef api_handler():\n    \"\"\"Handle API requests\"\"\"\n    response = requests.get(\"https://api.example.com/data\")\n    return response.json()\n\nif __name__ == \"__main__\":\n    result = api_handler()\n    print(json.dumps(result, indent=2))"
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
    "content": "// Utility functions for data processing\nfunction formatDate(date) {\n    return new Date(date).toISOString().split(\"T\")[0];\n}\n\nfunction debounce(func, wait) {\n    let timeout;\n    return function executedFunction(...args) {\n        const later = () => {\n            clearTimeout(timeout);\n            func(...args);\n        };\n        clearTimeout(timeout);\n        timeout = setTimeout(later, wait);\n    };\n}"
  }'
```

## Container Notes

### Book Note (Optional Content)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Folder",
    "type": "book",
    "content": "<p>Container for project-related notes</p>"
  }'
```

### Empty Container Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Empty Folder",
    "type": "book",
    "content": ""
  }'
```

## Specialized Note Types

### Mermaid Diagram Note (Plain Text Diagram Syntax)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "System Architecture",
    "type": "mermaid",
    "content": "graph TD\n    A[Client] --> B[Load Balancer]\n    B --> C[Server1]\n    B --> D[Server2]\n    C --> E[Database]\n    D --> E[Database]"
  }'
```

### Search Note
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Important Tasks",
    "type": "search",
    "content": "note.type = \"text\" AND #important AND #task"
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
    "content": "<h1>Project Task Board</h1><p>Manage your project tasks and track progress.</p>",
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
    "content": "<h1>Project Timeline</h1><p>Track project milestones and deadlines.</p>",
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
    "content": "<h1>REST API Documentation</h1><p>Complete reference for our RESTful API endpoints.</p>",
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

## Hash Validation Examples

### Safe Update Workflow
```bash
#!/bin/bash

# Step 1: Create a note
CREATE_RESPONSE=$(curl -s -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Test Note for Updates",
    "type": "text",
    "content": "<h1>Original Content</h1><p>This will be updated.</p>"
  }')

NOTE_ID=$(echo $CREATE_RESPONSE | jq -r '.note.noteId')
echo "Created note with ID: $NOTE_ID"

# Step 2: Get note with hash info
NOTE_INFO=$(curl -s -X GET "$TRILIUM_URL/notes/$NOTE_ID" \
  -H "$AUTH_HEADER")

BLOB_ID=$(echo $NOTE_INFO | jq -r '.blobId')
echo "Current blobId: $BLOB_ID"

# Step 3: Update with hash validation
UPDATE_RESPONSE=$(curl -s -X PUT "$TRILIUM_URL/notes/$NOTE_ID/content" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: text/plain" \
  -d '<h1>Updated Content</h1><p>This content has been safely updated.</p>')

echo "Update response: $UPDATE_RESPONSE"

# Step 4: Update note metadata (title, type, etc.)
curl -s -X PATCH "$TRILIUM_URL/notes/$NOTE_ID" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "title": "Updated Test Note"
  }'
```

## Update Note Examples

### Update Content with Type Parameter
```bash
#!/bin/bash

# Get current note state
NOTE_INFO=$(curl -s -X GET "$TRILIUM_URL/notes/$NOTE_ID" \
  -H "$AUTH_HEADER")

BLOB_ID=$(echo $NOTE_INFO | jq -r '.blobId')
NOTE_TYPE=$(echo $NOTE_INFO | jq -r '.type')

# Update content using MCP update_note function
curl -X POST "$TRILIUM_URL/update-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d "{
    \"noteId\": \"$NOTE_ID\",
    \"type\": \"$NOTE_TYPE\",
    \"content\": \"<h1>Safely Updated Content</h1><p>Updated via MCP with hash validation.</p>\",
    \"expectedHash\": \"$BLOB_ID\"
  }"
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

### Batch Attribute Creation (via create_note attributes parameter)
```bash
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Code Snippet Repository",
    "type": "text",
    "content": "<h1>Reusable Code Snippets</h1><p>Collection of useful code examples.</p>",
    "attributes": [
      {
        "type": "relation",
        "name": "template",
        "value": "Text Snippet",
        "position": 10
      },
      {
        "type": "label",
        "name": "language",
        "value": "javascript",
        "position": 20
      },
      {
        "type": "label",
        "name": "category",
        "value": "utilities",
        "position": 30
      }
    ]
  }'
```

## Common Content Validation Tests

### Invalid Content Type (HTML in Code Note)
```bash
# This should fail with content type mismatch
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Invalid Code Note",
    "type": "code",
    "mime": "text/x-javascript",
    "content": "<h1>This should fail</h1><p>HTML in code note</p>"
  }'
```

### Plain Text in Code Note (Should Work)
```bash
# This should work - plain text for code notes
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Valid Code Note",
    "type": "code",
    "mime": "text/x-javascript",
    "content": "function validCode() {\n  return true;\n}"
  }'
```

### Smart Content Detection Test
```bash
# Test auto-detection of different content formats
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Smart Content Test",
    "type": "text",
    "content": "# Auto-Detected Markdown\n\nThis **markdown** should be automatically converted to HTML.\n\n## Features\n- List item 1\n- List item 2\n\n[Link example](https://example.com)"
  }'
```

## Error Handling Examples

### Missing Required Parameters
```bash
# Should fail - missing required content parameter
curl -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Missing Content",
    "type": "text"
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
    "content": "test content"
  }'
```

### Update Without Hash (Should Fail)
```bash
# Should fail - missing expectedHash parameter
curl -X POST "$TRILIUM_URL/update-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "noteId": "abc123",
    "type": "text",
    "content": "Updated content"
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
      \"content\": \"<h1>Note $i</h1><p>Created at $(date)</p>\"
    }")

  NOTE_ID=$(echo $RESPONSE | jq -r '.note.noteId')
  echo "Created note $i with ID: $NOTE_ID"
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Batch creation completed in $DURATION seconds"
echo "Average time per note: $(echo "scale=2; $DURATION / 5" | bc) seconds"
```

## Smart Processing Validation

### Markdown Auto-Conversion Test
```bash
#!/bin/bash

echo "Testing Markdown auto-conversion..."

# Create note with Markdown content
MARKDOWN_RESPONSE=$(curl -s -X POST "$TRILIUM_URL/create-note" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_HEADER" \
  -d '{
    "parentNoteId": "root",
    "title": "Markdown Test",
    "type": "text",
    "content": "# Markdown Heading\n\nThis is **bold text** and *italic text*.\n\n## List\n- Item 1\n- Item 2\n- Item 3"
  }')

NOTE_ID=$(echo $MARKDOWN_RESPONSE | jq -r '.note.noteId')
echo "Created Markdown note with ID: $NOTE_ID"

# Get the processed content
CONTENT_RESPONSE=$(curl -s -X GET "$TRILIUM_URL/notes/$NOTE_ID/content" \
  -H "$AUTH_HEADER")

echo "Processed content:"
echo "$CONTENT_RESPONSE"
```

These cURL examples provide comprehensive validation for the string-based note creation system with smart content processing and hash validation features.