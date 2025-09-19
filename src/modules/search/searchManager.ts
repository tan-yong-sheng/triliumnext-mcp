/**
 * Search Management Module - Main Exports
 * Handles search and listing operations for TriliumNext notes
 *
 * This file serves as the main entry point for search operations,
 * aggregating functionality from specialized submodules.
 */

import { buildSearchQuery } from './query/queryBuilder.js';
import { validateSearchParams } from './query/queryValidator.js';
import { optimizeSearchParams, analyzeQueryComplexity } from './query/queryOptimizer.js';
import { filterSearchResults } from './filtering/resultFilter.js';
import { hasHierarchySearch, extractHierarchyInfo, validateHierarchySearch } from './filtering/hierarchyFilter.js';
import { trimNoteResults, formatNotesForListing } from '../shared/index.js';
import { createSearchDebugInfo, createListSummary } from '../shared/index.js';

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
  complexityAnalysis?: {
    complexity: 'low' | 'medium' | 'high';
    suggestions: string[];
    estimatedPerformance: 'fast' | 'moderate' | 'slow';
  };
}

/**
 * Handle search notes operation
 */
export async function handleSearchNotes(
  args: SearchOperation,
  axiosInstance: any
): Promise<SearchResponse> {
  // Validate search parameters
  const validation = validateSearchParams(args);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Validate hierarchy-specific searches
  const hierarchyValidation = validateHierarchySearch(args);
  if (!hierarchyValidation.valid) {
    throw new Error(hierarchyValidation.errors.join('; '));
  }

  // Optimize search parameters
  const optimizedParams = optimizeSearchParams(args);

  // Analyze query complexity
  const complexityAnalysis = analyzeQueryComplexity(optimizedParams);

  // Build query from structured parameters
  const query = buildSearchQuery(optimizedParams);

  if (!query.trim()) {
    throw new Error("At least one search parameter must be provided");
  }

  const params = new URLSearchParams();
  params.append("search", query);

  // Smart fastSearch logic: use fastSearch=true ONLY when ONLY text parameter is provided (no other parameters)
  const hasOnlyText = optimizedParams.text &&
    (!optimizedParams.searchCriteria || !Array.isArray(optimizedParams.searchCriteria) || optimizedParams.searchCriteria.length === 0) &&
    !optimizedParams.limit; // fastSearch doesn't support limit clauses

  params.append("fastSearch", hasOnlyText ? "true" : "false");
  params.append("includeArchivedNotes", "true"); // Always include archived notes

  const response = await axiosInstance.get(`/notes?${params.toString()}`);

  // Prepare verbose debug info if enabled
  const verboseInfo = createSearchDebugInfo(query, args);

  let searchResults = response.data.results || [];

  // Apply comprehensive result filtering
  const filteringOptions = {
    removeParents: hasHierarchySearch(args),
    removeDuplicates: true,
    sortByRelevance: !!args.text,
    applyLimit: !!args.limit,
    searchTerms: args.text ? [args.text] : []
  };

  const filteredResults = filterSearchResults(searchResults, args, filteringOptions);

  const trimmedResults = trimNoteResults(filteredResults);

  return {
    results: trimmedResults,
    debugInfo: verboseInfo,
    summary: createListSummary(trimmedResults.length),
    complexityAnalysis
  };
}

// Export utility functions for external use
export {
  // Query building
  buildSearchQuery,

  // Validation
  validateSearchParams,

  // Optimization
  optimizeSearchParams,
  analyzeQueryComplexity,

  // Filtering
  filterSearchResults,
  hasHierarchySearch,
  extractHierarchyInfo,
  validateHierarchySearch
};