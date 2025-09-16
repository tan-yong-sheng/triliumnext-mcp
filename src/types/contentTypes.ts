/**
 * Content Type Definitions
 * Core interfaces for content processing
 */

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export interface ContentItem {
  type: 'text' | 'file' | 'image' | 'url' | 'data-url';
  content: string;
  mimeType?: string;
  filename?: string;
  encoding?: 'plain' | 'base64' | 'data-url' | 'url';
  urlOptions?: {
    timeout?: number;
    headers?: Record<string, string>;
    followRedirects?: boolean;
  };
}