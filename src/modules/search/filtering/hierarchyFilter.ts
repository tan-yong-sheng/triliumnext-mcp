/**
 * Hierarchy Filtering for Search
 * Handles filtering and navigation of note hierarchy (parents, children, ancestors)
 */

import { SearchOperation } from '../searchManager.js';

interface SearchCriteria {
  property: string;
  type: 'noteProperty';
  op?: string;
  value?: string;
  logic?: 'AND' | 'OR';
}

/**
 * Detects if search involves hierarchy navigation
 */
export function hasHierarchySearch(searchArgs: SearchOperation): boolean {
  if (!searchArgs.searchCriteria || !Array.isArray(searchArgs.searchCriteria)) {
    return false;
  }

  return searchArgs.searchCriteria.some(criteria => {
    if (criteria.type !== 'noteProperty') return false;

    const property = criteria.property;
    return property.startsWith('parents.') ||
           property.startsWith('children.') ||
           property.startsWith('ancestors.');
  });
}

/**
 * Extracts hierarchy-related information from search criteria
 */
export function extractHierarchyInfo(searchArgs: SearchOperation): {
  hasParentSearch: boolean;
  hasChildSearch: boolean;
  hasAncestorSearch: boolean;
  targetNoteIds: Set<string>;
  hierarchyProperties: string[];
} {
  const result = {
    hasParentSearch: false,
    hasChildSearch: false,
    hasAncestorSearch: false,
    targetNoteIds: new Set<string>(),
    hierarchyProperties: [] as string[]
  };

  if (!searchArgs.searchCriteria || !Array.isArray(searchArgs.searchCriteria)) {
    return result;
  }

  searchArgs.searchCriteria.forEach(criteria => {
    if (criteria.type !== 'noteProperty') return;

    const property = criteria.property;

    if (property.startsWith('parents.')) {
      result.hasParentSearch = true;
      result.hierarchyProperties.push(property);

      // Extract target note ID for direct parent searches
      if (property.endsWith('.noteId') && criteria.op === '=' && criteria.value) {
        result.targetNoteIds.add(criteria.value);
      }
    } else if (property.startsWith('children.')) {
      result.hasChildSearch = true;
      result.hierarchyProperties.push(property);
    } else if (property.startsWith('ancestors.')) {
      result.hasAncestorSearch = true;
      result.hierarchyProperties.push(property);

      // Extract target note ID for direct ancestor searches
      if (property.endsWith('.noteId') && criteria.op === '=' && criteria.value) {
        result.targetNoteIds.add(criteria.value);
      }
    }
  });

  return result;
}

/**
 * Validates hierarchy search criteria
 */
export function validateHierarchySearch(searchArgs: SearchOperation): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!searchArgs.searchCriteria || !Array.isArray(searchArgs.searchCriteria)) {
    return { valid: true, errors: [] };
  }

  const hierarchyCriteria = searchArgs.searchCriteria.filter(criteria =>
    criteria.type === 'noteProperty' && (
      criteria.property.startsWith('parents.') ||
      criteria.property.startsWith('children.') ||
      criteria.property.startsWith('ancestors.')
    )
  );

  // Check for valid hierarchy properties
  const validHierarchyProperties = [
    'parents.noteId', 'parents.title',
    'children.noteId', 'children.title',
    'ancestors.noteId', 'ancestors.title'
  ];

  // Support nested properties like parents.parents.title
  hierarchyCriteria.forEach(criteria => {
    const property = criteria.property;

    // Check if property follows valid hierarchy pattern
    const isValidProperty = validHierarchyProperties.some(validProp =>
      property === validProp || property.startsWith(validProp + '.')
    );

    if (!isValidProperty) {
      errors.push(`Invalid hierarchy property: '${property}'. Supported properties include: ${validHierarchyProperties.join(', ')}`);
    }

    // Check for valid operators with hierarchy properties
    if (criteria.op && !['=', '!=', 'exists', 'not_exists'].includes(criteria.op)) {
      errors.push(`Invalid operator '${criteria.op}' for hierarchy property '${property}'. Only =, !=, exists, not_exists are supported.`);
    }
  });

  // Check for conflicting hierarchy searches
  const hasParentSearch = hierarchyCriteria.some(c => c.property.startsWith('parents.'));
  const hasChildSearch = hierarchyCriteria.some(c => c.property.startsWith('children.'));
  const hasAncestorSearch = hierarchyCriteria.some(c => c.property.startsWith('ancestors.'));

  if (hasParentSearch && hasAncestorSearch) {
    errors.push('Cannot search both parents and ancestors in the same query. They represent different hierarchy relationships.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Builds hierarchy navigation query parts
 */
export function buildHierarchyQueryParts(searchArgs: SearchOperation): string[] {
  const queryParts: string[] = [];

  if (!searchArgs.searchCriteria || !Array.isArray(searchArgs.searchCriteria)) {
    return queryParts;
  }

  searchArgs.searchCriteria.forEach(criteria => {
    if (criteria.type !== 'noteProperty') return;

    const property = criteria.property;
    if (!property.startsWith('parents.') && !property.startsWith('children.') && !property.startsWith('ancestors.')) {
      return;
    }

    const triliumProperty = `note.${property}`;
    let queryPart = '';

    switch (criteria.op) {
      case 'exists':
        queryPart = `${triliumProperty}`;
        break;
      case 'not_exists':
        queryPart = `${triliumProperty} = ''`;
        break;
      case '=':
        if (criteria.value) {
          queryPart = `${triliumProperty} = '${criteria.value.replace(/'/g, "\\'")}'`;
        }
        break;
      case '!=':
        if (criteria.value) {
          queryPart = `${triliumProperty} != '${criteria.value.replace(/'/g, "\\'")}'`;
        }
        break;
      default:
        // Skip unsupported operators
        return;
    }

    if (queryPart) {
      queryParts.push(queryPart);
    }
  });

  return queryParts;
}

/**
 * Provides guidance for hierarchy search errors
 */
export function getHierarchySearchGuidance(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  let guidance = '📋 **Hierarchy Search Guidance**\n\n';
  guidance += 'The following issues were found with your hierarchy search:\n\n';

  errors.forEach((error, index) => {
    guidance += `${index + 1}. ${error}\n`;
  });

  guidance += '\n**Supported Hierarchy Properties:**\n';
  guidance += '- `parents.noteId` - Search by parent note ID\n';
  guidance += '- `parents.title` - Search by parent note title\n';
  guidance += '- `children.noteId` - Search by child note ID\n';
  guidance += '- `children.title` - Search by child note title\n';
  guidance += '- `ancestors.noteId` - Search by ancestor note ID\n';
  guidance += '- `ancestors.title` - Search by ancestor note title\n';

  guidance += '\n**Supported Operators:**\n';
  guidance += '- `=` - Exact match\n';
  guidance += '- `!=` - Not equal\n';
  guidance += '- `exists` - Property exists\n';
  guidance += '- `not_exists` - Property does not exist\n';

  guidance += '\n**Example Usage:**\n';
  guidance += '```json\n';
  guidance += '{\n';
  guidance += '  "searchCriteria": [\n';
  guidance += '    {\n';
  guidance += '      "property": "parents.title",\n';
  guidance += '      "type": "noteProperty",\n';
  guidance += '      "op": "=",\n';
  guidance += '      "value": "Projects"\n';
  guidance += '    }\n';
  guidance += '  ]\n';
  guidance += '}\n';
  guidance += '```\n';

  return guidance;
}