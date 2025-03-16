# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.

## Tools

The server provides the following tools for note management:

- `create_note` - Create a new note
  - Requires: parent note ID, title, type, content
  - Optional: MIME type for code/file/image notes
  - Supported note types: text, code, file, image, search, book, relationMap, render

- `search_notes` - Search through notes
  - Requires: search query
  - Optional: fastSearch (fulltext search toggle), includeArchivedNotes

- `get_note` - Retrieve a note by ID
  - Requires: note ID

- `get_note_content` - Get the content of a note by its ID
  - Requires: note ID

- `update_note` - Update an existing note
  - Requires: note ID
  - Optional: new title, new content

- `delete_note` - Delete a note
  - Requires: note ID

## Development

Git clone this repo:
```bash
git clone https://github.com/tan-yong-sheng/triliumnext-mcp.git
```

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "triliumnext-mcp": {

      "command": "node",
      "args": [
        "/path/to/triliumnext-mcp/build/index.js"
      ],
      "env": {
        "TRILIUM_API_URL": "http://localhost:8080/etapi",
        "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
