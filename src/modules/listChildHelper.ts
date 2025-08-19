interface ListChildParams {
  parentNoteId: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  includeArchivedNotes?: boolean;
  includeProtectedNotes?: boolean;
}

export function buildListChildQuery(params: ListChildParams): URLSearchParams {
  // Verbose logging
  const isVerbose = process.env.VERBOSE === "true";
  if (isVerbose) {
    console.error(`[VERBOSE] buildListChildQuery input:`, JSON.stringify(params, null, 2));
  }

  // Build URL parameters for ETAPI search
  const urlParams = new URLSearchParams();
  
  // Build search query for direct children using Trilium search DSL
  let searchQuery: string;
  
  if (params.parentNoteId === "root") {
    // For root, find notes that have root as direct parent
    // This means notes where one of their parents is root (note.parents.noteId = 'root')
    searchQuery = "note.parents.noteId = 'root'";
  } else {
    // For specific parent, find notes that have this parent as direct parent
    searchQuery = `note.parents.noteId = '${params.parentNoteId}'`;
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
  
  // Note: includeProtectedNotes is handled by client-side filtering since ETAPI doesn't have this parameter

  if (isVerbose) {
    console.error(`[VERBOSE] buildListChildQuery output - urlParams: "${urlParams.toString()}"`);
  }

  return urlParams;
}