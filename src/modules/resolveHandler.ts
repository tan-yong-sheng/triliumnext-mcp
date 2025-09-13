/**
 * Resolve Handler Module
 * Handles resolve_note_id tool requests with permission validation
 */

import { handleResolveNoteId, ResolveNoteOperation } from "./resolveManager.js";

export async function handleResolveNoteRequest(args: any, permissionChecker: any, axiosInstance: any): Promise<any> {
  // Permission check
  if (!permissionChecker.hasPermission("READ")) {
    throw new Error("READ permission required for resolve_note_id operation");
  }

  const resolveOperation: ResolveNoteOperation = {
    noteName: args.noteName,
    exactMatch: args.exactMatch,
    maxResults: args.maxResults,
    autoSelect: args.autoSelect
  };

  const response = await handleResolveNoteId(resolveOperation, axiosInstance);

  // Enhanced response formatting for multiple matches
  if (response.requiresUserChoice && response.topMatches) {
    const choiceList = response.topMatches
      .map((match, index) => `${index + 1}. ${match.title} (ID: ${match.noteId}, Type: ${match.type}, Modified: ${match.dateModified})`)
      .join('\n');

    return {
      content: [
        {
          type: "text",
          text: `Found ${response.matches} matches for "${resolveOperation.noteName}". Please choose:\n\n${choiceList}\n\nTo select: Use the note ID directly, or specify autoSelect=true for automatic selection, or refine your search criteria.`
        }
      ]
    };
  }

  // Standard response for single match or auto-selected
  if (response.found && response.noteId) {
    return {
      content: [
        {
          type: "text",
          text: `✅ Resolved "${resolveOperation.noteName}" to Note ID: ${response.noteId} (Title: "${response.title}", Matches: ${response.matches})`
        }
      ]
    };
  }

  // No matches found
  return {
    content: [
      {
        type: "text",
        text: `❌ No notes found matching "${resolveOperation.noteName}". ${response.nextSteps || "Try a different search term or check spelling."}`
      }
    ]
  };
}