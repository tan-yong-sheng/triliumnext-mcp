/**
 * Type Definitions Module
 * Centralized type exports for all modules
 */

// Note types
export interface NoteOperation {
  parentNoteId: string;
  title: string;
  type: string;
  content?: string;
  mime?: string;
  attributes?: any[];
}

export interface NoteUpdateOperation {
  noteId: string;
  title?: string;
  type?: string;
  mime?: string;
  content?: string;
  expectedHash: string;
  revision?: boolean;
  mode: 'overwrite' | 'append';
}

export interface NoteSearchOperation {
  text?: string;
  searchCriteria?: any[];
  limit?: number;
}

// Attribute types
export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export interface AttributeOperation {
  noteId: string;
  operation: 'create' | 'update' | 'delete' | 'batch_create';
  attributes: Attribute[];
}

export interface ReadAttributesParams {
  noteId: string;
}

export interface ManageAttributesParams {
  noteId: string;
  operation: 'create' | 'update' | 'delete' | 'batch_create';
  attributes: Attribute[];
}

export interface AttributeOperationResult {
  success: boolean;
  message: string;
  attributes?: Attribute[];
  errors?: string[];
  summary?: {
    total: number;
    labels: number;
    relations: number;
    noteId: string;
  };
}

export interface ManageAttributesRequest {
  noteId: string;
  operation: 'create' | 'update' | 'delete' | 'batch_create';
  attributes: Attribute[];
}

// Search types
export interface SearchCriteria {
  property: string;
  type: 'label' | 'relation' | 'noteProperty';
  op?: string;
  value?: string;
  logic?: 'AND' | 'OR';
}

export interface SearchOperation {
  text?: string;
  searchCriteria?: SearchCriteria[];
  limit?: number;
}

// Resolve types
export interface ResolveNoteOperation {
  noteName: string;
  exactMatch?: boolean;
  maxResults?: number;
  autoSelect?: boolean;
}

// Response types
export interface NoteResponse {
  note: any;
  content: string;
  contentHash: string;
  contentRequirements: any;
}

export interface SearchResponse {
  results: any[];
  debugInfo?: string;
  summary?: string;
  complexityAnalysis?: {
    complexity: 'low' | 'medium' | 'high';
    suggestions: string[];
    estimatedPerformance: 'fast' | 'moderate' | 'slow';
  };
}

export interface ResolveResponse {
  selectedNote: any;
  totalMatches: number;
  topMatches: any[];
  nextSteps: string;
}

// Utility types
export interface ContentRequirements {
  requiresHtml: boolean;
  allowsPlain: boolean;
  supportsMarkdown: boolean;
  mustBeEmpty: boolean;
  description: string;
}

export interface TemplateRelation {
  name: string;
  value: string;
  systemNoteId?: string;
}