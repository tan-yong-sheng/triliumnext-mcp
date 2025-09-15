/**
 * Content Processing Utilities
 * Handles ContentItem[] array processing for TriliumNext MCP
 */

import { marked } from 'marked';
import { ContentItem } from '../types/contentTypes.js';

/**
 * Process ContentItem[] array into format suitable for ETAPI
 */
export interface ProcessedContent {
  content: string;
  mimeType?: string;
  filename?: string;
  error?: string;
}

/**
 * Process a single ContentItem into ETAPI-compatible format
 */
export async function processContentItem(item: ContentItem, noteType?: string): Promise<ProcessedContent> {
  try {
    switch (item.type) {
      case 'text':
        return await processTextContent(item, noteType);

      case 'file':
        return processFileContent(item);

      case 'image':
        return processImageContent(item);

      case 'url':
        return processUrlContent(item);

      case 'data-url':
        return processDataUrlContent(item);

      default:
        return {
          content: '',
          error: `Unsupported content type: ${(item as any).type}`
        };
    }
  } catch (error) {
    return {
      content: '',
      error: `Failed to process content item: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Process text content (Markdown conversion only for text notes)
 */
async function processTextContent(item: ContentItem, noteType?: string): Promise<ProcessedContent> {
  const content = item.content.trim();

  // Only for text notes: detect Markdown and convert to HTML
  if (noteType === 'text' && isLikelyMarkdown(content)) {
    const html = await marked.parse(content);
    return { content: html };
  }

  // For everything else: pass through exactly as provided
  return { content: content };
}

/**
 * Check if content is likely HTML (definitive detection)
 */
function isLikelyHtml(content: string): boolean {
  // Check for HTML tags (more definitive)
  const htmlTagPattern = /<[a-zA-Z][^>]*>.*<\/[a-zA-Z][^>]*>|<[a-zA-Z][^>]*\/>/;
  const selfClosingTagPattern = /<[a-zA-Z][^>]*\/>/;
  const openTagPattern = /<[a-zA-Z][^>]*>/;

  // More specific HTML patterns
  const specificPatterns = [
    /<[hH][1-6][^>]*>.*<\/[hH][1-6][^>]*>/, // Headers
    /<[pP][^>]*>.*<\/[pP][^>]*>/, // Paragraphs
    /<[dD][iI][vV][^>]*>.*<\/[dD][iI][vV][^>]*>/, // Divs
    /<[sS][pP][aA][nN][^>]*>.*<\/[sS][pP][aA][nN][^>]*>/, // Spans
    /<[aA][^>]*href=.*>.*<\/[aA]>/, // Links
    /<[iI][mM][gG][^>]*src=.*>/, // Images
    /<[bB][rR][^>]*>/, // Line breaks
    /<[hH][rR][^>]*>/, // Horizontal rules
    /<[uU][lL][^>]*>.*<\/[uU][lL]>/, // Unordered lists
    /<[oO][lL][^>]*>.*<\/[oO][lL]>/, // Ordered lists
    /<[tT][aA][bB][lL][eE][^>]*>.*<\/[tT][aA][bB][lL][eE]>/, // Tables
    /<[tT][rR][^>]*>.*<\/[tT][rR]>/, // Table rows
    /<[tT][dD][^>]*>.*<\/[tT][dD]>/, // Table cells
  ];

  // Check for any HTML patterns
  return htmlTagPattern.test(content) ||
         selfClosingTagPattern.test(content) ||
         openTagPattern.test(content) ||
         specificPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if content is likely Markdown (high confidence detection)
 */
function isLikelyMarkdown(content: string): boolean {
  // Skip empty content
  if (!content || content.length < 2) return false;

  const markdownPatterns = [
    // Headers
    /^#{1,6}\s+.+/m,
    // Bold/italic
    /\*\*.*?\*\*/,
    /\*.*?\*/,
    /__.*?__/,
    /_.*?_/,
    // Links
    /\[.*?\]\(.*?\)/,
    // Images
    /!\[.*?\]\(.*?\)/,
    // Code blocks
    /```[\s\S]*?```/,
    /`.*?`/,
    // Unordered lists
    /^[\s]*[-*+]\s+/m,
    /^[\s]*\d+\.\s+/m, // Ordered lists
    // Blockquotes
    /^>\s+/m,
    // Horizontal rules
    /^[-*_]{3,}\s*$/m,
    // Task lists
    /^[\s]*[-*+]\s+\[[xX]\]\s+/m,
  ];

  // Need at least 2 markdown patterns to avoid false positives
  const matchCount = markdownPatterns.filter(pattern => pattern.test(content)).length;
  return matchCount >= 1; // At least 1 markdown pattern
}

/**
 * Process file content (base64 encoded)
 */
function processFileContent(item: ContentItem): ProcessedContent {
  if (!item.content) {
    return {
      content: '',
      error: 'File content is required'
    };
  }

  // Validate base64 format
  if (!isValidBase64(item.content)) {
    return {
      content: '',
      error: 'File content must be base64 encoded'
    };
  }

  // Determine MIME type if not provided
  const mimeType = item.mimeType || detectMimeTypeFromFilename(item.filename);

  return {
    content: item.content,
    mimeType,
    filename: item.filename || 'file'
  };
}

/**
 * Process image content (base64 encoded)
 */
function processImageContent(item: ContentItem): ProcessedContent {
  if (!item.content) {
    return {
      content: '',
      error: 'Image content is required'
    };
  }

  // Validate base64 format
  if (!isValidBase64(item.content)) {
    return {
      content: '',
      error: 'Image content must be base64 encoded'
    };
  }

  // Determine MIME type if not provided
  const mimeType = item.mimeType || detectMimeTypeFromFilename(item.filename) || 'image/png';

  // Validate it's an image MIME type
  if (!mimeType.startsWith('image/')) {
    return {
      content: '',
      error: `Invalid image MIME type: ${mimeType}`
    };
  }

  return {
    content: item.content,
    mimeType,
    filename: item.filename || 'image'
  };
}

/**
 * Process URL content (placeholder for future implementation)
 */
function processUrlContent(item: ContentItem): ProcessedContent {
  // For now, return URL as text content
  // Future implementation would fetch the URL content
  return {
    content: `<p>Remote URL: <a href="${item.content}">${item.content}</a></p>`
  };
}

/**
 * Process data URL content
 */
function processDataUrlContent(item: ContentItem): ProcessedContent {
  if (!item.content.startsWith('data:')) {
    return {
      content: '',
      error: 'Data URL must start with "data:"'
    };
  }

  try {
    // Extract MIME type and base64 data
    const [header, base64Data] = item.content.split(',');
    const mimeType = header.split(';')[0].replace('data:', '');

    // For data URLs, convert to img tag or appropriate format
    if (mimeType.startsWith('image/')) {
      return {
        content: `<img src="${item.content}" alt="${item.filename || 'image'}" />`
      };
    } else {
      // For other data types, provide a download link
      return {
        content: `<p><a href="${item.content}" download="${item.filename || 'file'}">Download ${item.filename || 'file'}</a></p>`
      };
    }
  } catch (error) {
    return {
      content: '',
      error: `Invalid data URL format: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Process ContentItem[] array into single content string
 */
export async function processContentArray(contentItems: ContentItem[], noteType?: string): Promise<ProcessedContent> {
  if (!contentItems || contentItems.length === 0) {
    // Return empty content for note types that allow it
    if (noteType && ['book', 'search', 'relationMap', 'shortcut', 'doc', 'contentWidget', 'launcher'].includes(noteType)) {
      return { content: '' };
    }

    return {
      content: '',
      error: 'Content is required for this note type'
    };
  }

  // For now, process only the first item (ETAPI limitation)
  // Future enhancement would support mixed content
  const firstItem = contentItems[0];
  const processed = await processContentItem(firstItem, noteType);

  // Validate content type requirements by note type
  if (noteType) {
    const validation = validateContentForNoteType(processed, noteType, firstItem.type);
    if (validation.error) {
      return validation;
    }
  }

  return processed;
}

/**
 * Validate that processed content meets note type requirements
 */
function validateContentForNoteType(processed: ProcessedContent, noteType: string, contentType: string): ProcessedContent {
  const requirements = getContentRequirementsByNoteType(noteType);

  switch (requirements.format) {
    case 'html':
      // Should be HTML content
      if (contentType === 'text' && !processed.content.includes('<')) {
        return {
          content: processed.content,
          error: `Note type '${noteType}' requires HTML content. Found plain text.`
        };
      }
      break;

    case 'plain':
      // No validation needed - content passes through as-is
      // Code notes may contain <, > operators which are not HTML
      break;

    case 'base64':
      // Should be base64 encoded
      if (!isValidBase64(processed.content)) {
        return {
          content: processed.content,
          error: `Note type '${noteType}' requires base64 encoded content.`
        };
      }
      break;
  }

  return processed;
}

/**
 * Get content requirements for a note type
 */
function getContentRequirementsByNoteType(noteType: string): { format: 'html' | 'plain' | 'base64' | 'optional' } {
  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      return { format: 'html' };

    case 'code':
    case 'mermaid':
      return { format: 'plain' };

    case 'file':
    case 'image':
      return { format: 'base64' };

    case 'search':
    case 'relationMap':
    case 'book':
    case 'noteMap':
    case 'shortcut':
    case 'doc':
    case 'contentWidget':
    case 'launcher':
    default:
      return { format: 'optional' };
  }
}

/**
 * Validate base64 string format
 */
function isValidBase64(str: string): boolean {
  try {
    // Basic validation - should be base64 encoded
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str) && str.length > 0;
  } catch {
    return false;
  }
}

/**
 * Detect MIME type from filename
 */
function detectMimeTypeFromFilename(filename?: string): string | undefined {
  if (!filename) return undefined;

  const ext = filename.toLowerCase().split('.').pop();
  // ext could be undefined when there's no file extension
  if (!ext) return undefined;

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };

  return mimeTypes[ext];
}

/**
 * Backward compatibility: Convert string content to ContentItem[]
 */
export function stringToContentItem(content: string, noteType?: string): ContentItem[] {
  if (typeof content !== 'string') {
    return [];
  }

  let contentType: ContentItem['type'] = 'text';

  // Determine content type based on note type
  if (noteType === 'file' || noteType === 'image') {
    contentType = noteType as 'file' | 'image';
  }

  return [{
    type: contentType,
    content: content
  }];
}