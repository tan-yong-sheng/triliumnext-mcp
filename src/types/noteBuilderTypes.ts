/**
 * Note Builder Types
 * Simplified interfaces for easy note creation with automatic content mapping
 */

import { ContentItem, Attribute } from './contentTypes.js';
import type { NoteType } from '../modules/noteManager.js';

/**
 * Flexible content input that handles strings, single items, or arrays
 */
export type ContentInput =
  | string                    // Simple string content (most common)
  | ContentItem              // Single content item (files, URLs)
  | ContentItem[]           // Multiple content items (mixed content)

/**
 * Simplified note creation interface
 * Eliminates the need to manually specify ContentItem types
 */
export interface SimpleNoteInput {
  parentNoteId: string;
  title: string;
  noteType: NoteType;
  content: ContentInput;
  mime?: string;
  attributes?: Attribute[];
}

/**
 * Full note creation parameters (internal use)
 * This is what the existing MCP tools expect
 */
export interface CreateNoteParams {
  parentNoteId: string;
  title: string;
  type: NoteType;
  content: ContentItem[];
  mime?: string;
  attributes?: Attribute[];
}