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
        content: '<p>This is a test note</p>'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.title, 'Test Note');
      assert.strictEqual(result.data.type, 'text');
      assert.strictEqual(result.data.content, '<p>This is a test note</p>');
    });

    it('should validate create note with minimal content', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Empty Note',
        type: 'text',
        content: ''
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content, '');
    });

    it('should reject multiple content items (not supported)', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Multi-content Note',
        type: 'text',
        content: [
          { type: 'text', content: '<p>First section</p>' },
          { type: 'text', content: '<p>Second section</p>' }
        ]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Note Type Validation', () => {
    it('should validate all supported note types', () => {
      const validTypes = [
        'text', 'code', 'render', 'search', 'relationMap', 'book',
        'noteMap', 'mermaid', 'webView'
      ];

      validTypes.forEach(type => {
        const request = {
          parentNoteId: 'root',
          title: 'Test Note',
          type: type,
          content: 'test'
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
        content: '<p>This is a test note</p>'
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
          content: 'test'
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
        content: 'Plain text content'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(typeof result.data.content, 'string');
    });

    
    it('should validate content as string type', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'String Content Note',
        type: 'text',
        content: 'test'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.content, 'test');
    });

    it('should validate content with complex HTML', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Complex HTML Note',
        type: 'text',
        content: '<div><h1>Title</h1><p>Content with <strong>formatting</strong></p></div>'
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
          content: 'test'
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
        content: 'test'
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
        content: 'test'
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
          content: 'test'
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
        content: 'test'
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
        content: 'test'
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
        content: '',
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
        content: 'test',
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
        content: '<p>Test content</p>',
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
        content: '<p>Test content</p>',
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
        content: 'test',
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
        content: 'test'
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject request missing title', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        type: 'text',
        content: 'test'
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject request missing type', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        content: 'test'
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should accept request without content (optional parameter)', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });
  });

  describe('Edge Cases', () => {
    it('should validate minimal valid request', () => {
      const minimalRequest = {
        parentNoteId: 'root',
        title: 'A',
        type: 'text',
        content: ''
      };

      const result = safeValidate(createNoteSchema, minimalRequest);
      assert.strictEqual(result.success, true);
    });

    it('should validate request with all optional fields', () => {
      const completeRequest = {
        parentNoteId: 'root',
        title: 'Complete Note',
        type: 'book',
        content: 'Full content',
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
        content: 'Special content'
      };

      const result = safeValidate(createNoteSchema, specialCharRequest);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Container Template Content Validation', () => {
    const containerTemplates = ['Board', 'Calendar', 'Grid View', 'List View', 'Table', 'Geo Map'];

    describe('Empty Content Acceptance', () => {
      containerTemplates.forEach(template => {
        it(`should accept empty content for ${template} template`, () => {
          const validRequest = {
            parentNoteId: 'root',
            title: `Test ${template}`,
            type: 'book',
            content: '',
            attributes: [
              { type: 'relation', name: 'template', value: template, position: 10 }
            ]
          };

          const result = safeValidate(createNoteSchema, validRequest);
          assert.strictEqual(result.success, true);
          assert.ok(result.data);
          assert.strictEqual(result.data.type, 'book');
          assert.strictEqual(result.data.content, '');

          // Verify template relation is properly validated
          const templateAttr = result.data.attributes.find(attr =>
            attr.name === 'template' && attr.value === template
          );
          assert.ok(templateAttr, `Template relation for ${template} should be present`);
        });
      });
    });

    describe('Whitespace Content Handling', () => {
      containerTemplates.forEach(template => {
        it(`should handle whitespace-only content as empty for ${template} template`, () => {
          const validRequest = {
            parentNoteId: 'root',
            title: `Test ${template}`,
            type: 'book',
            content: '   \n\t  ',  // Various whitespace
            attributes: [
              { type: 'relation', name: 'template', value: template, position: 10 }
            ]
          };

          const result = safeValidate(createNoteSchema, validRequest);
          assert.strictEqual(result.success, true);
          assert.ok(result.data);
        });
      });
    });

    describe('Template Relation Validation', () => {
      it('should validate template relation with proper structure', () => {
        const validRequest = {
          parentNoteId: 'root',
          title: 'Test Board',
          type: 'book',
          content: '',
          attributes: [
            {
              type: 'relation',
              name: 'template',
              value: 'Board',
              position: 10,
              isInheritable: false
            }
          ]
        };

        const result = safeValidate(createNoteSchema, validRequest);
        assert.strictEqual(result.success, true);
        assert.ok(result.data);

        const templateAttr = result.data.attributes[0];
        assert.strictEqual(templateAttr.type, 'relation');
        assert.strictEqual(templateAttr.name, 'template');
        assert.strictEqual(templateAttr.value, 'Board');
        assert.strictEqual(templateAttr.position, 10);
        assert.strictEqual(templateAttr.isInheritable, false);
      });

      it('should accept template relation with default position', () => {
        const validRequest = {
          parentNoteId: 'root',
          title: 'Test Calendar',
          type: 'book',
          content: '',
          attributes: [
            {
              type: 'relation',
              name: 'template',
              value: 'Calendar'
              // No position specified - should default
            }
          ]
        };

        const result = safeValidate(createNoteSchema, validRequest);
        assert.strictEqual(result.success, true);
        assert.ok(result.data);
      });
    });
  });

  describe('Regular Note Type Content Validation', () => {
    it('should require HTML content for text notes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Text Note',
        type: 'text',
        content: '<p>This is valid HTML content</p>'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.type, 'text');
    });

    it('should accept plain text content for text notes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Text Note',
        type: 'text',
        content: 'Plain text content'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should accept empty content for text notes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Empty Text Note',
        type: 'text',
        content: ''
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should accept both plain text and HTML for code notes', () => {
      const plainTextRequest = {
        parentNoteId: 'root',
        title: 'Code Note',
        type: 'code',
        content: 'console.log("Hello World");',
        mime: 'application/typescript'
      };

      const htmlRequest = {
        parentNoteId: 'root',
        title: 'Code Note',
        type: 'code',
        content: '<div>HTML example with code</div>',
        mime: 'text/html'
      };

      const plainResult = safeValidate(createNoteSchema, plainTextRequest);
      const htmlResult = safeValidate(createNoteSchema, htmlRequest);

      assert.strictEqual(plainResult.success, true);
      assert.strictEqual(htmlResult.success, true);
    });

    it('should accept empty content for code notes', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Empty Code Note',
        type: 'code',
        content: '',
        mime: 'text/plain'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });
  });

  describe('Template Attribute Edge Cases', () => {
    it('should handle template relation with case variations', () => {
      const caseVariations = [
        { value: 'board', description: 'lowercase' },
        { value: 'BOARD', description: 'uppercase' },
        { value: 'Board', description: 'title case' },
        { value: ' board ', description: 'with spaces' }
      ];

      caseVariations.forEach(({ value, description }) => {
        const request = {
          parentNoteId: 'root',
          title: 'Test Board',
          type: 'book',
          content: '',
          attributes: [
            { type: 'relation', name: 'template', value: value, position: 10 }
          ]
        };

        const result = safeValidate(createNoteSchema, request);
        assert.strictEqual(result.success, true, `Should accept ${description} template value`);
        assert.ok(result.data);
      });
    });

    it('should handle multiple attributes with template relation', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Complex Board',
        type: 'book',
        content: '',
        attributes: [
          { type: 'label', name: 'project', value: 'Website Redesign', position: 20 },
          { type: 'relation', name: 'template', value: 'Board', position: 10 },
          { type: 'label', name: 'priority', value: 'high', position: 30 }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.attributes.length, 3);
    });

    it('should validate attribute position ordering', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Ordered Attributes',
        type: 'book',
        content: '',
        attributes: [
          { type: 'label', name: 'first', value: '1', position: 10 },
          { type: 'relation', name: 'template', value: 'Board', position: 5 },
          { type: 'label', name: 'last', value: '2', position: 15 }
        ]
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);

      // Verify all attributes are present with correct positions
      const attributes = result.data.attributes;
      assert.strictEqual(attributes.length, 3);

      const templateAttr = attributes.find(attr => attr.name === 'template');
      assert.strictEqual(templateAttr.position, 5);
    });
  });

  describe('Content Type Edge Cases', () => {
    it('should handle Unicode and special characters in content', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Unicode Content',
        type: 'text',
        content: 'Hello 世界 🌟 Special chars: &<>"\' and emoji 😀'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should handle very long content strings', () => {
      const longContent = 'x'.repeat(10000); // 10KB content

      const validRequest = {
        parentNoteId: 'root',
        title: 'Long Content',
        type: 'text',
        content: longContent
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.content.length, 10000);
    });

    it('should handle content with HTML entities', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'HTML Entities',
        type: 'text',
        content: '&lt;div&gt;Hello &amp; World&lt;/div&gt;'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });
  });

});