# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.


> Update: support latest version of TriliumNext v0.92.6

> Note: Suggest to use with Cline extension in VSCode, instead of Claude Desktop

## Quick Start

Make sure to set up your environment variables first:
- `TRILIUM_API_URL` (default: http://localhost:8080/etapi)
- `TRILIUM_API_TOKEN` (required, get this from your Trilium Notes settings)
- `PERMISSIONS` (optional, default='READ;WRITE', where READ let this MCP has permissions to perform `search_notes` and `get_note` operation and WRITE let this MCP has permissions to perform `create_note`, `update_note` and `delete_note` operations) 

## Installation

### 1. Using with Claude Desktop 

Add the server config to your Claude Desktop configuration file:

Add the following configuration to the `mcpServers` object in your Claude configuration file:


#### For Local Installation (on Windows)

```json
"triliumnext-mcp": {
  "command": "cmd",
  "args": [
        "/k",
        "npx",
        "-y",
        "triliumnext-mcp"
      ],
   "env": {
    "TRILIUM_API_URL": "http://localhost:8080/etapi",
    "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
    "PERMISSIONS": "READ;WRITE"
  }
}
```

#### For Local installation (on Linux)

```json
"triliumnext-mcp": {
  "command": "npx",
  "args": [
        "-y",
        "triliumnext-mcp"
      ],
   "env": {
    "TRILIUM_API_URL": "http://localhost:8080/etapi",
    "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
    "PERMISSIONS": "READ;WRITE"
  }
}
```

#### For Development (on Windows / Linux)

```bash
cd /path/to/triliumnext-mcp
npm run build
```

```json
"triliumnext-mcp": {
  "command": "node",
  "args": [
        "/path/to/triliumnext-mcp/build/index.js"
  ],
  "env": {
    "TRILIUM_API_URL": "http://localhost:8080/etapi",
    "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
    "PERMISSIONS": "READ;WRITE"
  }
}
```


Location of the configuration file:
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`



## Available Tools

The server provides the following tools for note management:

### Search Tools

- `search_notes` - Fast full-text search for finding notes by keywords
  - Requires: search query
  - Optional: includeArchivedNotes

- `search_notes_advanced` - Advanced filtered search with date ranges and text search
  - Optional: created_date_start, created_date_end, modified_date_start, modified_date_end
  - Optional: text (full-text search token), limit, includeArchivedNotes

### Note Management Tools

- `get_note` - Retrieve a note content by ID
  - Requires: note ID

- `create_note` - Create a new note
  - Requires: parent note ID, title, type, content
  - Optional: MIME type for code/file/image notes
  - Supported note types: text, code, file, image, search, book, relationMap, render

- `update_note` - Update an existing note
  - Requires: note ID
  - Optional: new title, new content

- `delete_note` - Delete a note
  - Requires: note ID

## Development

If you want to contribute or modify the server:

```bash
# Clone the repository
git clone https://github.com/tan-yong-sheng/triliumnext-mcp.git

# Install dependencies
npm install

# Build the server
npm run build

# For development with auto-rebuild
npm run watch
```

