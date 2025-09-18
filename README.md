# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.

## Quick Start

Make sure to set up your environment variables first:
- `TRILIUM_API_URL` (default: http://localhost:8080/etapi)
- `TRILIUM_API_TOKEN` (required, get this from your Trilium Notes settings)
- `PERMISSIONS` (optional, default='READ;WRITE', where READ grants access to `search_notes`, `get_note`, `resolve_note_id`, and `read_attributes`, and WRITE grants access to `create_note`, `update_note`, `delete_note`, and `manage_attributes`)
- `VERBOSE` (optional, default='false', which if true will print verbose debugging logs)

## Installation

### 1. Using with Claude Desktop

Add the server config to your Claude Desktop configuration file:

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

**Feedback**: Please report issues and test results at [GitHub Issues](https://github.com/TriliumNext/Notes/issues)

## Available Tools

The server provides the following tools for note management:

### Search & Discovery Tools

- `search_notes` - Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation.
- `resolve_note_id` - Find a note's ID by its title. Essential for getting a note's ID to use with other tools.

### Note Management Tools

- `get_note` - Retrieve a note and its content by ID. Can also be used with regex to extract specific patterns from the content.
- `create_note` - Create a new note. Supports 9 note types and allows creating attributes (labels and relations) in the same step.
- `update_note` - Updates a note's title or content. Requires a `mode` (`'overwrite'` or `'append'`) to specify the update type and an `expectedHash` to prevent conflicts.
- `delete_note` - Permanently delete a note (⚠️ cannot be undone).

### Attribute Management Tools

- `read_attributes` - Read all attributes (labels and relations) for a given note.
- `manage_attributes` - Create, update, or delete attributes on a note. Supports batch creation.

> 📖 **Detailed Usage**: See [Note Management Guide](docs/manage-notes-examples/index.md) for revision control strategy and best practices.

## Example Queries

### Search & Discovery
- "Find my most recent 10 notes about 'n8n' since the beginning of 2024"
- "Show me notes I've edited in the last 7 days"
- "List all notes under 'n8n Template' folder, including subfolders"

### Content Management
- "Add today's update to my work log" (uses `update_note` with `mode: 'append'`)
- "Replace this draft with the final version" (uses `update_note` with `mode: 'overwrite'`)
- "Create a new note called 'Weekly Review' in my journal folder"

> 📖 **More Examples**: See [User Query Examples](docs/user-query-examples.md) for comprehensive usage scenarios.

## Documentation

- [Note Management Guide](docs/manage-notes-examples/index.md) - Safe content editing with revision control
- [User Query Examples](docs/user-query-examples.md) - Natural language query examples
- [Search Query Examples](docs/search-examples/) - Advanced search syntax and filters

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

## Contributing

Contributions are welcome! If you are looking to improve the server, please familiarize yourself with the official [Trilium Search DSL documentation](https://triliumnext.github.io/Docs/Wiki/search.html) and our internal [Search Query Examples](docs/search-examples/) to understand how search queries are constructed.

Please feel free to open an issue or submit a pull request.