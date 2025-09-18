# TriliumNext MCP - Supported Note Types

This document provides comprehensive information about the note types supported by the TriliumNext MCP server.

## Overview

The TriliumNext MCP server supports a wide range of note types for search operations, aligning with the TriliumNext ETAPI specification. For creation, a specific subset of these types is supported to ensure reliability.

## Note Creation Support

The `create_note` tool supports the following **9 note types**:

1.  **`text`** - Rich text notes with smart format detection (Markdown, HTML, plain text).
2.  **`code`** - Code snippets with syntax highlighting. Requires a `mime` type.
3.  **`render`** - Notes with custom HTML/JS rendering.
4.  **`search`** - Saved search queries.
5.  **`relationMap`** - Notes for visualizing relationships.
6.  **`book`** - Folders or containers for organizing other notes.
7.  **`noteMap`** - Visual note mapping layouts.
8.  **`mermaid`** - Mermaid diagram notes.
9.  **`webView`** - Notes for embedding web content.

**Note**: While `file` and `image` note types exist in Trilium, their creation via the MCP is temporarily disabled to ensure system stability.

## Search-Only Note Types

In addition to the creatable types, the following types can be found via `search_notes` but not created:

-   **`file`**: File attachments and documents.
-   **`image`**: Image files.
-   **`canvas`**: Excalidraw drawing notes.

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