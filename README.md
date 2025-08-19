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
    "PERMISSIONS": "READ;WRITE",
    "VERBOSE": "true"
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
  - Optional: includeArchivedNotes, includeProtectedNotes

- `search_notes_advanced` - Advanced filtered search with date ranges and text search
  - Optional: created_date_start, created_date_end, modified_date_start, modified_date_end
  - Optional: text (full-text search token), limit, includeArchivedNotes, includeProtectedNotes

### Note Discovery Tools

- `list_child_notes` - List direct children of a parent note (like Unix `ls` command)
  - Optional: parentNoteId (default: "root" for top-level notes)
  - Optional: orderBy, orderDirection, limit, includeArchivedNotes, includeProtectedNotes
  - Use when browsing note hierarchy or listing immediate children only

- `list_descendant_notes` - List ALL descendant notes recursively in database or subtree (like Unix `find` command)
  - Optional: parentNoteId (default: "root" to search entire note tree, omit for entire database)
  - Optional: orderBy, orderDirection, limit, includeArchivedNotes, includeProtectedNotes
  - Use when you need complete note inventory, discovery, or bulk operations

> **Function Comparison**: `list_child_notes` shows only direct children (like `ls`), while `list_descendant_notes` shows ALL descendants recursively (like `find`). Both support security defaults excluding protected and archived notes.

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

## Sample User Queries

### Search and Discovery
- Find my most recent 10 notes about 'n8n' since the beginning of 2020.
- Show me notes I've edited in the last 7 days.
- What are the 5 most recently modified notes about 'docker' from last year?
- Find notes created in the last week.
- Search for 'kubernetes' in notes created between January and June of this year.
- List all notes I worked on in the last week, either created or modified.

### Note Navigation and Browsing
- "List all notes" → Uses `list_child_notes` with parentNoteId="root" to show top-level notes
- "Show me what's in my project folder" → Uses `list_child_notes` with specific parentNoteId
- "Browse my note hierarchy" → Uses `list_child_notes` for directory-style navigation

### Complete Note Inventory
- "Show me everything I have" → Uses `list_descendant_notes` to recursively list all notes
- "Find all notes in my project" → Uses `list_descendant_notes` with parentNoteId for subtree search
- "Get complete note inventory" → Uses `list_descendant_notes` for bulk operations and analysis

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

