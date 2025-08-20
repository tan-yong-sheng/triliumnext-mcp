import { marked } from "marked";

// Configure marked.js for GitHub Flavored Markdown
marked.setOptions({
  breaks: true, // GitHub-style: treat single newlines as hard breaks
  gfm: true     // Enable GitHub Flavored Markdown
});

/**
 * Detects if content is likely Markdown based on common indicators
 */
export function isLikelyMarkdown(content: string): boolean {
  const markdownIndicators = ["#", "*", "-", "`", "[", "]", "(", ")", "_", ">"];
  return markdownIndicators.some(indicator => content.includes(indicator));
}

/**
 * Processes content and converts Markdown to HTML if detected
 */
export async function processContent(content: string): Promise<string> {
  if (!isLikelyMarkdown(content)) {
    return content;
  }

  try {
    return await marked.parse(content);
  } catch (e) {
    console.error("Markdown parsing failed, using original content:", e);
    return content;
  }
}