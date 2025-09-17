/**
 * Note Builder Utilities
 * Simplified note creation with automatic content type mapping
 */

import { ContentItem } from '../types/contentTypes.js';
import { SimpleNoteInput, CreateNoteParams, ContentInput } from '../types/noteBuilderTypes.js';
import type { NoteType } from '../modules/noteManager.js';

/**
 * Map note types to appropriate content item types
 */
function getContentTypeForNoteType(noteType: NoteType): ContentItem['type'] {
  return 'text'; // All note types use text content now
}

/**
 * Convert flexible content input to ContentItem array
 */
function normalizeContent(content: ContentInput, noteType: NoteType): ContentItem[] {
  // String content: auto-wrap based on note type
  if (typeof content === 'string') {
    const contentType = getContentTypeForNoteType(noteType);

    
    return [{
      type: contentType,
      content: content
    }];
  }

  // Single ContentItem: wrap in array
  if (!Array.isArray(content)) {
    return [content];
  }

  // ContentItem array: use as-is
  return content;
}

/**
 * Build note parameters with automatic content mapping
 * This is the main factory function that simplifies note creation
 * Handles all note types with automatic content type mapping
 */
export function buildNoteParams(input: SimpleNoteInput): CreateNoteParams {
  const { noteType, content, ...otherParams } = input;

  // Normalize content to ContentItem array
  const contentItems = normalizeContent(content, noteType);

  return {
    ...otherParams,
    type: noteType,
    content: contentItems
  };
}


/**
 * Helper for creating text content items
 * Note: All content items are now text type. File/image support removed for now.
 */
export function buildContentItem(content: string): ContentItem {
  return {
    type: 'text',
    content
  };
}

