/**
 * Hash Validation Operations
 * Handles blobId-based hash validation for concurrent modification prevention
 */

import { logVerbose } from '../../../modules/utils/system/verboseUtils.js';

/**
 * Validate blobId hash to prevent concurrent modification conflicts
 */
export function validateBlobIdHash(
  currentBlobId: string,
  expectedHash: string,
  noteId: string
): { valid: boolean; message?: string } {
  if (currentBlobId !== expectedHash) {
    return {
      valid: false,
      message: `CONFLICT: Note has been modified by another user. ` +
               `Current blobId: ${currentBlobId}, expected: ${expectedHash}. ` +
               `Please get the latest note content and retry.`
    };
  }

  logVerbose("validateBlobIdHash", `Hash validation passed for note ${noteId}`, {
    currentBlobId,
    expectedHash
  });

  return { valid: true };
}