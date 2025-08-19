/**
 * Checks if verbose logging is enabled via environment variable
 */
export function isVerboseMode(): boolean {
  return process.env.VERBOSE === "true";
}

/**
 * Creates debug information for search queries
 */
export function createSearchDebugInfo(query: string, inputParams: any): string {
  if (!isVerboseMode()) {
    return "";
  }
  
  return `\n--- Query Debug ---\nBuilt Query: ${query}\nInput Params: ${JSON.stringify(inputParams, null, 2)}\n--- End Debug ---\n\n`;
}

/**
 * Creates debug information for list children operations
 */
export function createListChildrenDebugInfo(parentNoteId: string, urlParams: URLSearchParams, resultCount: number): string {
  if (!isVerboseMode()) {
    return "";
  }
  
  return `--- List Children Debug ---\nParent Note ID: ${parentNoteId}\nURL Params: ${urlParams.toString()}\nRaw Result Count: ${resultCount}\n--- End Debug ---\n\n`;
}

/**
 * Creates a summary line for list operations
 */
export function createListSummary(count: number): string {
  return `\nTotal: ${count} note${count !== 1 ? 's' : ''}`;
}