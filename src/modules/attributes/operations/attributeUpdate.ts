/**
 * Attribute Update Operations
 * Handles attribute updates with validation and container template protection
 */

import { AxiosInstance } from 'axios';
import axios from 'axios';
import { logVerbose, logVerboseApi, logVerboseAxiosError } from '../../shared/index.js';
import { generate_attribute_cleaning_message } from '../../shared/index.js';
import { isContainerTemplateNote, generateContainerAttributeGuidance } from '../validation/containerProtection.js';
import { cleanAttributeName } from '../../shared/index.js';
import { Attribute, AttributeOperationResult } from '../../shared/index.js';

/**
 * Update an existing attribute
 */
export async function update_attribute(
  noteId: string,
  attribute: Attribute,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    // Check if this is a container template note (Board, Calendar, etc.)
    if (await isContainerTemplateNote(noteId, axiosInstance)) {
      const guidance = await generateContainerAttributeGuidance(noteId, "update", axiosInstance);
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

    // For update, we need the attribute ID, which requires finding it first
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

    // Debug: Log available attributes
    logVerbose("update_attribute", `Available attributes on note ${noteId}`, noteResponse.data.attributes);

    // Find the attribute to update by name and type (use cleaned name)
    const targetAttribute = noteResponse.data.attributes.find(
      (attr: any) => attr.name === attributeToUse.name && attr.type === attributeToUse.type
    );

    if (!targetAttribute) {
      const availableAttrs = noteResponse.data.attributes.map((attr: any) => `${attr.type}:${attr.name}`).join(', ');
      let message = `Attribute '${attributeToUse.name}' of type '${attributeToUse.type}' not found on note ${noteId}. Available attributes: ${availableAttrs || 'none'}`;

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

    logVerbose("update_attribute", "Found attribute to update", targetAttribute);

    // According to Trilium ETAPI spec:
    // - For labels: only value and position can be updated
    // - For relations: only position can be updated
    // - isInheritable cannot be updated via PATCH, requires delete+recreate
    const updateData: any = {};

    if (attributeToUse.type === "label") {
      updateData.value = attributeToUse.value !== undefined ? attributeToUse.value : targetAttribute.value;
    }

    if (attributeToUse.position !== undefined) {
      updateData.position = attributeToUse.position;
    } else if (targetAttribute.position !== undefined) {
      updateData.position = targetAttribute.position;
    }

    // Check if isInheritable is being changed (not allowed via PATCH)
    if (attributeToUse.isInheritable !== undefined && attributeToUse.isInheritable !== targetAttribute.isInheritable) {
      logVerbose("update_attribute", "isInheritable change detected, requires delete+recreate", {
        current: targetAttribute.isInheritable,
        requested: attributeToUse.isInheritable
      });

      return {
        success: false,
        message: `Cannot update 'isInheritable' property via PATCH operation. To change inheritability, delete the attribute and create a new one.`,
        errors: ["isInheritable property cannot be updated via PATCH"]
      };
    }

    logVerbose("update_attribute", "Update data", updateData);
    logVerboseApi("PATCH", `/attributes/${targetAttribute.attributeId}`, updateData);

    const response = await axiosInstance.patch(
      `/attributes/${targetAttribute.attributeId}`,
      updateData
    );

    // Build success message with cleaning information
    let successMessage = `Successfully updated ${attributeToUse.type} '${attributeToUse.name}' on note ${noteId}`;
    if (cleaningResult.wasCleaned) {
      successMessage += `\n\n${generate_attribute_cleaning_message(attributeToUse, cleaningResult)}`;
    }

    return {
      success: true,
      message: successMessage,
      attributes: [response.data]
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = `Failed to update attribute: ${error.response?.data?.message || error.message}`;
      logVerboseAxiosError("update_attribute", error);
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
    return {
      success: false,
      message: `Failed to update attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}