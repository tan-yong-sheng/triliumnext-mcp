/**
 * Search Criteria Validation Tests
 * Tests the searchCriteriaSchema validation functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import search criteria schema and validation functions from build directory
import {
  searchCriteriaSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Search Criteria Validation', () => {

  describe('Basic Validation', () => {
    it('should validate correct search criteria', () => {
      const validCriteria = {
        property: 'template',
        type: 'relation',
        op: 'exists',
        logic: 'AND'
      };

      const result = safeValidate(searchCriteriaSchema, validCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.property, 'template');
    });

    it('should validate search criteria with value', () => {
      const validCriteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'project',
        logic: 'OR'
      };

      const result = safeValidate(searchCriteriaSchema, validCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.value, 'project');
      assert.strictEqual(result.data.logic, 'OR');
    });

    it('should use default logic when not specified', () => {
      const validCriteria = {
        property: 'template',
        type: 'relation',
        op: 'exists'
      };

      const result = safeValidate(searchCriteriaSchema, validCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.logic, 'AND');
    });
  });

  describe('Operator Validation', () => {
    it('should reject invalid search criteria operators', () => {
      const invalidCriteria = {
        property: 'template',
        type: 'relation',
        op: 'invalid_operator'
      };

      const result = safeValidate(searchCriteriaSchema, invalidCriteria);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });

    it('should validate all supported operators', () => {
      const validOperators = [
        'exists', 'not_exists', '=', '!=', '>=', '<=', '>', '<',
        'contains', 'starts_with', 'ends_with', 'regex'
      ];

      validOperators.forEach(op => {
        const criteria = {
          property: 'title',
          type: 'noteProperty',
          op: op,
          value: 'test'
        };

        const result = safeValidate(searchCriteriaSchema, criteria);
        assert.strictEqual(result.success, true, `Operator ${op} should be valid`);
      });
    });

    it('should validate operators that work without values', () => {
      const operatorsWithoutValues = ['exists', 'not_exists'];

      operatorsWithoutValues.forEach(op => {
        const criteria = {
          property: 'template',
          type: 'relation',
          op: op
        };

        const result = safeValidate(searchCriteriaSchema, criteria);
        assert.strictEqual(result.success, true, `Operator ${op} should work without value`);
      });
    });
  });

  describe('Type Validation', () => {
    it('should reject invalid search criteria types', () => {
      const invalidCriteria = {
        property: 'template',
        type: 'invalid_type',
        op: 'exists'
      };

      const result = safeValidate(searchCriteriaSchema, invalidCriteria);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });

    it('should validate all supported types', () => {
      const validTypes = ['label', 'relation', 'noteProperty'];

      validTypes.forEach(type => {
        const criteria = {
          property: 'title',
          type: type,
          op: 'exists'
        };

        const result = safeValidate(searchCriteriaSchema, criteria);
        assert.strictEqual(result.success, true, `Type ${type} should be valid`);
      });
    });
  });

  describe('Property Validation', () => {
    it('should validate string properties', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'test'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });

    it('should accept any non-empty string property', () => {
      const criteria = {
        property: 'custom_property',
        type: 'label',
        op: 'exists'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Logic Validation', () => {
    it('should validate AND logic', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'test',
        logic: 'AND'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });

    it('should validate OR logic', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'test',
        logic: 'OR'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });

    it('should reject invalid logic values', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'test',
        logic: 'INVALID'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Value Validation', () => {
    it('should accept string values', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: 'test string'
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });

    it('should accept empty string values', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains',
        value: ''
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });

    it('should handle missing value for operators that require it', () => {
      const criteria = {
        property: 'title',
        type: 'noteProperty',
        op: 'contains'
        // Missing value - this should still pass because value is optional
      };

      const result = safeValidate(searchCriteriaSchema, criteria);
      assert.strictEqual(result.success, true);
    });
  });

});