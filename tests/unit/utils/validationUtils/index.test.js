/**
 * Core Validation Functions Tests
 * Tests the main validation utility functions: safeValidate and createValidationError
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

// Import core validation functions from build directory
import {
  safeValidate,
  createValidationError
} from '../../../../build/utils/validationUtils.js';

describe('Core Validation Functions', () => {

  describe('safeValidate', () => {
    it('should successfully validate valid data', () => {
      const validData = {
        property: 'template',
        type: 'relation',
        op: 'exists',
        logic: 'AND'
      };

      const schema = {
        parse: (data) => data
      };

      const result = safeValidate(schema, validData);
      assert.strictEqual(result.success, true);
      assert.deepEqual(result.data, validData);
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        property: '',
        type: 'invalid_type'
      };

      const schema = {
        parse: () => {
          throw new Error('Validation failed');
        }
      };

      const result = safeValidate(schema, invalidData);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.strictEqual(result.error, 'Unknown validation error');
    });

    it('should handle ZodError properly', () => {
      const invalidData = {
        property: ''
      };

      const schema = {
        parse: () => {
          const error = new Error('Zod validation error');
          error.errors = [
            { path: ['property'], message: 'Property cannot be empty' },
            { path: ['type'], message: 'Type is required' }
          ];
          error.name = 'ZodError';
          throw error;
        }
      };

      const result = safeValidate(schema, invalidData);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      // Mock ZodError (not instanceof z.ZodError) returns 'Unknown validation error'
      assert.strictEqual(result.error, 'Unknown validation error');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error for ZodError', () => {
      // Create a real ZodError by triggering validation
      try {
        z.string().min(5).parse('abc');
      } catch (zodError) {
        const error = createValidationError(zodError);

        assert.ok(typeof error === 'string');
        assert.ok(error.includes('Validation failed:'));
        assert.ok(error.includes('String must contain at least 5 character(s)'));
      }
    });

    it('should create validation error for regular Error', () => {
      const regularError = new Error('Something went wrong');

      const error = createValidationError(regularError);

      assert.ok(typeof error === 'string');
      assert.ok(error.includes('Validation error: Something went wrong'));
    });

    it('should create validation error for unknown error type', () => {
      const error = createValidationError('Unknown error');

      assert.ok(typeof error === 'string');
      assert.ok(error.includes('Validation error: Unknown error'));
    });
  });

});