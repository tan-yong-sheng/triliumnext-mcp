/**
 * Search Notes Validation Tests
 * Tests the searchNotesSchema validation functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import search notes schema and validation functions from build directory
import {
  searchNotesSchema,
  searchCriteriaSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Search Notes Validation', () => {

  describe('Basic Text Search', () => {
    it('should validate correct search notes request with text only', () => {
      const validRequest = {
        text: 'project'
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.text, 'project');
    });

    it('should validate search with text and limit', () => {
      const validRequest = {
        text: 'project',
        limit: 10
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.limit, 10);
    });

    it('should validate search with text only (minimal request)', () => {
      const validRequest = {
        text: 'search term'
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, 'search term');
      assert.strictEqual(result.data.limit, undefined);
      assert.strictEqual(result.data.searchCriteria, undefined);
    });
  });

  describe('Text Parameter Validation', () => {
    it('should validate with various text values', () => {
      const validTexts = [
        'simple search',
        'search with numbers 123',
        'search-with-dashes',
        'search_with_underscores',
        'search with special chars: àáâãä',
        'a', // Single character
        '', // Empty string
        'search with symbols: !@#$%^&*()',
        'search with emojis 🎉'
      ];

      validTexts.forEach(text => {
        const request = { text: text };

        const result = safeValidate(searchNotesSchema, request);
        assert.strictEqual(result.success, true, `Text "${text}" should be valid`);
      });
    });

    it('should validate search with Unicode text', () => {
      const validRequest = {
        text: 'search with 中文 and español and français'
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, 'search with 中文 and español and français');
    });

    it('should validate search with long text', () => {
      const longText = 'a'.repeat(1000);
      const validRequest = {
        text: longText
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, longText);
    });
  });

  describe('Search Criteria Validation', () => {
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

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.searchCriteria.length, 1);
    });

    it('should validate search with multiple search criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: 'exists',
            logic: 'AND'
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

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 2);
    });

    it('should validate search with empty search criteria array', () => {
      const validRequest = {
        searchCriteria: []
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 0);
    });

    it('should validate search with complex search criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'contains',
            value: 'project',
            logic: 'OR'
          },
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'false',
            logic: 'AND'
          },
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: '2024-01-01T00:00:00.000Z',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 3);
    });
  });

  describe('Limit Parameter Validation', () => {
    it('should validate with various limit values', () => {
      const validLimits = [1, 10, 50, 100, 1000];

      validLimits.forEach(limit => {
        const request = {
          text: 'test',
          limit: limit
        };

        const result = safeValidate(searchNotesSchema, request);
        assert.strictEqual(result.success, true, `Limit ${limit} should be valid`);
      });
    });

    it('should reject invalid limit values', () => {
      const invalidLimits = [0, -1, -10, 0.5, '10'];

      invalidLimits.forEach(limit => {
        const request = {
          text: 'test',
          limit: limit
        };

        const result = safeValidate(searchNotesSchema, request);
        assert.strictEqual(result.success, false, `Limit ${limit} should be invalid`);
        assert.ok(result.error);
      });
    });

    it('should accept undefined for optional limit', () => {
      const request = {
        text: 'test',
        limit: undefined
      };

      const result = safeValidate(searchNotesSchema, request);
      assert.strictEqual(result.success, true, 'Limit undefined should be valid for optional field');
    });

    it('should reject null for optional limit (expecting number or undefined only)', () => {
      const request = {
        text: 'test',
        limit: null
      };

      const result = safeValidate(searchNotesSchema, request);
      assert.strictEqual(result.success, false, 'Limit null should be invalid for optional field expecting number');
    });

    it('should reject limit less than 1', () => {
      const invalidRequest = {
        text: 'project',
        limit: 0
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.ok(result.error.includes('Limit must be at least 1'));
    });
  });

  describe('Combined Parameters', () => {
    it('should validate search with text, criteria, and limit', () => {
      const validRequest = {
        text: 'project',
        searchCriteria: [
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'book'
          }
        ],
        limit: 25
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, 'project');
      assert.strictEqual(result.data.limit, 25);
      assert.strictEqual(result.data.searchCriteria.length, 1);
    });

    it('should validate search with text and criteria without limit', () => {
      const validRequest = {
        text: 'project',
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: 'exists'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, 'project');
      assert.strictEqual(result.data.limit, undefined);
    });

    it('should validate search with criteria and limit without text', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'false'
          }
        ],
        limit: 50
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, undefined);
      assert.strictEqual(result.data.limit, 50);
    });
  });

  describe('Complex Search Scenarios', () => {
    it('should validate search with mixed criteria types', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'contains',
            value: 'project',
            logic: 'OR'
          },
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'template',
            type: 'relation',
            op: 'not_exists',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 3);
    });

    it('should validate search with date range criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: '2024-01-01T00:00:00.000Z',
            logic: 'AND'
          },
          {
            property: 'dateModified',
            type: 'noteProperty',
            op: '<=',
            value: '2024-12-31T23:59:59.999Z',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 2);
    });

    it('should validate search with numeric criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'labelCount',
            type: 'noteProperty',
            op: '>',
            value: '5',
            logic: 'AND'
          },
          {
            property: 'contentSize',
            type: 'noteProperty',
            op: '<=',
            value: '10000',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should validate empty search request', () => {
      const emptyRequest = {};

      const result = safeValidate(searchNotesSchema, emptyRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, undefined);
      assert.strictEqual(result.data.limit, undefined);
      assert.strictEqual(result.data.searchCriteria, undefined);
    });

    it('should validate search with whitespace-only text', () => {
      const validRequest = {
        text: '   '
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.text, '   ');
    });

    it('should validate search with special characters in text', () => {
      const validRequest = {
        text: 'search with !@#$%^&*() special characters'
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
    });

    it('should validate search with regex operators in criteria', () => {
      const validRequest = {
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'regex',
            value: '^Project\\\\s\\\\d+$',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, validRequest);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Invalid Search Requests', () => {
    it('should reject invalid search criteria items', () => {
      const invalidRequest = {
        searchCriteria: [
          {
            property: 'template',
            type: 'invalid_type',
            op: 'exists'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject search criteria with invalid operators', () => {
      const invalidRequest = {
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: 'invalid_operator'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject non-array search criteria', () => {
      const invalidRequest = {
        searchCriteria: 'not an array'
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject search criteria with null items', () => {
      const invalidRequest = {
        searchCriteria: [null]
      };

      const result = safeValidate(searchNotesSchema, invalidRequest);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

});