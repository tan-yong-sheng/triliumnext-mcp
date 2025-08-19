interface FilterCondition {
  field: string;    // 'title' or 'content'
  op: string;       // 'contains', 'starts_with', 'ends_with', 'not_equal'
  value: string;    // search value
}

interface SearchStructuredParams {
  created_date_start?: string;
  created_date_end?: string;
  modified_date_start?: string;
  modified_date_end?: string;
  text?: string;
  limit?: number;
  includeArchivedNotes?: boolean;
  orderBy?: string;
  filters?: FilterCondition[];
}

export function buildSearchQuery(params: SearchStructuredParams): string {
  const queryParts: string[] = [];
  
  // Verbose logging
  const isVerbose = process.env.VERBOSE === "true";
  if (isVerbose) {
    console.error(`[VERBOSE] buildSearchQuery input:`, JSON.stringify(params, null, 2));
  }
  
  // Build field-specific filters
  const fieldFilters: string[] = [];
  if (params.filters && params.filters.length > 0) {
    for (const filter of params.filters) {
      const fieldQuery = buildFieldQuery(filter);
      if (fieldQuery) {
        fieldFilters.push(fieldQuery);
      }
    }
  }
  
  // Build date ranges
  const dateGroups: string[] = [];
  
  // Created date range
  if (params.created_date_start || params.created_date_end) {
    const createdParts: string[] = [];
    if (params.created_date_start) {
      createdParts.push(`note.dateCreated >= '${params.created_date_start}'`);
    }
    if (params.created_date_end) {
      createdParts.push(`note.dateCreated < '${params.created_date_end}'`);
    }
    if (createdParts.length > 0) {
      dateGroups.push(`(${createdParts.join(' AND ')})`);
    }
  }
  
  // Modified date range
  if (params.modified_date_start || params.modified_date_end) {
    const modifiedParts: string[] = [];
    if (params.modified_date_start) {
      modifiedParts.push(`note.dateModified >= '${params.modified_date_start}'`);
    }
    if (params.modified_date_end) {
      modifiedParts.push(`note.dateModified < '${params.modified_date_end}'`);
    }
    if (modifiedParts.length > 0) {
      dateGroups.push(`(${modifiedParts.join(' AND ')})`);
    }
  }
  
  // Join date groups with OR if multiple
  if (dateGroups.length > 0) {
    if (dateGroups.length === 1) {
      // Remove parentheses for single date group
      queryParts.push(dateGroups[0].slice(1, -1));
    } else {
      // When using OR with parentheses, prepend with ~ to satisfy Trilium's parser
      // Trilium requires an "expression separator sign" (# or ~) before parentheses
      const orExpression = dateGroups.join(' OR ');
      queryParts.push(`~${orExpression}`);
    }
  }
  
  // Add field filters
  if (fieldFilters.length > 0) {
    queryParts.push(...fieldFilters);
  }
  
  // Add full-text search token
  if (params.text) {
    queryParts.unshift(params.text); // Add at beginning for better query structure
  }
  
  // Build main query
  let query = queryParts.join(' ');
  
  // Add orderBy with validation
  if (params.orderBy) {
    // Extract field name from orderBy (e.g., "note.dateCreated desc" -> "note.dateCreated")
    const orderByField = params.orderBy.split(' ')[0];
    
    // Validate that the orderBy field is used in the query
    const queryContainsField = query.includes(orderByField);
    
    if (queryContainsField) {
      query += ` orderBy ${params.orderBy}`;
    } else {
      // Log warning if verbose mode enabled
      if (isVerbose) {
        console.error(`[VERBOSE] Warning: orderBy field '${orderByField}' not found in query filters. Skipping orderBy.`);
      }
    }
  }
  
  // Add limit
  if (params.limit) {
    query += ` limit ${params.limit}`;
  }
  
  // Verbose logging
  if (isVerbose) {
    console.error(`[VERBOSE] buildSearchQuery output: "${query}"`);
  }
  
  return query;
}

/**
 * Builds a field-specific query based on the filter condition
 * Maps JSON operators to Trilium search operators
 */
function buildFieldQuery(filter: FilterCondition): string {
  const { field, op, value } = filter;
  
  // Map field names to Trilium note properties
  let triliumField: string;
  if (field === 'title') {
    triliumField = 'note.title';
  } else if (field === 'content') {
    triliumField = 'note.content';
  } else {
    // Invalid field, skip this filter
    return '';
  }
  
  // Map operators to Trilium syntax
  let triliumOperator: string;
  let escapedValue: string;
  
  switch (op) {
    case 'contains':
      triliumOperator = '*=*';
      break;
    case 'starts_with':
      triliumOperator = '=*';
      break;
    case 'ends_with':
      triliumOperator = '*=';
      break;
    case 'not_equal':
      triliumOperator = '!=';
      break;
    default:
      // Invalid operator, skip this filter
      return '';
  }
  
  // Escape quotes in the value and wrap in single quotes for regular operators
  escapedValue = value.replace(/'/g, "\\'");
  
  return `${triliumField} ${triliumOperator} '${escapedValue}'`;
}