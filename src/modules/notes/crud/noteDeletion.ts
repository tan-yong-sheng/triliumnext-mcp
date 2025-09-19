/**
 * Note Deletion Operations
 * Handles note deletion with proper error handling
 */

import { NoteOperation, NoteDeleteResponse } from '../noteManager.js';

/**
 * Handle delete note operation
 */
export async function handleDeleteNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteDeleteResponse> {
  const { noteId } = args;

  if (!noteId) {
    throw new Error("noteId is required for delete operation.");
  }

  await axiosInstance.delete(`/notes/${noteId}`);

  return {
    noteId,
    message: `Deleted note: ${noteId}`
  };
}