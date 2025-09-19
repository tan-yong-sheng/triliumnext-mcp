/**
 * Content Validation Operations
 * Handles content type validation and safety for different note types
 */

import { validateContentForNoteType as baseValidateContentForNoteType } from '../../../utils/contentRules.js';
import { NoteType } from '../noteManager.js';

/**
 * Enhanced content validation with template awareness
 */
export async function validateContentForNoteType(
  content: string,
  type: NoteType,
  existingContent?: string,
  templateRelation?: string
): Promise<{ valid: boolean; content: string; error?: string }> {
  return baseValidateContentForNoteType(content, type, existingContent, templateRelation);
}