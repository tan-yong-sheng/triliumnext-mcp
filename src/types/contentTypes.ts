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

