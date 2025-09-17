/**
 * Attribute Validation Tests
 * Tests the attributeSchema validation functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import attribute schema and validation functions from build directory
import {
  attributeSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Attribute Validation', () => {

  describe('Label Attribute Validation', () => {
    it('should validate correct label attributes', () => {
      const validAttribute = {
        type: 'label',
        name: 'project',
        value: 'api',
        position: 10
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.type, 'label');
      assert.strictEqual(result.data.name, 'project');
    });

    it('should validate label attributes without values', () => {
      const validAttribute = {
        type: 'label',
        name: 'important',
        position: 5
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.name, 'important');
      assert.strictEqual(result.data.value, undefined);
    });

    it('should validate label attributes with empty string values', () => {
      const validAttribute = {
        type: 'label',
        name: 'status',
        value: '',
        position: 1
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.value, '');
    });
  });

  describe('Relation Attribute Validation', () => {
    it('should validate relation attributes with required values', () => {
      const validRelation = {
        type: 'relation',
        name: 'template',
        value: 'Board',
        position: 10
      };

      const result = safeValidate(attributeSchema, validRelation);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.type, 'relation');
      assert.strictEqual(result.data.value, 'Board');
    });

    it('should validate relation attributes without values', () => {
      const validRelation = {
        type: 'relation',
        name: 'author',
        position: 15
      };

      const result = safeValidate(attributeSchema, validRelation);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.value, undefined);
    });

    it('should validate relation attributes with special characters in values', () => {
      const validRelation = {
        type: 'relation',
        name: 'template',
        value: 'Grid View & Table',
        position: 20
      };

      const result = safeValidate(attributeSchema, validRelation);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.value, 'Grid View & Table');
    });
  });

  describe('Name Validation', () => {
    it('should reject attributes with empty names', () => {
      const invalidAttribute = {
        type: 'label',
        name: '',
        position: 10
      };

      const result = safeValidate(attributeSchema, invalidAttribute);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Attribute name cannot be empty'));
    });

    it('should accept attributes with whitespace-only names (Zod allows this)', () => {
      const whitespaceAttribute = {
        type: 'label',
        name: '   ',
        position: 10
      };

      const result = safeValidate(attributeSchema, whitespaceAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.name, '   ');
    });

    it('should validate attributes with single character names', () => {
      const validAttribute = {
        type: 'label',
        name: 'a',
        position: 1
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.name, 'a');
    });

    it('should validate attributes with long names', () => {
      const longName = 'a'.repeat(100);
      const validAttribute = {
        type: 'label',
        name: longName,
        position: 50
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.name, longName);
    });
  });

  describe('Type Validation', () => {
    it('should reject invalid attribute types', () => {
      const invalidAttribute = {
        type: 'invalid_type',
        name: 'project',
        position: 10
      };

      const result = safeValidate(attributeSchema, invalidAttribute);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Invalid enum value'));
    });

    it('should validate label type', () => {
      const validAttribute = {
        type: 'label',
        name: 'test',
        position: 1
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
    });

    it('should validate relation type', () => {
      const validAttribute = {
        type: 'relation',
        name: 'test',
        position: 1
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Position Validation', () => {
    it('should validate attributes with position 0', () => {
      const validAttribute = {
        type: 'label',
        name: 'test',
        position: 0
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.position, 0);
    });

    it('should validate attributes with positive positions', () => {
      const validAttribute = {
        type: 'label',
        name: 'test',
        position: 1000
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.position, 1000);
    });

    it('should reject attributes with negative positions', () => {
      const invalidAttribute = {
        type: 'label',
        name: 'test',
        position: -1
      };

      const result = safeValidate(attributeSchema, invalidAttribute);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Position must be non-negative'));
    });

    it('should use default position when not specified', () => {
      const validAttribute = {
        type: 'label',
        name: 'test'
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.position, 10);
    });
  });

  describe('Inheritable Flag Validation', () => {
    it('should validate attributes with inheritable true', () => {
      const validAttribute = {
        type: 'label',
        name: 'test',
        isInheritable: true
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.isInheritable, true);
    });

    it('should validate attributes with inheritable false', () => {
      const validAttribute = {
        type: 'label',
        name: 'test',
        isInheritable: false
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.isInheritable, false);
    });

    it('should use default inheritable false when not specified', () => {
      const validAttribute = {
        type: 'label',
        name: 'test'
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.isInheritable, false);
    });
  });

  describe('Complete Attribute Validation', () => {
    it('should validate complete label attributes with all fields', () => {
      const completeAttribute = {
        type: 'label',
        name: 'project',
        value: 'api',
        position: 25,
        isInheritable: true
      };

      const result = safeValidate(attributeSchema, completeAttribute);
      assert.strictEqual(result.success, true);
      assert.deepEqual(result.data, completeAttribute);
    });

    it('should validate complete relation attributes with all fields', () => {
      const completeAttribute = {
        type: 'relation',
        name: 'template',
        value: 'Board',
        position: 30,
        isInheritable: false
      };

      const result = safeValidate(attributeSchema, completeAttribute);
      assert.strictEqual(result.success, true);
      assert.deepEqual(result.data, completeAttribute);
    });

    it('should validate minimal attribute with only required fields', () => {
      const minimalAttribute = {
        type: 'label',
        name: 'test'
      };

      const result = safeValidate(attributeSchema, minimalAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.name, 'test');
      assert.strictEqual(result.data.position, 10);
      assert.strictEqual(result.data.isInheritable, false);
    });
  });

});