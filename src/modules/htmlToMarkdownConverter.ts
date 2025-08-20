import TurndownService from "turndown";

/**
 * HTML to Markdown Converter Module
 * Provides utilities to convert HTML content to Markdown format for LLM-friendly processing
 */

// Configure TurndownJS with GFM (GitHub Flavored Markdown) support
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # style headings
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
  br: '\n' // GitHub-style: convert <br> tags to single newlines
});

// Add custom rule for GitHub-style line breaks
turndownService.addRule('preserveLineBreaks', {
  filter: 'br',
  replacement: () => '\n'
});

/**
 * Converts HTML content to GitHub Flavored Markdown
 * @param htmlContent - The HTML content to convert
 * @returns Promise<string> - The converted Markdown content
 */
export async function convertHtmlToMarkdown(htmlContent: string): Promise<string> {
  if (!htmlContent || htmlContent.trim() === '') {
    return '';
  }

  try {
    // Use TurndownJS to convert HTML to Markdown
    const markdown = turndownService.turndown(htmlContent);
    
    // Clean up excessive whitespace while preserving intentional line breaks
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
      .trim();
  } catch (error) {
    console.error('HTML to Markdown conversion failed:', error);
    // Fallback: return original content if conversion fails
    return htmlContent;
  }
}

/**
 * Checks if content appears to be HTML (contains HTML tags)
 * @param content - Content to check
 * @returns boolean - True if content appears to be HTML
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  
  // Check for HTML tags - more comprehensive detection
  const htmlTagRegex = /<[a-zA-Z][^>]*>/;
  const htmlEntityRegex = /&[a-zA-Z0-9#]+;/;
  
  return htmlTagRegex.test(content) || htmlEntityRegex.test(content);
}

/**
 * Conditionally converts HTML to Markdown only if the content appears to be HTML
 * Falls back to original content if conversion fails or content isn't HTML
 * @param content - Content that might be HTML, Markdown, or plain text
 * @returns Promise<string> - Markdown if input was HTML, otherwise original content
 */
export async function smartConvertToMarkdown(content: string): Promise<string> {
  if (!isHtmlContent(content)) {
    return content; // Return as-is if not HTML
  }
  
  return await convertHtmlToMarkdown(content);
}