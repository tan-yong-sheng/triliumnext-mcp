#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { buildSearchQuery } from "./modules/searchQueryBuilder.js";
import { processContent } from "./modules/contentProcessor.js";
import { trimNoteResults, formatNotesForListing } from "./modules/noteFormatter.js";
import { createSearchDebugInfo, createListSummary } from "./modules/responseUtils.js";

const TRILIUM_API_URL = process.env.TRILIUM_API_URL;
const TRILIUM_API_TOKEN = process.env.TRILIUM_API_TOKEN;
const PERMISSIONS = process.env.PERMISSIONS || "READ;WRITE";

if (!TRILIUM_API_TOKEN) {
  throw new Error("TRILIUM_API_TOKEN environment variable is required");
}

class TriliumServer {
  private server: Server;
  private axiosInstance;
  private allowedPermissions: string[];

  constructor() {
    this.allowedPermissions = PERMISSIONS.split(';');

    this.server = new Server(
      {
        name: "triliumnext-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: TRILIUM_API_URL,
      headers: {
        Authorization: TRILIUM_API_TOKEN
      }
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private hasPermission(permission: string): boolean {
    return this.allowedPermissions.includes(permission);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];

      if (this.hasPermission("WRITE")) {
        tools.push({
          name: "create_note",
          description: "Create a new note in TriliumNext. ONLY use this tool when the user explicitly requests note creation (e.g., 'create a note', 'make a new note'). DO NOT use this tool proactively or when the user is only asking questions about their notes.",
          inputSchema: {
            type: "object",
            properties: {
              parentNoteId: {
                type: "string",
                description: "ID of the parent note",
                default: "root"
              },
              title: {
                type: "string",
                description: "Title of the note",
              },
              type: {
                type: "string",
                enum: ["text", "code", "file", "image", "search", "book", "relationMap", "render"],
                description: "Type of note",
              },
              content: {
                type: "string",
                description: "Content of the note",
              },
              mime: {
                type: "string",
                description: "MIME type for code/file/image notes",
              },
            },
            required: ["parentNoteId", "title", "type", "content"],
          },
        });
        tools.push({
          name: "update_note",
          description: "Update the content of an existing note with optional revision creation. WARNING: This completely replaces the note's content. Consider using 'append_note' for adding content without replacement. STRONGLY RECOMMENDED: Keep revision=true (default) to create a backup before overwriting, unless explicitly instructed otherwise to prevent irreversible data loss.",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to update"
              },
              content: {
                type: "string",
                description: "New content for the note"
              },
              revision: {
                type: "boolean",
                description: "Whether to create a revision before updating (default: true for safety)",
                default: true
              }
            },
            required: ["noteId", "content"]
          }
        });
        tools.push({
          name: "append_note",
          description: "Appends new content to an existing note without overwriting it. Use this instead of update_note when you want to add text below the existing content (e.g., logs, journals). For full content replacement, use update_note. By default, it avoids creating revisions (revision=false) to improve performance during frequent additions.",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to append content to"
              },
              content: {
                type: "string",
                description: "Content to append to the existing note"
              },
              revision: {
                type: "boolean",
                description: "Whether to create a revision before appending (default: false for performance)",
                default: false
              }
            },
            required: ["noteId", "content"]
          }
        });
        tools.push({
          name: "delete_note",
          description: "Delete a note permanently. CAUTION: This action cannot be undone and will permanently remove the note and all its content.",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to delete",
              },
            },
            required: ["noteId"],
          },
        });
      }

      if (this.hasPermission("READ")) {
        tools.push({
          name: "get_note",
          description: "Get a note and its content by ID",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to retrieve",
              },
              includeContent: {
                type: "boolean",
                description: "Whether to include the note's content in the response",
                default: true
              }
            },
            required: ["noteId"],
          },
        });
        tools.push({
          name: "search_notes",
          description: "Unified search with structured parameters. Supports: full-text search, date filtering, field-specific searches (title/content), attribute searches (#labels), note properties (isArchived), and hierarchy navigation (children/descendants). Automatically optimizes with fast search when only text search is used.",
          inputSchema: {
            type: "object",
            properties: {
              created_date_start: {
                type: "string",
                description: "ISO date for created date start (e.g., '2024-01-01')",
              },
              created_date_end: {
                type: "string", 
                description: "ISO date for created date end, exclusive (e.g., '2024-12-31')",
              },
              modified_date_start: {
                type: "string",
                description: "ISO date for modified date start (e.g., '2024-01-01')",
              },
              modified_date_end: {
                type: "string",
                description: "ISO date for modified date end, exclusive (e.g., '2024-12-31')",
              },
              text: {
                type: "string",
                description: "Simple text search token for full-text search (NOT a query string - just plain text like 'kubernetes')",
              },
              filters: {
                type: "array",
                description: "Array of field-specific filter conditions for precise searches on title and content fields",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                      enum: ["title", "content"],
                      description: "Field to filter on"
                    },
                    op: {
                      type: "string", 
                      enum: ["contains", "starts_with", "ends_with", "not_equal"],
                      description: "Filter operator"
                    },
                    value: {
                      type: "string",
                      description: "Value to filter for"
                    }
                  },
                  required: ["field", "op", "value"]
                }
              },
              attributes: {
                type: "array",
                description: "Array of attribute-based search conditions for Trilium labels (e.g., #book, #author). Supports existence checks and value-based searches.",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["label"],
                      description: "Type of attribute (currently only 'label' is supported)"
                    },
                    name: {
                      type: "string",
                      description: "Name of the label (e.g., 'book', 'author', 'archived')"
                    },
                    op: {
                      type: "string",
                      enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with"],
                      description: "Attribute operator - 'exists' checks for label presence, others compare values",
                      default: "exists"
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (optional for 'exists'/'not_exists' operators)"
                    }
                  },
                  required: ["type", "name"]
                }
              },
              noteProperties: {
                type: "array",
                description: "Array of note property-based search conditions (e.g., note.isArchived, note.isProtected). Supports filtering by built-in note properties.",
                items: {
                  type: "object",
                  properties: {
                    property: {
                      type: "string",
                      enum: ["isArchived", "isProtected", "type", "title"],
                      description: "Note property to filter on"
                    },
                    op: {
                      type: "string",
                      enum: ["=", "!="],
                      description: "Comparison operator",
                      default: "="
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (e.g., 'true', 'false', 'text', 'code')"
                    }
                  },
                  required: ["property", "value"]
                }
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
              },
              orderBy: {
                type: "string",
                description: "Sort order for results (e.g., 'note.dateCreated desc', 'note.dateModified asc', 'note.title')",
              },
              hierarchyType: {
                type: "string",
                enum: ["children", "descendants"],
                description: "Optional hierarchy search type: 'children' for direct children only (like 'ls'), 'descendants' for all descendants recursively (like 'find')"
              },
              parentNoteId: {
                type: "string", 
                description: "Parent note ID for hierarchy searches. Use 'root' for top-level. Only used when hierarchyType is specified.",
                default: "root"
              },
            },
          },
        });
        tools.push({
          name: "list_descendant_notes",
          description: "List ALL descendant notes recursively in database or subtree (like Unix 'find' command). PREFERRED for 'list all notes' requests - provides complete note inventory. Use when user wants to see everything, discovery, or bulk operations. Supports all search_notes parameters for powerful filtering.",
          inputSchema: {
            type: "object",
            properties: {
              created_date_start: {
                type: "string",
                description: "ISO date for created date start (e.g., '2024-01-01')",
              },
              created_date_end: {
                type: "string", 
                description: "ISO date for created date end, exclusive (e.g., '2024-12-31')",
              },
              modified_date_start: {
                type: "string",
                description: "ISO date for modified date start (e.g., '2024-01-01')",
              },
              modified_date_end: {
                type: "string",
                description: "ISO date for modified date end, exclusive (e.g., '2024-12-31')",
              },
              text: {
                type: "string",
                description: "Simple text search token for full-text search (NOT a query string - just plain text like 'kubernetes')",
              },
              filters: {
                type: "array",
                description: "Array of field-specific filter conditions for precise searches on title and content fields",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                      enum: ["title", "content"],
                      description: "Field to filter on"
                    },
                    op: {
                      type: "string", 
                      enum: ["contains", "starts_with", "ends_with", "not_equal"],
                      description: "Filter operator"
                    },
                    value: {
                      type: "string",
                      description: "Value to filter for"
                    }
                  },
                  required: ["field", "op", "value"]
                }
              },
              attributes: {
                type: "array",
                description: "Array of attribute-based search conditions for Trilium labels (e.g., #book, #author). Supports existence checks and value-based searches.",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["label"],
                      description: "Type of attribute (currently only 'label' is supported)"
                    },
                    name: {
                      type: "string",
                      description: "Name of the label (e.g., 'book', 'author', 'archived')"
                    },
                    op: {
                      type: "string",
                      enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with"],
                      description: "Attribute operator - 'exists' checks for label presence, others compare values",
                      default: "exists"
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (optional for 'exists'/'not_exists' operators)"
                    }
                  },
                  required: ["type", "name"]
                }
              },
              noteProperties: {
                type: "array",
                description: "Array of note property-based search conditions (e.g., note.isArchived, note.isProtected). Supports filtering by built-in note properties.",
                items: {
                  type: "object",
                  properties: {
                    property: {
                      type: "string",
                      enum: ["isArchived", "isProtected", "type", "title"],
                      description: "Note property to filter on"
                    },
                    op: {
                      type: "string",
                      enum: ["=", "!="],
                      description: "Comparison operator",
                      default: "="
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (e.g., 'true', 'false', 'text', 'code')"
                    }
                  },
                  required: ["property", "value"]
                }
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
              },
              orderBy: {
                type: "string",
                description: "Sort order for results (e.g., 'note.dateCreated desc', 'note.dateModified asc', 'note.title')",
              },
              parentNoteId: {
                type: "string", 
                description: "Parent note ID for listing descendants. Use 'root' for entire note tree, or omit to search entire database.",
                default: "root"
              },
            },
          },
        });
        tools.push({
          name: "list_child_notes",
          description: "List direct child notes of a parent note (like Unix 'ls' command). Use for browsing/navigating note hierarchy or when user specifically wants only direct children. Supports all search_notes parameters for powerful filtering.",
          inputSchema: {
            type: "object",
            properties: {
              created_date_start: {
                type: "string",
                description: "ISO date for created date start (e.g., '2024-01-01')",
              },
              created_date_end: {
                type: "string", 
                description: "ISO date for created date end, exclusive (e.g., '2024-12-31')",
              },
              modified_date_start: {
                type: "string",
                description: "ISO date for modified date start (e.g., '2024-01-01')",
              },
              modified_date_end: {
                type: "string",
                description: "ISO date for modified date end, exclusive (e.g., '2024-12-31')",
              },
              text: {
                type: "string",
                description: "Simple text search token for full-text search (NOT a query string - just plain text like 'kubernetes')",
              },
              filters: {
                type: "array",
                description: "Array of field-specific filter conditions for precise searches on title and content fields",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                      enum: ["title", "content"],
                      description: "Field to filter on"
                    },
                    op: {
                      type: "string", 
                      enum: ["contains", "starts_with", "ends_with", "not_equal"],
                      description: "Filter operator"
                    },
                    value: {
                      type: "string",
                      description: "Value to filter for"
                    }
                  },
                  required: ["field", "op", "value"]
                }
              },
              attributes: {
                type: "array",
                description: "Array of attribute-based search conditions for Trilium labels (e.g., #book, #author). Supports existence checks and value-based searches.",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["label"],
                      description: "Type of attribute (currently only 'label' is supported)"
                    },
                    name: {
                      type: "string",
                      description: "Name of the label (e.g., 'book', 'author', 'archived')"
                    },
                    op: {
                      type: "string",
                      enum: ["exists", "not_exists", "=", "!=", ">=", "<=", ">", "<", "contains", "starts_with", "ends_with"],
                      description: "Attribute operator - 'exists' checks for label presence, others compare values",
                      default: "exists"
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (optional for 'exists'/'not_exists' operators)"
                    }
                  },
                  required: ["type", "name"]
                }
              },
              noteProperties: {
                type: "array",
                description: "Array of note property-based search conditions (e.g., note.isArchived, note.isProtected). Supports filtering by built-in note properties.",
                items: {
                  type: "object",
                  properties: {
                    property: {
                      type: "string",
                      enum: ["isArchived", "isProtected", "type", "title"],
                      description: "Note property to filter on"
                    },
                    op: {
                      type: "string",
                      enum: ["=", "!="],
                      description: "Comparison operator",
                      default: "="
                    },
                    value: {
                      type: "string",
                      description: "Value to compare against (e.g., 'true', 'false', 'text', 'code')"
                    }
                  },
                  required: ["property", "value"]
                }
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
              },
              orderBy: {
                type: "string",
                description: "Sort order for results (e.g., 'note.dateCreated desc', 'note.dateModified asc', 'note.title')",
              },
              parentNoteId: {
                type: "string", 
                description: "Parent note ID for listing children. Use 'root' for top-level notes.",
                default: "root"
              },
            },
          },
        });
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!request.params.arguments) {
        throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
      }

      try {
        switch (request.params.name) {
          case "create_note": {
            if (!this.hasPermission("WRITE")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to create notes.");
            }
            if (
              typeof request.params.arguments.parentNoteId !== "string" ||
              typeof request.params.arguments.title !== "string" ||
              typeof request.params.arguments.type !== "string" ||
              typeof request.params.arguments.content !== "string"
            ) {
              throw new McpError(ErrorCode.InvalidParams, "Invalid parameters for create_note");
            }

            let content = request.params.arguments.content;

            // Process content and convert Markdown to HTML if detected
            content = await processContent(content);

            const response = await this.axiosInstance.post("/create-note", {
              parentNoteId: request.params.arguments.parentNoteId,
              title: request.params.arguments.title,
              type: request.params.arguments.type,
              content: content,
              mime: request.params.arguments.mime,
            });
            return {
              content: [{
                type: "text",
                text: `Created note: ${response.data.note.noteId}`,
              }],
            };
          }

          case "search_notes": {
            if (!this.hasPermission("READ")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to search notes.");
            }

            // Build query from structured parameters
            const query = buildSearchQuery(request.params.arguments);
            
            if (!query.trim()) {
              throw new McpError(ErrorCode.InvalidParams, "At least one search parameter must be provided");
            }

            const params = new URLSearchParams();
            params.append("search", query);
            
            // Smart fastSearch logic: use fastSearch=true only when ONLY text parameter is provided
            const hasOnlyText = request.params.arguments.text && 
              !request.params.arguments.created_date_start &&
              !request.params.arguments.created_date_end &&
              !request.params.arguments.modified_date_start &&
              !request.params.arguments.modified_date_end &&
              (!request.params.arguments.filters || !Array.isArray(request.params.arguments.filters) || request.params.arguments.filters.length === 0) &&
              (!request.params.arguments.attributes || !Array.isArray(request.params.arguments.attributes) || request.params.arguments.attributes.length === 0) &&
              (!request.params.arguments.noteProperties || !Array.isArray(request.params.arguments.noteProperties) || request.params.arguments.noteProperties.length === 0) &&
              !request.params.arguments.hierarchyType &&
              !request.params.arguments.orderBy;
            
            params.append("fastSearch", hasOnlyText ? "true" : "false");
            params.append("includeArchivedNotes", "true"); // Always include archived notes

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            
            // Prepare verbose debug info if enabled
            const verboseInfo = createSearchDebugInfo(query, request.params.arguments);
            
            let searchResults = response.data.results || [];
            
            // Filter out the parent note itself if hierarchy search is used
            if (request.params.arguments.hierarchyType && request.params.arguments.parentNoteId) {
              const parentNoteId = request.params.arguments.parentNoteId;
              if (parentNoteId !== "root") {
                searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
              }
            }
            
            const trimmedResults = trimNoteResults(searchResults);
            const results = JSON.stringify(trimmedResults, null, 2);
            
            return {
              content: [{
                type: "text",
                text: `${verboseInfo}${results}`,
              }],
            };
          }

          case "list_child_notes": {
            if (!this.hasPermission("READ")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list child notes.");
            }

            // Use unified search logic with hierarchyType='children'
            const searchParams: any = {
              ...request.params.arguments,
              hierarchyType: "children" as const,
              parentNoteId: (request.params.arguments.parentNoteId as string) || "root"
            };

            // Build query from structured parameters
            const query = buildSearchQuery(searchParams);
            
            if (!query.trim()) {
              throw new McpError(ErrorCode.InvalidParams, "At least one search parameter must be provided");
            }

            const params = new URLSearchParams();
            params.append("search", query);
            
            // Smart fastSearch logic: use fastSearch=true only when ONLY text parameter is provided
            const hasOnlyText = searchParams.text && 
              !searchParams.created_date_start &&
              !searchParams.created_date_end &&
              !searchParams.modified_date_start &&
              !searchParams.modified_date_end &&
              (!searchParams.filters || !Array.isArray(searchParams.filters) || searchParams.filters.length === 0) &&
              (!searchParams.attributes || !Array.isArray(searchParams.attributes) || searchParams.attributes.length === 0) &&
              (!searchParams.noteProperties || !Array.isArray(searchParams.noteProperties) || searchParams.noteProperties.length === 0) &&
              !searchParams.orderBy;
            
            params.append("fastSearch", hasOnlyText ? "true" : "false");
            params.append("includeArchivedNotes", "true"); // Always include archived notes

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            
            let searchResults = response.data.results || [];
            
            // Filter out the parent note itself if hierarchy search is used
            const parentNoteId = searchParams.parentNoteId;
            if (parentNoteId && parentNoteId !== "root") {
              searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
            }
            
            if (searchResults.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `No children found for parent note: ${parentNoteId}`,
                }],
              };
            }
            
            // Format notes as "date title (noteId)" similar to ls -l output
            const formattedNotes = formatNotesForListing(searchResults);
            
            // Create ls-like output with count summary
            const output = formattedNotes.join('\n');
            const summary = createListSummary(searchResults.length);
            
            // Prepare verbose debug info if enabled
            const verboseInfo = createSearchDebugInfo(query, searchParams);
            
            return {
              content: [{
                type: "text",
                text: `${verboseInfo}${output}${summary}`,
              }],
            };
          }

          case "list_descendant_notes": {
            if (!this.hasPermission("READ")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list descendant notes.");
            }

            // Use unified search logic with hierarchyType='descendants'
            const searchParams: any = {
              ...request.params.arguments,
              hierarchyType: "descendants" as const,
              parentNoteId: (request.params.arguments.parentNoteId as string) || "root"
            };

            // Build query from structured parameters
            const query = buildSearchQuery(searchParams);
            
            if (!query.trim()) {
              throw new McpError(ErrorCode.InvalidParams, "At least one search parameter must be provided");
            }

            const params = new URLSearchParams();
            params.append("search", query);
            
            // Smart fastSearch logic: use fastSearch=true only when ONLY text parameter is provided
            const hasOnlyText = searchParams.text && 
              !searchParams.created_date_start &&
              !searchParams.created_date_end &&
              !searchParams.modified_date_start &&
              !searchParams.modified_date_end &&
              (!searchParams.filters || !Array.isArray(searchParams.filters) || searchParams.filters.length === 0) &&
              (!searchParams.attributes || !Array.isArray(searchParams.attributes) || searchParams.attributes.length === 0) &&
              (!searchParams.noteProperties || !Array.isArray(searchParams.noteProperties) || searchParams.noteProperties.length === 0) &&
              !searchParams.orderBy;
            
            params.append("fastSearch", hasOnlyText ? "true" : "false");
            params.append("includeArchivedNotes", "true"); // Always include archived notes

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            
            let searchResults = response.data.results || [];
            
            // Filter out the parent note itself if hierarchy search is used
            const parentNoteId = searchParams.parentNoteId;
            if (parentNoteId && parentNoteId !== "root") {
              searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
            }
            
            if (searchResults.length === 0) {
              const scopeInfo = parentNoteId ? ` within parent note: ${parentNoteId}` : ' in the database';
              return {
                content: [{
                  type: "text",
                  text: `No notes found${scopeInfo}`,
                }],
              };
            }
            
            // Use formatted output like list_child_notes (ls-like format)
            const formattedNotes = formatNotesForListing(searchResults);
            const output = formattedNotes.join('\n');
            
            // Create summary with scope info
            const scopeInfo = parentNoteId ? ` (within parent: ${parentNoteId})` : ' (entire database)';
            const summary = `\nTotal: ${searchResults.length} note${searchResults.length !== 1 ? 's' : ''}${scopeInfo}`;
            
            // Prepare verbose debug info if enabled
            const verboseInfo = createSearchDebugInfo(query, searchParams);
            
            return {
              content: [{
                type: "text",
                text: `${verboseInfo}${output}${summary}`,
              }],
            };
          }

          case "get_note": {
            if (!this.hasPermission("READ")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to get notes.");
            }
            if (typeof request.params.arguments.noteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Note ID must be a string");
            }
            const noteId = request.params.arguments.noteId;
            const includeContent = request.params.arguments.includeContent !== false;
            
            const noteResponse = await this.axiosInstance.get(`/notes/${noteId}`);
            
            if (!includeContent) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(noteResponse.data, null, 2),
                }],
              };
            }

            const { data: noteContent } = await this.axiosInstance.get(`/notes/${noteId}/content`, {
              responseType: 'text'
            });

            const noteData = {
              ...noteResponse.data
            };
            noteData.content = noteContent;

            return {
              content: [{
                type: "text",
                text: JSON.stringify(noteData, null, 2)
              }]
            };
          }


          case "delete_note": {
            if (!this.hasPermission("WRITE")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to delete notes.");
            }
            if (typeof request.params.arguments.noteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Note ID must be a string");
            }
            const noteId = request.params.arguments.noteId;
            await this.axiosInstance.delete(`/notes/${noteId}`);
            return {
              content: [{
                type: "text",
                text: `Deleted note: ${noteId}`,
              }],
            };
          }

          case "update_note": {
            if (!this.hasPermission("WRITE")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to update notes.");
            }
            const { noteId } = request.params.arguments;
            const contentRaw = request.params.arguments.content;
            const revision = request.params.arguments.revision !== false; // Default to true (safe behavior)
            
            if (typeof noteId !== "string" || typeof contentRaw !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "noteId and content are required and must be strings");
            }

            // Create revision if requested (defaults to true for safety)
            if (revision) {
              try {
                await this.axiosInstance.post(`/notes/${noteId}/revision`);
              } catch (error) {
                console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
                // Continue with update even if revision creation fails
              }
            }

            let content = contentRaw;

            // Process content and convert Markdown to HTML if detected
            content = await processContent(content);

            const url = `/notes/${noteId}/content`;
            const response = await this.axiosInstance.put(url, content, {
              headers: {
                "Content-Type": "text/plain"
              }
            });

            if (response.status === 204) {
              const revisionMsg = revision ? " (revision created)" : " (no revision)";
              return {
                content: [{
                  type: "text",
                  text: `Note ${noteId} updated successfully${revisionMsg}`
                }]
              };
            } else {
              return {
                content: [{
                  type: "text",
                  text: `Unexpected response status: ${response.status}`
                }]
              };
            }
          }

          case "append_note": {
            if (!this.hasPermission("WRITE")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to append to notes.");
            }
            const { noteId } = request.params.arguments;
            const contentToAppend = request.params.arguments.content;
            const revision = request.params.arguments.revision === true; // Default to false (performance behavior)
            
            if (typeof noteId !== "string" || typeof contentToAppend !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "noteId and content are required and must be strings");
            }

            // Create revision if requested (defaults to false for performance)
            if (revision) {
              try {
                await this.axiosInstance.post(`/notes/${noteId}/revision`);
              } catch (error) {
                console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
                // Continue with append even if revision creation fails
              }
            }

            // Get current content
            const { data: currentContent } = await this.axiosInstance.get(`/notes/${noteId}/content`, {
              responseType: 'text'
            });

            // Process the content to append and convert Markdown to HTML if detected
            let processedContentToAppend = await processContent(contentToAppend);

            // Concatenate current content with new content
            const newContent = currentContent + processedContentToAppend;

            // Update note content
            const url = `/notes/${noteId}/content`;
            const response = await this.axiosInstance.put(url, newContent, {
              headers: {
                "Content-Type": "text/plain"
              }
            });

            if (response.status === 204) {
              const revisionMsg = revision ? " (revision created)" : " (no revision)";
              return {
                content: [{
                  type: "text",
                  text: `Content appended to note ${noteId} successfully${revisionMsg}`
                }]
              };
            } else {
              return {
                content: [{
                  type: "text",
                  text: `Unexpected response status: ${response.status}`
                }]
              };
            }
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `TriliumNext API error: ${error.response?.data?.message || error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TriliumNext MCP server running on stdio");
  }
}

const server = new TriliumServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
