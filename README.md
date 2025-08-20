# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.


> Update: support latest version of TriliumNext v0.92.6

> Note: Suggest to use with Cline extension in VSCode, instead of Claude Desktop

> You could now install the beta version via the command: `npx -y triliumnext-mcp@beta`


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

## Beta Testing

🧪 **Want to test the latest features before they're stable?**

To install the beta version with cutting-edge features:

```bash
npm install -g triliumnext-mcp@beta
```

**Beta Features (v0.3.0-beta.1)**:
- ⚠️ **Relation search support**: Search by note relations (`~author.title`, `~relatedTo`) - *Implementation complete but untested*
- ✅ **Enhanced attribute logic**: Improved AND/OR logic handling with explicit parameter requirements
- ✅ **FastSearch logic fixes**: Resolved issues with `limit` and `orderBy` parameters causing empty results
- ✅ **Logic consistency**: Required `logic` field for all array items prevents LLM confusion

**⚠️ Beta Disclaimer**: 
- Beta versions may contain bugs or untested features
- Relation search functionality is implemented but not validated against live TriliumNext instances
- Use stable version (`npm install -g triliumnext-mcp`) for production environments
- Always backup your notes before testing beta features

**Beta Configuration**: Use the same configuration as above, but the beta version will be used automatically.

**Feedback**: Please report issues and test results at [GitHub Issues](https://github.com/TriliumNext/Notes/issues)


## Available Tools

The server provides the following tools for note management:

### Search Tools

- `search_notes` - Unified search with advanced filtering capabilities
  - Supports: full-text search, date ranges, field-specific searches, attribute searches, note properties, hierarchy navigation
  - Parameters: text, created_date_start/end, modified_date_start/end, filters, attributes, noteProperties, hierarchyType, parentNoteId, limit, orderBy
  - Automatically optimizes with fast search when only text search is used

- `manage_attributes` - Comprehensive attribute management system for CRUD operations on both labels and relations
  - **Operations**: list (discover attributes), create (add to note), update (modify), delete (remove), get (details)
  - **Types**: Supports both labels (#tags) and relations (~connections) with `attributeType` parameter
  - **Discovery**: Find all unique attribute names across notes with usage counts and values, filtered by type
  - **Management**: Create, update, and delete labels and relations on notes with full ETAPI integration
  - **Features**: Support for attribute values, positioning, inheritance, validation, and type-specific constraints

### Note Discovery Tools

- `search_notes` - Unified search with comprehensive filtering and hierarchy navigation
  - Use `hierarchyType="children"` with `parentNoteId` for direct children listing (like Unix `ls` command)
  - Use `hierarchyType="descendants"` with `parentNoteId` for recursive listing (like Unix `find` command)
  - Supports all search parameters: text search, date filtering, attributes, note properties, and more
  - **For "list all notes" requests**: Use `hierarchyType="descendants"` with `parentNoteId="root"`
  - **For browsing folders**: Use `hierarchyType="children"` with specific parent ID

> **Hierarchy Navigation**: Use `hierarchyType="children"` for immediate children (like `ls`) or `hierarchyType="descendants"` for complete recursive discovery (like `find`). All search parameters work with both hierarchy types for powerful filtering capabilities.

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
- "List all notes" (shows top-level notes)
- "Show me what's in my project folder" 
- "Show me everything I have" (complete inventory)

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


