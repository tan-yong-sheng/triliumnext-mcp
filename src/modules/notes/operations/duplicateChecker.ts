/**
 * Duplicate Detection Operations
 * Handles detection of duplicate notes in the same directory
 */

import { logVerbose } from '../../shared/index.js';
import { SearchOperation } from '../../search/searchManager.js';

/**
 * Check if a note with the same title already exists in the same directory
 */
export async function checkDuplicateTitleInDirectory(
  parentNoteId: string,
  title: string,
  axiosInstance: any
): Promise<{ found: boolean; duplicateNoteId?: string }> {
  // Search for notes with exact title in the same parent directory
  const searchParams: SearchOperation = {
    searchCriteria: [
      {
        property: "title",
        op: "=",
        value: title,
        logic: "AND"
      },
      {
        property: "parents.noteId",
        op: "=",
        value: parentNoteId,
        logic: "AND"
      }
    ]
  };

  try {
    // Use the search function to find duplicates
    const response = await axiosInstance.get(`/notes?search=note.title%20%3D%20%27${encodeURIComponent(title)}%27%20AND%20note.parents.noteId%20%3D%20%27${encodeURIComponent(parentNoteId)}%27&fastSearch=false&includeArchivedNotes=true`);
    const results = response.data.results || [];

    logVerbose("checkDuplicateTitleInDirectory", `Search for duplicate title "${title}" in parent ${parentNoteId} found ${results.length} results`);

    if (results.length > 0) {
      return { found: true, duplicateNoteId: results[0].noteId };
    }
    return { found: false };
  } catch (error) {
    logVerbose("checkDuplicateTitleInDirectory", `Error checking duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // If search fails, proceed cautiously (don't block creation)
    return { found: false };
  }
}