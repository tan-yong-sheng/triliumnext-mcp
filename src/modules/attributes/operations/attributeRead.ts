/**
 * Attribute Read Manager Module
 * Handles read-only operations for note attributes (labels and relations)
 */

import { AxiosInstance } from 'axios';
import { ReadAttributesParams, Attribute, AttributeOperationResult } from '../../shared/index.js';
import { logVerbose } from '../../shared/index.js';

// Re-export types for convenience
export type { ReadAttributesParams, Attribute, AttributeOperationResult };

/**
 * Read all attributes for a note (labels and relations)
 * This function provides read-only access to note attributes
 */
export async function read_attributes(
  params: ReadAttributesParams,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    const response = await axiosInstance.get(`/notes/${params.noteId}`);

    const attributes: Attribute[] = response.data.attributes.map((attr: any) => ({
      type: attr.type,
      name: attr.name,
      value: attr.value,
      position: attr.position,
      isInheritable: attr.isInheritable
    }));

    // Separate labels and relations for better organization
    const labels = attributes.filter(attr => attr.type === 'label');
    const relations = attributes.filter(attr => attr.type === 'relation');

    return {
      success: true,
      message: `Retrieved ${attributes.length} attributes for note ${params.noteId} (${labels.length} labels, ${relations.length} relations)`,
      attributes,
      // Add structured summary for easier parsing
      summary: {
        total: attributes.length,
        labels: labels.length,
        relations: relations.length,
        noteId: params.noteId
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve attributes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}