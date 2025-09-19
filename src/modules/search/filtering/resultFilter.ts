/**
 * Search Result Filtering
 * Handles filtering and processing of search results
 */

interface SearchOperation {
  text?: string;
  searchCriteria?: any[];
  limit?: number;
}

/**
 * Filters out parent notes from search results when performing hierarchy searches
 * This prevents the parent folder itself from appearing in results when searching for its children/descendants
 *
 * @param searchResults - The raw search results from Trilium API
 * @param searchArgs - The original search arguments used to detect hierarchy searches
 * @returns Filtered search results with parent notes excluded
 */
export function filterParentNotes(searchResults: any[], searchArgs: SearchOperation): any[] {
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
 * Removes duplicate notes from search results based on noteId
 */
export function deduplicateResults(searchResults: any[]): any[] {
  const seenNoteIds = new Set<string>();
  const uniqueResults: any[] = [];

  for (const note of searchResults) {
    if (!seenNoteIds.has(note.noteId)) {
      seenNoteIds.add(note.noteId);
      uniqueResults.push(note);
    }
  }

  return uniqueResults;
}

/**
 * Sorts search results by relevance (basic implementation)
 */
export function sortByRelevance(searchResults: any[], searchTerms: string[]): any[] {
  if (!searchTerms.length) {
    return searchResults;
  }

  return searchResults.sort((a, b) => {
    const aScore = calculateRelevanceScore(a, searchTerms);
    const bScore = calculateRelevanceScore(b, searchTerms);

    return bScore - aScore; // Higher score first
  });
}

/**
 * Calculates relevance score for a note based on search terms
 */
function calculateRelevanceScore(note: any, searchTerms: string[]): number {
  let score = 0;
  const noteText = `${note.title || ''} ${note.content || ''}`.toLowerCase();

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase();

    // Title matches are more important
    if (note.title && note.title.toLowerCase().includes(lowerTerm)) {
      score += 10;
    }

    // Content matches
    if (noteText.includes(lowerTerm)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Limits search results to specified count
 */
export function limitResults(searchResults: any[], limit: number): any[] {
  if (limit <= 0 || limit >= searchResults.length) {
    return searchResults;
  }

  return searchResults.slice(0, limit);
}

/**
 * Applies comprehensive result filtering
 */
export function filterSearchResults(
  searchResults: any[],
  searchArgs: SearchOperation,
  options: {
    removeParents?: boolean;
    removeDuplicates?: boolean;
    sortByRelevance?: boolean;
    applyLimit?: boolean;
    searchTerms?: string[];
  } = {}
): any[] {
  let filteredResults = [...searchResults];

  // Apply parent filtering
  if (options.removeParents) {
    filteredResults = filterParentNotes(filteredResults, searchArgs);
  }

  // Remove duplicates
  if (options.removeDuplicates) {
    filteredResults = deduplicateResults(filteredResults);
  }

  // Sort by relevance
  if (options.sortByRelevance && options.searchTerms) {
    filteredResults = sortByRelevance(filteredResults, options.searchTerms);
  }

  // Apply limit
  if (options.applyLimit && searchArgs.limit) {
    filteredResults = limitResults(filteredResults, searchArgs.limit);
  }

  return filteredResults;
}