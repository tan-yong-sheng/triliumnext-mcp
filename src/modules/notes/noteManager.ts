/**
 * Note Management Module - Main Exports
 * Handles CRUD operations for TriliumNext notes
 *
 * This file serves as the main entry point for note operations,
 * aggregating functionality from specialized submodules.
 */

// Export CRUD operations
export { handleCreateNote } from './crud/noteCreation.js';
export { handleUpdateNote } from './crud/noteUpdate.js';
export { handleDeleteNote } from './crud/noteDeletion.js';
export { handleGetNote } from './crud/noteRetrieval.js';

// Export validation operations
export { isContainerTemplateNote, generateContainerTemplateGuidance } from './validation/containerValidator.js';
export { validateContentForNoteType } from './validation/contentValidator.js';
export { validateBlobIdHash } from './validation/hashValidator.js';

// Export specialized operations
export { handleSearchReplaceNote, executeUnifiedSearch } from './operations/searchReplace.js';
export { checkDuplicateTitleInDirectory } from './operations/duplicateChecker.js';

// Export types and interfaces
export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export type NoteType = 'text' | 'code' | 'render' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView';

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  attributes?: Attribute[];
  expectedHash?: string;
  // Search parameters
  searchPattern?: string;
  useRegex?: boolean;
  searchFlags?: string;
  mode?: 'overwrite' | 'append';
  // Search and replace parameters
  replacePattern?: string;
}

export interface NoteCreateResponse {
  noteId?: string;
  message: string;
  duplicateFound?: boolean;
  duplicateNoteId?: string;
  choices?: {
    skip: string;
    updateExisting: string;
  };
  nextSteps?: string;
}

export interface NoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  conflict?: boolean;
}

export interface NoteSearchReplaceResponse {
  noteId: string;
  message: string;
  matchesFound: number;
  replacementsMade: number;
  revisionCreated: boolean;
  conflict?: boolean;
  searchPattern?: string;
  replacePattern?: string;
  useRegex?: boolean;
}

export interface NoteDeleteResponse {
  noteId: string;
  message: string;
}

export interface NoteGetResponse {
  note: any;
  content?: string;
  contentHash?: string;
  contentRequirements?: {
    requiresHtml: boolean;
    description: string;
    examples: string[];
  };
  search?: {
    pattern: string;
    flags: string;
    matches: RegexMatch[];
    totalMatches: number;
    searchMode?: 'html' | 'plain';
    useRegex?: boolean;
  };
}

export interface RegexMatch {
  match: string;
  index: number;
  length: number;
  groups?: string[];
  htmlContext?: {
    contentType: 'html' | 'plain';
    isHtmlContent: boolean;
  };
}