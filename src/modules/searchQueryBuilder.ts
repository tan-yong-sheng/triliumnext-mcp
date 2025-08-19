interface FilterCondition {
  field: string;    // 'title' or 'content'
  op: string;       // 'contains', 'starts_with', 'ends_with', 'not_equal'
  value: string;    // search value
}

interface AttributeCondition {
  type: string;     // 'label' (relations support could be added later)
  name: string;     // label name (e.g., 'book', 'author', 'archived')
  op?: string;      // 'exists', 'not_exists', '=', '!=', '>=', '<=', '>', '<', 'contains', 'starts_with', 'ends_with'
  value?: string;   // value to compare (optional for existence checks)
}

interface NotePropertyCondition {
  property: string; // 'isArchived', 'isProtected', 'type', 'title'
  op?: string;      // '=', '!='
  value: string;    // value to compare
}

interface SearchStructuredParams {
  created_date_start?: string;
  created_date_end?: string;
  modified_date_start?: string;
  modified_date_end?: string;
  text?: string;
  limit?: number;
  orderBy?: string;
  filters?: FilterCondition[];
  attributes?: AttributeCondition[];
  noteProperties?: NotePropertyCondition[];
  hierarchyType?: 'children' | 'descendants';
  parentNoteId?: string;
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
  
  // Build attribute-specific filters
  const attributeFilters: string[] = [];
  if (params.attributes && params.attributes.length > 0) {
    for (const attribute of params.attributes) {
      const attributeQuery = buildAttributeQuery(attribute);
      if (attributeQuery) {
        attributeFilters.push(attributeQuery);
      }
    }
  }
  
  // Build note property filters
  const notePropertyFilters: string[] = [];
  if (params.noteProperties && params.noteProperties.length > 0) {
    for (const noteProperty of params.noteProperties) {
      const notePropertyQuery = buildNotePropertyQuery(noteProperty);
      if (notePropertyQuery) {
        notePropertyFilters.push(notePropertyQuery);
      }
    }
  }
  
