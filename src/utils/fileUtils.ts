/**
 * File Utilities for TriliumNext MCP
 * Handles file validation, MIME type detection, and file operations
 */

import * as fs from 'fs';
import * as path from 'path';

export const SUPPORTED_MIME_TYPES = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'text/csv': ['csv'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/mp4': ['m4a'],
  'image/jpg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/ico': ['ico'],
  'image/tif': ['tiff'],
  'image/svg+xml': ['svg'],
  'image/gif': ['gif'],
  'video/mp4': ['mp4'],
  'video/x-matroska': ['mkv'],
  'video/quicktime': ['mov'],
  'video/x-msvideo': ['avi'],
  'video/webm': ['webm'],
  'video/x-ms-wmv': ['wmv']
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_MIME_TYPES;
export type FileExtension = string;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface FileStats {
  size: number;
  lastModified: Date;
  exists: boolean;
}

export interface FileDataSource {
  type: 'path' | 'base64' | 'dataUri';
  data: string; // file path or base64 data
  mimeType?: string;
  originalData?: string; // original input for reference
}

export interface ParsedFileData {
  type: 'path' | 'base64' | 'dataUri';
  data: Buffer | string; // Buffer for path, string for base64
  mimeType: string;
  fileName?: string;
  size: number;
}

/**
 * Detect MIME type based on file extension
 */
export function detectMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  for (const [mimeType, extensions] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if ((extensions as readonly string[]).includes(ext.substring(1))) {
      return mimeType;
    }
  }

  throw new Error(`Unsupported file type: ${ext}. Supported types: ${Object.values(SUPPORTED_MIME_TYPES).flat().join(', ')}`);
}

/**
 * Parse file data source (path, base64, or data URI)
 */
export function parseFileDataSource(fileDataSource: string): ParsedFileData {
  const trimmed = fileDataSource.trim();

  // Check if it's a data URI
  if (trimmed.startsWith('data:')) {
    return parseDataUri(trimmed);
  }

  // Check if it looks like base64 (contains only base64 characters and reasonable length)
  if (isBase64String(trimmed)) {
    return parseBase64String(trimmed);
  }

  // Otherwise treat as file path
  return parseFilePath(trimmed);
}

/**
 * Parse data URI format: data:mime/type;base64,data
 */
