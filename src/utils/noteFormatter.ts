/**
 * Interface for trimmed note results
 */
export interface TrimmedNote {
  noteId: string;
  title: string;
  type: string;
  mime: string;
  isProtected: boolean;
  dateCreated: string;
  dateModified: string;
  attributes: any[];
}

/**
 * Trims note objects to essential fields for search results
 */
export function trimNoteResults(notes: any[]): TrimmedNote[] {
  return notes.map(note => ({
    noteId: note.noteId,
    title: note.title,
    type: note.type,
    mime: note.mime,
    isProtected: note.isProtected,
    dateCreated: note.dateCreated,
    dateModified: note.dateModified,
    attributes: note.attributes || []
  }));
}

/**
 * Formats a date for ls-like output (e.g., "2024-08-19 14:30")
 */
export function formatDateForListing(dateStr: string | undefined): string {
  if (!dateStr || dateStr === "unknown") {
    return "unknown";
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "invalid-date";
    }
    return date.toISOString().slice(0, 16).replace('T', ' ');
  } catch (e) {
    return "invalid-date";
  }
}

/**
 * Gets type indicator for ls-F style output
 */
export function getTypeIndicator(type: string): string {
  switch (type) {
    case 'book': return '/';
    case 'code': return '*';
    case 'search': return '?';
    default: return '';
  }
}

/**
 * Formats notes for hierarchical search output in ls-like format
 */
export function formatNotesForListing(notes: any[]): string[] {
  return notes.map((note: any) => {
    const title = note.title || "Untitled";
    const noteId = note.noteId || "unknown";
    const type = note.type || "unknown";
    
    const dateCreated = note.dateCreated || note.utcDateCreated || "unknown";
    const formattedDate = formatDateForListing(dateCreated);
    const typeIndicator = getTypeIndicator(type);
    
    return `${formattedDate}  ${title}${typeIndicator} (${noteId})`;
  });
}