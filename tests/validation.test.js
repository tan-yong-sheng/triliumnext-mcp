/**
 * Validation Tests using Zod
 * Comprehensive data validation for MCP tool parameters
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Schema definitions for MCP tool parameters
const searchCriteriaSchema = z.object({
  property: z.string(),
  type: z.enum(['label', 'relation', 'noteProperty']),
  op: z.enum(['exists', 'not_exists', '=', '!=', '>=', '<=', '>', '<', 'contains', 'starts_with', 'ends_with', 'regex']),
  value: z.string().optional(),
  logic: z.enum(['AND', 'OR']).default('AND')
});

const attributeSchema = z.object({
  type: z.enum(['label', 'relation']),
  name: z.string().min(1),
  value: z.string().optional(),
  position: z.number().min(0).default(10),
  isInheritable: z.boolean().default(false)
});

const manageAttributesSchema = z.object({
  noteId: z.string().min(1),
  operation: z.enum(['create', 'update', 'delete', 'batch_create', 'read']),
  attributes: z.array(attributeSchema).optional()
});

const createNoteSchema = z.object({
  parentNoteId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['text', 'code', 'render', 'file', 'image', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView', 'shortcut', 'doc', 'contentWidget', 'launcher']),
  content: z.string(),
  mime: z.string().optional(),
  attributes: z.array(attributeSchema).optional()
});

const searchNotesSchema = z.object({
  text: z.string().optional(),
  searchCriteria: z.array(searchCriteriaSchema).optional(),
  limit: z.number().min(1).optional()
});

describe('MCP Tool Parameter Validation', () => {

  describe('Search Criteria Validation', () => {
    it('should validate correct search criteria', () => {
      const validCriteria = {
        property: 'template',
        type: 'relation',
        op: 'exists',
        logic: 'AND'
      };

      assert.doesNotThrow(() => searchCriteriaSchema.parse(validCriteria));
    });

    it('should reject invalid search criteria operators', () => {
      const invalidCriteria = {
        property: 'template',
        type: 'relation',
        op: 'invalid_operator'
      };

      assert.throws(() => searchCriteriaSchema.parse(invalidCriteria));
    });

    it('should reject invalid search criteria types', () => {
      const invalidCriteria = {
        property: 'template',
        type: 'invalid_type',
        op: 'exists'
      };

      assert.throws(() => searchCriteriaSchema.parse(invalidCriteria));
    });
  });

  describe('Attribute Validation', () => {
    it('should validate correct attributes', () => {
      const validAttribute = {
        type: 'label',
        name: 'project',
        value: 'api',
        position: 10
      };

      assert.doesNotThrow(() => attributeSchema.parse(validAttribute));
    });

    it('should validate relation attributes with required values', () => {
      const validRelation = {
        type: 'relation',
        name: 'template',
        value: 'Board',
        position: 10
      };

      assert.doesNotThrow(() => attributeSchema.parse(validRelation));
    });

    it('should reject attributes with empty names', () => {
      const invalidAttribute = {
        type: 'label',
        name: '',
        position: 10
      };

      assert.throws(() => attributeSchema.parse(ininvalidAttribute));
    });

    it('should reject invalid attribute types', () => {
      const invalidAttribute = {
        type: 'invalid_type',
        name: 'project',
        position: 10
      };

      assert.throws(() => attributeSchema.parse(invalidAttribute));
    });
  });

  describe('Manage Attributes Validation', () => {
    it('should validate correct manage attributes request', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'project',
            value: 'api',
            position: 10
          },
          {
            type: 'relation',
            name: 'template',
            value: 'Board',
            position: 20
          }
        ]
      };

      assert.doesNotThrow(() => manageAttributesSchema.parse(validRequest));
    });

    it('should validate read operation without attributes', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'read'
      };

      assert.doesNotThrow(() => manageAttributesSchema.parse(validRequest));
    });

    it('should reject invalid operations', () => {
      const invalidRequest = {
        noteId: 'abc123',
        operation: 'invalid_operation'
      };

      assert.throws(() => manageAttributesSchema.parse(invalidRequest));
    });
  });

  describe('Create Note Validation', () => {
    it('should validate correct create note request', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text',
        content: 'This is a test note'
      };

      assert.doesNotThrow(() => createNoteSchema.parse(validRequest));
    });

    it('should validate create note with attributes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Project Board',
        type: 'book',
        content: '',
        attributes: [
          {
            type: 'relation',
            name: 'template',
            value: 'Board',
            position: 10
          }
        ]
      };

      assert.doesNotThrow(() => createNoteSchema.parse(validRequest));
    });

    it('should reject invalid note types', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'invalid_type',
        content: 'This is a test note'
      };

      assert.throws(() => createNoteSchema.parse(invalidRequest));
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note'
        // Missing type and content
      };

      assert.throws(() => createNoteSchema.parse(invalidRequest));
    });
  });

  describe('Search Notes Validation', () => {
    it('should validate correct search notes request', () => {
      const validRequest = {
        text: 'project',
        limit: 10
      };

      assert.doesNotThrow(() => searchNotesSchema.parse(validRequest));
    });

    it('should validate search with search criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: 'exists',
            logic: 'AND'
          }
        ]
      };

      assert.doesNotThrow(() => searchNotesSchema.parse(validRequest));
    });

    it('should reject invalid limit values', () => {
      const invalidRequest = {
        text: 'project',
        limit: 0
      };

      assert.throws(() => searchNotesSchema.parse(invalidRequest));
    });
  });

  describe('Edge Cases and Complex Validation', () => {
    it('should validate complex search criteria with OR logic', () => {
      const complexCriteria = {
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: 'exists',
            logic: 'OR'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'book',
            logic: 'AND'
          }
        ]
      };

      assert.doesNotThrow(() => searchNotesSchema.parse(complexCriteria));
    });

    it('should validate batch attributes with different types', () => {
      const batchRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'language',
            value: 'javascript',
            position: 10
          },
          {
            type: 'label',
            name: 'project',
            value: 'api',
            position: 20
          },
          {
            type: 'relation',
            name: 'template',
            value: 'Grid View',
            position: 30
          }
        ]
      };

      assert.doesNotThrow(() => manageAttributesSchema.parse(batchRequest));
    });

    it('should validate regex operators', () => {
      const regexCriteria = {
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'regex',
            value: '^Project\\s\\d+$',
            logic: 'AND'
          }
        ]
      };

      assert.doesNotThrow(() => searchNotesSchema.parse(regexCriteria));
    });
  });
});

describe('Data Type Validation', () => {

  it('should validate date strings in note properties', () => {
    const dateCriteria = {
      searchCriteria: [
        {
          property: 'dateCreated',
          type: 'noteProperty',
          op: '>=',
          value: '2024-01-01T00:00:00.000Z',
          logic: 'AND'
        }
      ]
    };

    assert.doesNotThrow(() => searchNotesSchema.parse(dateCriteria));
  });

  it('should validate numeric values for count properties', () => {
    const numericCriteria = {
      searchCriteria: [
        {
          property: 'labelCount',
          type: 'noteProperty',
          op: '>',
          value: '5',
          logic: 'AND'
        }
      ]
    };

    assert.doesNotThrow(() => searchNotesSchema.parse(numericCriteria));
  });

  it('should validate boolean values for boolean properties', () => {
    const booleanCriteria = {
      searchCriteria: [
        {
          property: 'isArchived',
          type: 'noteProperty',
          op: '=',
          value: 'false',
          logic: 'AND'
        }
      ]
    };

    assert.doesNotThrow(() => searchNotesSchema.parse(booleanCriteria));
  });
});

describe('Error Message Validation', () => {

  it('should provide clear error messages for missing required fields', () => {
    const invalidRequest = {
      parentNoteId: 'root'
      // Missing title, type, content
    };

    try {
      createNoteSchema.parse(invalidRequest);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('title'));
      assert.ok(error.message.includes('Required'));
    }
  });

  it('should provide clear error messages for invalid enum values', () => {
    const invalidRequest = {
      parentNoteId: 'root',
      title: 'Test Note',
      type: 'invalid_type',
      content: 'Test content'
    };

    try {
      createNoteSchema.parse(invalidRequest);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('type'));
      assert.ok(error.message.includes('invalid'));
    }
  });
});