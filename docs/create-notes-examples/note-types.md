# TriliumNext MCP - Supported Note Types

This document provides comprehensive information about the note types supported by the TriliumNext MCP server.

## Overview

The TriliumNext MCP server supports **15 note types** that can be used in search operations and note creation. Each note type has specific characteristics, MIME types, and use cases. The note type enumeration is aligned exactly with the TriliumNext ETAPI specification.

## Supported Note Types

### 1. Text Notes (`text`)
- **Description**: Rich text notes with HTML formatting
- **MIME Type**: `text/html`
- **Use Cases**: General notes, documentation, articles, meeting notes
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "text"}
    ]
  }
  ```

### 2. Code Notes (`code`)
- **Description**: Code with syntax highlighting
- **MIME Types**: 
  - `text/x-python` (Python)
  - `text/x-javascript` (JavaScript)
  - `text/x-typescript` (TypeScript)
  - `text/x-dockerfile` (Docker)
  - `text/x-java` (Java)
  - `text/css` (CSS)
  - `text/html` (HTML)
  - `text/x-sql` (SQL)
  - `text/x-yaml` (YAML)
  - `text/x-markdown` (Markdown)
- **Use Cases**: Code snippets, scripts, configuration files, documentation
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "code"},
      {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-python"}
    ]
  }
  ```

### 3. Mermaid Diagrams (`mermaid`)
- **Description**: Mermaid diagram notes
- **MIME Type**: `text/vnd.mermaid`
- **Use Cases**: Flowcharts, sequence diagrams, Gantt charts, class diagrams
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid"}
    ]
  }
  ```

### 4. Canvas Notes (`canvas`)
- **Description**: Excalidraw drawings and sketches
- **MIME Type**: `application/json`
- **Use Cases**: Diagrams, sketches, mind maps, whiteboard drawings
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "canvas"}
    ]
  }
  ```

### 5. Book Notes (`book`)
- **Description**: Folders/containers for organizing other notes
- **MIME Type**: None (container type)
- **Use Cases**: Project folders, category containers, organizational structure
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "book"}
    ]
  }
  ```

### 6. Image Notes (`image`)
- **Description**: Image files and attachments
- **MIME Types**: 
  - `image/jpeg` (JPEG)
  - `image/png` (PNG)
  - `image/gif` (GIF)
  - `image/svg+xml` (SVG)
- **Use Cases**: Screenshots, diagrams, photos, illustrations
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "image"}
    ]
  }
  ```

### 7. File Notes (`file`)
- **Description**: File attachments and documents
- **MIME Types**: 
  - `application/pdf` (PDF)
  - `application/msword` (Word)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (Word DOCX)
  - `application/vnd.ms-excel` (Excel)
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel XLSX)
  - `text/plain` (Plain text)
- **Use Cases**: Documents, spreadsheets, presentations, any file attachment
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "file"},
      {"property": "mime", "type": "noteProperty", "op": "=", "value": "application/pdf"}
    ]
  }
  ```

### 8. Search Notes (`search`)
- **Description**: Saved search queries
- **MIME Type**: None (special type)
- **Use Cases**: Saved searches, search templates, reusable queries
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "search"}
    ]
  }
  ```

### 9. Web View Notes (`webView`)
- **Description**: Web content and embedded web pages
- **MIME Type**: `text/html`
- **Use Cases**: Web articles, embedded content, web-based tools
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "webView"}
    ]
  }
  ```

### 10. Render Notes (`render`)
- **Description**: Rendered content notes
- **MIME Type**: Varies by content type
- **Use Cases**: Dynamic content rendering, templates
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "render"}
    ]
  }
  ```

### 11. Note Map Notes (`noteMap`)
- **Description**: Visual note relationship maps
- **MIME Type**: `application/json`
- **Use Cases**: Mind mapping, relationship visualization
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "noteMap"}
    ]
  }
  ```

### 12. Shortcut Notes (`shortcut`)
- **Description**: Shortcuts to other notes or content
- **MIME Type**: None
- **Use Cases**: Quick access, navigation aids
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "shortcut"}
    ]
  }
  ```

### 13. Document Notes (`doc`)
- **Description**: Document container notes
- **MIME Type**: Varies by document type
- **Use Cases**: Document organization, structured content
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "doc"}
    ]
  }
  ```

### 14. Content Widget Notes (`contentWidget`)
- **Description**: Interactive widget containers
- **MIME Type**: `application/json`
- **Use Cases**: Interactive content, custom widgets
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "contentWidget"}
    ]
  }
  ```

### 15. Launcher Notes (`launcher`)
- **Description**: Application and script launchers
- **MIME Type**: None
- **Use Cases**: External application integration, automation
- **Search Example**:
  ```json
  {
    "searchCriteria": [
      {"property": "type", "type": "noteProperty", "op": "=", "value": "launcher"}
    ]
  }
  ```

## Template Relations

Some note types can be associated with built-in templates using the `~template.title` relation:

### Supported Templates:
- **Calendar** - Calendar notes
- **Board** - Task boards
- **Text Snippet** - Text snippets
- **Grid View** - Grid layouts
- **List View** - List layouts
- **Table** - Table views
- **Geo Map** - Geography maps

### Template Search Example:
```json
{
  "searchCriteria": [
    {"property": "template.title", "type": "relation", "op": "=", "value": "Board"}
  ]
}
```

## Search Patterns

### Find Multiple Note Types:
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "mermaid", "logic": "OR"},
    {"property": "type", "type": "noteProperty", "op": "=", "value": "canvas"}
  ]
}
```

### Find Notes by MIME Type:
```json
{
  "searchCriteria": [
    {"property": "mime", "type": "noteProperty", "op": "contains", "value": "text/x-"}
  ]
}
```

### Find Code Notes by Language:
```json
{
  "searchCriteria": [
    {"property": "type", "type": "noteProperty", "op": "=", "value": "code"},
    {"property": "mime", "type": "noteProperty", "op": "=", "value": "text/x-python"}
  ]
}
```

## ETAPI Alignment

All note types from the TriliumNext ETAPI are now supported by the MCP server. The enumeration exactly matches the ETAPI specification:

```
text, code, render, file, image, search, relationMap, book, noteMap, mermaid, webView, shortcut, doc, contentWidget, launcher
```

**Removed from MCP Support:**
- `canvas` - Was previously included but not supported by ETAPI

**Added to MCP Support:**
- `noteMap` - Note relationship maps
- `webView` - Web content embedding
- `shortcut` - Navigation shortcuts
- `doc` - Document containers
- `contentWidget` - Interactive widgets
- `launcher` - Application launchers

This ensures complete compatibility between MCP functionality and ETAPI capabilities.

## Best Practices

1. **Use specific MIME types** when searching for code or file notes
2. **Combine type and MIME filters** for precise results
3. **Use template relations** for finding notes with specific layouts
4. **Leverage boolean logic** to search across multiple note types
5. **Consider hierarchy navigation** for finding notes in specific contexts

## Related Documentation

- [Search Examples](search-examples/) - Detailed search examples
- [User Query Examples](user-query-examples.md) - Common user queries
- [Future Plan](future-plan.md) - Planned enhancements
