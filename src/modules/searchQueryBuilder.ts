interface SearchStructuredParams {
  created_date_start?: string;
  created_date_end?: string;
  modified_date_start?: string;
  modified_date_end?: string;
  text?: string;
  searchFields?: {
    content?: string;
    title?: string;
  };
  limit?: number;
  includeArchivedNotes?: boolean;
}

export function buildSearchQuery(params: SearchStructuredParams): string {
  const queryParts: string[] = [];
  
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
  
  // Build searchFields (substring search)
  if (params.searchFields) {
    const searchParts: string[] = [];
    if (params.searchFields.content) {
      searchParts.push(`note.content *=* '${params.searchFields.content}'`);
    }
    if (params.searchFields.title) {
      searchParts.push(`note.title *=* '${params.searchFields.title}'`);
    }
    
    if (searchParts.length > 0) {
      if (searchParts.length === 1) {
        queryParts.push(searchParts[0]);
      } else {
        queryParts.push(`(${searchParts.join(' OR ')})`);
      }
    }
  }
  
  // Build main query
  let query = queryParts.join(' AND ');
  
  // Add limit
  if (params.limit) {
    query += ` limit ${params.limit}`;
  }
  
  return query;
}