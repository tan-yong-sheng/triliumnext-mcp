/**
 * Attribute Deletion Operations
 * Handles attribute deletion with validation and container template protection
 */

import { AxiosInstance } from 'axios';
import { generate_attribute_cleaning_message } from '../../shared/index.js';
import { isContainerTemplateNote, generateContainerAttributeGuidance } from '../validation/containerProtection.js';
import { cleanAttributeName } from '../../shared/index.js';
import { Attribute, AttributeOperationResult } from '../../shared/index.js';

/**
 * Delete an attribute
 */
export async function delete_attribute(
  noteId: string,
  attribute: Attribute,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    // Check if this is a container template note (Board, Calendar, etc.)
    if (await isContainerTemplateNote(noteId, axiosInstance)) {
      const guidance = await generateContainerAttributeGuidance(noteId, "delete", axiosInstance);
      return {
        success: false,
        message: guidance,
        errors: ["Container template notes have protected attribute configurations"]
      };
    }

    // Clean attribute name first
    const cleaningResult = cleanAttributeName(attribute.name, attribute.type);
    const attributeToUse = {
      ...attribute,
      name: cleaningResult.cleanedName
    };

    // For delete, we need the attribute ID, which requires finding it first
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

    // Find the attribute to delete by name and type (use cleaned name)
    const targetAttribute = noteResponse.data.attributes.find(
      (attr: any) => attr.name === attributeToUse.name && attr.type === attributeToUse.type
    );

    if (!targetAttribute) {
      let message = `Attribute '${attributeToUse.name}' of type '${attributeToUse.type}' not found on note ${noteId}`;

      // Add cleaning information if name was corrected
      if (cleaningResult.wasCleaned) {
        message += `\n\n${generate_attribute_cleaning_message(attributeToUse, cleaningResult)}`;
      }

      return {
        success: false,
        message,
        errors: ["Attribute not found"]
      };
    }

    await axiosInstance.delete(`/attributes/${targetAttribute.attributeId}`);

    // Build success message with cleaning information
    let successMessage = `Successfully deleted ${attributeToUse.type} '${attributeToUse.name}' from note ${noteId}`;
    if (cleaningResult.wasCleaned) {
      successMessage += `\n\n${generate_attribute_cleaning_message(attributeToUse, cleaningResult)}`;
    }

    return {
      success: true,
      message: successMessage
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}