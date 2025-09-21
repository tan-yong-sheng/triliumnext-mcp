/**
 * Attribute Utilities Module
 * Shared utilities for attribute operations
 */

import { AxiosInstance } from 'axios';
import axios from 'axios';
import { logVerbose, logVerboseApi, logVerboseAxiosError } from '../system/verboseUtils.js';
import { validateAndTranslateTemplate, createTemplateRelationError } from '../content/templateMapper.js';
import { cleanAttributeName, generateCleaningMessage } from './attributeNameCleaner.js';
import { Attribute, AttributeOperationResult } from '../../types/index.js';

// Re-export Attribute type for convenience
export type { Attribute };

/**
 * Check if an attribute already exists on a note
 */
export async function check_attribute_exists(
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
 * Validate attribute data with auto-correction
 */
export function validate_attribute(attribute: Attribute): { valid: boolean; errors: string[]; cleanedAttribute?: Attribute; cleaningResult?: any } {
  const errors: string[] = [];

  // Validate type
  if (!["label", "relation"].includes(attribute.type)) {
    errors.push("Attribute type must be either 'label' or 'relation'");
  }

  // Clean attribute name first
  const cleaningResult = cleanAttributeName(attribute.name, attribute.type);
  const cleanedAttribute = {
    ...attribute,
    name: cleaningResult.cleanedName
  };

  // Validate name (using cleaned name)
  if (!cleanedAttribute.name || typeof cleanedAttribute.name !== 'string' || cleanedAttribute.name.trim() === '') {
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
    errors,
    cleanedAttribute: cleaningResult.wasCleaned ? cleanedAttribute : undefined,
    cleaningResult: cleaningResult.wasCleaned ? cleaningResult : undefined
  };
}

/**
 * Format attributes for display in MCP response
 */
export function format_attributes_for_display(attributes: Attribute[]): string {
  if (!attributes || attributes.length === 0) {
    return "📋 No attributes to display";
  }

  const format_single_attribute = (attr: Attribute): string => {
    const prefix = attr.type === "label" ? "#" : "~";
    const value = attr.value ? ` = "${attr.value}"` : "";
    const position = attr.position ? ` [position: ${attr.position}]` : "";
    const inheritable = attr.isInheritable ? " [inheritable]" : "";

    return `${prefix}${attr.name}${value}${position}${inheritable}`;
  };

  return `📋 Created attributes:\n${attributes.map(format_single_attribute).join('\n')}`;
}

/**
 * Generate cleaning message for auto-corrected attribute names
 */
export function generate_attribute_cleaning_message(cleanedAttribute: Attribute, cleaningResult: any): string {
  return `🔧 **Note**: Attribute name was auto-corrected from "${cleaningResult.originalName}" to "${cleanedAttribute.name}"`;
}

/**
 * Translate template names to note IDs for template relations
 */
export function translate_template_relation(attribute: Attribute): { success: boolean; value?: string; error?: string } {
  if (attribute.type === "relation" && attribute.name === "template" && attribute.value) {
    try {
      const processedValue = validateAndTranslateTemplate(attribute.value);
      logVerbose("translate_template_relation", `Translated template relation`, {
        from: attribute.value,
        to: processedValue
      });
      return { success: true, value: processedValue };
    } catch (error) {
      return {
        success: false,
        error: createTemplateRelationError(attribute.value)
      };
    }
  }
  return { success: true, value: attribute.value };
}