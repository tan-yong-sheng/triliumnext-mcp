/**
 * Note Builder Types
 * Simplified interfaces for easy note creation with string content
 */

import { Attribute } from './contentTypes.js';
import type { NoteType } from '../modules/noteManager.js';

/**
 * Simplified note creation interface
 * Uses string content for simplified API
 */
export interface SimpleNoteInput {
  parentNoteId: string;
  title: string;
  noteType: NoteType;
  content: string;
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
  content: string;
  mime?: string;
  attributes?: Attribute[];
}