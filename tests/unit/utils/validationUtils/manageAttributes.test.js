/**
 * Manage Attributes Validation Tests
 * Tests the manageAttributesSchema validation functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import manage attributes schema and validation functions from build directory
import {
  manageAttributesSchema,
  attributeSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Manage Attributes Validation', () => {

  describe('Batch Create Operation', () => {
    it('should validate correct batch create request with multiple attributes', () => {
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

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.operation, 'batch_create');
      assert.strictEqual(result.data.attributes.length, 2);
    });

    it('should validate batch create with single attribute', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'important',
            position: 5
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 1);
    });

    it('should validate batch create with empty attributes array', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: []
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 0);
    });

    it('should validate batch create with complex attributes', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'language',
            value: 'javascript',
            position: 10,
            isInheritable: true
          },
          {
            type: 'label',
            name: 'project',
            value: 'api',
            position: 20,
            isInheritable: false
          },
          {
            type: 'relation',
            name: 'template',
            value: 'Grid View',
            position: 30,
            isInheritable: true
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 3);
    });
  });

  describe('Single Operations', () => {
    it('should validate create operation', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'create',
        attributes: [
          {
            type: 'label',
            name: 'test',
            position: 1
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.operation, 'create');
    });

    it('should validate update operation', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'update',
        attributes: [
          {
            type: 'label',
            name: 'test',
            value: 'updated',
            position: 5
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.operation, 'update');
    });

    it('should validate delete operation', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'delete',
        attributes: [
          {
            type: 'label',
            name: 'test',
            position: 1
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.operation, 'delete');
    });
  });

  describe('Read Operation', () => {
    it('should validate read operation without attributes', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.operation, 'read');
      assert.strictEqual(result.data.attributes, undefined);
    });

    it('should validate read operation with empty attributes array', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'read',
        attributes: []
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 0);
    });
  });

  describe('Operation Validation', () => {
    it('should reject invalid operations', () => {
      const invalidRequest = {
        noteId: 'abc123',
        operation: 'invalid_operation'
      };

      const result = safeValidate(manageAttributesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });

    it('should validate all supported operations', () => {
      const validOperations = ['create', 'update', 'delete', 'batch_create', 'read'];

      validOperations.forEach(operation => {
        const request = {
          noteId: 'abc123',
          operation: operation
        };

        const result = safeValidate(manageAttributesSchema, request);
        assert.strictEqual(result.success, true, `Operation ${operation} should be valid`);
      });
    });
  });

  describe('Note ID Validation', () => {
    it('should validate with valid note ID', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.noteId, 'abc123');
    });

    it('should reject empty note ID', () => {
      const invalidRequest = {
        noteId: '',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Note ID cannot be empty'));
    });

    it('should validate with UUID-style note ID', () => {
      const validRequest = {
        noteId: '12345678-1234-1234-1234-123456789012',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
    });

    it('should validate with alphanumeric note ID', () => {
      const validRequest = {
        noteId: 'note123abc',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Attribute Array Validation', () => {
    it('should validate when attributes array is missing for non-read operations', () => {
      const invalidRequest = {
        noteId: 'abc123',
        operation: 'create'
        // Missing attributes array
      };

      const result = safeValidate(manageAttributesSchema, invalidRequest);
      assert.strictEqual(result.success, true); // attributes is optional
    });

    it('should validate attributes with valid schema', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'create',
        attributes: [
          {
            type: 'label',
            name: 'test',
            position: 1
          }
        ]
      };

      // First validate the individual attribute
      const attributeResult = safeValidate(attributeSchema, validRequest.attributes[0]);
      assert.strictEqual(attributeResult.success, true);

      // Then validate the full request
      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
    });

    it('should reject request with invalid attributes', () => {
      const invalidRequest = {
        noteId: 'abc123',
        operation: 'create',
        attributes: [
          {
            type: 'invalid_type',
            name: 'test',
            position: 1
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Edge Cases', () => {
    it('should validate request with minimal required fields', () => {
      const minimalRequest = {
        noteId: 'abc123',
        operation: 'read'
      };

      const result = safeValidate(manageAttributesSchema, minimalRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.noteId, 'abc123');
      assert.strictEqual(result.data.operation, 'read');
    });

    it('should validate complex batch operation with mixed attribute types', () => {
      const complexRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'priority',
            value: 'high',
            position: 10
          },
          {
            type: 'relation',
            name: 'template',
            value: 'Board',
            position: 20,
            isInheritable: true
          },
          {
            type: 'label',
            name: 'status',
            value: '',
            position: 30,
            isInheritable: false
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, complexRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 3);
    });

    it('should validate request with special characters in values', () => {
      const specialCharRequest = {
        noteId: 'abc123',
        operation: 'create',
        attributes: [
          {
            type: 'label',
            name: 'description',
            value: 'Special chars: àáâãäåèéêëìíîïòóôõöùúûüñç',
            position: 1
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, specialCharRequest);
      assert.strictEqual(result.success, true);
    });
  });

});