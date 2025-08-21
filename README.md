# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.

## Quick Start

Make sure to set up your environment variables first:
- `TRILIUM_API_URL` (default: http://localhost:8080/etapi)
- `TRILIUM_API_TOKEN` (required, get this from your Trilium Notes settings)
- `PERMISSIONS` (optional, default='READ;WRITE', where READ let this MCP has permissions to perform `search_notes` and `get_note` operation and WRITE let this MCP has permissions to perform `create_note`, `update_note` and `delete_note` operations) 
- `VERBOSE` (optional, default='false', where if true it will print out some logging response and pass the logs into LLM (such as API call) which is useful for developers to debug this MCP)

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


**Feedback**: Please report issues and test results at [GitHub Issues](https://github.com/TriliumNext/Notes/issues)


## Available Tools

The server provides the following tools for note management:

### Search Tools

- `search_notes` - Unified search with advanced filtering capabilities
  - Supports: full-text search, date ranges, field-specific searches, attribute searches, note properties, hierarchy navigation
  - Parameters: text, attributes, noteProperties, hierarchyType, parentNoteId, limit  
  - Use hierarchyType='descendants' with parentNoteId='root' for listing all notes (like Unix 'find')
  - Use hierarchyType='children' for browsing direct children (like Unix 'ls')
  - Automatically optimizes with fast search when only text search is used

- `manage_attributes` - Comprehensive attribute management system for CRUD operations on both labels and relations
  - **Operations**: list (discover attributes), create (add to note), update (modify), delete (remove), get (details)
  - **Types**: Supports both labels (#tags) and relations (~connections) with `attributeType` parameter
  - **Discovery**: Find all unique attribute names across notes with usage counts and values, filtered by type
  - **Management**: Create, update, and delete labels and relations on notes with full ETAPI integration
  - **Features**: Support for attribute values, positioning, inheritance, validation, and type-specific constraints

### Note Discovery Tools

- `search_notes` - Unified search and discovery tool with hierarchy navigation
  - Use hierarchyType='children' for direct children only (like Unix `ls` command)
  - Use hierarchyType='descendants' for ALL descendant notes recursively (like Unix `find` command)  
  - Supports all advanced search parameters for powerful filtering
  - For complete note inventory: `search_notes` with hierarchyType='descendants' and parentNoteId='root'
  - For browsing note hierarchy: `search_notes` with hierarchyType='children'

### Note Management Tools

- `get_note` - Retrieve a note content by ID
- `create_note` - Create a new note (supports various types: text, code, file, image, etc.)
- `update_note` - Replace entire note content (⚠️ creates backup by default)  
- `append_note` - Add content while preserving existing content (📝 optimized for logs/journals)
- `delete_note` - Permanently delete a note (⚠️ cannot be undone)

> 📖 **Detailed Usage**: See [Content Modification Guide](docs/content-modification-guide.md) for revision control strategy and best practices.

## Example Queries

### Search & Discovery
- "Find my most recent 10 notes about 'n8n' since the beginning of 2020"
- "Show me notes I've edited in the last 7 days"
- "Find notes with 'machine learning' in the title created this year"
- "Search for 'kubernetes' in notes created between January and June"

### Navigation & Browsing
- "List all notes including subfolders" → Uses `search_notes` with hierarchyType='descendants' and parentNoteId='root'
- "Show me everything I have" → Uses `search_notes` with hierarchyType='descendants' for complete inventory
- "List all notes" → Uses `search_notes` with hierarchyType='children' and specific parentNoteId
- "List all notes under 'n8n Template' folder" → Uses `search_notes` with hierarchyType='children' and specific parentNoteId
- "List all notes under 'n8n Template' folder, including subfolders" → Uses `search_notes` with hierarchyType='descendants' and specific parentNoteId


### Content Management
- "Add today's update to my work log" (uses `append_note`)
- "Replace this draft with the final version" (uses `update_note`)
- "Create a new note called 'Weekly Review' in my journal folder"

> 📖 **More Examples**: See [User Query Examples](docs/user-query-examples.md) for comprehensive usage scenarios.

## Documentation

- [Content Modification Guide](docs/content-modification-guide.md) - Safe content editing with revision control
- [User Query Examples](docs/user-query-examples.md) - Natural language query examples
- [Search Query Examples](docs/search-query-examples.md) - Advanced search syntax and filters

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

Contributions are welcome! If you are looking to improve the server, especially the search functionality, please familiarize yourself with the following resources:

- **Trilium Search DSL**: The [official documentation](https://triliumnext.github.io/Docs/Wiki/search.html) provides the foundation for all search queries.
- **Internal Search Implementation**: Our [Search Query Examples](docs/search-query-examples.md) document details how `search_notes` parameters are translated into Trilium search strings. This is crucial for understanding and extending the current implementation.

Please feel free to open an issue or submit a pull request.


