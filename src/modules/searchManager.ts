/**
 * Search Management Module
 * Handles search and listing operations for TriliumNext notes
 */

import { buildSearchQuery } from "./searchQueryBuilder.js";
import { trimNoteResults, formatNotesForListing } from "./noteFormatter.js";
import { createSearchDebugInfo, createListSummary } from "./responseUtils.js";

export interface SearchOperation {
  text?: string;
  attributes?: any[];
  noteProperties?: any[];
  limit?: number;
  orderBy?: string;
  hierarchyType?: "children" | "descendants";
  parentNoteId?: string;
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
  prioritizeFolders?: boolean;
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
  
  // Smart fastSearch logic: use fastSearch=true only when ONLY text parameter is provided
  const hasOnlyText = args.text && 
    (!args.attributes || !Array.isArray(args.attributes) || args.attributes.length === 0) &&
    (!args.noteProperties || !Array.isArray(args.noteProperties) || args.noteProperties.length === 0) &&
    !args.hierarchyType &&
    !args.orderBy;
  
  params.append("fastSearch", hasOnlyText ? "true" : "false");
  params.append("includeArchivedNotes", "true"); // Always include archived notes

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  
  // Prepare verbose debug info if enabled
  const verboseInfo = createSearchDebugInfo(query, args);
  
  let searchResults = response.data.results || [];
  
  // Filter out the parent note itself if hierarchy search is used
  if (args.hierarchyType && args.parentNoteId) {
    const parentNoteId = args.parentNoteId;
    if (parentNoteId !== "root") {
      searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
    }
  }
  
  const trimmedResults = trimNoteResults(searchResults);
  
  return {
    results: trimmedResults,
    debugInfo: verboseInfo
  };
}

/**
 * Handle list child notes operation
 */
export async function handleListChildNotes(
  args: SearchOperation,
  axiosInstance: any
): Promise<SearchResponse> {
  // Use unified search logic with hierarchyType='children'
  const searchParams: SearchOperation = {
    ...args,
    hierarchyType: "children",
    parentNoteId: args.parentNoteId || "root"
  };

  // Build query from structured parameters
  const query = buildSearchQuery(searchParams);
  
  if (!query.trim()) {
    throw new Error("At least one search parameter must be provided");
  }

  const params = new URLSearchParams();
  params.append("search", query);
  
  // Smart fastSearch logic
  const hasOnlyText = searchParams.text && 
    (!searchParams.attributes || !Array.isArray(searchParams.attributes) || searchParams.attributes.length === 0) &&
    (!searchParams.noteProperties || !Array.isArray(searchParams.noteProperties) || searchParams.noteProperties.length === 0) &&
    !searchParams.orderBy;
  
  params.append("fastSearch", hasOnlyText ? "true" : "false");
  params.append("includeArchivedNotes", "true");

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  
  let searchResults = response.data.results || [];
  
  // Filter out the parent note itself
  const parentNoteId = searchParams.parentNoteId;
  if (parentNoteId && parentNoteId !== "root") {
    searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
  }
  
  if (searchResults.length === 0) {
    return {
      results: [],
      summary: `No children found for parent note: ${parentNoteId}`
    };
  }
  
  // Format notes as "date title (noteId)" similar to ls -l output
  const formattedNotes = formatNotesForListing(searchResults);
  
  // Prepare verbose debug info if enabled
  const verboseInfo = createSearchDebugInfo(query, searchParams);
  
  return {
    results: searchResults,
    debugInfo: verboseInfo,
    summary: createListSummary(searchResults.length)
  };
}

/**
 * Handle list descendant notes operation
 */
