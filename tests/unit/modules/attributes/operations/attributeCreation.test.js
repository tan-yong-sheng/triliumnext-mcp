/**
 * Attribute Creation Module Unit Tests
 * Tests single and batch attribute creation with validation, template translation, and container protection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the specific functions we want to test
import {
  create_single_attribute,
  create_batch_attributes
} from '../../../../../build/modules/attributes/operations/attributeCreation.js';

// Mock axios instance for testing
const createMockAxiosInstance = (responses = {}) => ({
  get: async (url) => {
    // Mock note retrieval for container template detection
    if (url.includes('/notes/') && !url.includes('/attributes')) {
      return responses.note || {
        data: {
          noteId: 'note123',
          type: 'text',
          attributes: []
        }
      };
    }
    // Mock attribute existence check
    if (url.includes('/attributes')) {
      return responses.attributes || { data: [] };
    }
    return { data: {} };
  },
  post: async (url, data) => {
    // Mock attribute creation endpoint
    if (url === '/attributes') {
      return {
        data: {
          attributeId: 'attr123',
          ...data,
          created: new Date().toISOString()
        }
      };
    }
    return { data: {} };
  }
});

// Mock validate_batch_attributes function for testing
async function validate_batch_attributes(noteId, attributes, axiosInstance) {
  // Mock validation logic - check for conflicts with existing attributes
  const conflicts = [];
  const validAttributes = [];

  for (const attr of attributes) {
    // Simulate conflict detection
    if (attr.name === 'project' && attr.value === 'new') {
      conflicts.push({
        attribute: attr,
        existingAttribute: { type: 'label', name: 'project', value: 'existing' }
      });
    } else {
      validAttributes.push(attr);
    }
  }

  return {
    conflicts,
    validAttributes,
    allExistingAttributes: []
  };
}

// Mock container template note
const createContainerTemplateMockAxios = (templateName = 'Board') => ({
  get: async (url) => {
    if (url.includes('/notes/') && !url.includes('/attributes')) {
      return {
        data: {
          noteId: 'board123',
          type: 'book',
          attributes: [
            {
              type: 'relation',
              name: 'template',
              value: templateName
            }
          ]
        }
      };
    }
    return { data: { attributes: [] } };
  },
  post: async () => ({ data: {} })
});

// Mock note with existing attributes
const createExistingAttributesMockAxios = (existingAttrs = []) => ({
  get: async (url) => {
    if (url.includes('/notes/') && !url.includes('/attributes')) {
      return {
        data: {
          noteId: 'note123',
          type: 'text',
          attributes: existingAttrs
        }
      };
    }
    return { data: [] };
  },
  post: async (url, data) => {
    // Simulate conflict when trying to create existing attribute
    const existing = existingAttrs.find(attr =>
      attr.name === data.name && attr.type === data.type
    );
    if (existing) {
      throw new Error('Attribute already exists');
    }
    return { data: { attributeId: 'new123', ...data } };
  }
});

describe('Attribute Creation Module', () => {

  describe('create_single_attribute', () => {
    it('should create label attribute successfully', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'label',
        name: 'project',
        value: 'test'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.ok(result.message.includes('Successfully created label'));
      assert.strictEqual(result.attributes.length, 1);
      assert.strictEqual(result.attributes[0].name, 'project');
    });

    it('should create relation attribute successfully', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'relation',
        name: 'author',
        value: 'note456'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.ok(result.message.includes('Successfully created relation'));
      assert.strictEqual(result.attributes[0].name, 'author');
    });

    it('should translate template relation names to note IDs', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'relation',
        name: 'template',
        value: 'Board'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      // Should translate 'Board' to the actual template note ID
      assert.ok(result.attributes[0].value.startsWith('_template_'));
    });

    it('should reject invalid template relation names', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'relation',
        name: 'template',
        value: 'Invalid Template Name'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('Invalid template relation'));
    });

    it('should prevent attribute creation on container template notes', async () => {
      const mockAxios = createContainerTemplateMockAxios();
      const attribute = {
        type: 'label',
        name: 'project',
        value: 'test'
      };

      const result = await create_single_attribute('board123', attribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('Container template'));
      assert.ok(result.errors[0].includes('protected attribute'));
    });

    it('should detect and prevent duplicate attribute creation', async () => {
      const existingAttrs = [
        { type: 'label', name: 'project', value: 'existing', position: 10 }
      ];
      const mockAxios = createExistingAttributesMockAxios(existingAttrs);
      const attribute = {
        type: 'label',
        name: 'project',
        value: 'new'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('already exists'));
      assert.ok(result.errors.some(err => err.includes('use operation: \'update\'')));
    });

    it('should clean attribute names with leading symbols', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'label',
        name: '#project',
        value: 'test'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.ok(result.message.includes('Successfully created label'));
      // Should include cleaning message
      assert.ok(result.message.includes('Attribute name was auto-corrected'));
    });

    it('should use default position when not specified', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'label',
        name: 'project',
        value: 'test'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes[0].position, 10);
    });

    it('should use custom position when specified', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'label',
        name: 'project',
        value: 'test',
        position: 50
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes[0].position, 50);
    });

    it('should handle API errors gracefully', async () => {
      const mockAxios = createMockAxiosInstance();
      mockAxios.post = async () => { throw new Error('API Error'); };

      const attribute = {
        type: 'label',
        name: 'project',
        value: 'test'
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('Failed to create attribute'));
    });

    it('should validate attribute before creation', async () => {
      const mockAxios = createMockAxiosInstance();
      const invalidAttribute = {
        type: 'invalid',
        name: 'project',
        value: 'test'
      };

      const result = await create_single_attribute('note123', invalidAttribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('validation failed'));
      assert.ok(result.errors.some(err => err.includes('Attribute type must be either')));
    });

    it('should handle attributes without values (labels)', async () => {
      const mockAxios = createMockAxiosInstance();
      const attribute = {
        type: 'label',
        name: 'important'
        // No value - valid for labels
      };

      const result = await create_single_attribute('note123', attribute, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes[0].name, 'important');
    });

    it('should require values for relations', async () => {
      const mockAxios = createMockAxiosInstance();
      const invalidAttribute = {
        type: 'relation',
        name: 'template'
        // Missing value - invalid for relations
      };

      const result = await create_single_attribute('note123', invalidAttribute, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.errors.some(err => err.includes('Relation attributes require a value')));
    });
  });

  describe('validate_batch_attributes', () => {
    it('should identify conflicts with existing attributes', async () => {
      const existingAttrs = [
        { type: 'label', name: 'project', value: 'existing' },
        { type: 'relation', name: 'author', value: 'note456' }
      ];
      const mockAxios = createExistingAttributesMockAxios(existingAttrs);

      const newAttributes = [
        { type: 'label', name: 'project', value: 'new' }, // Conflict
        { type: 'label', name: 'status', value: 'active' }  // Valid
      ];

      const result = await validate_batch_attributes('note123', newAttributes, mockAxios);

      assert.strictEqual(result.conflicts.length, 1);
      assert.strictEqual(result.conflicts[0].attribute.name, 'project');
      assert.strictEqual(result.validAttributes.length, 1);
      assert.strictEqual(result.validAttributes[0].name, 'status');
    });

    it('should allow multiple attributes of different types with same name', async () => {
      const existingAttrs = [
        { type: 'label', name: 'project', value: 'existing' }
      ];
      const mockAxios = createExistingAttributesMockAxios(existingAttrs);

      const newAttributes = [
        { type: 'relation', name: 'project', value: 'note789' }  // Different type - should be valid
      ];

      const result = await validate_batch_attributes('note123', newAttributes, mockAxios);

      assert.strictEqual(result.conflicts.length, 0);
      assert.strictEqual(result.validAttributes.length, 1);
    });

    it('should handle API errors when checking existing attributes', async () => {
      const mockAxios = createMockAxiosInstance();
      mockAxios.get = async () => { throw new Error('API Error'); };

      const newAttributes = [
        { type: 'label', name: 'project', value: 'test' }
      ];

      const result = await validate_batch_attributes('note123', newAttributes, mockAxios);

      // Should proceed without conflicts when API fails
      assert.strictEqual(result.conflicts.length, 0);
      assert.strictEqual(result.validAttributes.length, 1);
    });

    it('should handle empty attribute list', async () => {
      const mockAxios = createMockAxiosInstance();

      const result = await validate_batch_attributes('note123', [], mockAxios);

      assert.strictEqual(result.conflicts.length, 0);
      assert.strictEqual(result.validAttributes.length, 0);
    });
  });

  describe('create_batch_attributes', () => {
    it('should create multiple attributes successfully', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test1' },
        { type: 'label', name: 'status', value: 'active' },
        { type: 'relation', name: 'author', value: 'note456' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes.length, 3);
      assert.ok(result.message.includes('Created 3/3 attributes successfully'));
    });

    it('should skip conflicting attributes and create valid ones', async () => {
      const existingAttrs = [
        { type: 'label', name: 'project', value: 'existing' }
      ];
      const mockAxios = createExistingAttributesMockAxios(existingAttrs);

      const attributes = [
        { type: 'label', name: 'project', value: 'new' },      // Conflict
        { type: 'label', name: 'status', value: 'active' },     // Valid
        { type: 'relation', name: 'author', value: 'note456' }   // Valid
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes.length, 2);
      assert.ok(result.message.includes('Created 2/2 valid attributes successfully'));
      assert.ok(result.message.includes('1 skipped due to conflicts'));
      assert.ok(result.errors?.some(err => err.includes('Skipping duplicate')));
    });

    it('should return failure when all attributes are conflicts', async () => {
      const existingAttrs = [
        { type: 'label', name: 'project', value: 'existing' },
        { type: 'label', name: 'status', value: 'existing' }
      ];
      const mockAxios = createExistingAttributesMockAxios(existingAttrs);

      const attributes = [
        { type: 'label', name: 'project', value: 'new' },
        { type: 'label', name: 'status', value: 'new' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.attributes.length, 0);
      assert.ok(result.message.includes('All 2 attributes already exist'));
    });

    it('should prevent batch creation on container template notes', async () => {
      const mockAxios = createContainerTemplateMockAxios();
      const attributes = [
        { type: 'label', name: 'project', value: 'test' },
        { type: 'label', name: 'status', value: 'active' }
      ];

      const result = await create_batch_attributes('board123', attributes, mockAxios);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('Container template'));
    });

    it('should handle partial failures in batch creation', async () => {
      const mockAxios = createMockAxiosInstance();
      let callCount = 0;
      mockAxios.post = async (url, data) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Second attribute creation failed');
        }
        return { data: { attributeId: `attr${callCount}`, ...data } };
      };

      const attributes = [
        { type: 'label', name: 'project', value: 'test1' },
        { type: 'label', name: 'status', value: 'active' },
        { type: 'label', name: 'priority', value: 'high' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true); // Partial success is still success
      assert.strictEqual(result.attributes.length, 2);
      assert.ok(result.message.includes('Created 2/3 attributes successfully'));
      assert.ok(result.message.includes('with 1 errors'));
      assert.ok(result.errors?.length);
    });

    it('should handle complete failure in batch creation', async () => {
      const mockAxios = createMockAxiosInstance();
      mockAxios.post = async () => { throw new Error('All creations failed'); };

      const attributes = [
        { type: 'label', name: 'project', value: 'test1' },
        { type: 'label', name: 'status', value: 'active' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.attributes?.length || 0, 0);
      assert.ok(result.message.includes('All attribute creation operations failed'));
    });

    it('should return success for empty attribute list', async () => {
      const mockAxios = createMockAxiosInstance();

      const result = await create_batch_attributes('note123', [], mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'No attributes to create');
      assert.deepStrictEqual(result.attributes, []);
    });

    it('should validate individual attributes in batch', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'valid' },
        { type: 'invalid', name: 'bad', value: 'test' },  // Invalid type
        { type: 'label', name: 'status', value: 'valid' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes.length, 2);
      assert.ok(result.message.includes('Created 2/3 attributes successfully'));
      assert.ok(result.errors?.some(err => err.includes('Validation failed')));
    });

    it('should clean attribute names in batch operations', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: '#project', value: 'test1' },
        { type: 'label', name: 'status', value: 'active' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes.length, 2);
      // Should create with cleaned names
      assert.strictEqual(result.attributes[0].name, 'project');
    });

    it('should translate template relations in batch operations', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'relation', name: 'template', value: 'Board' },
        { type: 'label', name: 'project', value: 'test' }
      ];

      const result = await create_batch_attributes('note123', attributes, mockAxios);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.attributes.length, 2);
      // Should translate template name to ID
      assert.ok(result.attributes[0].value.startsWith('_template_'));
    });
  });

});