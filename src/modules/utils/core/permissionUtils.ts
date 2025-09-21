/**
 * Permission Utilities
 * Permission checking interface and utilities for MCP server
 */

/**
 * Permission Checker Interface
 * Defines the contract for permission validation across all MCP handlers
 */
export interface PermissionChecker {
  hasPermission(permission: string): boolean;
}

/**
 * Create a permission checker from environment variable
 * @param permissionsString - Semicolon-separated permissions string (e.g., "READ;WRITE")
 * @returns PermissionChecker instance
 */
export function createPermissionChecker(permissionsString: string = 'READ'): PermissionChecker {
  const permissions = permissionsString.split(';').filter(p => p.trim());

  return {
    hasPermission(permission: string): boolean {
      return permissions.includes(permission);
    }
  };
}

/**
 * Default permission types used in the MCP server
 */
export const PERMISSION_TYPES = {
  READ: 'READ',
  WRITE: 'WRITE'
} as const;

/**
 * Permission utility functions for common checks
 */
export const PermissionUtils = {
  /**
   * Check if a permission checker has READ permission
   */
  hasReadPermission(checker: PermissionChecker): boolean {
    return checker.hasPermission(PERMISSION_TYPES.READ);
  },

  /**
   * Check if a permission checker has WRITE permission
   */
  hasWritePermission(checker: PermissionChecker): boolean {
    return checker.hasPermission(PERMISSION_TYPES.WRITE);
  },

  /**
   * Check if a permission checker has both READ and WRITE permissions
   */
  hasFullAccess(checker: PermissionChecker): boolean {
    return PermissionUtils.hasReadPermission(checker) &&
           PermissionUtils.hasWritePermission(checker);
  },

  /**
   * Get available permissions as an array
   */
  getAvailablePermissions(checker: PermissionChecker): string[] {
    const allPermissions = Object.values(PERMISSION_TYPES);
    return allPermissions.filter(permission => checker.hasPermission(permission));
  }
} as const;