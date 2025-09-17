/**
 * Data Type Validation Tests
 * Tests validation of different data types in search criteria and other schemas
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import schemas and validation functions from build directory
import {
  searchNotesSchema,
  searchCriteriaSchema,
  attributeSchema,
  manageAttributesSchema,
  safeValidate
} from '../../../../build/utils/validationUtils.js';

describe('Data Type Validation', () => {

  describe('Date String Validation', () => {
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

      const result = safeValidate(searchNotesSchema, dateCriteria);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should validate various ISO date formats', () => {
      const validDates = [
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T23:59:59.999Z',
        '2024-06-15T12:30:45.123Z',
        '2023-01-01T00:00:00Z'
      ];

      validDates.forEach(date => {
        const criteria = {
          searchCriteria: [
            {
              property: 'dateCreated',
              type: 'noteProperty',
              op: '>=',
              value: date,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Date ${date} should be valid`);
      });
    });

    it('should validate date comparison operators', () => {
      const dateOperators = ['>=', '<=', '>', '<', '=', '!='];

      dateOperators.forEach(op => {
        const criteria = {
          searchCriteria: [
            {
              property: 'dateModified',
              type: 'noteProperty',
              op: op,
              value: '2024-01-01T00:00:00.000Z',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Date operator ${op} should be valid`);
      });
    });

    it('should validate date ranges with AND logic', () => {
      const dateRangeCriteria = {
        searchCriteria: [
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: '2024-01-01T00:00:00.000Z',
            logic: 'AND'
          },
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '<=',
            value: '2024-12-31T23:59:59.999Z',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, dateRangeCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 2);
    });
  });

  describe('Numeric Value Validation', () => {
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

      const result = safeValidate(searchNotesSchema, numericCriteria);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should validate various numeric formats', () => {
      const validNumbers = ['0', '1', '10', '100', '1000', '999999'];

      validNumbers.forEach(num => {
        const criteria = {
          searchCriteria: [
            {
              property: 'labelCount',
              type: 'noteProperty',
              op: '>=',
              value: num,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Number ${num} should be valid`);
      });
    });

    it('should validate numeric comparison operators', () => {
      const numericOperators = ['>', '<', '>=', '<=', '=', '!='];

      numericOperators.forEach(op => {
        const criteria = {
          searchCriteria: [
            {
              property: 'contentSize',
              type: 'noteProperty',
              op: op,
              value: '1000',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Numeric operator ${op} should be valid`);
      });
    });

    it('should validate multiple numeric criteria', () => {
      const multiNumericCriteria = {
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
          },
          {
            property: 'revisionCount',
            type: 'noteProperty',
            op: '=',
            value: '1',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, multiNumericCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 3);
    });

    it('should validate count-related properties', () => {
      const countProperties = [
        'labelCount', 'ownedLabelCount', 'attributeCount', 'relationCount',
        'parentCount', 'childrenCount', 'revisionCount'
      ];

      countProperties.forEach(prop => {
        const criteria = {
          searchCriteria: [
            {
              property: prop,
              type: 'noteProperty',
              op: '>',
              value: '0',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Property ${prop} should be valid`);
      });
    });
  });

  describe('Boolean Value Validation', () => {
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

      const result = safeValidate(searchNotesSchema, booleanCriteria);
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should validate true and false boolean values', () => {
      const booleanValues = ['true', 'false'];

      booleanValues.forEach(value => {
        const criteria = {
          searchCriteria: [
            {
              property: 'isProtected',
              type: 'noteProperty',
              op: '=',
              value: value,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Boolean value ${value} should be valid`);
      });
    });

    it('should validate boolean comparison operators', () => {
      const booleanOperators = ['=', '!='];

      booleanOperators.forEach(op => {
        const criteria = {
          searchCriteria: [
            {
              property: 'isArchived',
              type: 'noteProperty',
              op: op,
              value: 'false',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Boolean operator ${op} should be valid`);
      });
    });

    it('should validate boolean properties', () => {
      const booleanProperties = ['isArchived', 'isProtected'];

      booleanProperties.forEach(prop => {
        const criteria = {
          searchCriteria: [
            {
              property: prop,
              type: 'noteProperty',
              op: '=',
              value: 'false',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Boolean property ${prop} should be valid`);
      });
    });
  });

  describe('String Property Validation', () => {
    it('should validate string properties with various operators', () => {
      const stringOperators = ['=', '!=', 'contains', 'starts_with', 'ends_with', 'regex'];

      stringOperators.forEach(op => {
        const criteria = {
          searchCriteria: [
            {
              property: 'type',
              type: 'noteProperty',
              op: op,
              value: 'text',
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `String operator ${op} should be valid`);
      });
    });

    it('should validate type property with different note types', () => {
      const noteTypes = ['text', 'code', 'book', 'search', 'relationMap', 'mermaid'];

      noteTypes.forEach(type => {
        const criteria = {
          searchCriteria: [
            {
              property: 'type',
              type: 'noteProperty',
              op: '=',
              value: type,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Note type ${type} should be valid`);
      });
    });
  });

  describe('Mixed Data Type Validation', () => {
    it('should validate mixed data types in single search', () => {
      const mixedCriteria = {
        searchCriteria: [
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'text',
            logic: 'AND'
          },
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'false',
            logic: 'AND'
          },
          {
            property: 'labelCount',
            type: 'noteProperty',
            op: '>',
            value: '3',
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

      const result = safeValidate(searchNotesSchema, mixedCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 4);
    });

    it('should validate mixed data types with OR logic', () => {
      const mixedOrCriteria = {
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'contains',
            value: 'project',
            logic: 'OR'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'book',
            logic: 'OR'
          },
          {
            property: 'labelCount',
            type: 'noteProperty',
            op: '>',
            value: '5',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, mixedOrCriteria);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.searchCriteria.length, 3);
    });
  });

  describe('Edge Cases and Complex Data Types', () => {
    it('should validate date with smart expressions', () => {
      const smartDateCriteria = {
        searchCriteria: [
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: 'TODAY-7',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, smartDateCriteria);
      assert.strictEqual(result.success, true);
    });

    it('should validate numeric edge cases', () => {
      const edgeCases = [
        { property: 'labelCount', op: '>', value: '0' },
        { property: 'contentSize', op: '=', value: '0' },
        { property: 'revisionCount', op: '>=', value: '1' }
      ];

      edgeCases.forEach(({ property, op, value }) => {
        const criteria = {
          searchCriteria: [
            {
              property: property,
              type: 'noteProperty',
              op: op,
              value: value,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Edge case ${property} ${op} ${value} should be valid`);
      });
    });

    it('should validate regex patterns with special characters', () => {
      const regexPatterns = [
        '^Project\\\\s\\\\d+$',
        '.*\\\\.(jpg|png|gif)$',
        '^[A-Z][a-z]+$',
        '.*test.*'
      ];

      regexPatterns.forEach(pattern => {
        const criteria = {
          searchCriteria: [
            {
              property: 'title',
              type: 'noteProperty',
              op: 'regex',
              value: pattern,
              logic: 'AND'
            }
          ]
        };

        const result = safeValidate(searchNotesSchema, criteria);
        assert.strictEqual(result.success, true, `Regex pattern ${pattern} should be valid`);
      });
    });

    it('should validate very large numeric values', () => {
      const largeNumberCriteria = {
        searchCriteria: [
          {
            property: 'contentSize',
            type: 'noteProperty',
            op: '>',
            value: '999999999',
            logic: 'AND'
          }
        ]
      };

      const result = safeValidate(searchNotesSchema, largeNumberCriteria);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Data Type Integration with Other Schemas', () => {
    it('should validate data types in attribute values', () => {
      const validAttribute = {
        type: 'label',
        name: 'numeric_test',
        value: '12345',
        position: 10
      };

      const result = safeValidate(attributeSchema, validAttribute);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.value, '12345');
    });

    it('should validate data types in manage attributes', () => {
      const validRequest = {
        noteId: 'abc123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'date_test',
            value: '2024-01-01',
            position: 10
          },
          {
            type: 'label',
            name: 'boolean_test',
            value: 'true',
            position: 20
          }
        ]
      };

      const result = safeValidate(manageAttributesSchema, validRequest);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.attributes.length, 2);
    });
  });

});