/**
 * Attribute Manager Module
 * Handles CRUD operations for note attributes (labels and relations)
 */

import { AxiosInstance } from 'axios';
import axios from 'axios';
import { logVerbose, logVerboseApi, logVerboseAxiosError } from "../utils/verboseUtils.js";
import { validateAndTranslateTemplate, createTemplateRelationError } from "../utils/templateMapper.js";

export interface Attribute {
  type: "label" | "relation";
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export interface ReadAttributesParams {
  noteId: string;
}

export interface ManageAttributesParams {
  noteId: string;
  operation: "create" | "update" | "delete" | "batch_create";
  attributes: Attribute[];
}

export interface AttributeOperationResult {
  success: boolean;
  message: string;
  attributes?: Attribute[];
  errors?: string[];
  summary?: {
    total: number;
    labels: number;
    relations: number;
    noteId: string;
  };
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
 * Check if an attribute already exists on a note
 */
async function check_attribute_exists(
  noteId: string,
  attribute: Attribute,
  axiosInstance: AxiosInstance
): Promise<{exists: boolean, existingAttribute?: Attribute, allAttributes?: Attribute[]}> {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}`);
    const existingAttributes: Attribute[] = response.data.attributes.map((attr: any) => ({
      type: attr.type,
      name: attr.name,
      value: attr.value,
      position: attr.position,
      isInheritable: attr.isInheritable
    }));

    // Find matching attribute by name and type
    const matchingAttribute = existingAttributes.find(
      attr => attr.name === attribute.name && attr.type === attribute.type
    );

    return {
      exists: !!matchingAttribute,
      existingAttribute: matchingAttribute,
      allAttributes: existingAttributes
    };
  } catch (error) {
    // If we can't read attributes, assume it doesn't exist and let the create operation handle the error
    return { exists: false };
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
    // Validate attribute
    const validation = validate_attribute(attribute);
    if (!validation.valid) {
      return {
        success: false,
        message: "Attribute validation failed",
        errors: validation.errors
      };
    }

    // Check if attribute already exists
    const existenceCheck = await check_attribute_exists(noteId, attribute, axiosInstance);
    if (existenceCheck.exists && existenceCheck.existingAttribute) {
      const existing = existenceCheck.existingAttribute;
      const availableAttrs = existenceCheck.allAttributes?.map((attr: any) => `${attr.type}:${attr.name}`).join(', ') || 'none';

      return {
        success: false,
        message: `Attribute '${attribute.name}' of type '${attribute.type}' already exists on note ${noteId}. Available attributes: ${availableAttrs}`,
        errors: [
          "Attribute already exists",
          `Existing ${attribute.type} '${attribute.name}' has value: ${existing.value || 'none'}, position: ${existing.position || 'default'}, inheritable: ${existing.isInheritable || false}`,
          "To modify the existing attribute, use operation: 'update' instead of 'create'"
        ]
      };
    }

    // Translate template names to note IDs for template relations
    let processedValue = attribute.value || "";
    if (attribute.type === "relation" && attribute.name === "template" && attribute.value) {
      try {
        processedValue = validateAndTranslateTemplate(attribute.value);
        logVerbose("create_single_attribute", `Translated template relation`, {
          from: attribute.value,
          to: processedValue
        });
      } catch (error) {
        return {
          success: false,
          message: createTemplateRelationError(attribute.value),
          errors: [error instanceof Error ? error.message : 'Template validation failed']
        };
      }
    }

    // Prepare attribute data for ETAPI
    const attributeData = {
      noteId: noteId,
      type: attribute.type,
      name: attribute.name,
      value: processedValue,
      position: attribute.position || 10,
      isInheritable: attribute.isInheritable || false
    };

    // Make API call to create attribute
    const response = await axiosInstance.post(
      `/attributes`,
      attributeData
    );

    return {
      success: true,
      message: `Successfully created ${attribute.type} '${attribute.name}' on note ${noteId}`,
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

      // Translate template names to note IDs for template relations
      let processedValue = attribute.value || "";
      if (attribute.type === "relation" && attribute.name === "template" && attribute.value) {
        try {
          processedValue = validateAndTranslateTemplate(attribute.value);
          logVerbose("create_batch_attributes", `Translated template relation`, {
            from: attribute.value,
            to: processedValue
          });
        } catch (error) {
          errors.push(createTemplateRelationError(attribute.value));
          return null;
        }
      }

      const attributeData = {
        noteId: noteId,
        type: attribute.type,
        name: attribute.name,
        value: processedValue,
        position: attribute.position || 10,
        isInheritable: attribute.isInheritable || false
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
    // For update, we need the attribute ID, which requires finding it first
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

    // Debug: Log available attributes
    logVerbose("update_attribute", `Available attributes on note ${noteId}`, noteResponse.data.attributes);

    // Find the attribute to update by name and type
    const targetAttribute = noteResponse.data.attributes.find(
      (attr: any) => attr.name === attribute.name && attr.type === attribute.type
    );

    if (!targetAttribute) {
      const availableAttrs = noteResponse.data.attributes.map((attr: any) => `${attr.type}:${attr.name}`).join(', ');
      return {
        success: false,
        message: `Attribute '${attribute.name}' of type '${attribute.type}' not found on note ${noteId}. Available attributes: ${availableAttrs || 'none'}`,
        errors: ["Attribute not found"]
      };
    }

    logVerbose("update_attribute", "Found attribute to update", targetAttribute);

    // According to Trilium ETAPI spec:
    // - For labels: only value and position can be updated
    // - For relations: only position can be updated
    // - isInheritable cannot be updated via PATCH, requires delete+recreate
    const updateData: any = {};

    if (attribute.type === "label") {
      updateData.value = attribute.value !== undefined ? attribute.value : targetAttribute.value;
    }

    if (attribute.position !== undefined) {
      updateData.position = attribute.position;
    } else if (targetAttribute.position !== undefined) {
      updateData.position = targetAttribute.position;
    }

    // Check if isInheritable is being changed (not allowed via PATCH)
    if (attribute.isInheritable !== undefined && attribute.isInheritable !== targetAttribute.isInheritable) {
      logVerbose("update_attribute", "isInheritable change detected, requires delete+recreate", {
        current: targetAttribute.isInheritable,
        requested: attribute.isInheritable
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

    return {
      success: true,
      message: `Successfully updated ${attribute.type} '${attribute.name}' on note ${noteId}`,
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
    // For delete, we need the attribute ID, which requires finding it first
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

    // Find the attribute to delete by name and type
    const targetAttribute = noteResponse.data.attributes.find(
      (attr: any) => attr.name === attribute.name && attr.type === attribute.type
    );

    if (!targetAttribute) {
      return {
        success: false,
        message: `Attribute '${attribute.name}' of type '${attribute.type}' not found on note ${noteId}`,
        errors: ["Attribute not found"]
      };
    }

    await axiosInstance.delete(`/attributes/${targetAttribute.attributeId}`);

    return {
      success: true,
      message: `Successfully deleted ${attribute.type} '${attribute.name}' from note ${noteId}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Validate attribute data
 */
function validate_attribute(attribute: Attribute): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate type
  if (!["label", "relation"].includes(attribute.type)) {
    errors.push("Attribute type must be either 'label' or 'relation'");
  }

  // Validate name
  if (!attribute.name || typeof attribute.name !== 'string' || attribute.name.trim() === '') {
    errors.push("Attribute name is required and must be a non-empty string");
  }

  // Validate position
  if (attribute.position !== undefined && (typeof attribute.position !== 'number' || attribute.position < 1)) {
    errors.push("Attribute position must be a positive number");
  }

  // Validate value for relations
  if (attribute.type === "relation" && (!attribute.value || attribute.value.trim() === '')) {
    errors.push("Relation attributes require a value");
  }

  // Validate isInheritable
  if (attribute.isInheritable !== undefined && typeof attribute.isInheritable !== 'boolean') {
    errors.push("isInheritable must be a boolean value");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

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