/**
 * Template name to note ID mapping system for TriliumNext MCP
 *
 * This module provides translation between human-readable template names
 * and their corresponding system note IDs in TriliumNext.
 */

// Built-in template name to note ID mapping
export const TEMPLATE_NAME_TO_ID = {
  'Grid View': '_template_grid_view',
  'Calendar': '_template_calendar',
  'Board': '_template_board',
  'List View': '_template_list_view',
  'Table': '_template_table',
  'Geo Map': '_template_geo_map',
  'Text Snippet': '_template_text_snippet'
};

// Reverse mapping for ID to name resolution
export const TEMPLATE_ID_TO_NAME = Object.fromEntries(
  Object.entries(TEMPLATE_NAME_TO_ID).map(([name, id]) => [id, name])
);

// List of all built-in template names for validation
export const BUILTIN_TEMPLATE_NAMES = Object.keys(TEMPLATE_NAME_TO_ID);

// List of all built-in template IDs for validation
export const BUILTIN_TEMPLATE_IDS = Object.values(TEMPLATE_NAME_TO_ID);

/**
 * Translates a human-readable template name to its system note ID
 * @param templateName - Human-readable template name (e.g., "Grid View")
 * @returns System note ID (e.g., "_template_grid_view")
 */
export function translateTemplateNameToId(templateName: string): string {
  return TEMPLATE_NAME_TO_ID[templateName as keyof typeof TEMPLATE_NAME_TO_ID] || templateName;
}

/**
 * Translates a system note ID back to human-readable template name
 * @param templateId - System note ID (e.g., "_template_grid_view")
 * @returns Human-readable template name (e.g., "Grid View")
 */
export function translateTemplateIdToName(templateId: string): string {
  return TEMPLATE_ID_TO_NAME[templateId] || templateId;
}

/**
 * Checks if a template name is a built-in template
 * @param templateName - Template name to check
 * @returns True if it's a built-in template
 */
export function isBuiltinTemplate(templateName: string): boolean {
  return templateName in TEMPLATE_NAME_TO_ID;
}

/**
 * Checks if a template ID is a built-in template ID
 * @param templateId - Template ID to check
 * @returns True if it's a built-in template ID
 */
export function isBuiltinTemplateId(templateId: string): boolean {
  return templateId in TEMPLATE_ID_TO_NAME;
}

/**
 * Validates and translates a template name for API use
 * @param templateName - Template name to validate and translate
 * @returns Translated template ID ready for API calls
 * @throws Error if template name is invalid
 */
export function validateAndTranslateTemplate(templateName: string): string {
  if (typeof templateName !== 'string' || templateName.trim() === '') {
    throw new Error('Template name cannot be empty');
  }

  // Check if it's a built-in template
  if (isBuiltinTemplate(templateName)) {
    return translateTemplateNameToId(templateName);
  }

  // Check if it's already a valid note ID pattern
  if (isNoteIdPattern(templateName)) {
    return templateName;
  }

  // Not a built-in template and not a note ID - show helpful error
  throw new Error(
    `Invalid template: "${templateName}". Template relations must link to a note ID. ` +
    `For built-in templates, use one of: ${BUILTIN_TEMPLATE_NAMES.join(', ')}. ` +
    `For custom templates, use the note ID (e.g., "abc123"). ` +
    `~template relations should always reference note IDs, not human-readable names.`
  );
}

/**
 * Checks if a string matches Trilium note ID patterns
 * @param value - String to check
 * @returns True if it matches note ID patterns
 */
function isNoteIdPattern(value: string): boolean {
  // Trilium note IDs are typically alphanumeric with underscores, like "_template_grid_view" or "abc123def"
  return /^[a-zA-Z0-9_]+$/.test(value) && value.length > 2;
}

/**
 * Gets a list of available built-in templates for error messages
 * @returns Formatted string listing available templates
 */
export function getAvailableTemplatesMessage(): string {
  return `Available built-in templates: ${BUILTIN_TEMPLATE_NAMES.join(', ')}. ` +
    `Custom templates should use their note ID (e.g., "abc123").`;
}

/**
 * Provides enhanced error message for template relation validation
 * @param templateValue - The template value that failed validation
 * @returns Detailed error message
 */
export function createTemplateRelationError(templateValue: string): string {
  if (typeof templateValue !== 'string' || templateValue.trim() === '') {
    return 'Template relation value cannot be empty';
  }

  if (isBuiltinTemplate(templateValue)) {
    // This shouldn't happen if validation is working correctly
    return `Built-in template "${templateValue}" should have been translated to "${translateTemplateNameToId(templateValue)}"`;
  }

  if (isNoteIdPattern(templateValue)) {
    return `Template note ID "${templateValue}" may not exist. Verify the note ID is correct.`;
  }

  return `Invalid template relation: "${templateValue}". ${getAvailableTemplatesMessage()}`;
}