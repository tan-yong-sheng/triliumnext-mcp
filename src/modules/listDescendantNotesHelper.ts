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
  
  // Build search query for ALL descendants using Trilium search DSL
  let searchQuery: string;
  
  if (params.parentNoteId) {
    if (params.parentNoteId === "root") {
      // For root, find all notes that have root as an ancestor (all notes in the tree)
      // This includes direct children and all their descendants
      searchQuery = "note.ancestors.noteId = 'root'";
    } else {
      // For specific parent, find all notes that have this parent as an ancestor
      // This includes direct children and all their descendants recursively
      searchQuery = `note.ancestors.noteId = '${params.parentNoteId}'`;
    }
  } else {
    // If no parentNoteId, search all notes in the database
    searchQuery = "note.noteId != ''";
  }
  
  urlParams.append("search", searchQuery);
  
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