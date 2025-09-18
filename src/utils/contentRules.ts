/**
 * Content Rules System
 * Handles note type content rules, template validation, and content processing
 */

import type { NoteType, Attribute } from '../modules/noteManager.js';

/**
 * Content rules for different note types and templates
 */
export interface ContentRules {
  allowContent: boolean;
  enforceEmpty: boolean;
  maxContentLength?: number;
  allowedPatterns?: RegExp[];
  requiresHtml: boolean;
  description: string;
  examples: string[];
  errorMessage: string;
}

/**
 * Templates that require empty content (container notes)
 */
const CONTAINER_TEMPLATES = [
  'Board',      // Kanban/task boards
  'Calendar',   // Calendar interfaces
  'Grid View',  // Grid layouts
  'List View',  // List layouts
  'Table',      // Spreadsheet-like tables
  'Geo Map'     // Geographic maps
];

/**
 * Get content rules for a note type (without considering templates)
 */
export function getNoteTypeContentRules(noteType: NoteType): ContentRules {
  switch (noteType) {
    case 'text':
      return {
        allowContent: true,
        enforceEmpty: false,
        requiresHtml: true,
        description: "HTML content required (plain text auto-wrapped in <p> tags)",
        examples: ["<p>Hello world</p>", "<strong>Bold text</strong>"],
        errorMessage: "Text notes require HTML content. Plain text will be automatically wrapped in <p> tags."
      };

    case 'render':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - render notes display HTML content from child notes via ~renderNote relation",
        examples: [""],
        errorMessage: "Render notes must be empty. Create a child code note with type='code' and mime='application/x-html' containing your HTML, then link it with ~renderNote='child-note-title' relation."
      };

    case 'code':
      return {
        allowContent: true,
        enforceEmpty: false,
        requiresHtml: false,
        description: "Plain text only (no HTML tags)",
        examples: ["def fibonacci(n):", "console.log('hello');"],
        errorMessage: "Code notes require plain text only. HTML tags are not allowed."
      };

    case 'mermaid':
      return {
        allowContent: true,
        enforceEmpty: false,
        requiresHtml: false,
        description: "Plain text only (Mermaid diagram syntax)",
        examples: ["graph TD; A-->B", "sequenceDiagram; A->B: Hello"],
        errorMessage: "Mermaid notes require plain text diagram syntax only. HTML tags are not allowed."
      };

    case 'webView':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - use #webViewSrc label for URL",
        examples: [""],
        errorMessage: "WebView notes must be empty. Use the #webViewSrc label to specify the URL (e.g., #webViewSrc='https://example.com')."
      };

    case 'search':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - search queries are configured through the note's search properties",
        examples: [""],
        errorMessage: "Search notes must be empty. Search queries are configured through the note's search properties, not content."
      };

    case 'relationMap':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - relation maps display note relationships visually",
        examples: [""],
        errorMessage: "RelationMap notes must be empty. The visual map is generated automatically from note relationships."
      };

    case 'noteMap':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - note maps display note hierarchies visually",
        examples: [""],
        errorMessage: "NoteMap notes must be empty. The visual map is generated automatically from note hierarchies."
      };

    case 'book':
      return {
        allowContent: false,
        enforceEmpty: true,
        requiresHtml: false,
        description: "Content must be empty - book notes are containers for child notes",
        examples: [""],
        errorMessage: "Book notes must be empty. They are container notes that organize child notes. Add content as child notes instead."
      };

    default:
      return {
        allowContent: true,
        enforceEmpty: false,
        requiresHtml: false,
        description: "Content optional or any format accepted",
        examples: ["", "Any content format"],
        errorMessage: "Invalid content format for this note type."
      };
  }
}

/**
 * Legacy compatibility function
 */
export function getContentRequirements(noteType: NoteType): {
  requiresHtml: boolean;
  description: string;
  examples: string[];
} {
  const rules = getNoteTypeContentRules(noteType);
  return {
    requiresHtml: rules.requiresHtml,
    description: rules.description,
    examples: rules.examples
  };
}

/**
 * Get template-aware content rules for validation
 */
export function getTemplateContentRules(
  noteType: NoteType,
  templateRelation?: string | Attribute
): ContentRules {
  // Get base rules for the note type
  const baseRules = getNoteTypeContentRules(noteType);

  // Extract template value if Attribute object is provided
  const templateValue = typeof templateRelation === 'string'
    ? templateRelation
    : templateRelation?.value;

  // Check if this is a container template that must be empty (overrides base rules)
  if (noteType === 'book' && templateValue && CONTAINER_TEMPLATES.includes(templateValue)) {
    return {
      ...baseRules,
      allowContent: false,
      enforceEmpty: true,
      description: `Container note for ${templateValue} template`,
      examples: [""],
      errorMessage: `${templateValue} template notes must be empty - they are container notes that provide specialized layouts. Add content as child notes instead.`
    };
  }

  // For webView notes, always enforce empty content regardless of template
  if (noteType === 'webView') {
    return {
      ...baseRules,
      allowContent: false,
      enforceEmpty: true
    };
  }

  // Return base rules for all other cases
  return baseRules;
}

/**
 * Extract template relation from attributes array
 */
export function extractTemplateRelation(attributes?: Attribute[]): string | undefined {
  if (!attributes) return undefined;

  const templateAttr = attributes.find(
    attr => attr.type === 'relation' && attr.name === 'template'
  );

  return templateAttr?.value;
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
 * Enhanced with template-aware validation for container notes
 */
export async function validateContentForNoteType(
  content: string,
  noteType: NoteType,
  currentContent?: string,
  templateRelation?: string | Attribute
): Promise<{
  valid: boolean;
  content: string;
  error?: string;
  corrected?: boolean;
}> {
  // Empty content is always valid for most types (except text/code which usually need content)
  if (!content || content.trim() === '') {
    // For container templates, empty is required and valid
    if (templateRelation) {
      const rules = getTemplateContentRules(noteType, templateRelation);
      if (rules.enforceEmpty) {
        return {
          valid: true,
          content: "",
          corrected: false
        };
      }
    }

    // For other types, empty might be valid but we'll let the caller decide
    return {
      valid: true,
      content: "",
      corrected: false
    };
  }

  const textContent = content.trim();

  // Get template-aware content rules
  const rules = getTemplateContentRules(noteType, templateRelation);

  // Check if content is allowed at all
  if (!rules.allowContent) {
    return {
      valid: false,
      content,
      error: rules.errorMessage
    };
  }

  // Check content length restrictions
  if (rules.maxContentLength && textContent.length > rules.maxContentLength) {
    return {
      valid: false,
      content,
      error: `Content too long for ${noteType} note (max ${rules.maxContentLength} characters). ${rules.errorMessage}`
    };
  }

  // Check allowed patterns for restricted content types
  if (rules.allowedPatterns && !rules.allowedPatterns.some(pattern => pattern.test(textContent))) {
    return {
      valid: false,
      content,
      error: `Content format not allowed for ${noteType} note. ${rules.errorMessage}`
    };
  }

  // Type-specific validation
  switch (noteType) {
    case 'text':
    case 'render':
    case 'webView':
      // HTML required for these types
      if (rules.requiresHtml && !isLikelyHtml(textContent)) {
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
      if (rules.requiresHtml === false && isLikelyHtml(textContent)) {
        return {
          valid: false,
          content,
          error: `${noteType} notes require plain text only, but HTML content was detected. ` +
                 `Remove HTML tags and use plain text format. ` +
                 `Expected format: ${rules.examples.join(', ')}`
        };
      }
      break;

  }

  return {
    valid: true,
    content: textContent,
    corrected: false
  };
}