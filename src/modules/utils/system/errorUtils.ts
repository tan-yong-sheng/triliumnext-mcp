/**
 * Error Handling Utilities
 * Centralized error creation and management for consistent error handling
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Create a standardized attribute-related error
 */
export function createAttributeError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Attribute Error: ${message}`,
    context
  );
}

/**
 * Create a standardized note-related error
 */
export function createNoteError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Note Error: ${message}`,
    context
  );
}

/**
 * Create a standardized search-related error
 */
export function createSearchError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Search Error: ${message}`,
    context
  );
}

/**
 * Create a standardized permission-related error
 */
export function createPermissionError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidRequest,
    `Permission Error: ${message}`,
    context
  );
}

/**
 * Create a standardized validation error
 */
export function createValidationError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Validation Error: ${message}`,
    context
  );
}

/**
 * Create a standardized conflict error (for concurrent modifications)
 */
export function createConflictError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Conflict Error: ${message}`,
    context
  );
}

/**
 * Create a standardized container template error
 */
export function createContainerTemplateError(message: string, context?: any): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Container Template Error: ${message}`,
    context
  );
}