/**
 * Note Resolution Module
 * Handles note ID resolution by name/title with template and type awareness
 * Built on top of search functionality but with specialized parameters
 */

import { buildSearchQuery } from "./searchQueryBuilder.js";
import { SearchOperation } from "./searchManager.js";

export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
  autoSelect?: boolean;
  noteType?: string;
  templateHint?: string;
}

export interface ResolveNoteResponse {
  noteId: string | null;
  title: string | null;
  found: boolean;
  matches: number;
  requiresUserChoice?: boolean;
  topMatches?: Array<{
    noteId: string;
    title: string;
    type: string;
    dateModified: string;
  }>;
  nextSteps?: string;
}

/**
 * Handle resolve note ID operation - find note ID by name/title
 * Enhanced with template and type awareness
 */
export async function handleResolveNoteId(
  args: ResolveNoteOperation,
  axiosInstance: any
): Promise<ResolveNoteResponse> {
  const { noteName, exactMatch = false, maxResults = 3, autoSelect = false, noteType, templateHint } = args;

  if (!noteName?.trim()) {
    throw new Error("Note name must be provided");
  }

  // Build enhanced searchCriteria based on hints
  const searchCriteria: any[] = [];

  // Add template-based criteria if templateHint is provided
  if (templateHint) {
    const templateMapping: { [key: string]: string } = {
      "calendar": "_template_calendar",
      "board": "_template_board",
      "text snippet": "_template_text_snippet"
    };

    const templateValue = templateMapping[templateHint.toLowerCase()];
    if (templateValue) {
      searchCriteria.push({
        property: "template.title",
        type: "relation",
        op: "=",
        value: templateValue,
        logic: "OR"
      });
    }
  }

  // Add note type criteria if noteType is provided
  if (noteType) {
    searchCriteria.push({
      property: "type",
      type: "noteProperty",
      op: "=",
      value: noteType,
      logic: "OR"
    });
  }

  // Always add title search as fallback (or primary if no hints)
  searchCriteria.push({
    property: "title",
    type: "noteProperty",
    op: exactMatch ? "=" : "contains",
    value: noteName.trim()
    // No logic needed for last item
  });

  // Build search query from enhanced criteria
  const searchParams: SearchOperation = {
    searchCriteria
  };

  // Search for notes matching the criteria
  const query = buildSearchQuery(searchParams);
  const params = new URLSearchParams();
  params.append("search", query);
  params.append("fastSearch", "false");
  params.append("includeArchivedNotes", "true");

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  let searchResults = response.data.results || [];

  const totalMatches = searchResults.length;

  if (searchResults.length === 0) {
    // Enhanced fallback suggestions when no matches found
    let nextSteps = "No notes found matching the search criteria.";

    if (templateHint || noteType) {
      nextSteps += ` Try basic title search: resolve_note_id(noteName: "${noteName.trim()}")`;
    } else {
      // Primary fallback: suggest broader search using search_notes
      nextSteps += ` Consider using search_notes for broader results: search_notes(text: "${noteName.trim()}") to find notes containing "${noteName.trim()}" in title or content.`;
    }

    return {
      noteId: null,
      title: null,
      found: false,
      matches: 0,
      nextSteps
    };
  }

  // Store original results for top matches
  const originalResults = [...searchResults];

  // Check if user choice is required (multiple matches and autoSelect is false)
  if (totalMatches > 1 && !autoSelect) {
    // Enhanced prioritization for template/type aware searches
    const topMatches = originalResults
      .sort((a: any, b: any) => {
        // First priority: template matches (if templateHint provided)
        if (templateHint) {
          const aHasTemplate = a.attributes?.some((attr: any) =>
            attr.name === 'template' &&
            attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
          );
          const bHasTemplate = b.attributes?.some((attr: any) =>
            attr.name === 'template' &&
            attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
          );
          if (aHasTemplate && !bHasTemplate) return -1;
          if (!aHasTemplate && bHasTemplate) return 1;
        }

        // Second priority: note type matches (if noteType provided)
        if (noteType) {
          if (a.type === noteType && b.type !== noteType) return -1;
          if (a.type !== noteType && b.type === noteType) return 1;
        }

        // Third priority: exact title matches
        const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
        const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Fourth priority: book type (folders)
        if (a.type === 'book' && b.type !== 'book') return -1;
        if (a.type !== 'book' && b.type === 'book') return 1;

        // Final priority: most recent
        return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
      })
      .slice(0, maxResults)
      .map((note: any) => ({
        noteId: note.noteId,
        title: note.title,
        type: note.type,
        dateModified: note.dateModified
      }));

    return {
      noteId: null,
      title: null,
      found: true,
      matches: totalMatches,
      requiresUserChoice: true,
      topMatches
    };
  }

  // Apply enhanced prioritization for selecting the best match
  if (searchResults.length > 1) {
    searchResults.sort((a: any, b: any) => {
      // First priority: template matches (if templateHint provided)
      if (templateHint) {
        const aHasTemplate = a.attributes?.some((attr: any) =>
          attr.name === 'template' &&
          attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
        );
        const bHasTemplate = b.attributes?.some((attr: any) =>
          attr.name === 'template' &&
          attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
        );
        if (aHasTemplate && !bHasTemplate) return -1;
        if (!aHasTemplate && bHasTemplate) return 1;
      }

      // Second priority: note type matches (if noteType provided)
      if (noteType) {
        if (a.type === noteType && b.type !== noteType) return -1;
        if (a.type !== noteType && b.type === noteType) return 1;
      }

      // Third priority: exact title matches (if not exactMatch mode, prefer exact matches)
      if (!exactMatch) {
        const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
        const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }

      // Fourth priority: book type (folders)
      if (a.type === 'book' && b.type !== 'book') return -1;
      if (a.type !== 'book' && b.type === 'book') return 1;

      // Final priority: most recent
      return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
    });
  }

  // Return the first match (or best match if multiple)
  const selectedNote = searchResults[0];

  // Prepare top N matches for display (from original results, with enhanced prioritization)
  const topMatches = originalResults
    .sort((a: any, b: any) => {
      // Enhanced prioritization same as above
      if (templateHint) {
        const aHasTemplate = a.attributes?.some((attr: any) =>
          attr.name === 'template' &&
          attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
        );
        const bHasTemplate = b.attributes?.some((attr: any) =>
          attr.name === 'template' &&
          attr.value.includes(templateHint.toLowerCase().replace(' ', '_'))
        );
        if (aHasTemplate && !bHasTemplate) return -1;
        if (!aHasTemplate && bHasTemplate) return 1;
      }

      if (noteType) {
        if (a.type === noteType && b.type !== noteType) return -1;
        if (a.type !== noteType && b.type === noteType) return 1;
      }

      const aExact = a.title && a.title.toLowerCase() === noteName.toLowerCase();
      const bExact = b.title && b.title.toLowerCase() === noteName.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      if (a.type === 'book' && b.type !== 'book') return -1;
      if (a.type !== 'book' && b.type === 'book') return 1;

      return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
    })
    .slice(0, maxResults)
    .map((note: any) => ({
      noteId: note.noteId,
      title: note.title,
      type: note.type,
      dateModified: note.dateModified
    }));

  return {
    noteId: selectedNote.noteId,
    title: selectedNote.title,
    found: true,
    matches: totalMatches,
    topMatches
  };
}