/**
 * Attribute Manager Module
 * Handles CRUD operations for note attributes (labels and relations)
 */

import { AxiosInstance } from 'axios';

export interface Attribute {
  type: "label" | "relation";
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
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
}

/**
 * Main attribute management function that orchestrates different operations
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
    // Validate attribute
    const validation = validate_attribute(attribute);
    if (!validation.valid) {
      return {
        success: false,
        message: "Attribute validation failed",
        errors: validation.errors
      };
    }

    // Prepare attribute data for ETAPI
    const attributeData = {
      type: attribute.type,
      name: attribute.name,
      value: attribute.value || "",
      position: attribute.position || 10,
      isInheritable: attribute.isInheritable || false
    };

    // Make API call to create attribute
    const response = await axiosInstance.post(
      `/notes/${noteId}/attributes`,
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

  const results: Attribute[] = [];
  const errors: string[] = [];

  // Create attributes in parallel for better performance
  const promises = attributes.map(async (attribute) => {
    try {
      const validation = validate_attribute(attribute);
      if (!validation.valid) {
        errors.push(`Validation failed for ${attribute.type} '${attribute.name}': ${validation.errors.join(', ')}`);
        return null;
      }

      const attributeData = {
        type: attribute.type,
        name: attribute.name,
        value: attribute.value || "",
        position: attribute.position || 10,
        isInheritable: attribute.isInheritable || false
      };

      const response = await axiosInstance.post(
        `/notes/${noteId}/attributes`,
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

  if (errors.length === attributes.length) {
    return {
      success: false,
      message: "All attribute creation operations failed",
      errors
    };
  }

  const successCount = results.length;
  const totalCount = attributes.length;

  return {
    success: successCount > 0,
    message: `Created ${successCount}/${totalCount} attributes successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
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
    const existingAttributes = await axiosInstance.get(`/notes/${noteId}/attributes`);

    // Find the attribute to update by name and type
    const targetAttribute = existingAttributes.data.find(
      (attr: any) => attr.name === attribute.name && attr.type === attribute.type
    );

    if (!targetAttribute) {
      return {
        success: false,
        message: `Attribute '${attribute.name}' of type '${attribute.type}' not found on note ${noteId}`,
        errors: ["Attribute not found"]
      };
    }

    const updateData = {
      value: attribute.value || "",
      position: attribute.position || targetAttribute.position,
      isInheritable: attribute.isInheritable || targetAttribute.isInheritable
    };

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
    const existingAttributes = await axiosInstance.get(`/notes/${noteId}/attributes`);

    // Find the attribute to delete by name and type
    const targetAttribute = existingAttributes.data.find(
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
 * Get all attributes for a note
 */
export async function get_note_attributes(
  noteId: string,
  axiosInstance: AxiosInstance
): Promise<AttributeOperationResult> {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}/attributes`);

    const attributes: Attribute[] = response.data.map((attr: any) => ({
      type: attr.type,
      name: attr.name,
      value: attr.value,
      position: attr.position,
      isInheritable: attr.isInheritable
    }));

    return {
      success: true,
      message: `Retrieved ${attributes.length} attributes for note ${noteId}`,
      attributes
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve attributes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}