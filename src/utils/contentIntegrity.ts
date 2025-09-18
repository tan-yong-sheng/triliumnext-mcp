/**
 * Content Integrity System
 * Handles hash validation, conflict detection, and content integrity checks
 */

import type { NoteType, Attribute } from '../modules/noteManager.js';
import { getContentRequirements } from './contentRules.js';

/**
 * Enhanced NoteGetResponse with hash information
 */
export interface EnhancedNoteGetResponse {
  note: any;
  content?: string;
  contentHash?: string;
  contentRequirements?: ReturnType<typeof getContentRequirements>;
}

/**
 * Enhanced NoteUpdateResponse with hash information
 */
export interface EnhancedNoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  newHash?: string;
  conflict?: boolean;
}

/**
 * HTML detection utility (moved from hashUtils)
 */
export function isLikelyHtml(content: string): boolean {
  if (!content || content.length < 3) return false;

  const htmlPatterns = [
    /<[a-zA-Z][^>]*>.*<\/[a-zA-Z][^>]*>/, // Complete HTML tags
    /<[a-zA-Z][^>]*\/>/,                   // Self-closing tags
    /<[a-zA-Z][^>]*>/,                      // Opening tags only
    /&[a-zA-Z]+;/,                          // HTML entities
  ];

  return htmlPatterns.some(pattern => pattern.test(content));
}

/**
 * Validate content integrity using blobId-based hash validation
 * This function uses Trilium's native blobId for perfect reliability
 */
export async function validateContentIntegrity(
  expectedHash: string | undefined,
  currentNote: any
): Promise<{
  isValid: boolean;
  currentHash?: string;
  error?: string;
}> {
  if (!expectedHash) {
    return {
      isValid: true,
      currentHash: currentNote?.data?.blobId
    };
  }

  const currentBlobId = currentNote?.data?.blobId;

  if (!currentBlobId) {
    return {
      isValid: false,
      currentHash: undefined,
      error: "Current note does not have a blobId"
    };
  }

  if (currentBlobId !== expectedHash) {
    return {
      isValid: false,
      currentHash: currentBlobId,
      error: `CONFLICT: Note has been modified by another user. Current blobId: ${currentBlobId}, expected: ${expectedHash}. Please get the latest note content and retry.`
    };
  }

  return {
    isValid: true,
    currentHash: currentBlobId
  };
}

/**
 * Enhanced getNote response with content requirements
 */
export function createEnhancedGetNoteResponse(
  noteData: any,
  noteContent: string,
  blobId?: string
): EnhancedNoteGetResponse {
  return {
    note: noteData,
    content: noteContent,
    contentHash: blobId,
    contentRequirements: getContentRequirements(noteData.type)
  };
}

/**
 * Enhanced updateNote response with hash information
 */
export function createEnhancedUpdateNoteResponse(
  noteId: string,
  success: boolean,
  blobId?: string,
  revisionCreated: boolean = false,
  conflict: boolean = false
): EnhancedNoteUpdateResponse {
  const message = success
    ? conflict
      ? `Note ${noteId} updated successfully but conflict detected`
      : `Note ${noteId} updated successfully`
    : `Failed to update note ${noteId}`;

  return {
    noteId,
    message,
    revisionCreated,
    newHash: blobId,
    conflict
  };
}

/**
 * Content integrity check for update operations
 * Validates that content matches expected format and type requirements
 */
export async function validateContentForUpdate(
  rawContent: string,
  type: NoteType
): Promise<{
  isValid: boolean;
  processedContent: string;
  error?: string;
  corrected?: boolean;
}> {
  const contentString = rawContent;

  // Basic content validation based on note type
  switch (type) {
    case 'text':
      // For text notes, auto-wrap plain text in HTML if needed
      if (!isLikelyHtml(contentString) && contentString.trim()) {
        return {
          isValid: true,
          processedContent: `<p>${contentString.trim()}</p>`,
          corrected: true
        };
      }
      break;

    case 'code':
    case 'mermaid':
      // For code/mermaid notes, reject HTML content
      if (isLikelyHtml(contentString)) {
        return {
          isValid: false,
          processedContent: contentString,
          error: `${type} notes require plain text only, but HTML content was detected. Remove HTML tags and use plain text format.`
        };
      }
      break;

    case 'render':
    case 'search':
    case 'relationMap':
    case 'noteMap':
    case 'book':
    case 'webView':
      // These note types should not have content
      if (contentString.trim()) {
        return {
          isValid: false,
          processedContent: contentString,
          error: `${type} notes must be empty. Content should be managed through other means (relations, labels, or child notes).`
        };
      }
      break;
  }

  return {
    isValid: true,
    processedContent: contentString.trim(),
    corrected: false
  };
}

/**
 * Check if content modification requires hash validation
 */
export function requiresHashValidation(
  oldContent: string | undefined,
  newContent: string
): boolean {
  // Always require validation if there's existing content
  if (oldContent && oldContent.trim()) {
    return true;
  }

  // For new content, check if it's substantial
  return newContent.trim().length > 0;
}

/**
 * Generate hash validation error message
 */
export function createHashValidationError(
  expectedHash: string,
  actualHash: string,
  noteId: string
): string {
  return `CONFLICT: Note ${noteId} has been modified by another user. Expected blobId: ${expectedHash}, Actual blobId: ${actualHash}. Please get the latest note content and retry.`;
}

/**
 * Safe hash comparison with detailed error reporting
 */
export function compareHashes(
  expected: string | undefined,
  actual: string | undefined,
  noteId: string
): {
  matches: boolean;
  error?: string;
  details: {
    expected: string | undefined;
    actual: string | undefined;
  };
} {
  const details = {
    expected,
    actual
  };

  if (!expected) {
    return {
      matches: true,
      details
    };
  }

  if (!actual) {
    return {
      matches: false,
      error: `Note ${noteId} does not have a blobId for comparison`,
      details
    };
  }

  if (expected !== actual) {
    return {
      matches: false,
      error: createHashValidationError(expected, actual, noteId),
      details
    };
  }

  return {
    matches: true,
    details
  };
}