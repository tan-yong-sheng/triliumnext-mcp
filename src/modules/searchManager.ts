/**
 * Search Management Module
 * Handles search and listing operations for TriliumNext notes
 */

import { buildSearchQuery } from "./searchQueryBuilder.js";
import { trimNoteResults, formatNotesForListing } from "./noteFormatter.js";
import { createSearchDebugInfo, createListSummary } from "./responseUtils.js";

// Interface for SearchOperation - unified searchCriteria structure
export interface SearchOperation {
  text?: string;
  searchCriteria?: any[];
  limit?: number;
}

export interface SearchResponse {
  results: any[];
  debugInfo?: string;
  summary?: string;
}

export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
}

export interface ResolveNoteResponse {
  noteId: string | null;
  title: string | null;
  found: boolean;
  matches: number;
  topMatches?: Array<{
    noteId: string;
    title: string;
    type: string;
    dateModified: string;
  }>;
}

/**
 * Handle search notes operation
 */
export async function handleSearchNotes(
  args: SearchOperation,
  axiosInstance: any
): Promise<SearchResponse> {
  // Build query from structured parameters
  const query = buildSearchQuery(args);
  
  if (!query.trim()) {
    throw new Error("At least one search parameter must be provided");
  }

  const params = new URLSearchParams();
  params.append("search", query);
  
  // Smart fastSearch logic: use fastSearch=true ONLY when ONLY text parameter is provided (no other parameters)
  const hasOnlyText = args.text &&
    (!args.searchCriteria || !Array.isArray(args.searchCriteria) || args.searchCriteria.length === 0) &&
    !args.limit; // fastSearch doesn't support limit clauses
  
  params.append("fastSearch", hasOnlyText ? "true" : "false");
  params.append("includeArchivedNotes", "true"); // Always include archived notes

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  
  // Prepare verbose debug info if enabled
  const verboseInfo = createSearchDebugInfo(query, args);
  
  let searchResults = response.data.results || [];

  const trimmedResults = trimNoteResults(searchResults);
  
  return {
    results: trimmedResults,
    debugInfo: verboseInfo
  };
}

/**
 * Handle resolve note ID operation - find note ID by name/title
 */
export async function handleResolveNoteId(
  args: ResolveNoteOperation,
  axiosInstance: any
): Promise<ResolveNoteResponse> {
  const { noteName, exactMatch = false, maxResults = 3 } = args;
  
  if (!noteName?.trim()) {
    throw new Error("Note name must be provided");
  }

  // Build search query for title matching
  const searchParams: SearchOperation = {
    searchCriteria: [{
      property: "title",
      type: "noteProperty",
      op: exactMatch ? "=" : "contains",
      value: noteName.trim()
      // No logic needed for single property
    }]
  };

  // Search for notes matching the title
  const query = buildSearchQuery(searchParams);
  const params = new URLSearchParams();
  params.append("search", query);
  params.append("fastSearch", "false");
  params.append("includeArchivedNotes", "true");
  
  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  let searchResults = response.data.results || [];
  
  const totalMatches = searchResults.length;

  if (searchResults.length === 0) {
    return {
      noteId: null,
      title: null,
      found: false,
      matches: 0
    };
  }

  // Store original results for top matches
  const originalResults = [...searchResults];

  // Apply prioritization for selecting the best match
  // If exact match requested and we have results, prefer exact title matches
  if (!exactMatch && searchResults.length > 1) {
    const exactMatches = searchResults.filter((note: any) => 
      note.title && note.title.toLowerCase() === noteName.toLowerCase()
    );
    if (exactMatches.length > 0) {
      searchResults = exactMatches;
    }
  }

  // If still multiple results, prefer folder-like notes (book type) for listing operations
  if (searchResults.length > 1) {
    const folderNotes = searchResults.filter((note: any) => note.type === 'book');
    if (folderNotes.length > 0) {
      searchResults = folderNotes;
    }
  }

  // If still multiple results, prefer most recently modified
  if (searchResults.length > 1) {
    searchResults.sort((a: any, b: any) => 
      new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()
    );
  }

  // Return the first match (or best match if multiple)
  const selectedNote = searchResults[0];
  
  // Prepare top N matches for display (from original results, prioritized)
  const topMatches = originalResults
    .sort((a: any, b: any) => {
      // First priority: exact matches
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
    noteId: selectedNote.noteId,
    title: selectedNote.title,
    found: true,
    matches: totalMatches,
    topMatches
  };
}