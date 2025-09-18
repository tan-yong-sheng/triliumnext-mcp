# TriliumNext MCP - Supported Note Types

This document provides comprehensive information about the note types supported by the TriliumNext MCP server.

## Overview

The TriliumNext MCP server currently supports **9 note types** for both search and creation operations. These types have been carefully selected to ensure reliability and stability with the current TriliumNext ETAPI implementation.

## Supported Note Types (Search & Creation)

The following **9 note types** are fully supported for both search and creation operations:

1.  **`text`** - Rich text notes with smart format detection (Markdown, HTML, plain text).
2.  **`code`** - Code snippets with syntax highlighting. Requires a `mime` type.
3.  **`render`** - Notes with custom HTML/JS rendering.
4.  **`search`** - Saved search queries.
5.  **`relationMap`** - Notes for visualizing relationships.
6.  **`book`** - Folders or containers for organizing other notes.
7.  **`noteMap`** - Visual note mapping layouts.
8.  **`mermaid`** - Mermaid diagram notes.
9.  **`webView`** - Notes for embedding web content.

## Type Support Matrix

| Type | Search | Create | Description | MIME Type Support |
|------|--------|--------|-------------|-------------------|
| `text` | ✅ | ✅ | Rich text with smart format detection | Not applicable |
| `code` | ✅ | ✅ | Code with syntax highlighting | Required (e.g., `text/javascript`) |
| `render` | ✅ | ✅ | Custom HTML/JS rendering | Optional |
| `search` | ✅ | ✅ | Saved search queries | Optional |
| `relationMap` | ✅ | ✅ | Relationship visualization | Optional |
| `book` | ✅ | ✅ | Folders/containers | Optional |
| `noteMap` | ✅ | ✅ | Visual mapping layouts | Optional |
| `mermaid` | ✅ | ✅ | Mermaid diagram syntax | `text/vnd.mermaid` |
| `webView` | ✅ | ✅ | Web content embedding | Optional |

## Currently Unsupported Types

The following note types exist in TriliumNext but are **not supported** by the MCP server:

- **`file`**: File attachments and documents (ETAPI upload limitations)
- **`image`**: Image files (ETAPI upload limitations)
- **`canvas`**: Excalidraw drawing notes (currently not yet supported)
- **`shortcut`**: Navigation shortcuts (deprecated in ETAPI)
- **`doc`**: Document containers (deprecated in ETAPI)
- **`contentWidget`**: Interactive widgets (deprecated in ETAPI)
- **`launcher`**: Application launchers (deprecated in ETAPI)

**Note**: These types are excluded due to either ETAPI limitations, stability concerns, or deprecation in the current TriliumNext version.

## Search Examples

Find notes by type using the `search_notes` tool:

```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "text"
    }
  ]
}
```

### Find All Code Notes with Specific MIME Type
```json
{
  "searchCriteria": [
    {
      "property": "type",
      "type": "noteProperty",
      "op": "=",
      "value": "code",
      "logic": "AND"
    },
    {
      "property": "mime",
      "type": "noteProperty",
      "op": "=",
      "value": "text/javascript"
    }
  ]
}
```

### Find All Template-Based Notes
```json
{
  "searchCriteria": [
    {
      "property": "template.title",
      "type": "relation",
      "op": "=",
      "value": "Board"
    }
  ]
}
```

## Template Relations

Some note types can be associated with built-in templates using the `~template` relation:

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

## Best Practices

1.  **Use specific MIME types** when creating or searching for code notes.
2.  **Combine type and other filters** for precise search results.
3.  **Use template relations** for finding notes with specific layouts.
4.  **Remember**: Only the 9 specified note types can be created through the MCP.