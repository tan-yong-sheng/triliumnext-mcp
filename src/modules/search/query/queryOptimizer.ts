/**
 * Search Query Optimization
 * Handles optimization of search queries for better performance
 */

interface SearchCriteria {
  property: string;
  type: 'label' | 'relation' | 'noteProperty';
  op?: string;
  value?: string;
  logic?: 'AND' | 'OR';
}

interface SearchStructuredParams {
  text?: string;
  limit?: number;
  searchCriteria?: SearchCriteria[];
}

/**
 * Optimizes search parameters for better performance
 */
export function optimizeSearchParams(params: SearchStructuredParams): SearchStructuredParams {
  const optimized = { ...params };

  // Optimize search criteria order
  if (optimized.searchCriteria && optimized.searchCriteria.length > 1) {
    optimized.searchCriteria = optimizeSearchCriteriaOrder(optimized.searchCriteria);
  }

  // Add sensible default limit if not provided and query is complex
  if (!optimized.limit && shouldApplyDefaultLimit(optimized)) {
    optimized.limit = 50;
  }

  return optimized;
}

/**
 * Reorders search criteria for optimal performance
 */
function optimizeSearchCriteriaOrder(criteria: SearchCriteria[]): SearchCriteria[] {
  // Priority order for search criteria:
  // 1. High-selectivity criteria first (exact matches, exists operations)
  // 2. Medium-selectivity criteria (contains, starts_with, ends_with)
  // 3. Low-selectivity criteria last (regex, complex patterns)

  const prioritized = [...criteria];

  return prioritized.sort((a, b) => {
    const aPriority = getCriteriaPriority(a);
    const bPriority = getCriteriaPriority(b);

    return aPriority - bPriority;
  });
}

/**
 * Gets priority score for search criteria (lower = higher priority)
 */
function getCriteriaPriority(criteria: SearchCriteria): number {
  // High priority (fast, selective)
  if (criteria.op === 'exists' || criteria.op === 'not_exists') {
    return 1;
  }

  if (criteria.op === '=' || criteria.op === '!=') {
    return 2;
  }

  // Medium priority
  if (criteria.op === 'contains' || criteria.op === 'starts_with' || criteria.op === 'ends_with') {
    return 3;
  }

  // Low priority (slow, less selective)
  if (criteria.op === '>' || criteria.op === '<' || criteria.op === '>=' || criteria.op === '<=') {
    return 4;
  }

  // Lowest priority (very slow)
  if (criteria.op === 'regex') {
    return 5;
  }

  return 3; // Default priority
}

/**
 * Determines if a default limit should be applied
 */
function shouldApplyDefaultLimit(params: SearchStructuredParams): boolean {
  // Apply default limit for complex searches that might return many results
  if (!params.text && params.searchCriteria && params.searchCriteria.length > 0) {
    // Check if any of the criteria are broad searches
    const hasBroadCriteria = params.searchCriteria.some(criteria => {
      return criteria.op === 'contains' || criteria.op === 'regex';
    });

    return hasBroadCriteria;
  }

  return false;
}

/**
 * Analyzes search query complexity and suggests optimizations
 */
export function analyzeQueryComplexity(params: SearchStructuredParams): {
  complexity: 'low' | 'medium' | 'high';
  suggestions: string[];
  estimatedPerformance: 'fast' | 'moderate' | 'slow';
} {
  let complexityScore = 0;
  const suggestions: string[] = [];

  // Analyze text search
  if (params.text) {
    complexityScore += 1;
    if (params.text.length < 3) {
      suggestions.push("Very short search terms may return too many results. Consider using more specific terms.");
    }
  }

  // Analyze search criteria
  if (params.searchCriteria) {
    complexityScore += params.searchCriteria.length;

    // Check for potentially slow operations
    params.searchCriteria.forEach(criteria => {
      if (criteria.op === 'regex') {
        complexityScore += 3;
        suggestions.push("Regular expressions can be slow. Consider using simpler operators like 'contains' if possible.");
      }

      if (criteria.op === 'contains' && criteria.value && criteria.value.length < 3) {
        complexityScore += 1;
        suggestions.push("Short contains patterns may return many results. Consider using longer search terms.");
      }
    });

    // Check for OR logic (generally slower than AND)
    const hasOrLogic = params.searchCriteria.some(criteria => criteria.logic === 'OR');
    if (hasOrLogic) {
      complexityScore += 2;
      suggestions.push("OR operations can be slower than AND operations. Consider if you can restructure your search.");
    }
  }

  // Determine complexity level
  let complexity: 'low' | 'medium' | 'high';
  let estimatedPerformance: 'fast' | 'moderate' | 'slow';

  if (complexityScore <= 3) {
    complexity = 'low';
    estimatedPerformance = 'fast';
  } else if (complexityScore <= 7) {
    complexity = 'medium';
    estimatedPerformance = 'moderate';
  } else {
    complexity = 'high';
    estimatedPerformance = 'slow';
  }

  // Add general optimization suggestions
  if (complexity === 'high' && !params.limit) {
    suggestions.push("Consider adding a limit parameter to restrict result size for complex queries.");
  }

  return {
    complexity,
    suggestions,
    estimatedPerformance
  };
}