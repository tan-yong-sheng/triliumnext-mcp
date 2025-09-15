/**
 * Note Resolution Module
 * Handles simple note ID resolution by name/title
 * Built on top of search functionality with title-based search only
 */

import { buildSearchQuery } from "./searchQueryBuilder.js";
import { SearchOperation } from "./searchManager.js";
import { logVerboseInput } from "../utils/verboseUtils.js";

export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
  autoSelect?: boolean;
}

export interface ResolveNoteResponse {
  noteId: string | null;
  title: string | null;
  found: boolean;
  matches: number;
  requiresUserChoice?: boolean;
  topMatches?: Array<{
    noteId: string;
    title: string;
    type: string;
    dateModified: string;
  }>;
  nextSteps?: string;
}

/**
 * Handle resolve note ID operation - find note ID by name/title
 * Simple title-based search only
 */
export async function handleResolveNoteId(
  args: ResolveNoteOperation,
  axiosInstance: any
): Promise<ResolveNoteResponse> {
  const { noteName, exactMatch = false, maxResults = 3, autoSelect = false } = args;

  // Verbose logging
  logVerboseInput("resolve_note_id", args);

  if (!noteName?.trim()) {
    throw new Error("Note name must be provided");
  }

  // Simple title-based search criteria
  const searchCriteria: any[] = [{
    property: "title",
    type: "noteProperty",
    op: exactMatch ? "=" : "contains",
    value: noteName.trim()
  }];

  // Build search query from simple criteria
  const searchParams: SearchOperation = {
    searchCriteria
  };

  logVerboseInput("resolve_note_id", searchParams);

  // Search for notes matching the criteria
  const query = buildSearchQuery(searchParams);
  const params = new URLSearchParams();
  params.append("search", query);
  params.append("fastSearch", "false");
  params.append("includeArchivedNotes", "true");

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  let searchResults = response.data.results || [];

  const totalMatches = searchResults.length;

  if (searchResults.length === 0) {
    // Enhanced fallback suggestions when no matches found
    let nextSteps = "No notes found matching the search criteria.";

    // Primary fallback: suggest broader search using search_notes
    nextSteps += ` Consider using search_notes for broader results: search_notes(text: "${noteName.trim()}") to find notes containing "${noteName.trim()}" in title or content.`;

    return {
      noteId: null,
      title: null,
      found: false,
      matches: 0,
      nextSteps
    };
  }

  // Store original results for top matches
  const originalResults = [...searchResults];

  // Check if user choice is required (multiple matches and autoSelect is false)
  if (totalMatches > 1 && !autoSelect) {
    // Simple prioritization: exact matches → folders → most recent
    const topMatches = originalResults
      .sort((a: any, b: any) => {
        // First priority: exact title matches
        const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
        const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Second priority: book type (folders)
        if (a.type === 'book' && b.type !== 'book') return -1;
        if (a.type !== 'book' && b.type === 'book') return 1;

        // Final priority: most recent
        return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
      })
      .slice(0, maxResults)
      .map((note: any) => ({
        noteId: note.noteId,
        title: note.title,
        type: note.type,
        dateModified: note.dateModified
      }));

    return {
      noteId: null,
      title: null,
      found: true,
      matches: totalMatches,
      requiresUserChoice: true,
      topMatches
    };
  }

  // Apply simple prioritization for selecting the best match
  if (searchResults.length > 1) {
    searchResults.sort((a: any, b: any) => {
      // First priority: exact title matches (if not exactMatch mode, prefer exact matches)
      if (!exactMatch) {
        const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
        const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }

      // Second priority: book type (folders)
      if (a.type === 'book' && b.type !== 'book') return -1;
      if (a.type !== 'book' && b.type === 'book') return 1;

      // Final priority: most recent
      return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
    });
  }

  // Return the first match (or best match if multiple)
  const selectedNote = searchResults[0];

  // Prepare top N matches for display (from original results, with simple prioritization)
  const topMatches = originalResults
    .sort((a: any, b: any) => {
      // Simple prioritization: exact matches → folders → most recent
      const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
      const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      if (a.type === 'book' && b.type !== 'book') return -1;
      if (a.type !== 'book' && b.type === 'book') return 1;

      return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
    })
    .slice(0, maxResults)
    .map((note: any) => ({
      noteId: note.noteId,
      title: note.title,
      type: note.type,
      dateModified: note.dateModified
    }));

  return {
    noteId: selectedNote.noteId,
    title: selectedNote.title,
    found: true,
    matches: totalMatches,
    topMatches
  };
}