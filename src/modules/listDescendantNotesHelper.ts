interface ListDescendantNotesParams {
  parentNoteId?: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  includeArchivedNotes?: boolean;
  includeProtectedNotes?: boolean;
}

export function buildListDescendantNotesQuery(params: ListDescendantNotesParams): URLSearchParams {
  // Verbose logging
  const isVerbose = process.env.VERBOSE === "true";
  if (isVerbose) {
    console.error(`[VERBOSE] buildListDescendantNotesQuery input:`, JSON.stringify(params, null, 2));
  }

  // Build URL parameters for ETAPI search
  const urlParams = new URLSearchParams();
  
  // Use a search query that matches all notes
  // Every note has a noteId, so we search for notes where noteId is not empty
  urlParams.append("search", "note.noteId != ''");
  
  // If parentNoteId is provided, search within that subtree
  if (params.parentNoteId) {
    urlParams.append("ancestorNoteId", params.parentNoteId);
  }
  
  // Use fastSearch=false for better metadata
  urlParams.append("fastSearch", "false");
  
  if (params.orderBy) {
    urlParams.append("orderBy", params.orderBy);
    
    // Add orderDirection if provided
    if (params.orderDirection) {
      urlParams.append("orderDirection", params.orderDirection);
    }
  }
  
  if (params.limit) {
    urlParams.append("limit", params.limit.toString());
  }
  
  if (typeof params.includeArchivedNotes === "boolean") {
    urlParams.append("includeArchivedNotes", params.includeArchivedNotes.toString());
  }
  
  // Note: includeProtectedNotes is handled by client-side filtering

  if (isVerbose) {
    console.error(`[VERBOSE] buildListDescendantNotesQuery output - urlParams: "${urlParams.toString()}"`);
  }

  return urlParams;
}