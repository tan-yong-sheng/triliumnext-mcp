# TriliumNext MCP - cURL Examples for Note Creation

This document provides comprehensive cURL examples for creating notes using the TriliumNext ETAPI. Each example includes authentication, request body, and expected responses.

## Prerequisites

### Authentication Setup

Before using these examples, you need to obtain an ETAPI token from your TriliumNext instance:

1. Open TriliumNext in your browser
2. Go to **Options** → **ETAPI**
3. Generate a new token
4. Copy the token for use in the examples below

### Base URLs

Choose the appropriate base URL for your setup:
- **Default**: `http://localhost:37740/etapi`
- **Alternative**: `http://localhost:8080/etapi`

## Authentication Methods

### Method 1: ETAPI Token (Recommended)
```bash
# Set your token as an environment variable
export ETAPI_TOKEN="your_token_here"

# Use in curl commands
curl -H "Authorization: $ETAPI_TOKEN" ...
```

### Method 2: Basic Authentication
```bash
# Use ETAPI token as username (password can be anything)
curl -u "your_token_here:password" ...
```

## Basic Note Creation Examples

### 1. Text Notes (`text`)

#### Simple Text Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "My First Note",
    "type": "text",
    "content": "<p>This is a simple text note with <strong>HTML formatting</strong>.</p>"
  }'
```

#### Text Note with Positioning
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Meeting Notes",
    "type": "text",
    "content": "<h1>Project Meeting</h1><p>Discussed project timeline and deliverables.</p>",
    "notePosition": 10,
    "isExpanded": false
  }'
```

### 2. Code Notes (`code`)

#### Python Code Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Python Script",
    "type": "code",
    "mime": "text/x-python",
    "content": "#!/usr/bin/env python3\n\ndef hello_world():\n    print(\"Hello, World!\")\n\nif __name__ == \"__main__\":\n    hello_world()"
  }'
```

#### JavaScript Code Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "React Component",
    "type": "code",
    "mime": "text/x-javascript",
    "content": "import React from \"react\";\n\nconst MyComponent = () => {\n  return (\n    <div>\n      <h1>Hello React!</h1>\n    </div>\n  );\n};\n\nexport default MyComponent;"
  }'
```

#### Dockerfile Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Dockerfile",
    "type": "code",
    "mime": "text/x-dockerfile",
    "content": "FROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD [\"npm\", \"start\"]"
  }'
```

### 3. File Notes (`file`)

#### PDF Document Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Project Report.pdf",
    "type": "file",
    "mime": "application/pdf",
    "content": "Base64 encoded PDF content would go here"
  }'
```

#### Markdown File Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "README.md",
    "type": "file",
    "mime": "text/x-markdown",
    "content": "# My Project\n\nThis is a sample README file.\n\n## Features\n\n- Feature 1\n- Feature 2\n\n## Installation\n\n```bash\nnpm install\n```"
  }'
```

### 4. Image Notes (`image`)

#### PNG Image Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Screenshot.png",
    "type": "image",
    "mime": "image/png",
    "content": "Base64 encoded PNG image data would go here"
  }'
```

#### SVG Image Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Diagram.svg",
    "type": "image",
    "mime": "image/svg+xml",
    "content": "<svg width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\"/></svg>"
  }'
```

### 5. Search Notes (`search`)

#### Saved Search Note
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "My Saved Search",
    "type": "search",
    "content": "docker kubernetes"
  }'
```

### 6. Book Notes (`book`)

#### Project Folder
```bash
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "My Project",
    "type": "book",
    "content": "",
    "isExpanded": true
  }'
```

#### Nested Folder Structure
```bash
# Create parent folder
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Development",
    "type": "book",
    "content": "",
    "isExpanded": true
  }'

# Create subfolder (use the noteId from previous response)
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "noteId_from_previous_response",
    "title": "Frontend",
    "type": "book",
    "content": "",
    "notePosition": 10
  }'
```


## Template Relations Setup

To add template relations to notes, you need to make a separate API call to the `/attributes` endpoint.

### 1. Create Note with Template Relation

#### Step 1: Create the Note
```bash
# Create a note first
NOTE_RESPONSE=$(curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Task Board",
    "type": "book",
    "content": ""
  }')

# Extract noteId from response (you may need to parse JSON)
NOTE_ID=$(echo $NOTE_RESPONSE | jq -r '.note.noteId')
```

#### Step 2: Add Template Relation
```bash
# Add Board template relation
curl -X POST "http://localhost:37740/etapi/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "'$NOTE_ID'",
    "type": "relation",
    "name": "template",
    "value": "Board"
  }'
```

### 2. Calendar Template
```bash
# Create calendar note
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "My Calendar",
    "type": "book",
    "content": ""
  }'

# Add Calendar template relation (use noteId from response)
curl -X POST "http://localhost:37740/etapi/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "NOTE_ID_FROM_RESPONSE",
    "type": "relation",
    "name": "template",
    "value": "Calendar"
  }'
```

### 3. Grid View Template
```bash
# Create grid view note
curl -X POST "http://localhost:37740/etapi/create-note" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "Data Grid",
    "type": "book",
    "content": ""
  }'

# Add Grid View template relation
curl -X POST "http://localhost:37740/etapi/attributes" \
  -H "Authorization: $ETAPI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "NOTE_ID_FROM_RESPONSE",
    "type": "relation",
    "name": "template",
    "value": "Grid View"
  }'
```

## Best Practices

1. **Always use environment variables** for sensitive data like tokens
2. **Parse JSON responses** to extract note IDs for subsequent operations
3. **Handle errors gracefully** with proper HTTP status code checking
4. **Use meaningful titles** and organize notes in logical folder structures
5. **Set appropriate MIME types** for code and file notes
6. **Use positioning** to control note order in folders
7. **Add template relations** after creating notes for proper functionality
8. **Test with small examples** before creating complex note structures

## Related Documentation

- [Note Types](note-types.md) - Complete list of supported note types
- [Search Examples](search-examples/) - How to search for created notes
- [User Query Examples](user-query-examples.md) - Common usage patterns