export async function handleListDescendantNotes(
  args: SearchOperation,
  axiosInstance: any
): Promise<SearchResponse> {
  // Use unified search logic with hierarchyType='descendants'
  const searchParams: SearchOperation = {
    ...args,
    hierarchyType: "descendants",
    parentNoteId: args.parentNoteId || "root"
  };

  // Build query from structured parameters
  const query = buildSearchQuery(searchParams);
  
  if (!query.trim()) {
    throw new Error("At least one search parameter must be provided");
  }

  const params = new URLSearchParams();
  params.append("search", query);
  
  // Smart fastSearch logic
  const hasOnlyText = searchParams.text && 
    (!searchParams.attributes || !Array.isArray(searchParams.attributes) || searchParams.attributes.length === 0) &&
    (!searchParams.noteProperties || !Array.isArray(searchParams.noteProperties) || searchParams.noteProperties.length === 0) &&
    !searchParams.orderBy;
  
  params.append("fastSearch", hasOnlyText ? "true" : "false");
  params.append("includeArchivedNotes", "true");

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  
  let searchResults = response.data.results || [];
  
  // Filter out the parent note itself
  const parentNoteId = searchParams.parentNoteId;
  if (parentNoteId && parentNoteId !== "root") {
    searchResults = searchResults.filter((note: any) => note.noteId !== parentNoteId);
  }
  
  if (searchResults.length === 0) {
    const scopeInfo = parentNoteId ? ` within parent note: ${parentNoteId}` : ' in the database';
    return {
      results: [],
      summary: `No notes found${scopeInfo}`
    };
  }
  
  // Use formatted output like list_child_notes (ls-like format)
  const formattedNotes = formatNotesForListing(searchResults);
  
  // Create summary with scope info
  const scopeInfo = parentNoteId ? ` (within parent: ${parentNoteId})` : ' (entire database)';
  const summary = `Total: ${searchResults.length} note${searchResults.length !== 1 ? 's' : ''}${scopeInfo}`;
  
  // Prepare verbose debug info if enabled
  const verboseInfo = createSearchDebugInfo(query, searchParams);
  
  return {
    results: searchResults,
    debugInfo: verboseInfo,
    summary
  };
}

/**
 * Handle resolve note ID operation - find note ID by name/title
 */
export async function handleResolveNoteId(
  args: ResolveNoteOperation,
  axiosInstance: any
): Promise<ResolveNoteResponse> {
  const { noteName, exactMatch = false, maxResults = 3, prioritizeFolders = false } = args;
  
  if (!noteName?.trim()) {
    throw new Error("Note name must be provided");
  }

  // Build search query for title matching
  const baseSearchParams: SearchOperation = {
    noteProperties: [{
      property: "title",
      op: exactMatch ? "=" : "contains",
      value: noteName.trim()
      // No logic needed for single property
    }]
  };

  let searchResults: any[] = [];
  let totalMatches = 0;

  // If prioritizeFolders is enabled, try searching folders first
  if (prioritizeFolders) {
    const folderSearchParams: SearchOperation = {
      ...baseSearchParams,
      // Combine title matching with folder criteria
      noteProperties: [
        {
          property: "title",
          op: exactMatch ? "=" : "contains",
          value: noteName.trim(),
          logic: "AND"  // Explicit AND to combine with childrenCount
        },
        {
          property: "childrenCount",
          op: ">", 
          value: "0"
          // No logic needed on last item (auto-cleaned)
        }
      ]
    };

    const folderQuery = buildSearchQuery(folderSearchParams);
    const folderParams = new URLSearchParams();
    folderParams.append("search", folderQuery);
    folderParams.append("fastSearch", "false");
    folderParams.append("includeArchivedNotes", "true");

    const folderResponse = await axiosInstance.get(`/notes?${folderParams.toString()}`);
    searchResults = folderResponse.data.results || [];
  }
  
  // If no folder results found (or prioritizeFolders disabled), search all notes
  if (searchResults.length === 0) {
    const allNotesQuery = buildSearchQuery(baseSearchParams);
    const allNotesParams = new URLSearchParams();
    allNotesParams.append("search", allNotesQuery);
    allNotesParams.append("fastSearch", "false");
    allNotesParams.append("includeArchivedNotes", "true");
    
    const allNotesResponse = await axiosInstance.get(`/notes?${allNotesParams.toString()}`);
    searchResults = allNotesResponse.data.results || [];
  }
  
  totalMatches = searchResults.length;

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
      
      // Second priority: notes with children (folders) - only if prioritizeFolders is enabled
      if (prioritizeFolders) {
        const aHasChildren = a.childrenCount > 0;
        const bHasChildren = b.childrenCount > 0;
        if (aHasChildren && !bHasChildren) return -1;
        if (!aHasChildren && bHasChildren) return 1;
        
        // Third priority: book type (for additional folder indication)
        if (a.type === 'book' && b.type !== 'book') return -1;
        if (a.type !== 'book' && b.type === 'book') return 1;
      }
      
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