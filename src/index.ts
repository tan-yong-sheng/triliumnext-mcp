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

const TRILIUM_API_URL = process.env.TRILIUM_API_URL;
const TRILIUM_API_TOKEN = process.env.TRILIUM_API_TOKEN;

if (!TRILIUM_API_TOKEN) {
  throw new Error("TRILIUM_API_TOKEN environment variable is required");
}

class TriliumServer {
  private server: Server;
  private axiosInstance;

  constructor() {
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
        Authorization: TRILIUM_API_TOKEN,
      },
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
              tools: [
                {
                  name: "get_note_content",
                  description: "Get the content of a note by its ID",
                  inputSchema: {
                    type: "object",
                    properties: {
                      noteId: {
                        type: "string",
                        description: "ID of the note to retrieve content for"
                      }
                    },
                    required: ["noteId"]
                  }
                },
                {
                  name: "create_note",
          description: "Create a new note in TriliumNext",
          inputSchema: {
            type: "object",
            properties: {
              parentNoteId: {
                type: "string",
                description: "ID of the parent note",
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
        },
        {
          name: "search_notes",
          description: "Search notes in TriliumNext",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
              fastSearch: {
                type: "boolean",
                description: "Enable fast search (fulltext doesn't look into content)",
              },
              includeArchivedNotes: {
                type: "boolean",
                description: "Include archived notes in search results",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_note",
          description: "Get a note by ID",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to retrieve",
              },
            },
            required: ["noteId"],
          },
        },
        {
          name: "update_note",
          description: "Update an existing note",
          inputSchema: {
            type: "object",
            properties: {
              noteId: {
                type: "string",
                description: "ID of the note to update",
              },
              title: {
                type: "string",
                description: "New title for the note",
              },
              content: {
                type: "string",
                description: "New content for the note",
              },
            },
            required: ["noteId"],
          },
        },
        {
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
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!request.params.arguments) {
        throw new McpError(ErrorCode.InvalidParams, "Arguments are required");
      }

      try {
        switch (request.params.name) {
          case "create_note": {
            if (
              typeof request.params.arguments.parentNoteId !== "string" ||
              typeof request.params.arguments.title !== "string" ||
              typeof request.params.arguments.type !== "string" ||
              typeof request.params.arguments.content !== "string"
            ) {
              throw new McpError(ErrorCode.InvalidParams, "Invalid parameters for create_note");
            }

            const response = await this.axiosInstance.post("/create-note", {
              parentNoteId: request.params.arguments.parentNoteId,
              title: request.params.arguments.title,
              type: request.params.arguments.type,
              content: request.params.arguments.content,
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
            if (typeof request.params.arguments.query !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Search query must be a string");
            }

            const params = new URLSearchParams();
            params.append("search", request.params.arguments.query);
            
            if (typeof request.params.arguments.fastSearch === "boolean") {
              params.append("fastSearch", request.params.arguments.fastSearch.toString());
            }
            
            if (typeof request.params.arguments.includeArchivedNotes === "boolean") {
              params.append("includeArchivedNotes", request.params.arguments.includeArchivedNotes.toString());
            }

            const response = await this.axiosInstance.get(`/notes?${params.toString()}`);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(response.data.results, null, 2),
              }],
            };
          }

          case "get_note": {
            if (typeof request.params.arguments.noteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Note ID must be a string");
            }
            const noteId = request.params.arguments.noteId;
            const response = await this.axiosInstance.get(`/notes/${noteId}`);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(response.data, null, 2),
              }],
            };
          }

          case "update_note": {
            if (typeof request.params.arguments.noteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Note ID must be a string");
            }
            
            const updates: Record<string, string> = {};
            if (typeof request.params.arguments.title === "string") {
              updates.title = request.params.arguments.title;
            }
            if (typeof request.params.arguments.content === "string") {
              updates.content = request.params.arguments.content;
            }

            const noteId = request.params.arguments.noteId;
            const response = await this.axiosInstance.patch(`/notes/${noteId}`, updates);
            return {
              content: [{
                type: "text",
                text: `Updated note: ${noteId}`,
              }],
            };
          }

          case "delete_note": {
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

          case "get_note_content": {
            if (typeof request.params.arguments?.noteId !== "string") {
              throw new McpError(ErrorCode.InvalidParams, "Note ID must be a string");
            }
            const noteId = request.params.arguments.noteId;
            const noteInfo = await this.axiosInstance.get(`/notes/${noteId}`);
            const { data } = await this.axiosInstance.get(`/notes/${noteId}/content`, {
              responseType: 'text',
              headers: {
                'Accept': noteInfo.data.mime || 'text/plain'
              }
            });
            return {
              content: [{
                type: "text",
                text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
              }]
            };
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
