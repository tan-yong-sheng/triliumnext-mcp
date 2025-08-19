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
import { buildListChildrenQuery } from "./modules/listChildrenHelper.js";
import { processContent } from "./modules/contentProcessor.js";
import { trimNoteResults, formatNotesForListing } from "./modules/noteFormatter.js";
import { createSearchDebugInfo, createListChildrenDebugInfo, createListSummary } from "./modules/responseUtils.js";

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
          description: "Create a new note in TriliumNext",
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
          description: "Update the content of an existing note",
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
              }
            },
            required: ["noteId", "content"]
          }
        });
        tools.push({
          name: "delete_note",
          description: "Delete a note",
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
          name: "search_notes",
          description: "Fast full-text search using simple keyword searches.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Full text search query string (e.g., 'kubernetes', 'docker')",
              },
              includeArchivedNotes: {
                type: "boolean",
                description: "Include archived notes in search results",
              },
            },
            required: ["query"],
          },
        });
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
          name: "search_notes_advanced",
          description: "Advanced filtered search using parameters such as created_date, modified_date, text keyword etc. Use when you need date filtering, field-specific searches for comprehensive search",
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
              limit: {
                type: "number",
                description: "Maximum number of results to return",
              },
              orderBy: {
                type: "string",
                description: "Sort order for results (e.g., 'note.dateCreated desc', 'note.dateModified asc', 'note.title')",
              },
              includeArchivedNotes: {
                type: "boolean",
                description: "Include archived notes in search results",
              },
            },
          },
        });
        tools.push({
          name: "list_children_notes",
          description: "List direct children notes of a parent note for tree navigation. Use parentNoteId='root' to list all top-level notes.",
          inputSchema: {
            type: "object",
            properties: {
              parentNoteId: {
                type: "string",
                description: "ID of the parent note to list children from. Use 'root' to list all top-level notes, especially when user is requesting to list all the notes that they have.",
              },
              orderBy: {
                type: "string",
                description: "Sort order for results (e.g., 'title', 'dateCreated', 'dateModified')",
              },
              orderDirection: {
                type: "string",
                enum: ["asc", "desc"],
                description: "Sort direction - ascending or descending",
                default: "asc"
              },
              limit: {
                type: "number",
                description: "Maximum number of children to return",
              },
              includeArchivedNotes: {
                type: "boolean",
                description: "Include archived notes in results",
                default: false
              },
            },
            required: ["parentNoteId"],
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
            if (typeof request.params.arguments.query !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Search query must be a string");
            }

            const params = new URLSearchParams();
            params.append("search", request.params.arguments.query);
            params.append("fastSearch", "true"); // Always use fastSearch=true for basic queries
            
            if (typeof request.params.arguments.includeArchivedNotes === "boolean") {
              params.append("includeArchivedNotes", request.params.arguments.includeArchivedNotes.toString());
            }

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            const trimmedResults = trimNoteResults(response.data.results || []);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(trimmedResults, null, 2),
              }],
            };
          }

          case "search_notes_advanced": {
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
            params.append("fastSearch", "false"); // Always use fastSearch=false for content search
            
            if (typeof request.params.arguments.includeArchivedNotes === "boolean") {
              params.append("includeArchivedNotes", request.params.arguments.includeArchivedNotes.toString());
            }

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            
            // Prepare verbose debug info if enabled
            const verboseInfo = createSearchDebugInfo(query, request.params.arguments);
            
            const trimmedResults = trimNoteResults(response.data.results || []);
            const results = JSON.stringify(trimmedResults, null, 2);
            
            return {
              content: [{
                type: "text",
                text: `${verboseInfo}${results}`,
              }],
            };
          }

          case "list_children_notes": {
            if (!this.hasPermission("READ")) {
              throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list children notes.");
            }
            if (typeof request.params.arguments.parentNoteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "parentNoteId must be a string");
            }

            // Build query parameters using helper
            const listChildrenParams = {
              parentNoteId: request.params.arguments.parentNoteId,
              orderBy: typeof request.params.arguments.orderBy === "string" ? request.params.arguments.orderBy : undefined,
              orderDirection: typeof request.params.arguments.orderDirection === "string" ? request.params.arguments.orderDirection : undefined,
              limit: typeof request.params.arguments.limit === "number" ? request.params.arguments.limit : undefined,
              includeArchivedNotes: typeof request.params.arguments.includeArchivedNotes === "boolean" ? request.params.arguments.includeArchivedNotes : undefined,
            };
            
            const urlParams = buildListChildrenQuery(listChildrenParams);
            
            const response = await this.axiosInstance.get(`/notes?${urlParams.toString()}`);
            
            const notes = response.data.results || [];
            
            if (notes.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `No children found for parent note: ${request.params.arguments.parentNoteId}`,
                }],
              };
            }
            
            // Format notes as "date title (noteId)" similar to ls -l output
            const formattedNotes = formatNotesForListing(notes);
            
            // Create ls-like output with count summary
            const output = formattedNotes.join('\n');
            const summary = createListSummary(notes.length);
            
            // Prepare verbose debug info if enabled
            const verboseInfo = createListChildrenDebugInfo(
              request.params.arguments.parentNoteId, 
              urlParams, 
              notes.length
            );
            
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
            if (typeof noteId !== "string" || typeof contentRaw !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "noteId and content are required and must be strings");
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
              return {
                content: [{
                  type: "text",
                  text: `Note ${noteId} updated successfully`
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
