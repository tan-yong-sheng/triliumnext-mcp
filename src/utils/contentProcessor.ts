/**
 * Content Processing Utilities
 * Handles string content processing for TriliumNext MCP
 */

import { marked } from 'marked';

/**
 * Process string content into format suitable for ETAPI
 */
export interface ProcessedContent {
  content: string;
  error?: string;
}

/**
 * Process string content into ETAPI-compatible format
 */
export async function processContent(content: string, noteType?: string): Promise<ProcessedContent> {
  try {
    return await processTextContent(content, noteType);
  } catch (error) {
    return {
      content: '',
      error: `Failed to process content: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Process text content (HTML requirements for text notes)
 */
async function processTextContent(content: string, noteType?: string): Promise<ProcessedContent> {
  const trimmedContent = content.trim();

  // Only for text notes: detect Markdown and convert to HTML
  if (noteType === 'text' && isLikelyMarkdown(trimmedContent)) {
    const html = await marked.parse(trimmedContent);
    return { content: html };
  }

  // For text notes: auto-wrap plain text in <p> tags if it's not already HTML
  if (noteType === 'text' && !isLikelyHtml(trimmedContent)) {
    return { content: `<p>${trimmedContent}</p>` };
  }

  // For everything else: pass through exactly as provided
  return { content: trimmedContent };
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
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}


/**
 * Process string content into ETAPI-compatible format
 */
export async function processContentArray(content: string, noteType?: string): Promise<ProcessedContent> {
  if (!content || content.trim() === '') {
    // Return empty content for note types that allow it
    if (noteType && ['book', 'search', 'relationMap', 'noteMap'].includes(noteType)) {
      return { content: '' };
    }

    return {
      content: '',
      error: 'Content is required for this note type'
    };
  }

  // Process content
  const processed = await processContent(content, noteType);

  // Validate content type requirements by note type
  if (noteType) {
    const validation = validateContentForNoteType(processed, noteType);
    if (validation.error) {
      return validation;
    }
  }

  return processed;
}

/**
 * Validate that processed content meets note type requirements
 */
function validateContentForNoteType(processed: ProcessedContent, noteType: string): ProcessedContent {
  const requirements = getContentRequirementsByNoteType(noteType);

  switch (requirements.format) {
    case 'html':
      // Should be HTML content
      if (!processed.content.includes('<')) {
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
    default:
      return { format: 'optional' };
  }
}

/**
 * Validate base64 string format with actual decode test
 */
function isValidBase64(str: string): boolean {
  try {
    // Check basic base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str) || str.length === 0) {
      return false;
    }

    // Test actual decoding
    const buffer = Buffer.from(str, 'base64');
    
    // Verify the decoded content can be re-encoded to the same string
    const reencoded = buffer.toString('base64');
    
    // Allow for slight differences in padding
    const normalizedOriginal = str.replace(/=+$/, '');
    const normalizedReencoded = reencoded.replace(/=+$/, '');
    
    return normalizedOriginal === normalizedReencoded;
  } catch (error) {
    console.error('Base64 validation failed:', error);
    return false;
  }
}


