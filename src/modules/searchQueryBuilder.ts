interface FilterCondition {
  field: string;    // 'title' or 'content'
  op: string;       // 'contains', 'starts_with', 'ends_with', 'not_equal'
  value: string;    // search value
}

interface AttributeCondition {
  type: string;     // 'label', 'relation' (future)
  name: string;     // Name of the label or relation
  op?: string;      // Operator (exists, not_exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with)
  value?: string;   // Value to search for (optional for exists/not_exists)
  logic?: 'AND' | 'OR'; // Logic operator to combine with NEXT item
}

// NotePropertyCondition interface for note.* properties
interface NotePropertyCondition {
  property: string; // Note property name (isArchived, isProtected, etc.)
  op?: string;      // Operator (=, !=, >, <, >=, <=)
  value: string;    // Value to compare
  logic?: 'AND' | 'OR'; // Logic operator to combine with NEXT item
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
  
  // Build attribute-specific filters (labels and relations with #, ~ syntax)
  const attributeExpressions: string[] = [];
  if (params.attributes && params.attributes.length > 0) {
    attributeExpressions.push(...buildAttributeExpressions(params.attributes));
  }
  
  // Build note property filters (note.* properties - separate concept)
  const notePropertyExpressions: string[] = [];
  if (params.noteProperties && params.noteProperties.length > 0) {
    notePropertyExpressions.push(...buildNotePropertyExpressions(params.noteProperties));
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
  
  // Add attribute expressions (labels and relations)
  if (attributeExpressions.length > 0) {
    queryParts.push(...attributeExpressions);
  }
  
  // Add note property expressions (note.* properties)
  if (notePropertyExpressions.length > 0) {
    queryParts.push(...notePropertyExpressions);
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
  if (query.trim() === '' && (fieldFilters.length > 0 || attributeExpressions.length > 0 || notePropertyExpressions.length > 0 || hierarchyFilters.length > 0)) {
    // For ETAPI compatibility, we need a base search condition when only using filters/attributes/noteProperties/hierarchy
    const allFilters = [...fieldFilters, ...attributeExpressions, ...notePropertyExpressions, ...hierarchyFilters];
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
 * Builds attribute expressions with per-item logic support
 * Handles labels and relations (# and ~ syntax)
 */
function buildAttributeExpressions(attributes: AttributeCondition[]): string[] {
  const expressions: string[] = [];
  let currentGroup: string[] = [];
  let groupLogic: 'AND' | 'OR' = 'OR'; // Default to OR as requested
  
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const query = buildAttributeQuery(attribute);
    
    if (!query) continue; // Skip invalid attributes
    
    // Auto-clean: Ignore logic on last item (no next item to combine with)
    const effectiveLogic = (i === attributes.length - 1) ? undefined : attribute.logic;
    
    // If this is the first item in a group, or continuing the same logic
    if (currentGroup.length === 0 || !effectiveLogic || effectiveLogic === groupLogic) {
      currentGroup.push(query);
      if (effectiveLogic) {
        groupLogic = effectiveLogic;
      }
    } else {
      // Logic changed, finalize current group
      expressions.push(finalizeGroup(currentGroup, groupLogic));
      
      // Start new group
      currentGroup = [query];
      groupLogic = effectiveLogic;
    }
  }
  
  // Finalize the last group
  if (currentGroup.length > 0) {
    expressions.push(finalizeGroup(currentGroup, groupLogic));
  }
  
  return expressions;
}

/**
 * Finalizes a group of attribute queries with the specified logic
 */
function finalizeGroup(queries: string[], logic: 'AND' | 'OR'): string {
  if (queries.length === 1) {
    return queries[0];
  }
  
  if (logic === 'OR') {
    // Join with OR and add ~ prefix for Trilium parser compatibility
    return `~(${queries.join(' OR ')})`;
  } else {
    // AND logic - just join with spaces (Trilium's default)
    return queries.join(' ');
  }
}

/**
 * Builds an attribute query for labels and relations
 * Maps JSON operators to Trilium attribute search syntax
 */
function buildAttributeQuery(attribute: AttributeCondition): string {
  const { type, name, op = 'exists', value } = attribute;
  
  // Currently only support labels (relations support can be added later)
  if (type !== 'label') {
    return '';
  }
  
  // Escape the label name
  const escapedName = name.replace(/'/g, "\\'");
  
  switch (op) {
    case 'exists':
      return `#${escapedName}`;
    case 'not_exists':
      return `#!${escapedName}`;
    case '=':
      if (!value) return '';
      return `#${escapedName} = '${value.replace(/'/g, "\\'")}'`;
    case '!=':
      if (!value) return '';
      return `#${escapedName} != '${value.replace(/'/g, "\\'")}'`;
    case '>=':
      if (!value) return '';
      return `#${escapedName} >= '${value.replace(/'/g, "\\'")}'`;
    case '<=':
      if (!value) return '';
      return `#${escapedName} <= '${value.replace(/'/g, "\\'")}'`;
    case '>':
      if (!value) return '';
      return `#${escapedName} > '${value.replace(/'/g, "\\'")}'`;
    case '<':
      if (!value) return '';
      return `#${escapedName} < '${value.replace(/'/g, "\\'")}'`;
    case 'contains':
      if (!value) return '';
      return `#${escapedName} *=* '${value.replace(/'/g, "\\'")}'`;
    case 'starts_with':
      if (!value) return '';
      return `#${escapedName} =* '${value.replace(/'/g, "\\'")}'`;
    case 'ends_with':
      if (!value) return '';
      return `#${escapedName} *= '${value.replace(/'/g, "\\'")}'`;
    default:
      return '';
  }
}

/**
 * Builds note property expressions with per-item logic support
 */
function buildNotePropertyExpressions(noteProperties: NotePropertyCondition[]): string[] {
  const expressions: string[] = [];
  let currentGroup: string[] = [];
  let groupLogic: 'AND' | 'OR' = 'OR'; // Default to OR as requested
  
  for (let i = 0; i < noteProperties.length; i++) {
    const noteProperty = noteProperties[i];
    const query = buildNotePropertyQuery(noteProperty);
    
    if (!query) continue; // Skip invalid properties
    
    // Auto-clean: Ignore logic on last item (no next item to combine with)
    const effectiveLogic = (i === noteProperties.length - 1) ? undefined : noteProperty.logic;
    
    // If this is the first item in a group, or continuing the same logic
    if (currentGroup.length === 0 || !effectiveLogic || effectiveLogic === groupLogic) {
      currentGroup.push(query);
      if (effectiveLogic) {
        groupLogic = effectiveLogic;
      }
    } else {
      // Logic changed, finalize current group
      expressions.push(finalizeGroup(currentGroup, groupLogic));
      
      // Start new group
      currentGroup = [query];
      groupLogic = effectiveLogic;
    }
  }
  
  // Finalize the last group
  if (currentGroup.length > 0) {
    expressions.push(finalizeGroup(currentGroup, groupLogic));
  }
  
  return expressions;
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
    case 'labelCount':
      triliumProperty = 'note.labelCount';
      break;
    case 'ownedLabelCount':
      triliumProperty = 'note.ownedLabelCount';
      break;
    case 'attributeCount':
      triliumProperty = 'note.attributeCount';
      break;
    case 'relationCount':
      triliumProperty = 'note.relationCount';
      break;
    case 'parentCount':
      triliumProperty = 'note.parentCount';
      break;
    case 'childrenCount':
      triliumProperty = 'note.childrenCount';
      break;
    case 'contentSize':
      triliumProperty = 'note.contentSize';
      break;
    case 'revisionCount':
      triliumProperty = 'note.revisionCount';
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
    case '>':
      triliumOperator = '>';
      break;
    case '<':
      triliumOperator = '<';
      break;
    case '>=':
      triliumOperator = '>=';
      break;
    case '<=':
      triliumOperator = '<=';
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
  } else if (property === 'labelCount' || property === 'ownedLabelCount' || property === 'attributeCount' || 
             property === 'relationCount' || property === 'parentCount' || property === 'childrenCount' || 
             property === 'contentSize' || property === 'revisionCount') {
    // Numeric properties - no quotes needed
    processedValue = value;
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