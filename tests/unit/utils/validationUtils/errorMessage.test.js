/**
 * Error Message Validation Tests
 * Tests error message formatting and validation error handling
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Import schemas and validation functions from build directory
import {
  createNoteSchema,
  searchCriteriaSchema,
  attributeSchema,
  searchNotesSchema,
  safeValidate,
  createValidationError
} from '../../../../build/utils/validationUtils.js';

describe('Error Message Validation', () => {

  describe('Required Field Error Messages', () => {
    it('should provide clear error messages for missing required fields', () => {
      const invalidRequest = {
        parentNoteId: 'root'
        // Missing title, type, content
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(typeof result.error === 'string');

      // Should mention the missing fields
      assert.ok(result.error.includes('required') ||
              result.error.includes('missing') ||
              result.error.includes('title') ||
              result.error.includes('type') ||
              result.error.includes('content'));
    });

    it('should provide specific error for missing parentNoteId', () => {
      const invalidRequest = {
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.toLowerCase().includes('parent'));
    });

    it('should provide specific error for missing title', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.toLowerCase().includes('title'));
    });

    it('should provide specific error for missing type', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.toLowerCase().includes('type'));
    });

    it('should accept request without content since content is optional', () => {
      const validRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'text'
      };

      const result = safeValidate(createNoteSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.content, undefined);
    });
  });

  describe('Enum Value Error Messages', () => {
    it('should provide clear error messages for invalid enum values', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'invalid_type',
        content: [{ type: 'text', content: '<p>Test content</p>' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
      assert.ok(result.error.includes('type'));
    });

    it('should provide specific error for invalid note types', () => {
      const invalidTypes = ['invalid_type'];

      invalidTypes.forEach(type => {
        const invalidRequest = {
          parentNoteId: 'root',
          title: 'Test Note',
          type: type,
          content: [{ type: 'text', content: 'test' }]
        };

        const result = safeValidate(createNoteSchema, invalidRequest);
        assert.strictEqual(result.success, false);
        assert.ok(result.error);
        assert.ok(result.error.includes('Invalid enum value'));
      });
    });

    it('should provide error for invalid attribute types', () => {
      const invalidRequest = {
        type: 'invalid_type',
        name: 'test',
        position: 10
      };

      const result = safeValidate(attributeSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });

    it('should provide error for invalid search criteria operators', () => {
      const invalidRequest = {
        property: 'template',
        type: 'relation',
        op: 'invalid_operator'
      };

      const result = safeValidate(searchCriteriaSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });
  });

  describe('Validation Error Function', () => {
    it('should create validation error for string message', () => {
      const error = createValidationError('Test error message');
      assert.ok(typeof error === 'string');
      assert.ok(error.includes('Validation error: Unknown error'));
    });

    it('should create validation error for Error object', () => {
      const customMessage = 'Custom validation failed';
      const error = createValidationError(new Error(customMessage));
      assert.ok(typeof error === 'string');
      assert.ok(error.includes('Validation error: Custom validation failed'));
    });

    it('should create validation error for ZodError', () => {
      try {
        z.string().min(5).parse('abc');
      } catch (zodError) {
        const error = createValidationError(zodError);
        assert.ok(typeof error === 'string');
        assert.ok(error.includes('Validation failed:'));
        assert.ok(error.includes('String must contain at least 5 character(s)'));
      }
    });

    it('should create validation error with empty string', () => {
      const error = createValidationError('');
      assert.ok(typeof error === 'string');
      assert.ok(error.includes('Validation error: Unknown error'));
    });
  });

  describe('Field-Specific Error Messages', () => {
    it('should provide specific error for empty strings in required fields', () => {
      const invalidRequest = {
        parentNoteId: '',
        title: 'Test Note',
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.toLowerCase().includes('empty'));
    });

    it('should provide specific error for attribute name validation', () => {
      const invalidRequest = {
        type: 'label',
        name: '',
        position: 10
      };

      const result = safeValidate(attributeSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Attribute name cannot be empty'));
    });

    it('should provide specific error for position validation', () => {
      const invalidRequest = {
        type: 'label',
        name: 'test',
        position: -1
      };

      const result = safeValidate(attributeSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Position must be non-negative'));
    });

    it('should provide specific error for limit validation', () => {
      const invalidRequest = {
        text: 'test',
        limit: 0
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Limit must be at least 1'));
    });
  });

  describe('Multiple Error Messages', () => {
    it('should handle multiple validation errors in single response', () => {
      const invalidRequest = {
        parentNoteId: '',
        title: '',
        type: 'invalid_type',
        content: [{ type: 'invalid_type', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);

      // Should contain information about multiple validation issues
      const errorText = result.error.toLowerCase();
      const errorIndicators = [
        'empty', 'invalid', 'required', 'missing'
      ];

      // At least one error indicator should be present
      const hasErrorIndicator = errorIndicators.some(indicator =>
        errorText.includes(indicator)
      );
      assert.ok(hasErrorIndicator, `Error should contain validation indicators: ${result.error}`);
    });

    it('should provide meaningful error messages for complex validation failures', () => {
      const complexInvalidRequest = {
        parentNoteId: 'root',
        title: 'Test',
        type: 'text',
        content: [
          { type: 'invalid_type', content: 'test' },
          { type: 'text', content: 'valid' }
        ],
        attributes: [
          { type: 'invalid_attr_type', name: 'test' }
        ]
      };

      const result = safeValidate(createNoteSchema, complexInvalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(typeof result.error === 'string');

      // Should be a comprehensive error message
      assert.ok(result.error.length > 10, 'Error message should be descriptive');
    });
  });

  describe('Error Message Format Consistency', () => {
    it('should maintain consistent error message format across schemas', () => {
      const testCases = [
        {
          schema: createNoteSchema,
          data: { parentNoteId: 'root' }, // Missing required fields
          schemaName: 'createNoteSchema'
        },
        {
          schema: attributeSchema,
          data: { type: 'label', name: '' }, // Empty name
          schemaName: 'attributeSchema'
        },
        {
          schema: searchCriteriaSchema,
          data: { property: 'test', type: 'invalid', op: 'exists' }, // Invalid type
          schemaName: 'searchCriteriaSchema'
        }
      ];

      testCases.forEach(({ schema, data, schemaName }) => {
        const result = safeValidate(schema, data);
        assert.strictEqual(result.success, false, `${schemaName} should fail validation`);
        assert.ok(result.error, `${schemaName} should have error message`);
        assert.ok(typeof result.error === 'string', `${schemaName} error should be string`);
        assert.ok(result.error.length > 0, `${schemaName} error should not be empty`);
      });
    });

    it('should provide actionable error messages', () => {
      const invalidRequest = {
        parentNoteId: 'root',
        title: 'Test Note',
        type: 'invalid_note_type',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);

      // Error message should help identify the problem
      const errorText = result.error.toLowerCase();
      const hasHelpfulInfo = errorText.includes('invalid') ||
                            errorText.includes('enum') ||
                            errorText.includes('type');

      assert.ok(hasHelpfulInfo, `Error message should be actionable: ${result.error}`);
    });
  });

  describe('Edge Case Error Messages', () => {
    it('should handle edge case error scenarios gracefully', () => {
      const edgeCaseRequest = {
        parentNoteId: 'root',
        title: '', // Empty title (should fail)
        type: 'text',
        content: [{ type: 'text', content: 'test' }]
      };

      const result = safeValidate(createNoteSchema, edgeCaseRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(typeof result.error === 'string');
    });

    it('should provide clear error for completely invalid data types', () => {
      const invalidDataTypes = [
        null,
        undefined,
        123,
        [],
        {},
        'string'
      ];

      invalidDataTypes.forEach((dataType, index) => {
        const result = safeValidate(createNoteSchema, dataType);
        assert.strictEqual(result.success, false, `Data type ${typeof dataType} should fail validation`);
        assert.ok(result.error, `Should have error for data type ${typeof dataType}`);
      });
    });
  });

});