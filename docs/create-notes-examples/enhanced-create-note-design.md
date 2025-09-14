# TriliumNext MCP - Enhanced create_note Function Design

This document outlines the design for enhancing the `create_note` function to intelligently suggest when `manage_attributes` should be called next, creating a seamless workflow for note creation and attribute management.

## Overview

The enhanced `create_note` function will analyze the created note and provide intelligent suggestions for follow-up attribute management operations. This creates a more user-friendly experience by guiding users through common workflows.

## Enhanced Response Format

All create_note responses now use an extensible array of typed objects under the `content` field. Each object has:
- `type`: Identifies the content (e.g., 'text', 'note', 'nextStep')
- `text`: Human-readable summary or message (optional except for 'text' type)
- `data`: Structured, machine-readable data (optional except for types that require it)

### Example: Success Response with nextStep
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
        "title": "My Note",
        "type": "book"
        // ...other note fields
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Book notes work best with templates for organization",
        "attributes": [
          // ...suggested attributes
        ],
        "priority": "high"
      }
    }
  ]
}
```

## nextStep Logic Design

### Trigger Conditions

#### 1. Note Type-Based Suggestions

**Book Notes (`book`)**
- **High Priority**: Suggest template relations for organization
- **Templates**: Board, Calendar, Grid View, List View
- **Reason**: "Book notes work best with templates for organization"

**Code Notes (`code`)**
- **Medium Priority**: Suggest project labels and relations
- **Attributes**: 
  - `project` label for project identification
  - `language` label based on MIME type
  - `template` relation for code organization
- **Reason**: "Code notes benefit from project organization and language tagging"

**Search Notes (`search`)**
- **Medium Priority**: Suggest search-related attributes
- **Attributes**:
  - `category` label for search categorization
  - `template` relation for search organization
- **Reason**: "Search notes work better with categorization"

**Image Notes (`image`)**
- **Low Priority**: Suggest image metadata
- **Attributes**:
  - `alt` label for accessibility
  - `category` label for image organization
- **Reason**: "Image notes benefit from accessibility and organization attributes"

#### 2. Content-Based Suggestions

**Template Keywords in Title**
- **Keywords**: "board", "calendar", "grid", "list", "kanban", "task"
- **Suggestion**: Add corresponding template relation
- **Priority**: High

**Project Keywords in Title**
- **Keywords**: "project", "task", "todo", "issue", "bug", "feature"
- **Suggestion**: Add project organization attributes
- **Priority**: Medium

**Date Keywords in Title**
- **Keywords**: "2024", "january", "monday", "week", "month", "year"
- **Suggestion**: Add Calendar template relation
- **Priority**: High

#### 3. MIME Type-Based Suggestions

**Programming Languages**
- **Python** (`text/x-python`): Suggest `language: python` label
- **JavaScript** (`text/x-javascript`): Suggest `language: javascript` label
- **Docker** (`text/x-dockerfile`): Suggest `language: docker` label
- **SQL** (`text/x-sql`): Suggest `language: sql` label

**Document Types**
- **Markdown** (`text/x-markdown`): Suggest `format: markdown` label
- **JSON** (`application/json`): Suggest `format: json` label
- **YAML** (`text/x-yaml`): Suggest `format: yaml` label

## Implementation Strategy

### 1. Analysis Engine

```typescript
interface NextStepAnalyzer {
  analyzeNote(note: CreatedNote): NextStepSuggestion | null;
  checkNoteType(note: CreatedNote): NextStepSuggestion | null;
  checkContent(note: CreatedNote): NextStepSuggestion | null;
  checkMimeType(note: CreatedNote): NextStepSuggestion | null;
}
```

### 2. Suggestion Templates

```typescript
interface NextStepSuggestion {
  suggested: boolean;
  operation: "manage_attributes";
  reason: string;
  attributes: SuggestedAttribute[];
  priority: "low" | "medium" | "high";
}

