/**
 * Attribute List Management Module
 * Handles attribute listing operations using search_notes internally
 */

import { handleSearchNotes } from '../../search/searchManager.js';
import { logVerbose, logVerboseInput, logVerboseOutput } from '../../shared/index.js';

// Interface for ListAttributesOperation
export interface ListAttributesOperation {
  noteId: string;
  hierarchyLevel?: 'immediate' | 'all';
  limit?: number;
}

export interface AttributeInfo {
  noteId: string;
  noteTitle: string;
  noteType: string;
  attributeId: string;
  attributeType: 'label' | 'relation';
  attributeName: string;
  attributeValue: string;
  position: number;
  isInheritable: boolean;
  hierarchyPath?: string;
}

/**
 * Handle list attributes operation using search_notes internally
 */
export async function handleListAttributes(
  args: ListAttributesOperation,
  axiosInstance: any
): Promise<{ attributes: AttributeInfo[], summary: string }> {
  logVerboseInput('handleListAttributes', args);

  // Build search criteria based on hierarchy navigation
  const searchCriteria = buildHierarchySearchCriteria(args);

  // Use search_notes internally to find notes
  const searchOperation = {
    searchCriteria: searchCriteria,
    limit: args.limit || 100
  };

  const searchResults = await handleSearchNotes(searchOperation, axiosInstance);

  // Extract and organize attributes from search results
  const attributes = extractAttributesFromResults(searchResults.results, args);

  // Generate summary
  const summary = generateAttributeSummary(attributes, args);

  const result = {
    attributes: attributes,
    summary: summary
  };

  logVerboseOutput('handleListAttributes', result);
  return result;
}

/**
 * Build search criteria for hierarchy navigation
 */
function buildHierarchySearchCriteria(args: ListAttributesOperation): any[] {
  const criteria: any[] = [];

  const hierarchyLevel = args.hierarchyLevel || 'immediate';

  if (hierarchyLevel === 'immediate') {
    // For immediate level, search for direct parents and children
    criteria.push({
      property: 'parents.noteId',
      type: 'noteProperty',
      op: '=',
      value: args.noteId
    });
    criteria.push({
      property: 'children.noteId',
      type: 'noteProperty',
      op: '=',
      value: args.noteId,
      logic: 'OR'
    });
  } else {
    // For all levels, search for ancestors and descendants
    criteria.push({
      property: 'ancestors.noteId',
      type: 'noteProperty',
      op: '=',
      value: args.noteId
    });
    criteria.push({
      property: 'descendants.noteId',
      type: 'noteProperty',
      op: '=',
      value: args.noteId,
      logic: 'OR'
    });
  }

  // Exclude the anchor note itself
  criteria.push({
    property: 'noteId',
    type: 'noteProperty',
    op: '!=',
    value: args.noteId,
    logic: 'AND'
  });

  return criteria;
}

/**
 * Extract and organize attributes from search results
 */
function extractAttributesFromResults(searchResults: any[], args: ListAttributesOperation): AttributeInfo[] {
  const attributes: AttributeInfo[] = [];

  for (const note of searchResults) {
    if (note.attributes && Array.isArray(note.attributes)) {
      for (const attribute of note.attributes) {
        const attributeInfo: AttributeInfo = {
          noteId: note.noteId,
          noteTitle: note.title,
          noteType: note.type,
          attributeId: attribute.attributeId,
          attributeType: attribute.type,
          attributeName: attribute.name,
          attributeValue: attribute.value || '',
          position: attribute.position || 10,
          isInheritable: attribute.isInheritable || false,
          hierarchyPath: buildHierarchyPath(note, args)
        };
        attributes.push(attributeInfo);
      }
    }
  }

  return attributes;
}

/**
 * Build hierarchy path for attribute context
 */
function buildHierarchyPath(note: any, args: ListAttributesOperation): string {
  const hierarchyLevel = args.hierarchyLevel || 'immediate';
  const noteTitle = note.title || 'Unknown';

  if (hierarchyLevel === 'immediate') {
    return `Related to ${args.noteId}: ${noteTitle}`;
  } else {
    return `Hierarchy-connected to ${args.noteId}: ${noteTitle}`;
  }
}

/**
 * Generate summary of attributes found
 */
function generateAttributeSummary(attributes: AttributeInfo[], args: ListAttributesOperation): string {
  const totalAttributes = attributes.length;

  if (totalAttributes === 0) {
    return `No attributes found`;
  }

  // Group by attribute type
  const labelCount = attributes.filter(attr => attr.attributeType === 'label').length;
  const relationCount = attributes.filter(attr => attr.attributeType === 'relation').length;

  // Group by note
  const uniqueNotes = new Set(attributes.map(attr => attr.noteId)).size;

  let summary = `Found ${totalAttributes} attributes across ${uniqueNotes} notes`;

  if (labelCount > 0 || relationCount > 0) {
    summary += ` (${labelCount} labels, ${relationCount} relations)`;
  }

  // Add hierarchy context
  const hierarchyLevel = args.hierarchyLevel || 'immediate';
  if (hierarchyLevel === 'immediate') {
    summary += ` in immediate hierarchy (parents and children)`;
  } else {
    summary += ` in full hierarchy (ancestors and descendants)`;
  }

  // Add unique attribute names count
  const uniqueAttributeNames = new Set(attributes.map(attr => attr.attributeName)).size;
  summary += ` with ${uniqueAttributeNames} unique attribute types`;

  return summary;
}