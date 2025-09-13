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

