/**
 * Attribute Types Module
 * Shared type definitions for attribute operations
 */

export interface Attribute {
  type: "label" | "relation";
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export interface ReadAttributesParams {
  noteId: string;
}

export interface ManageAttributesParams {
  noteId: string;
  operation: "create" | "update" | "delete" | "batch_create";
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
  operation: "create" | "update" | "delete" | "batch_create";
  attributes: Attribute[];
}