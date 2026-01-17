# TriliumNext Notes' MCP Server

⚠️ **DISCLAIMER: This is a prototype for https://github.com/TriliumNext/Notes/issues/705. Suggested only for developer use. Please backup your Trilium notes before using this tool.** ⚠️

A model context protocol server for TriliumNext Notes. This server provides tools to interact with your Trilium Notes instance through MCP.

## Quick Start

Make sure to set up your environment variables first:
- `TRILIUM_API_URL` (default: http://localhost:8080/etapi)
- `TRILIUM_API_TOKEN` (required, get this from your Trilium Notes settings)
- `PERMISSIONS` (optional, default=''READ;WRITE'', where READ grants access to `search_notes`, `get_note`, `resolve_note_id`, and `read_attributes`, and WRITE grants access to `create_note`, `update_note`, `delete_note`, and `manage_attributes`)
- `VERBOSE` (optional, default='false', which if true will print verbose debugging logs)

## Installation


Below are the installation guide for this MCP on different MCP clients, such as Claude Desktop, Claude Code, Cursor, Cline, etc.

<details>
<summary>Claude Desktop</summary>

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "triliumnext-mcp": {
      "command": "npx",
      "args": ["triliumnext-mcp"],
      "env": {
        "TRILIUM_API_URL": "http://localhost:8080/etapi",
        "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
        "PERMISSIONS": "'READ;WRITE'"
      }
    }
  }
}
```
</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add triliumnext-mcp \
  -e TRILIUM_API_URL=http://localhost:8080/etapi \
  -e TRILIUM_API_TOKEN=<YOUR_TRILIUM_API_TOKEN> \
  -e PERMISSIONS='READ;WRITE' \
  -- npx triliumnext-mcp
```

Note: Increase the MCP startup timeout to 1 minutes and MCP tool execution timeout to about 5 minutes by updating `~\.claude\settings.json` as follows:

```json
{
  "env": {
    "MCP_TIMEOUT": "60000",
    "MCP_TOOL_TIMEOUT": "300000"
  }
}
```

</details>

<details>
<summary>Cursor</summary>

Go to: Settings -> Cursor Settings -> MCP -> Add new global MCP server

Pasting the following configuration into your Cursor ~/.cursor/mcp.json file is the recommended approach. You may also install in a specific project by creating .cursor/mcp.json in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

```json
{
  "mcpServers": {
    "triliumnext-mcp": {
      "command": "npx",
      "args": ["triliumnext-mcp"],
      "env": {
        "TRILIUM_API_URL": "http://localhost:8080/etapi",
        "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
        "PERMISSIONS": "'READ;WRITE'"
      }
    }
  }
}
```
</details>


<details>
<summary>Cline</summary>

Cline uses a JSON configuration file to manage MCP servers. To integrate the provided MCP server configuration:

1. Open Cline and click on the MCP Servers icon in the top navigation bar.
2. Select the Installed tab, then click Advanced MCP Settings.
3. In the cline_mcp_settings.json file, add the following configuration:

(i) Using Google AI Studio Provider
```json
{
  "mcpServers": {
    "timeout": 300, 
    "type": "stdio",
    "triliumnext-mcp": {
      "command": "npx",
      "args": ["triliumnext-mcp"],
      "env": {
        "TRILIUM_API_URL": "http://localhost:8080/etapi",
        "TRILIUM_API_TOKEN": "<YOUR_TRILIUM_API_TOKEN>",
        "PERMISSIONS": "'READ;WRITE'"
      }
    }
  }
}
```
</details>


<details>

<summary>Other MCP clients</summary>

The server uses stdio transport and follows the standard MCP protocol. It can be integrated with any MCP-compatible client by running:

```bash
npx triliumnext-mcp
```
</details>

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