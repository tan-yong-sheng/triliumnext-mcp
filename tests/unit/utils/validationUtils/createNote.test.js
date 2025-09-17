/**
 * Create Note Validation Tests
 * Tests the createNoteSchema validation functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import create note schema and validation functions from build directory
import {
  createNoteSchema,
  attributeSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Create Note Validation', () => {

  describe('Basic Create Note Validation', () => {
    it('should validate correct create note request', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: '<p>This is a test note</p>' }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.title, 'Test Note');
      assert.strictEqual(result.data.type, 'text');
    });

    it('should validate create note with minimal content', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Empty Note',
        type: 'text',
        content: [{ type: 'text', content: '' }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content[0].content, '');
    });

    it('should validate create note with multiple content items', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Multi-content Note',
        type: 'text',
        content: [
          { type: 'text', content: '<p>First section</p>' },
          { type: 'text', content: '<p>Second section</p>' }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content.length, 2);
    });
  });

  describe('Note Type Validation', () => {
    it('should validate all supported note types', () => {
      const validTypes = [
        'text', 'code', 'render', 'search', 'relationMap', 'book',
        'noteMap', 'mermaid', 'webView', 'shortcut', 'doc', 'contentWidget', 'launcher'
      ];

      validTypes.forEach(type => {
        const request = {
          parentNoteId: 'root',
          title: 'Test Note',
          type: type,
          content: [{ type: 'text', content: 'test' }]
        };

        const result = safeValidate(createNoteSchema, request);
        assert.strictEqual(result.success, true, `Note type ${type} should be valid`);
      });
    });

    it('should reject invalid note types', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'invalid_type',
        content: [{ type: 'text', content: '<p>This is a test note</p>' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('type'));
    });

    it('should reject note types that are not in enum', () => {
      const unsupportedTypes = ['canvas', 'widget', 'custom'];

      unsupportedTypes.forEach(type => {
        const request = {
          parentNoteId: 'root',
          title: 'Test Note',
          type: type,
          content: [{ type: 'text', content: 'test' }]
        };

        const result = safeValidate(createNoteSchema, request);
        assert.strictEqual(result.success, false, `Note type ${type} should be invalid`);
      });
    });
  });

  describe('Content Validation', () => {
    it('should validate text content items', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Text Content Note',
        type: 'text',
        content: [{ type: 'text', content: 'Plain text content' }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content[0].type, 'text');
    });

    it('should validate data-url content items', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Data URL Note',
        type: 'text',
        content: [{ type: 'data-url', content: 'data:text/plain;base64,SGVsbG8gV29ybGQ=' }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content[0].type, 'data-url');
    });

    it('should validate content with mimeType', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'MIME Type Note',
        type: 'text',
        content: [
          {
            type: 'text',
            content: 'HTML content',
            mimeType: 'text/html'
          }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content[0].mimeType, 'text/html');
    });

    it('should reject content items with invalid types', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Invalid Content Note',
        type: 'text',
        content: [{ type: 'invalid_type', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate content with complex HTML', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Complex HTML Note',
        type: 'text',
        content: [{
          type: 'text',
          content: '<div><h1>Title</h1><p>Content with <strong>formatting</strong></p></div>'
        }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Parent Note ID Validation', () => {
    it('should validate with standard parent note IDs', () => {
      const validParents = ['root', 'abc123', 'parent_123', 'note-id-456'];

      validParents.forEach(parentId => {
        const request = {
          parentNoteId: parentId,
          title: 'Test Note',
          type: 'text',
          content: [{ type: 'text', content: 'test' }]
        };

        const result = safeValidate(createNoteSchema, request);
        assert.strictEqual(result.success, true, `Parent ID ${parentId} should be valid`);
      });
    });

    it('should reject empty parent note ID', () => {
      const invalidRequest = {
        parentNoteId: '',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Parent note ID cannot be empty'));
    });

    it('should validate with UUID-style parent note ID', () => {
      const validRequest = {
        parentNoteId: '12345678-1234-1234-1234-123456789012',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Title Validation', () => {
    it('should validate with various titles', () => {
      const validTitles = [
        'Simple Title',
        'Title with Numbers 123',
        'Title-with-dashes',
        'Title_with_underscores',
        'Title with special chars: àáâãä',
        'A', // Single character
        'A'.repeat(100) // Long title
      ];

      validTitles.forEach(title => {
        const request = {
          parentNoteId: 'root',
          title: title,
          type: 'text',
          content: [{ type: 'text', content: 'test' }]
        };

        const result = safeValidate(createNoteSchema, request);
        assert.strictEqual(result.success, true, `Title "${title}" should be valid`);
      });
    });

    it('should reject empty title', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: '',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Title cannot be empty'));
    });

    it('should accept whitespace-only title (Zod min(1) allows strings with length > 0)', () => {
      const request = {
        parentNoteId: 'root',
        title: '   ',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, request);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Attributes Integration', () => {
    it('should validate create note with attributes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Project Board',
        type: 'book',
        content: [{ type: 'text', content: '' }],
        attributes: [
          {
            type: 'relation',
            name: 'template',
            value: 'Board',
            position: 10
          }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.attributes.length, 1);
    });

    it('should validate create note with multiple attributes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Complex Note',
        type: 'book',
        content: [{ type: 'text', content: '' }],
        attributes: [
          {
            type: 'relation',
            name: 'template',
            value: 'Board',
            position: 10
          },
          {
            type: 'label',
            name: 'project',
            value: 'api',
            position: 20
          }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 2);
    });

    it('should validate create note with empty attributes array', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Note with Empty Attributes',
        type: 'text',
        content: [{ type: 'text', content: 'test' }],
        attributes: []
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 0);
    });
  });

  describe('Optional Parameters', () => {
    it('should validate create note with forceCreate parameter', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: '<p>Test content</p>' }],
        forceCreate: true
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.forceCreate, true);
    });

    it('should validate create note with forceCreate false', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: '<p>Test content</p>' }],
        forceCreate: false
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.forceCreate, false);
    });

    it('should validate create note with mime type', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'MIME Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }],
        mime: 'text/plain'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.mime, 'text/plain');
    });
  });

  describe('Required Field Validation', () => {
    it('should reject missing required fields', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note'
        // Missing type and content
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('type') || result.error.includes('content'));
    });

    it('should reject request missing parentNoteId', () => {
      const invalidRequest = {
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject request missing title', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject request missing type', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject request missing content', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text'
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Edge Cases', () => {
    it('should validate minimal valid request', () => {
      const minimalRequest = {
        parentNoteId: 'root',
        title: 'A',
        type: 'text',
        content: [{ type: 'text', content: '' }]
      };

      const result = safeValidate(createNoteSchema, minimalRequest);
      assert.strictEqual(result.success, true);
    });

    it('should validate request with all optional fields', () => {
      const completeRequest = {
        parentNoteId: 'root',
        title: 'Complete Note',
        type: 'book',
        content: [{ type: 'text', content: 'Full content' }],
        mime: 'text/html',
        attributes: [
          {
            type: 'label',
            name: 'complete',
            position: 1
          }
        ],
        forceCreate: true
      };

      const result = safeValidate(createNoteSchema, completeRequest);
      assert.strictEqual(result.success, true);
    });

    it('should validate note with special characters in title', () => {
      const specialCharRequest = {
        parentNoteId: 'root',
        title: 'Note with émojis 🎉 and spëciål chäracters',
        type: 'text',
        content: [{ type: 'text', content: 'Special content' }]
      };

      const result = safeValidate(createNoteSchema, specialCharRequest);
      assert.strictEqual(result.success, true);
    });
  });

});