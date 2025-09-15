/**
 * Permission Utilities
 * Helper functions for checking user permissions
 */

/**
 * Check if user has WRITE permission
 */
export function hasWritePermission(): boolean {
  const permissions = process.env.PERMISSIONS?.split(';') || [];
  return permissions.includes('WRITE');
}

/**
 * Check if user has READ permission
 */
export function hasReadPermission(): boolean {
  const permissions = process.env.PERMISSIONS?.split(';') || [];
  return permissions.includes('READ');
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission: string): boolean {
  const permissions = process.env.PERMISSIONS?.split(';') || [];
  return permissions.includes(permission);
}

/**
 * Get all available permissions
 */
export function getPermissions(): string[] {
  return process.env.PERMISSIONS?.split(';') || ['READ']; // Default to READ if not specified
}