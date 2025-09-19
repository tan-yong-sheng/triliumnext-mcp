/**
 * Batch Attribute Operations
 * Handles batch validation and conflict detection for attribute operations
 */

import { AxiosInstance } from 'axios';
import { Attribute } from '../../shared/index.js';

/**
 * Validate batch attributes for conflicts and duplicates
 */
export async function validate_batch_attributes(
  noteId: string,
  attributes: Attribute[],
  axiosInstance: AxiosInstance
): Promise<{
  conflicts: Array<{attribute: Attribute, existingAttribute: Attribute}>;
  validAttributes: Attribute[];
  allExistingAttributes: Attribute[];
}> {
  try {
    // Get all existing attributes once
    const response = await axiosInstance.get(`/notes/${noteId}`);
    const existingAttributes: Attribute[] = response.data.attributes.map((attr: any) => ({
      type: attr.type,
      name: attr.name,
      value: attr.value,
      position: attr.position,
      isInheritable: attr.isInheritable
    }));

    const conflicts: Array<{attribute: Attribute, existingAttribute: Attribute}> = [];
    const validAttributes: Attribute[] = [];

    // Check each new attribute against existing ones
    for (const attribute of attributes) {
      const existingMatch = existingAttributes.find(
        attr => attr.name === attribute.name && attr.type === attribute.type
      );

      if (existingMatch) {
        conflicts.push({
          attribute,
          existingAttribute: existingMatch
        });
      } else {
        validAttributes.push(attribute);
      }
    }

    return {
      conflicts,
      validAttributes,
      allExistingAttributes: existingAttributes
    };
  } catch (error) {
    // If we can't read attributes, assume no conflicts and proceed
    return {
      conflicts: [],
      validAttributes: attributes,
      allExistingAttributes: []
    };
  }
}