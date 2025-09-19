/**
 * Tool Definition Module
 * Centralized tool schema definitions based on permissions
 */

import { PermissionChecker } from '../shared/index.js';
import { createWriteTools } from './definitions/writeTools.js';
import { createReadTools } from './definitions/readTools.js';
import { createReadAttributeTools, createWriteAttributeTools } from './definitions/attributeTools.js';

/**
 * Generate all tools based on permissions
 */
export function generateTools(permissionChecker: PermissionChecker): any[] {
  const tools: any[] = [];

  // Add write tools if WRITE permission
  if (permissionChecker.hasPermission("WRITE")) {
    tools.push(...createWriteTools());
  }

  // Add read tools if READ permission
  if (permissionChecker.hasPermission("READ")) {
    tools.push(...createReadTools());
  }

  // Add read attribute tools if READ permission
  if (permissionChecker.hasPermission("READ")) {
    tools.push(...createReadAttributeTools());
  }

  // Add write attribute tools if WRITE permission
  if (permissionChecker.hasPermission("WRITE")) {
    tools.push(...createWriteAttributeTools());
  }

  return tools;
}

// Export individual tool generators for flexibility
export {
  createWriteTools,
  createReadTools,
  createReadAttributeTools,
  createWriteAttributeTools
};