function parseDataUri(dataUri: string): ParsedFileData {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URI format. Expected: data:mime/type;base64,data');
  }

  const mimeType = match[1];
  const base64Data = match[2];

  // Validate MIME type
  if (!isMimeTypeSupported(mimeType)) {
    throw new Error(`Unsupported MIME type in data URI: ${mimeType}`);
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    return {
      type: 'dataUri',
      data: buffer,
      mimeType,
      size: buffer.length
    };
  } catch (error) {
    throw new Error(`Invalid base64 data in data URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse raw base64 string
 */
function parseBase64String(base64String: string): ParsedFileData {
  // Validate base64 format
  if (!isValidBase64(base64String)) {
    throw new Error('Invalid base64 string format');
  }

  try {
    const buffer = Buffer.from(base64String, 'base64');

    // Try to guess MIME type from content if possible
    const mimeType = detectMimeTypeFromBuffer(buffer) || 'application/octet-stream';

    return {
      type: 'base64',
      data: buffer,
      mimeType,
      size: buffer.length
    };
  } catch (error) {
    throw new Error(`Invalid base64 string: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse file path
 */
function parseFilePath(filePath: string): ParsedFileData {
  const stats = getFileStats(filePath);

  if (!stats.exists) {
    throw new Error(`File not found: ${filePath}`);
  }

  const mimeType = detectMimeType(filePath);
  const fileName = path.basename(filePath);

  return {
    type: 'path',
    data: filePath,
    mimeType,
    fileName,
    size: stats.size
  };
}

/**
 * Check if string looks like base64
 */
function isBase64String(str: string): boolean {
  // Base64 strings are typically longer and contain only base64 characters
  // This is a heuristic check
  return str.length > 20 && /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

/**
 * Validate base64 string format
 */
function isValidBase64(str: string): boolean {
  try {
    Buffer.from(str, 'base64');
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to detect MIME type from buffer content
 */
function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  // Check for common file signatures
  const signatures: { [key: string]: string } = {
    // Documents
    '%PDF-': 'application/pdf',
    // ZIP-based Office documents
    'PK\x03\x04': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    // Images
    '\x89PNG': 'image/png',
    '\xFF\xD8\xFF': 'image/jpeg',
    'GIF87a': 'image/gif',
    'GIF89a': 'image/gif',
    // WebP and RIFF-based formats
    'RIFF': 'image/webp',

    // Audio
    'ID3': 'audio/mpeg',
    'RIFF\x57\x41\x56\x45': 'audio/wav',
    'ftypM4A': 'audio/mp4',

    // Video
    'ftypisom': 'video/mp4',
    'ftypmp42': 'video/mp4',

    // SVG (text-based, check for XML header)
    '<svg': 'image/svg+xml',
    '<?xml': 'image/svg+xml'
  };

  const bufferStr = buffer.toString('binary', 0, Math.min(16, buffer.length));

  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (bufferStr.startsWith(signature)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Validate file exists and is within supported types and size limits
 */
export function validateFile(filePath: string, maxSize: number = 50 * 1024 * 1024): ValidationResult {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File not found' };
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { valid: false, error: 'Path is not a file' };
    }

    // Check file size
    if (stats.size > maxSize) {
      return {
        valid: false,
        error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Check file is not empty
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Detect and validate MIME type
    const mimeType = detectMimeType(filePath);

    return {
      valid: true,
      mimeType,
      fileSize: stats.size
    };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Generate file title from file path (without extension)
 */
export function generateFileTitle(filePath: string): string {
  const fileName = path.basename(filePath);
  const nameWithoutExt = path.parse(fileName).name;

  // Clean up the filename - replace underscores, hyphens with spaces
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim() || 'Untitled File';
}

/**
 * Get comprehensive file statistics
 */
export function getFileStats(filePath: string): FileStats {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      lastModified: stats.mtime,
      exists: stats.isFile()
    };
  } catch {
    return {
      size: 0,
      lastModified: new Date(0),
      exists: false
    };
  }
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filePath: string): ValidationResult {
  try {
    // Resolve the path to handle any relative components
    const resolvedPath = path.resolve(filePath);

    // Basic check for obvious path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      return { valid: false, error: 'Invalid file path: potential path traversal detected' };
    }

    // Additional security checks
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath !== filePath && !filePath.startsWith('/') && !filePath.match(/^[A-Za-z]:/)) {
      return { valid: false, error: 'Invalid file path: path normalization failed' };
    }

    return { valid: true };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid file path'
    };
  }
}

/**
 * Check if MIME type is supported
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  return Object.keys(SUPPORTED_MIME_TYPES).includes(mimeType);
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_MIME_TYPES).flat();
}

/**
 * Get MIME types for a specific category
 */
export function getMimeTypesByCategory(category: 'document' | 'image' | 'audio' | 'video'): string[] {
  const categories = {
    document: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    image: [
      'image/jpg',
      'image/png',
      'image/webp',
      'image/ico',
      'image/tif',
      'image/svg+xml',
      'image/gif'
    ],
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4'
    ],
    video: [
      'video/mp4',
      'video/x-matroska',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-ms-wmv'
    ]
  };

  return categories[category] || [];
}

/**
 * Detect note type from file path or MIME type
 * Returns 'image' for images, 'file' for other supported file types, null for unsupported
 * Includes fallback mechanism for unknown but reasonable MIME types
 */
export function detectNoteTypeFromMime(mimeType: string): 'image' | 'file' | null {
  // Known/supported image types
  const imageMimeTypes = [
    'image/jpg',
    'image/png',
    'image/webp',
    'image/ico',
    'image/tif',
    'image/svg+xml',
    'image/gif'
  ];

  if (imageMimeTypes.includes(mimeType)) {
    return 'image';
  }

  // Known/supported file types
  const supportedFileMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-ms-wmv'
  ];

  if (supportedFileMimeTypes.includes(mimeType)) {
    return 'file';
  }

  // Fallback: Unknown but valid-looking MIME types
  // This provides flexibility for new file types while maintaining basic validation
  if (mimeType.includes('image/')) {
    return 'image';
  }

  if (mimeType.includes('video/') || mimeType.includes('audio/') ||
      mimeType.includes('application/') || mimeType.includes('text/')) {
    return 'file';
  }

  return null; // Truly unsupported or malformed MIME types
}

/**
 * Detect note type from file path extension
 * Returns 'image' for images, 'file' for other supported file types, null for unsupported
 */
export function detectNoteTypeFromPath(filePath: string): 'image' | 'file' | null {
  try {
    const mimeType = detectMimeType(filePath);
    return detectNoteTypeFromMime(mimeType);
  } catch {
    return null;
  }
}