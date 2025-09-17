import type { NoteType } from '../modules/noteManager.js';

/**
 * Get content requirements for a note type
 */
export function getContentRequirements(noteType: NoteType): {
  requiresHtml: boolean;
  description: string;
  examples: string[];
} {
  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      return {
        requiresHtml: true,
        description: "HTML content required (wrap plain text in <p> tags)",
        examples: ["<p>Hello world</p>", "<strong>Bold text</strong>"]
      };

    case 'code':
    case 'mermaid':
      return {
        requiresHtml: false,
        description: "Plain text only (no HTML tags)",
        examples: ["def fibonacci(n):", "graph TD; A-->B"]
      };

  
    case 'search':
    case 'relationMap':
    case 'book':
    case 'noteMap':
      return {
        requiresHtml: false,
        description: "Content optional or any format accepted",
        examples: ["", "Any content format"]
      };

    default:
      return {
        requiresHtml: false,
        description: "Content optional or any format accepted",
        examples: ["", "Any content format"]
      };
  }
}

/**
 * Check if content is likely HTML
 */
export function isLikelyHtml(content: string): boolean {
  if (!content || content.length < 3) return false;

  const htmlPatterns = [
    /<[a-zA-Z][^>]*>.*<\/[a-zA-Z][^>]*>/, // Complete HTML tags
    /<[a-zA-Z][^>]*\/>/,                   // Self-closing tags
    /<[a-zA-Z][^>]*>/,                      // Opening tags only
    /&[a-zA-Z]+;/,                          // HTML entities
  ];

  return htmlPatterns.some(pattern => pattern.test(content));
}

/**
 * Validate content for note type and auto-correct if possible
 */
export async function validateContentForNoteType(
  content: string,
  noteType: NoteType,
  currentContent?: string
): Promise<{
  valid: boolean;
  content: string;
  error?: string;
  corrected?: boolean;
}> {
  if (!content || content.trim() === '') {
    return {
      valid: false,
      content,
      error: "Content must be a non-empty string"
    };
  }

  const textContent = content.trim();
  const requirements = getContentRequirements(noteType);

  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      // HTML required for text notes
      if (!isLikelyHtml(textContent)) {
        // Auto-wrap plain text in HTML
        const wrappedContent = `<p>${textContent}</p>`;
        return {
          valid: true,
          content: wrappedContent,
          corrected: true
        };
      }
      break;

    case 'code':
    case 'mermaid':
      // Plain text required for code/mermaid notes
      if (isLikelyHtml(textContent)) {
        return {
          valid: false,
          content,
          error: `${noteType} notes require plain text only, but HTML content was detected. ` +
                 `Remove HTML tags and use plain text format. ` +
                 `Expected format: ${requirements.examples.join(', ')}`
        };
      }
      break;

    }

  return { valid: true, content };
}

/**
 * Enhanced NoteGetResponse with hash information
 */
export interface EnhancedNoteGetResponse {
  note: any;
  content?: string;
  contentHash?: string;
  contentRequirements?: ReturnType<typeof getContentRequirements>;
}

/**
 * Enhanced NoteUpdateResponse with hash information
 */
export interface EnhancedNoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  newHash?: string;
  conflict?: boolean;
}