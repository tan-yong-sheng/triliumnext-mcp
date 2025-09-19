/**
 * Attribute Creation Operations
 * Handles single and batch attribute creation with validation and template translation
 */

import { AxiosInstance } from 'axios';
import { logVerbose, logVerboseApi } from '../../shared/index.js';
import {
  validate_attribute,
  check_attribute_exists,
  translate_template_relation,
  generate_attribute_cleaning_message
} from '../../shared/index.js';
import { isContainerTemplateNote, generateContainerAttributeGuidance } from '../validation/containerProtection.js';
import { cleanAttributeName } from '../../shared/index.js';
import { Attribute, AttributeOperationResult } from '../../shared/index.js';

/**
 * Create a single attribute on a note
 */
export async function create_single_attribute(
  noteId: string,
  attribute: Attribute,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    // Check if this is a container template note (Board, Calendar, etc.)
    if (await isContainerTemplateNote(noteId, axiosInstance)) {
      const guidance = await generateContainerAttributeGuidance(noteId, "create", axiosInstance);
      return {
        success: false,
        message: guidance,
        errors: ["Container template notes have protected attribute configurations"]
      };
    }

    // Validate attribute with auto-correction
    const validation = validate_attribute(attribute);
    if (!validation.valid) {
      return {
        success: false,
        message: "Attribute validation failed",
        errors: validation.errors
      };
    }

    // Use cleaned attribute if correction was made
    const attributeToUse = validation.cleanedAttribute || attribute;

    // Check if attribute already exists (use cleaned name)
    const existenceCheck = await check_attribute_exists(noteId, attributeToUse, axiosInstance);
    if (existenceCheck.exists && existenceCheck.existingAttribute) {
      const existing = existenceCheck.existingAttribute;
      const availableAttrs = existenceCheck.allAttributes?.map((attr: any) => `${attr.type}:${attr.name}`).join(', ') || 'none';

      let message = `Attribute '${attributeToUse.name}' of type '${attributeToUse.type}' already exists on note ${noteId}. Available attributes: ${availableAttrs}`;

      // Add cleaning information if name was corrected
      if (validation.cleaningResult && validation.cleaningResult.wasCleaned) {
        message += `\n\n${generate_attribute_cleaning_message(attributeToUse, validation.cleaningResult)}`;
      }

      return {
        success: false,
        message,
        errors: [
          "Attribute already exists",
          `Existing ${attributeToUse.type} '${attributeToUse.name}' has value: ${existing.value || 'none'}, position: ${existing.position || 'default'}, inheritable: ${existing.isInheritable || false}`,
          "To modify the existing attribute, use operation: 'update' instead of 'create'"
        ]
      };
    }

    // Translate template names to note IDs for template relations
    const templateTranslation = translate_template_relation(attributeToUse);
    if (!templateTranslation.success) {
      return {
        success: false,
        message: templateTranslation.error!,
        errors: [templateTranslation.error!]
      };
    }

    // Prepare attribute data for ETAPI
    const attributeData = {
      noteId: noteId,
      type: attributeToUse.type,
      name: attributeToUse.name,
      value: templateTranslation.value,
      position: attributeToUse.position || 10,
      isInheritable: attributeToUse.isInheritable || false
    };

    // Make API call to create attribute
    const response = await axiosInstance.post(
      `/attributes`,
      attributeData
    );

    // Build success message with cleaning information
    let successMessage = `Successfully created ${attributeToUse.type} '${attributeToUse.name}' on note ${noteId}`;
    if (validation.cleaningResult && validation.cleaningResult.wasCleaned) {
      successMessage += `\n\n${generate_attribute_cleaning_message(attributeToUse, validation.cleaningResult)}`;
    }

    return {
      success: true,
      message: successMessage,
      attributes: [response.data]
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Validate batch attributes for conflicts and duplicates
 */
async function validate_batch_attributes(
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

/**
 * Create multiple attributes in batch
 */
export async function create_batch_attributes(
  noteId: string,
  attributes: Attribute[],
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  if (!attributes.length) {
    return {
      success: true,
      message: "No attributes to create",
      attributes: []
    };
  }

  // Check if this is a container template note (Board, Calendar, etc.)
  if (await isContainerTemplateNote(noteId, axiosInstance)) {
    const guidance = await generateContainerAttributeGuidance(noteId, "create", axiosInstance);
    return {
      success: false,
      message: guidance,
      errors: ["Container template notes have protected attribute configurations"]
    };
  }

  // Validate batch for conflicts first
  const batchValidation = await validate_batch_attributes(noteId, attributes, axiosInstance);

  const results: Attribute[] = [];
  const errors: string[] = [];

  // Add conflict warnings if any
  if (batchValidation.conflicts.length > 0) {
    const conflictMessages = batchValidation.conflicts.map(({attribute, existingAttribute}) => {
      return `Skipping duplicate ${attribute.type} '${attribute.name}' (already exists with value: ${existingAttribute.value || 'none'})`;
    });
    errors.push(...conflictMessages);
  }

  // If all attributes are conflicts, return early
  if (batchValidation.validAttributes.length === 0) {
    return {
      success: false,
      message: `All ${attributes.length} attributes already exist on note ${noteId}`,
      errors,
      attributes: []
    };
  }

  // Create only valid (non-conflicting) attributes in parallel
  const promises = batchValidation.validAttributes.map(async (attribute) => {
    try {
      const validation = validate_attribute(attribute);
      if (!validation.valid) {
        errors.push(`Validation failed for ${attribute.type} '${attribute.name}': ${validation.errors.join(', ')}`);
        return null;
      }

      // Use cleaned attribute if correction was made
      const attributeToUse = validation.cleanedAttribute || attribute;

      // Translate template names to note IDs for template relations
      const templateTranslation = translate_template_relation(attributeToUse);
      if (!templateTranslation.success) {
        errors.push(templateTranslation.error!);
        return null;
      }

      const attributeData = {
        noteId: noteId,
        type: attributeToUse.type,
        name: attributeToUse.name,
        value: templateTranslation.value,
        position: attributeToUse.position || 10,
        isInheritable: attributeToUse.isInheritable || false
      };

      const response = await axiosInstance.post(
        `/attributes`,
        attributeData
      );

      results.push(response.data);
      return response.data;
    } catch (error) {
      const errorMsg = `Failed to create ${attribute.type} '${attribute.name}': ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      return null;
    }
  });

  await Promise.all(promises);

  if (errors.length === batchValidation.validAttributes.length) {
    return {
      success: false,
      message: "All attribute creation operations failed",
      errors
    };
  }

  const successCount = results.length;
  const validCount = batchValidation.validAttributes.length;
  const conflictCount = batchValidation.conflicts.length;
  const totalCount = attributes.length;

  let message;
  if (conflictCount > 0) {
    message = `Created ${successCount}/${validCount} valid attributes successfully (${conflictCount} skipped due to conflicts, ${totalCount} total requested)`;
  } else {
    message = `Created ${successCount}/${totalCount} attributes successfully`;
  }
  if (errors.length > 0) {
    message += ` with ${errors.length} errors`;
  }

  return {
    success: successCount > 0,
    message,
    attributes: results,
    errors: errors.length > 0 ? errors : undefined
  };
}