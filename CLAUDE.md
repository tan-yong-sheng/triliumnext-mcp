# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for TriliumNext Notes that provides tools to interact with Trilium Notes instances through the MCP framework. The server allows AI assistants to search, read, create, update, and delete notes in TriliumNext through its External API (ETAPI).

## Key Architecture

- **Single TypeScript file**: All server logic is contained in `src/index.ts`
- **MCP SDK Integration**: Uses `@modelcontextprotocol/sdk` for server implementation
- **HTTP Client**: Uses `axios` for TriliumNext API communication
- **Markdown Processing**: Uses `marked` library to parse Markdown content before saving to Trilium
- **Permission System**: Configurable READ/WRITE permissions via environment variables

## Environment Variables

Required environment variables for operation:
- `TRILIUM_API_TOKEN` (required): Authentication token from TriliumNext settings
- `TRILIUM_API_URL` (optional): API endpoint, defaults to `http://localhost:8080/etapi`
- `PERMISSIONS` (optional): Semicolon-separated permissions, defaults to `READ;WRITE`

## Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript and set executable permissions
npm run prepare        # Same as build (runs on npm install)
npm run watch          # Watch mode for development
```

### Testing and Debugging
```bash
npm run inspector      # Run MCP inspector for testing tools
```

### Development Setup
```bash
npm install            # Install dependencies
npm run build         # Build the project
node build/index.js   # Run the server directly
```

## MCP Tools Available

The server exposes different tools based on permissions:

**READ Permission Tools:**
- `search_notes`: Search through notes with optional filters
- `get_note`: Retrieve note content by ID

**WRITE Permission Tools:**
- `create_note`: Create new notes with various types (text, code, file, image, etc.)
- `update_note`: Update existing note content
- `delete_note`: Delete notes by ID

## Note Types Supported

- `text`: Regular text notes
- `code`: Code notes with syntax highlighting
- `file`: File attachments
- `image`: Image notes
- `search`: Search notes
- `book`: Book/folder notes
- `relationMap`: Relation map notes
- `render`: Render notes

## Content Processing

The server includes automatic Markdown detection and conversion:
- Detects likely Markdown content using heuristics
- Converts Markdown to HTML using the `marked` library
- Falls back to original content if parsing fails

## API Integration

Uses TriliumNext's External API (ETAPI) with endpoints defined in `openapi.yaml`:
- Authentication via Authorization header
- JSON request/response format
- RESTful API design following OpenAPI 3.0.3 specification