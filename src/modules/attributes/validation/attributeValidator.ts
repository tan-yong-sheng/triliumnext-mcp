/**
 * Attribute Validation Operations
 * Handles attribute validation and processing for create/update/delete operations
 */

import {
  validate_attribute,
  check_attribute_exists,
  translate_template_relation,
  generate_attribute_cleaning_message
} from '../../shared/index.js';
import { cleanAttributeName } from '../../shared/index.js';
import { Attribute } from '../../shared/index.js';

/**
 * Enhanced attribute validation with cleaning and template translation
 */
export function validateAndCleanAttribute(attribute: Attribute): {
  valid: boolean;
  cleanedAttribute?: Attribute;
  errors: string[];
  cleaningResult?: any;
} {
  const validation = validate_attribute(attribute);

  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors
    };
  }

  return {
    valid: true,
    cleanedAttribute: validation.cleanedAttribute || attribute,
    errors: [],
    cleaningResult: validation.cleaningResult
  };
}

/**
 * Check if attribute exists and provide detailed information
 */
export async function checkAttributeExistence(
  noteId: string,
  attribute: Attribute,
  axiosInstance: any
): Promise<{
  exists: boolean;
  existingAttribute?: any;
  allAttributes?: any[];
  availableAttributes?: string;
}> {
  const existenceCheck = await check_attribute_exists(noteId, attribute, axiosInstance);

  if (existenceCheck.exists && existenceCheck.existingAttribute) {
    const availableAttrs = existenceCheck.allAttributes?.map((attr: any) => `${attr.type}:${attr.name}`).join(', ') || 'none';

    return {
      exists: true,
      existingAttribute: existenceCheck.existingAttribute,
      allAttributes: existenceCheck.allAttributes,
      availableAttributes: availableAttrs
    };
  }

  return {
    exists: false
  };
}

/**
 * Translate template relation with proper error handling
 */
export function translateTemplateRelation(
  attribute: Attribute
): {
  success: boolean;
  value?: string;
  error?: string;
} {
  try {
    const translation = translate_template_relation(attribute);

    if (!translation.success) {
      return {
        success: false,
        error: translation.error
      };
    }

    return {
      success: true,
      value: translation.value
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Template translation failed'
    };
  }
}

/**
 * Clean attribute name and generate message if needed
 */
export function cleanAttributeNameWithMessage(
  name: string,
  type: 'label' | 'relation'
): {
  cleanedName: string;
  wasCleaned: boolean;
  cleaningMessage?: string;
} {
  const cleaningResult = cleanAttributeName(name, type);

  if (cleaningResult.wasCleaned) {
    return {
      cleanedName: cleaningResult.cleanedName,
      wasCleaned: true,
      cleaningMessage: generate_attribute_cleaning_message(
        { name: cleaningResult.cleanedName, type },
        cleaningResult
      )
    };
  }

  return {
    cleanedName: cleaningResult.cleanedName,
    wasCleaned: false
  };
}