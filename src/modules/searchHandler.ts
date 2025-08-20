/**
 * Search Handler Module
 * Centralized request handling for search operations
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  SearchOperation,
  ResolveNoteOperation,
  handleSearchNotes,
  handleListChildNotes,
  handleListDescendantNotes,
  handleResolveNoteId
} from "./searchManager.js";
import { formatNotesForListing } from "./noteFormatter.js";

export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Handle search_notes tool requests
 */
export async function handleSearchNotesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to search notes.");
  }

  try {
    const searchOperation: SearchOperation = {
      text: args.text,
      attributes: args.attributes,
      noteProperties: args.noteProperties,
      limit: args.limit,
      hierarchyType: args.hierarchyType,
      parentNoteId: args.parentNoteId
    };

    const result = await handleSearchNotes(searchOperation, axiosInstance);
    const resultsText = JSON.stringify(result.results, null, 2);

    return {
      content: [{
        type: "text",
        text: `${result.debugInfo || ''}${resultsText}`
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle list_child_notes tool requests
 */
export async function handleListChildNotesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list child notes.");
  }

  try {
    const searchOperation: SearchOperation = {
      text: args.text,
      attributes: args.attributes,
      noteProperties: args.noteProperties,
      limit: args.limit,
      parentNoteId: args.parentNoteId || "root"
    };

    const result = await handleListChildNotes(searchOperation, axiosInstance);

    if (result.summary && result.results.length === 0) {
      return {
        content: [{
          type: "text",
          text: result.summary
        }]
      };
    }

    // Format notes as "date title (noteId)" similar to ls -l output
    const formattedNotes = formatNotesForListing(result.results);
    const output = formattedNotes.join('\n');

    return {
      content: [{
        type: "text",
        text: `${result.debugInfo || ''}${output}${result.summary || ''}`
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle list_descendant_notes tool requests
 */
export async function handleListDescendantNotesRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to list descendant notes.");
  }

  try {
    const searchOperation: SearchOperation = {
      text: args.text,
      attributes: args.attributes,
      noteProperties: args.noteProperties,
      limit: args.limit,
      parentNoteId: args.parentNoteId || "root"
    };

    const result = await handleListDescendantNotes(searchOperation, axiosInstance);

    if (result.summary && result.results.length === 0) {
      return {
        content: [{
          type: "text",
          text: result.summary
        }]
      };
    }

    // Use formatted output like list_child_notes (ls-like format)
    const formattedNotes = formatNotesForListing(result.results);
    const output = formattedNotes.join('\n');

    return {
      content: [{
        type: "text",
        text: `${result.debugInfo || ''}${output}\n${result.summary || ''}`
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle resolve_note_id tool requests
 */
export async function handleResolveNoteIdRequest(
  args: any,
  axiosInstance: any,
  permissionChecker: PermissionChecker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (!permissionChecker.hasPermission("READ")) {
    throw new McpError(ErrorCode.InvalidRequest, "Permission denied: Not authorized to resolve note IDs.");
  }

  try {
    const resolveOperation: ResolveNoteOperation = {
      noteName: args.noteName,
      exactMatch: args.exactMatch,
      maxResults: args.maxResults
    };

    const result = await handleResolveNoteId(resolveOperation, axiosInstance);

    if (!result.found) {
      // Define common stopwords to filter out
      const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall']);
      
      // Split and filter out stopwords and short terms
      const allTerms = args.noteName.trim().split(/\s+/).filter((term: string) => term.length > 0);
      const meaningfulTerms = allTerms.filter((term: string) => 
        term.length >= 2 && !stopwords.has(term.toLowerCase())
      );
      
      const hasMultipleTerms = meaningfulTerms.length > 1;
      const hasStopwords = allTerms.length > meaningfulTerms.length;
      
      let suggestionText = `No note found with name: "${args.noteName}".

NOTE: The following search parameters are REFERENCE SUGGESTIONS. Please modify them based on your specific scenario and user context.

Suggested search strategies:
1. Try using search_notes with broader parameters:
   - For general full-text search: {"text": "${args.noteName}"}`;

      if (hasMultipleTerms) {
        // Create OR-based filter suggestions using meaningful terms only
        const titleNoteProps = meaningfulTerms.map((term: string) => `{"property": "title", "op": "contains", "value": "${term}"}`).join(', ');
        const contentNoteProps = meaningfulTerms.map((term: string) => `{"property": "content", "op": "contains", "value": "${term}"}`).join(', ');
        
        suggestionText += `
   - For title search (meaningful words only): {"noteProperties": [${titleNoteProps}]}
   - For content search (meaningful words only): {"noteProperties": [${contentNoteProps}]}`;

        if (hasStopwords) {
          suggestionText += `
   - Note: Filtered out stopwords (${allTerms.filter((t: string) => !meaningfulTerms.includes(t)).join(', ')}) to improve search relevance`;
        }

        // Add individual term suggestions
        suggestionText += `
   - Try individual key terms: `;
        meaningfulTerms.forEach((term: string, index: number) => {
          suggestionText += `"${term}"${index < meaningfulTerms.length - 1 ? ', ' : ''}`;
        });
      } else if (meaningfulTerms.length === 1) {
        // Single meaningful term
        suggestionText += `
   - For title search: {"noteProperties": [{"property": "title", "op": "contains", "value": "${meaningfulTerms[0]}"}]}
   - For content search: {"noteProperties": [{"property": "content", "op": "contains", "value": "${meaningfulTerms[0]}"}]}`;
        
        if (hasStopwords) {
          suggestionText += `
   - Note: Filtered out stopwords to focus on: "${meaningfulTerms[0]}"`;
        }
      } else {
        // No meaningful terms found (all stopwords)
        suggestionText += `
   - Warning: Search term contains mostly stopwords. Consider using more specific terms.
   - For title search: {"noteProperties": [{"property": "title", "op": "contains", "value": "${args.noteName}"}]}`;
      }

      suggestionText += `

2. Use partial matching strategies:
   - Try the primary term: "${meaningfulTerms[0] || allTerms[0] || args.noteName}"
   - Use "starts_with" operator: {"noteProperties": [{"property": "title", "op": "starts_with", "value": "${meaningfulTerms[0] || allTerms[0] || args.noteName}"}]}
   - Try resolve_note_id with exactMatch=false for fuzzy matching

3. Alternative approaches if searches continue to fail:
   - Browse parent folders using list_child_notes or list_descendant_notes
   - Check if the note exists under a different name or structure
   - Verify note isn't in a restricted or archived state
   - Consider if the note might be in a different TriliumNext instance

4. Troubleshooting checklist:
   - Verify spelling and capitalization
   - Check for special characters or formatting
   - Consider if the note title uses abbreviations or codes
   - Remember: search_notes includes archived notes by default

REMINDER: Adapt these suggestions based on user context, domain knowledge, and previous conversation history.`;

      return {
        content: [{
          type: "text",
          text: suggestionText
        }]
      };
    }

    // Format response as JSON with top matches
    const responseData = {
      selectedNote: {
        noteId: result.noteId,
        title: result.title
      },
      totalMatches: result.matches,
      topMatches: result.topMatches || [],
      nextSteps: "Use the selectedNote.noteId with list_descendant_notes or list_child_notes"
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(responseData, null, 2)
      }]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InvalidParams, error instanceof Error ? error.message : String(error));
  }
}