interface SuggestedAttribute {
  type: "label" | "relation";
  name: string;
  value: string;
  position: number;
  description: string;
}
```

### 3. Rule Engine

```typescript
const suggestionRules = [
  {
    condition: (note) => note.type === "book",
    suggestion: {
      priority: "high",
      attributes: [
        { type: "relation", name: "template", value: "Board", position: 10 }
      ],
      reason: "Book notes work best with templates for organization"
    }
  },
  {
    condition: (note) => note.type === "code" && note.mime?.includes("python"),
    suggestion: {
      priority: "medium",
      attributes: [
        { type: "label", name: "language", value: "python", position: 10 },
        { type: "label", name: "project", value: "code", position: 20 }
      ],
      reason: "Python code notes benefit from language and project tagging"
    }
  }
  // ... more rules
];
```

## Examples by Note Type

### 1. Book Note with Template Suggestion

**Input:**
```json
{
  "parentNoteId": "root",
  "title": "Project Tasks",
  "type": "book",
  "content": ""
}
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
        "title": "My Note",
        "type": "book",
        "content": "<p>Content here</p>",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
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

### 2. Code Note with Language Suggestion

**Input:**
```json
{
  "parentNoteId": "root",
  "title": "API Handler",
  "type": "code",
  "mime": "text/x-python",
  "content": "def api_handler():\n    pass"
}
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
        "title": "My Note",
        "type": "code",
        "content": "<p>Content here</p>",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z",
        "mime": "text/x-python"
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
          }
        ],
        "priority": "medium"
      }
    }
  ]
}
```

### 3. Search Note with Categorization

**Input:**
```json
{
  "parentNoteId": "root",
  "title": "Docker Search",
  "type": "search",
  "content": "docker kubernetes containers"
}
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
        "title": "My Note",
        "type": "search",
        "content": "<p>Content here</p>",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
      }
    },
    {
      "type": "nextStep",
      "data": {
        "suggested": true,
        "operation": "manage_attributes",
        "reason": "Search notes work better with categorization",
        "attributes": [
          {
            "type": "label",
            "name": "category",
            "value": "devops",
            "position": 10,
            "description": "Categorize search by topic"
          },
          {
            "type": "relation",
            "name": "template",
            "value": "Grid View",
            "position": 20,
            "description": "Use Grid View for search results"
          }
        ],
        "priority": "medium"
      }
    }
  ]
}
```

### 4. No Suggestion Case

**Input:**
```json
{
  "parentNoteId": "root",
  "title": "Random Note",
  "type": "text",
  "content": "<p>Just a simple text note</p>"
}
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
        "title": "My Note",
        "type": "text",
        "content": "<p>Just a simple text note</p>",
        "parentNoteIds": ["root"],
        "dateCreated": "2024-01-01T12:00:00.000Z"
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

## Configuration Options

### 1. Suggestion Levels

```typescript
interface SuggestionConfig {
  enabled: boolean;
  level: "minimal" | "standard" | "comprehensive";
  includeExamples: boolean;
  maxSuggestions: number;
}
```

### 2. Custom Rules

```typescript
interface CustomRule {
  name: string;
  condition: (note: CreatedNote) => boolean;
  suggestion: NextStepSuggestion;
  enabled: boolean;
}
```

## Benefits

### 1. User Experience
- **Guided Workflow**: Users get intelligent suggestions for next steps
- **Learning Tool**: Examples help users understand attribute management
- **Efficiency**: Reduces the need to remember when to add attributes

### 2. Developer Experience
- **Consistent Patterns**: Encourages best practices for note organization
- **Reduced Errors**: Suggests appropriate attributes for each note type
- **Documentation**: Examples serve as inline documentation

### 3. System Benefits
- **Better Organization**: Encourages proper note categorization
- **Searchability**: More notes will have useful attributes
- **Templates**: More notes will use appropriate templates

## Implementation Plan

### Phase 1: Basic Suggestion Engine
1. Implement note type-based suggestions
2. Add basic rule engine
3. Create suggestion templates

### Phase 2: Content Analysis
1. Add title keyword analysis
2. Implement MIME type suggestions
3. Add content pattern matching

### Phase 3: Advanced Features
1. Add custom rule support
2. Implement suggestion configuration
3. Add suggestion history and learning

### Phase 4: Integration
1. Integrate with `manage_attributes` function
2. Add workflow automation
3. Create comprehensive examples

## Related Documentation

- [manage_attributes Design](../manage-attributes-design.md) - Attribute management function
- [Note Types](note-types.md) - Complete list of supported note types
- [cURL Examples](curl-examples.md) - Basic note creation examples