  // Build hierarchy filters
  const hierarchyFilters: string[] = [];
  if (params.hierarchyType && params.parentNoteId) {
    const hierarchyQuery = buildHierarchyQuery(params.hierarchyType, params.parentNoteId);
    if (hierarchyQuery) {
      hierarchyFilters.push(hierarchyQuery);
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
  
  // Add attribute filters
  if (attributeFilters.length > 0) {
    queryParts.push(...attributeFilters);
  }
  
  // Add note property filters
  if (notePropertyFilters.length > 0) {
    queryParts.push(...notePropertyFilters);
  }
  
  // Add hierarchy filters
  if (hierarchyFilters.length > 0) {
    queryParts.push(...hierarchyFilters);
  }
  
  // Add full-text search token
  if (params.text) {
    queryParts.unshift(params.text); // Add at beginning for better query structure
  }
  
  // Build main query
  let query = queryParts.join(' ');
  
  // If only filters/attributes/noteProperties/hierarchy were provided and no other search criteria, add universal match condition
  if (query.trim() === '' && (fieldFilters.length > 0 || attributeFilters.length > 0 || notePropertyFilters.length > 0 || hierarchyFilters.length > 0)) {
    // For ETAPI compatibility, we need a base search condition when only using filters/attributes/noteProperties/hierarchy
    const allFilters = [...fieldFilters, ...attributeFilters, ...notePropertyFilters, ...hierarchyFilters];
    query = `note.noteId != '' ${allFilters.join(' ')}`;
  } else if (query.trim() === '') {
    // No search criteria provided at all - this will trigger the validation error in index.ts
    query = '';
  }
  
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

/**
 * Builds an attribute-specific query based on the attribute condition
 * Maps JSON operators to Trilium attribute search syntax
 */
function buildAttributeQuery(attribute: AttributeCondition): string {
  const { type, name, op = 'exists', value } = attribute;
  
  // Currently only support labels
  if (type !== 'label') {
    return '';
  }
  
  // Escape the label name (though label names shouldn't contain special characters)
  const escapedName = name.replace(/'/g, "\\'");
  
  switch (op) {
    case 'exists':
      // Simple label existence: #book
      return `#${escapedName}`;
      
    case 'not_exists':
      // Label does not exist: #!book
      return `#!${escapedName}`;
      
    case '=':
      // Label equals value: #publicationYear = 1954
      if (!value) return '';
      const escapedValueEq = value.replace(/'/g, "\\'");
      return `#${escapedName} = '${escapedValueEq}'`;
      
    case '!=':
      // Label not equal to value: #status != 'draft'
      if (!value) return '';
      const escapedValueNe = value.replace(/'/g, "\\'");
      return `#${escapedName} != '${escapedValueNe}'`;
      
    case '>=':
      // Label greater than or equal: #publicationYear >= 1950
      if (!value) return '';
      const escapedValueGe = value.replace(/'/g, "\\'");
      return `#${escapedName} >= '${escapedValueGe}'`;
      
    case '<=':
      // Label less than or equal: #publicationYear <= 1960
      if (!value) return '';
      const escapedValueLe = value.replace(/'/g, "\\'");
      return `#${escapedName} <= '${escapedValueLe}'`;
      
    case '>':
      // Label greater than: #rating > 5
      if (!value) return '';
      const escapedValueGt = value.replace(/'/g, "\\'");
      return `#${escapedName} > '${escapedValueGt}'`;
      
    case '<':
      // Label less than: #rating < 10
      if (!value) return '';
      const escapedValueLt = value.replace(/'/g, "\\'");
      return `#${escapedName} < '${escapedValueLt}'`;
      
    case 'contains':
      // Label contains substring: #genre *=* 'sci'
      if (!value) return '';
      const escapedValueCont = value.replace(/'/g, "\\'");
      return `#${escapedName} *=* '${escapedValueCont}'`;
      
    case 'starts_with':
      // Label starts with: #category =* 'tech'
      if (!value) return '';
      const escapedValueStart = value.replace(/'/g, "\\'");
      return `#${escapedName} =* '${escapedValueStart}'`;
      
    case 'ends_with':
      // Label ends with: #filename *= '.pdf'
      if (!value) return '';
      const escapedValueEnd = value.replace(/'/g, "\\'");
      return `#${escapedName} *= '${escapedValueEnd}'`;
      
    default:
      // Invalid operator, skip this attribute
      return '';
  }
}

/**
 * Builds a note property query based on the note property condition
 * Maps JSON note properties to Trilium note property search syntax
 */
function buildNotePropertyQuery(noteProperty: NotePropertyCondition): string {
  const { property, op = '=', value } = noteProperty;
  
  // Map property names to Trilium note properties
  let triliumProperty: string;
  switch (property) {
    case 'isArchived':
      triliumProperty = 'note.isArchived';
      break;
    case 'isProtected':
      triliumProperty = 'note.isProtected';
      break;
    case 'type':
      triliumProperty = 'note.type';
      break;
    case 'title':
      triliumProperty = 'note.title';
      break;
    default:
      // Invalid property, skip this filter
      return '';
  }
  
  // Map operators to Trilium syntax
  let triliumOperator: string;
  switch (op) {
    case '=':
      triliumOperator = '=';
      break;
    case '!=':
      triliumOperator = '!=';
      break;
    default:
      // Invalid operator, skip this filter
      return '';
  }
  
  // Handle boolean values for isArchived and isProtected
  let processedValue: string;
  if (property === 'isArchived' || property === 'isProtected') {
    // Convert string boolean to actual boolean for Trilium
    if (value.toLowerCase() === 'true') {
      processedValue = 'true';
    } else if (value.toLowerCase() === 'false') {
      processedValue = 'false';
    } else {
      // Invalid boolean value, skip this filter
      return '';
    }
  } else {
    // For other properties, escape quotes and wrap in single quotes
    processedValue = `'${value.replace(/'/g, "\\'")}'`;
  }
  
  return `${triliumProperty} ${triliumOperator} ${processedValue}`;
}

/**
 * Builds a hierarchy query based on the hierarchy type and parent note ID
 * Maps hierarchy parameters to Trilium hierarchy search syntax
 */
function buildHierarchyQuery(hierarchyType: 'children' | 'descendants', parentNoteId: string): string {
  // Escape the parent note ID
  const escapedParentId = parentNoteId.replace(/'/g, "\\'");
  
  switch (hierarchyType) {
    case 'children':
      // Direct children only: note.parents.noteId = 'parentId'
      return `note.parents.noteId = '${escapedParentId}'`;
      
    case 'descendants':
      // All descendants recursively: note.ancestors.noteId = 'parentId'
      return `note.ancestors.noteId = '${escapedParentId}'`;
      
    default:
      // Invalid hierarchy type, skip this filter
      return '';
  }
}