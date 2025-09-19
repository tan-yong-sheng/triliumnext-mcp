/**
 * Search Management Module
 * Handles search and listing operations for TriliumNext notes
 */

import { buildSearchQuery } from "./searchQueryBuilder.js";
import { trimNoteResults, formatNotesForListing } from "../utils/noteFormatter.js";
import { createSearchDebugInfo, createListSummary } from "../utils/verboseUtils.js";

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
 * Filters out parent notes from search results when performing hierarchy searches
 * This prevents the parent folder itself from appearing in results when searching for its children/descendants
 *
 * @param searchResults - The raw search results from Trilium API
 * @param searchArgs - The original search arguments used to detect hierarchy searches
 * @returns Filtered search results with parent notes excluded
 */
function filterParentNotes(searchResults: any[], searchArgs: SearchOperation): any[] {
  // If no search criteria, return results as-is (no filtering needed)
  if (!searchArgs.searchCriteria || !Array.isArray(searchArgs.searchCriteria)) {
    return searchResults;
  }

  // Check if any search criteria involves hierarchy navigation (parents, children, ancestors)
  const hasHierarchySearch = searchArgs.searchCriteria.some(criteria => {
    if (criteria.type !== 'noteProperty') return false;

    const property = criteria.property;
    return property.startsWith('parents.') ||
           property.startsWith('children.') ||
           property.startsWith('ancestors.');
  });

  // If no hierarchy search, return results as-is
  if (!hasHierarchySearch) {
    return searchResults;
  }

  // Extract target note IDs from hierarchy search criteria
  const targetNoteIds = new Set<string>();
  searchArgs.searchCriteria.forEach(criteria => {
    if (criteria.type === 'noteProperty' && criteria.value) {
      const property = criteria.property;

      // Handle different hierarchy property patterns
      if (property.endsWith('.noteId') && criteria.op === '=') {
        targetNoteIds.add(criteria.value);
      }
      // For other hierarchy properties, we might need to resolve note IDs from titles
      // This is a simplified approach - in practice, you'd need to resolve titles to IDs
    }
  });

  // If no target note IDs found, return results as-is
  if (targetNoteIds.size === 0) {
    return searchResults;
  }

  // Filter out notes that match the target note IDs (these are the parents we want to exclude)
  const filteredResults = searchResults.filter(note => {
    return !targetNoteIds.has(note.noteId);
  });

  return filteredResults;
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

  // Apply parent filtering for hierarchy searches to exclude parent notes from results
  // This implements the documented behavior: "Parent note filtering automatically applied to avoid showing parent in children/descendant lists"
  const filteredResults = filterParentNotes(searchResults, args);

  const trimmedResults = trimNoteResults(filteredResults);
  
  return {
    results: trimmedResults,
    debugInfo: verboseInfo
  };
}

