/**
 * Note Builder Utilities
 * Simplified note creation with string content
 */

import { SimpleNoteInput, CreateNoteParams } from '../../types/index.js';
import type { NoteType } from '../../notes/noteManager.js';

/**
 * Build note parameters with string content
 * This is the main factory function that simplifies note creation
 * Handles all note types with string content
 */
export function buildNoteParams(input: SimpleNoteInput): CreateNoteParams {
  const { noteType, content, ...otherParams } = input;

  return {
    ...otherParams,
    type: noteType,
    content: content
  };
}

