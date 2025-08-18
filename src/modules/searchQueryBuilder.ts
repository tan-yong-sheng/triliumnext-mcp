interface SearchStructuredParams {
  created_date_start?: string;
  created_date_end?: string;
  modified_date_start?: string;
  modified_date_end?: string;
  text?: string;
  limit?: number;
  includeArchivedNotes?: boolean;
  orderBy?: string;
}

export function buildSearchQuery(params: SearchStructuredParams): string {
  const queryParts: string[] = [];
  
  // Verbose logging
  const isVerbose = process.env.VERBOSE === "true";
  if (isVerbose) {
    console.error(`[VERBOSE] buildSearchQuery input:`, JSON.stringify(params, null, 2));
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
      queryParts.push(dateGroups.join(' OR '));
    }
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