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
 * Creates a summary line for list operations
 */
export function createListSummary(count: number): string {
  return `\nTotal: ${count} note${count !== 1 ? 's' : ''}`;
}

/**
 * Logs verbose message with consistent formatting
 */
export function logVerbose(category: string, message: string, data?: any): void {
  if (!isVerboseMode()) {
    return;
  }

  if (data !== undefined) {
    console.error(`[VERBOSE] ${category}: ${message}`, data);
  } else {
    console.error(`[VERBOSE] ${category}: ${message}`);
  }
}

/**
 * Logs verbose input parameters with consistent formatting
 */
export function logVerboseInput(functionName: string, params: any): void {
  logVerbose(functionName, "input", params);
}

/**
 * Logs verbose output/results with consistent formatting
 */
export function logVerboseOutput(functionName: string, result: any): void {
  logVerbose(functionName, "output", result);
}

/**
 * Logs verbose API request details with consistent formatting
 */
export function logVerboseApi(method: string, url: string, data?: any): void {
  if (!isVerboseMode()) {
    return;
  }

  const logMessage = `${method} ${url}`;
  if (data !== undefined) {
    console.error(`[VERBOSE] API Request: ${logMessage}`, data);
  } else {
    console.error(`[VERBOSE] API Request: ${logMessage}`);
  }
}

/**
 * Logs verbose error details with consistent formatting
 */
export function logVerboseError(context: string, error: any): void {
  if (!isVerboseMode()) {
    return;
  }

  console.error(`[VERBOSE] Error in ${context}:`, error);
}

/**
 * Logs verbose axios error details with consistent formatting
 */
export function logVerboseAxiosError(context: string, error: any): void {
  if (!isVerboseMode() || !error.isAxiosError) {
    return;
  }

  console.error(`[VERBOSE] Axios Error in ${context}:`, {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    config: {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data
    }
  });
}

/**
 * Logs verbose transformation/processing details with consistent formatting
 */
export function logVerboseTransform(category: string, from: string, to: string, reason?: string): void {
  if (!isVerboseMode()) {
    return;
  }

  const message = reason
    ? `${from} → ${to} (${reason})`
    : `${from} → ${to}`;

  console.error(`[VERBOSE] Transform ${category}: ${message}`);
}