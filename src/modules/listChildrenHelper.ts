interface ListChildrenParams {
  parentNoteId: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  includeArchivedNotes?: boolean;
}

export function buildListChildrenQuery(params: ListChildrenParams): URLSearchParams {
  // Verbose logging
  const isVerbose = process.env.VERBOSE === "true";
  if (isVerbose) {
    console.error(`[VERBOSE] buildListChildrenQuery input:`, JSON.stringify(params, null, 2));
  }

  // Build URL parameters for ETAPI search
  const urlParams = new URLSearchParams();
  
  // Use a search query that matches all notes
  // Since we need a non-empty search, we use a condition that all notes should satisfy
  // Every note has a noteId, so we search for notes where noteId is not empty
  urlParams.append("search", "note.noteId != ''");
  
  // Use ancestorNoteId and ancestorDepth for listing children
  urlParams.append("ancestorNoteId", params.parentNoteId);
  
  // Use ancestorDepth=eq1 for direct children only
  urlParams.append("ancestorDepth", "eq1");
  
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

  if (isVerbose) {
    console.error(`[VERBOSE] buildListChildrenQuery output - urlParams: "${urlParams.toString()}"`);
  }

  return urlParams;
}