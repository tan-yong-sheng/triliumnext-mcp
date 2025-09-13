// Unified SearchCriteria interface for all search types
interface SearchCriteria {
  property: string;  // Property name (varies by type)
  type: 'label' | 'relation' | 'noteProperty' | 'fulltext'; // Type of search criteria
  op?: string;       // Operator (exists, =, !=, >=, <=, >, <, contains, starts_with, ends_with, regex)
  value?: string;    // Value to search for (optional for exists, required for fulltext)
  logic?: 'AND' | 'OR'; // Logic operator to combine with NEXT item
}


interface SearchStructuredParams {
  text?: string;
  limit?: number;
  searchCriteria?: SearchCriteria[];
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

  // Build unified search criteria expressions
  const searchExpressions: string[] = [];
  if (params.searchCriteria && params.searchCriteria.length > 0) {
    searchExpressions.push(...buildUnifiedSearchExpressions(params.searchCriteria));
  }

  // Build hierarchy filters
  const hierarchyFilters: string[] = [];
  if (params.hierarchyType && params.parentNoteId) {
    const hierarchyQuery = buildHierarchyQuery(params.hierarchyType, params.parentNoteId);
    if (hierarchyQuery) {
      hierarchyFilters.push(hierarchyQuery);
    }
  }

  // Add search expressions from unified searchCriteria
  if (searchExpressions.length > 0) {
    queryParts.push(...searchExpressions);
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

  // If only searchCriteria/hierarchy were provided and no other search criteria, add universal match condition
  if (query.trim() === '' && (searchExpressions.length > 0 || hierarchyFilters.length > 0)) {
    // For ETAPI compatibility, we need a base search condition when only using searchCriteria/hierarchy
    const allFilters = [...searchExpressions, ...hierarchyFilters];
    query = `note.noteId != '' ${allFilters.join(' ')}`;
  } else if (query.trim() === '') {
    // No search criteria provided at all - this will trigger the validation error in index.ts
    query = '';
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
 * Builds unified search expressions with cross-type boolean logic support
 * Handles all search criteria types: labels, relations, note properties, and fulltext
 * Enables previously impossible cross-type OR operations
 */
function buildUnifiedSearchExpressions(searchCriteria: SearchCriteria[]): string[] {
  const expressions: string[] = [];
  let currentGroup: string[] = [];
  let groupLogic: 'AND' | 'OR' = 'AND'; // Default to AND as per TriliumNext behavior

  for (let i = 0; i < searchCriteria.length; i++) {
    const criteria = searchCriteria[i];
    const query = buildSearchCriteriaQuery(criteria);

    if (!query) continue; // Skip invalid criteria

    // Auto-clean: Ignore logic on last item (no next item to combine with)
    const effectiveLogic = (i === searchCriteria.length - 1) ? undefined : criteria.logic;

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
 * Builds a query for individual search criteria based on type
 * Dispatches to appropriate handler based on criteria type
 */
function buildSearchCriteriaQuery(criteria: SearchCriteria): string {
  const { type } = criteria;

  switch (type) {
    case 'label':
    case 'relation':
      return buildAttributeQuery(criteria);
    case 'noteProperty':
      return buildNotePropertyQuery(criteria);
    case 'fulltext':
      // For fulltext, simply return the value as a search token
      return criteria.value || '';
    default:
      return '';
  }
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
function buildAttributeQuery(criteria: SearchCriteria): string {
  const { type, property: name, op = 'exists', value } = criteria;

  // Support both labels and relations
  if (type !== 'label' && type !== 'relation') {
    return '';
  }

  // Auto-enhance relation properties to ensure proper TriliumNext syntax
  let enhancedName = name;
  if (type === 'relation') {
    // For relations, ensure property access syntax is used
    // TriliumNext requires ~relation.property, not ~relation = value
    if (!name.includes('.') && op !== 'exists' && op !== 'not_exists') {
      enhancedName = `${name}.title`;

      // Verbose logging for auto-enhancement
      const isVerbose = process.env.VERBOSE === "true";
      if (isVerbose) {
        console.error(`[VERBOSE] Auto-enhanced relation property: "${name}" → "${enhancedName}" (TriliumNext requires property access for relations)`);
      }
    }
  }

  // Escape the attribute name
  const escapedName = enhancedName.replace(/'/g, "\\'");

  // Determine the prefix based on attribute type
  const prefix = type === 'label' ? '#' : '~';
  
  switch (op) {
    case 'exists':
      return `${prefix}${escapedName}`;
    case 'not_exists':
      return `${prefix}!${escapedName}`;
    case '=':
      if (!value) return '';
      return `${prefix}${escapedName} = '${value.replace(/'/g, "\\'")}'`;
    case '!=':
      if (!value) return '';
      return `${prefix}${escapedName} != '${value.replace(/'/g, "\\'")}'`;
    case '>=':
      if (!value) return '';
      return `${prefix}${escapedName} >= '${value.replace(/'/g, "\\'")}'`;
    case '<=':
      if (!value) return '';
      return `${prefix}${escapedName} <= '${value.replace(/'/g, "\\'")}'`;
    case '>':
      if (!value) return '';
      return `${prefix}${escapedName} > '${value.replace(/'/g, "\\'")}'`;
    case '<':
      if (!value) return '';
      return `${prefix}${escapedName} < '${value.replace(/'/g, "\\'")}'`;
    case 'contains':
      if (!value) return '';
      return `${prefix}${escapedName} *=* '${value.replace(/'/g, "\\'")}'`;
    case 'starts_with':
      if (!value) return '';
      return `${prefix}${escapedName} =* '${value.replace(/'/g, "\\'")}'`;
    case 'ends_with':
      if (!value) return '';
      return `${prefix}${escapedName} *= '${value.replace(/'/g, "\\'")}'`;
    case 'regex':
      if (!value) return '';
      return `${prefix}${escapedName} %= '${value.replace(/'/g, "\\'")}'`;
    default:
      return '';
  }
}

/**
 * Validates ISO date format for date properties
 */
function validateISODate(value: string, property: string): string {
  // ISO date formats: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  
  if (!isoDateRegex.test(value) && !isoDateTimeRegex.test(value)) {
    throw new Error(`Invalid date format for property '${property}'. Must use ISO format: 'YYYY-MM-DD' (e.g., '2024-01-01') or 'YYYY-MM-DDTHH:mm:ss.sssZ' (e.g., '2024-01-01T00:00:00.000Z'). Smart expressions like 'TODAY-7' are not allowed.`);
  }
  
  // Additional validation: check if the date is actually valid
  const dateObj = new Date(value);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date value for property '${property}': '${value}'. Please provide a valid ISO date.`);
  }
  
  return value;
}


/**
 * Builds a note property query based on the note property condition
 * Maps JSON note properties to Trilium note property search syntax
 */
function buildNotePropertyQuery(criteria: SearchCriteria): string {
  const { property, op = '=', value } = criteria;

  // Ensure value is provided when needed
  if (!value && op !== 'exists' && op !== 'not_exists') {
    return ''; // Skip if no value provided for operators that need one
  }
  
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
    case 'content':
      triliumProperty = 'note.content';
      break;
    case 'dateCreated':
      triliumProperty = 'note.dateCreated';
      break;
    case 'dateModified':
      triliumProperty = 'note.dateModified';
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
    case 'regex':
      triliumOperator = '%=';
      break;
    default:
      // Invalid operator, skip this filter
      return '';
  }
  
  // Handle boolean values for isArchived and isProtected
  let processedValue: string;
  if (property === 'isArchived' || property === 'isProtected') {
    // Convert string boolean to actual boolean for Trilium
    if (value!.toLowerCase() === 'true') {
      processedValue = 'true';
    } else if (value!.toLowerCase() === 'false') {
      processedValue = 'false';
    } else {
      // Invalid boolean value, skip this filter
      return '';
    }
  } else if (property === 'labelCount' || property === 'ownedLabelCount' || property === 'attributeCount' ||
             property === 'relationCount' || property === 'parentCount' || property === 'childrenCount' ||
             property === 'contentSize' || property === 'revisionCount') {
    // Numeric properties - no quotes needed
    processedValue = value!;
  } else if (property === 'title' || property === 'content') {
    // Title and content properties need quotes for string operators
    processedValue = `'${value!.replace(/'/g, "\\'")}'`;
  } else if (property === 'dateCreated' || property === 'dateModified') {
    // Date properties - validate ISO format and wrap in quotes
    const validatedValue = validateISODate(value!, property);
    processedValue = `'${validatedValue.replace(/'/g, "\\'")}'`;
  } else {
    // For other properties, escape quotes and wrap in single quotes
    processedValue = `'${value!.replace(/'/g, "\\'")}'`;
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