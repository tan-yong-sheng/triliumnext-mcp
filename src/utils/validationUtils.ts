/**
 * Validation Utilities
 * Zod-based type validation for MCP tool parameters
 */

import { z } from 'zod';

// Schema definitions for MCP tool parameters
export const searchCriteriaSchema = z.object({
  property: z.string(),
  type: z.enum(['label', 'relation', 'noteProperty']),
  op: z.enum(['exists', 'not_exists', '=', '!=', '>=', '<=', '>', '<', 'contains', 'starts_with', 'ends_with', 'regex']),
  value: z.string().optional(),
  logic: z.enum(['AND', 'OR']).default('AND')
});

export const attributeSchema = z.object({
  type: z.enum(['label', 'relation']),
  name: z.string().min(1, 'Attribute name cannot be empty'),
  value: z.string().optional(),
  position: z.number().min(0, 'Position must be non-negative').default(10),
  isInheritable: z.boolean().default(false)
});

export const manageAttributesSchema = z.object({
  noteId: z.string().min(1, 'Note ID cannot be empty'),
  operation: z.enum(['create', 'update', 'delete', 'batch_create', 'read']),
  attributes: z.array(attributeSchema).optional()
});

export const createNoteSchema = z.object({
  parentNoteId: z.string().min(1, 'Parent note ID cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  type: z.enum(['text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView']),
  content: z.string().optional(),
  mime: z.string().optional(),
  attributes: z.array(attributeSchema).optional(),
  forceCreate: z.boolean().optional()
});

export const searchNotesSchema = z.object({
  text: z.string().optional(),
  searchCriteria: z.array(searchCriteriaSchema).optional(),
  limit: z.number().min(1, 'Limit must be at least 1').optional()
});

export const updateNoteSchema = z.object({
  noteId: z.string().min(1, 'Note ID cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  type: z.enum(['text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView']).optional(),
  content: z.string().optional(),
  mime: z.string().optional(),
  revision: z.boolean().optional(),
  expectedHash: z.string().min(1, 'Expected hash cannot be empty')
}).refine(
  (data) => data.title || data.content,
  {
    message: "Either 'title' or 'content' (or both) must be provided for update operation",
    path: ['title', 'content']
  }
).refine(
  (data) => !data.content || data.type,
  {
    message: "Parameter 'type' is required when updating content",
    path: ['type']
  }
);

// Type exports
export type SearchCriteria = z.infer<typeof searchCriteriaSchema>;
export type Attribute = z.infer<typeof attributeSchema>;
export type ManageAttributesRequest = z.infer<typeof manageAttributesSchema>;
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;
export type SearchNotesRequest = z.infer<typeof searchNotesSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;

/**
 * Validate search criteria parameters
 */
export function validateSearchCriteria(criteria: unknown): SearchCriteria {
  return searchCriteriaSchema.parse(criteria);
}

/**
 * Validate attribute parameters
 */
export function validateAttribute(attribute: unknown): Attribute {
  return attributeSchema.parse(attribute);
}

/**
 * Validate manage attributes request
 */
export function validateManageAttributes(request: unknown): ManageAttributesRequest {
  return manageAttributesSchema.parse(request);
}

/**
 * Validate create note request
 */
export function validateCreateNote(request: unknown): CreateNoteRequest {
  return createNoteSchema.parse(request);
}

/**
 * Validate search notes request
 */
export function validateSearchNotes(request: unknown): SearchNotesRequest {
  return searchNotesSchema.parse(request);
}

/**
 * Validate update note request
 */
export function validateUpdateNote(request: unknown): UpdateNoteRequest {
  return updateNoteSchema.parse(request);
}

/**
 * Safe validation - returns validation result instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate and format error messages for MCP responses
 */
export function createValidationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const errorDetails = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return `Validation failed:\n${errorDetails.map(err =>
      `  ${err.field}: ${err.message}`
    ).join('\n')}`;
  }

  return `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
}

/**
 * Specific validators for common patterns
 */

export function validateNoteType(type: unknown): 'text' | 'code' | 'render' | 'file' | 'image' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView' {
  const validTypes = ['text', 'code', 'render', 'file', 'image', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView'];

  if (typeof type !== 'string' || !validTypes.includes(type)) {
    throw new Error(`Invalid note type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  return type as any;
}

export function validateAttributeType(type: unknown): 'label' | 'relation' {
  if (type !== 'label' && type !== 'relation') {
    throw new Error(`Invalid attribute type: ${type}. Must be 'label' or 'relation'`);
  }
  return type;
}

export function validateOperator(op: unknown): string {
  const validOperators = ['exists', 'not_exists', '=', '!=', '>=', '<=', '>', '<', 'contains', 'starts_with', 'ends_with', 'regex'];

  if (typeof op !== 'string' || !validOperators.includes(op)) {
    throw new Error(`Invalid operator: ${op}. Must be one of: ${validOperators.join(', ')}`);
  }

  return op;
}

/**
 * Template validation helpers
 */
export function validateTemplateRelation(templateName: unknown): string {
  const validTemplates = ['Calendar', 'Board', 'Text Snippet', 'Grid View', 'List View', 'Table', 'Geo Map'];

  if (typeof templateName !== 'string' || !validTemplates.includes(templateName)) {
    throw new Error(`Invalid template: ${templateName}. Must be one of: ${validTemplates.join(', ')}`);
  }

  return templateName;
}

/**
 * Position validation
 */
export function validatePosition(position: unknown): number {
  const pos = Number(position);

  if (isNaN(pos) || pos < 0) {
    throw new Error(`Invalid position: ${position}. Must be a non-negative number`);
  }

  return pos;
}

/**
 * Note ID validation
 */
export function validateNoteId(noteId: unknown): string {
  if (typeof noteId !== 'string' || noteId.trim() === '') {
    throw new Error('Note ID cannot be empty');
  }

  return noteId.trim();
}

/**
 * Title validation
 */
export function validateTitle(title: unknown): string {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error('Title cannot be empty');
  }

  const trimmedTitle = title.trim();

  // Check for reasonable title length (Trilium limits)
  if (trimmedTitle.length > 500) {
    throw new Error('Title is too long. Maximum length is 500 characters');
  }

  return trimmedTitle;
}

/**
 * Logic operator validation
 */
export function validateLogicOperator(logic: unknown): 'AND' | 'OR' {
  if (logic !== 'AND' && logic !== 'OR') {
    throw new Error(`Invalid logic operator: ${logic}. Must be 'AND' or 'OR'`);
  }
  return logic;
}