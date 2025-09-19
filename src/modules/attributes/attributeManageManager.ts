/**
 * Attribute Manage Manager Module
 * Handles CRUD operations for note attributes (labels and relations)
 */

import { AxiosInstance } from 'axios';
import axios from 'axios';
import { logVerbose, logVerboseApi, logVerboseAxiosError } from '../../utils/verboseUtils.js';
import {
  ManageAttributesParams,
  Attribute,
  AttributeOperationResult
} from '../../types/attributeTypes.js';
import {
  check_attribute_exists,
  validate_attribute,
  format_attributes_for_display,
  generate_attribute_cleaning_message,
  translate_template_relation
} from '../../utils/attributeUtils.js';

// Re-export types for convenience
export type { ManageAttributesParams, Attribute, AttributeOperationResult };

/**
 * Container templates that must remain empty and serve as layout containers
 */
const CONTAINER_TEMPLATES = [
  'Board',      // Kanban/task boards
  'Calendar',   // Calendar interfaces
  'Grid View',  // Grid layouts
  'List View',  // List layouts
  'Table',      // Spreadsheet-like tables
  'Geo Map'     // Geographic maps
];

/**
 * Check if a note is a container template note that should not have attributes modified
 */
async function isContainerTemplateNote(noteId: string, axiosInstance: AxiosInstance): Promise<boolean> {
  try {
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
    const noteData = noteResponse.data;

    // Only book notes can be container templates
    if (noteData.type !== 'book') {
      return false;
    }

    // Check if the note has a container template relation
    const attributes = noteData.attributes || [];
    const templateRelation = attributes.find(
      (attr: any) => attr.type === 'relation' && attr.name === 'template'
    )?.value;

    if (!templateRelation) {
      return false;
    }

    // Check if it's a built-in container template
    return CONTAINER_TEMPLATES.includes(templateRelation);
  } catch (error) {
    // If we can't read the note, assume it's not a container template
    return false;
  }
}

/**
 * Generate guidance message for container template attribute operations
 */
async function generateContainerAttributeGuidance(
  noteId: string,
  operation: string,
  axiosInstance: AxiosInstance
): Promise<string> {
  try {
    // Get note details for better guidance
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
    const noteData = noteResponse.data;

    const templateRelation = noteData.attributes?.find(
      (attr: any) => attr.type === 'relation' && attr.name === 'template'
    )?.value || 'Container';

    const noteTitle = noteData.title || 'Container Note';

    return `📋 **CONTAINER TEMPLATE ATTRIBUTE PROTECTION**

Cannot ${operation} attributes on "${noteTitle}" (${noteId}) because it's a ${templateRelation} container template note.

**What are container template notes?**
Container template notes provide specialized layouts and functionality for child notes:
- **Board**: Kanban/task board layouts for project management
- **Calendar**: Calendar interfaces for scheduling and events
- **Grid View**: Grid-based layouts for visual organization
- **List View**: List-based layouts with filtering capabilities
- **Table**: Spreadsheet-like table structures for data
- **Geo Map**: Geographic maps with location markers

**Why attribute modifications are prevented:**
Container template notes have specific attribute configurations that enable their specialized functionality. Modifying attributes could break the template behavior.

**What you probably want to do:**

1. **Create a child note** with your desired attributes:
   \`\`\`json
   {
     "parentNoteId": "${noteId}",
     "title": "Your Content Note",
     "type": "text",
     "attributes": [
       {
         "type": "label",
         "name": "your-label",
         "value": "your-value"
       }
     ]
   }
   \`\`\`

2. **View current attributes**:
   - Use read_attributes to see existing attributes
   - Use get_note to see the full note structure

3. **Work with child notes**:
   - Use search_notes to find child notes
   - Modify attributes on child notes instead

**If you really need to modify container attributes:**
- Remove the ~template relation first (this will convert it to a regular book note)
- Then you can modify attributes freely
- But this will lose the specialized template functionality

**Next steps:**
Would you like me to help you create a child note under this ${templateRelation} container with your desired attributes?`;
  } catch (error) {
    return `Cannot ${operation} attributes on note ${noteId} because it's a container template note. Container template notes have protected attribute configurations. Create a child note instead or remove the template relation first.`;
  }
}

/**
 * Manage note attributes with write operations (create, update, delete)
 * This function provides write-only access to note attributes
 */
export async function manage_attributes(
  params: ManageAttributesParams,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    switch (params.operation) {
      case "create":
        return await create_single_attribute(params.noteId, params.attributes[0], axiosInstance);

      case "batch_create":
        return await create_batch_attributes(params.noteId, params.attributes, axiosInstance);

      case "update":
        return await update_attribute(params.noteId, params.attributes[0], axiosInstance);

      case "delete":
        return await delete_attribute(params.noteId, params.attributes[0], axiosInstance);

      default:
        return {
          success: false,
          message: `Unsupported operation: ${params.operation}`,
          errors: [`Operation ${params.operation} is not supported`]
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Attribute operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Create a single attribute on a note
 */
async function create_single_attribute(
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
async function create_batch_attributes(
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

  let message = `Created ${successCount}/${validCount} valid attributes successfully`;
  if (conflictCount > 0) {
    message += ` (${conflictCount} skipped due to conflicts, ${totalCount} total requested)`;
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

/**
 * Update an existing attribute
 */
async function update_attribute(
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

/**
 * Delete an attribute
 */
async function delete_attribute(
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

// Import the cleanAttributeName function (re-export from utility)
import { cleanAttributeName } from '../../utils/attributeNameCleaner.js';