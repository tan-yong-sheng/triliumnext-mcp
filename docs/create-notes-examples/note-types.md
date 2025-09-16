# TriliumNext MCP - Supported Note Types

This document provides comprehensive information about the note types supported by the TriliumNext MCP server.

## Overview

The TriliumNext MCP server supports **13 note types** for search operations that align with the TriliumNext ETAPI specification. However, note creation is currently limited to **text and code note types only** to ensure reliability and eliminate file upload issues. Each note type has specific characteristics, MIME types, and use cases.

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

### 4. File Notes (`file`) - Search Only
- **Description**: File attachments and documents (searchable only, creation disabled)
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

### 5. Book Notes (`book`) - Search Only
- **Description**: Folders/containers for organizing other notes (searchable only, creation disabled)
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

### 6. Image Notes (`image`) - Search Only
- **Description**: Image files and attachments (searchable only, creation disabled)
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

### 7. Search Notes (`search`) - Search Only
- **Description**: Saved search queries (searchable only, creation disabled)
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

### 8. Web View Notes (`webView`) - Search Only
- **Description**: Web content and embedded web pages (searchable only, creation disabled)
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

### 9. Render Notes (`render`) - Search Only
- **Description**: Rendered content notes (searchable only, creation disabled)
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

### 10. Note Map Notes (`noteMap`) - Search Only
- **Description**: Visual note relationship maps (searchable only, creation disabled)
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

### 11. Shortcut Notes (`shortcut`) - Search Only
- **Description**: Shortcuts to other notes or content (searchable only, creation disabled)
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

### 12. Document Notes (`doc`) - Search Only
- **Description**: Document container notes (searchable only, creation disabled)
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

### 13. Content Widget Notes (`contentWidget`) - Search Only
- **Description**: Interactive widget containers (searchable only, creation disabled)
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

### 14. Launcher Notes (`launcher`) - Search Only
- **Description**: Application and script launchers (searchable only, creation disabled)
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

The MCP server supports **13 note types** that align with the TriliumNext ETAPI specification:

```
text, code, render, search, relationMap, book, noteMap, mermaid, webView, shortcut, doc, contentWidget, launcher
```

**Creation Support:**
- **Text and Code notes**: Full creation support with smart content processing
- **All other note types**: Search-only (can be found and queried but not created through MCP)

**Search Support:**
- **All 13 note types**: Full search capabilities with filters, boolean logic, and template relations

**Note**: File and image note creation has been temporarily disabled due to API implementation challenges. These can be searched and accessed but cannot be created through the MCP server at this time.

## Best Practices

1. **Use specific MIME types** when searching for code notes
2. **Combine type and MIME filters** for precise results
3. **Use template relations** for finding notes with specific layouts
4. **Leverage boolean logic** to search across multiple note types
5. **Consider hierarchy navigation** for finding notes in specific contexts
6. **Remember**: Only text and code notes can be created; other types must be created directly in TriliumNext

## Related Documentation

- [Search Examples](search-examples/) - Detailed search examples
- [User Query Examples](user-query-examples.md) - Common user queries
- [Future Plan](future-plan.md) - Planned enhancements
