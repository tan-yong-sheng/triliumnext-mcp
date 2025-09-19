/**
 * Search Query Builder Module Unit Tests
 * Tests construction of Trilium search queries from structured parameters
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the specific function we want to test
import { buildSearchQuery } from '../../../../../build/modules/search/query/queryBuilder.js';

describe('Search Query Builder Module', () => {

  describe('Basic Query Building', () => {
    it('should build empty query for no parameters', () => {
      const result = buildSearchQuery({});

      assert.strictEqual(result, '');
    });

    it('should build query with text only', () => {
      const result = buildSearchQuery({
        text: 'search term'
      });

      assert.strictEqual(result, 'search term');
    });

    it('should build query with limit only', () => {
      const result = buildSearchQuery({
        limit: 10
      });

      assert.strictEqual(result, ' limit 10');
    });

    it('should build query with text and limit', () => {
      const result = buildSearchQuery({
        text: 'search term',
        limit: 5
      });

      assert.strictEqual(result, 'search term limit 5');
    });

    it('should add universal match condition for searchCriteria only', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'contains',
            value: 'test'
          }
        ]
      });

      assert.ok(result.includes('note.noteId != \'\''));
      assert.ok(result.includes('note.title *=* \'test\''));
    });
  });

  describe('Label Search Criteria', () => {
    it('should build exists query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists'
          }
        ]
      });

      assert.ok(result.includes('#project'));
    });

    it('should build not_exists query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'not_exists'
          }
        ]
      });

      assert.ok(result.includes('#!project'));
    });

    it('should build equality query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: '=',
            value: 'important'
          }
        ]
      });

      assert.ok(result.includes('#project = \'important\''));
    });

    it('should build inequality query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: '!=',
            value: 'archived'
          }
        ]
      });

      assert.ok(result.includes('#project != \'archived\''));
    });

    it('should build contains query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'contains',
            value: 'test'
          }
        ]
      });

      assert.ok(result.includes('#project *=* \'test\''));
    });

    it('should build starts_with query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'starts_with',
            value: 'web'
          }
        ]
      });

      assert.ok(result.includes('#project =* \'web\''));
    });

    it('should build ends_with query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'ends_with',
            value: 'app'
          }
        ]
      });

      assert.ok(result.includes('#project *= \'app\''));
    });

    it('should build regex query for labels', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'regex',
            value: 'test\\d+'
          }
        ]
      });

      assert.ok(result.includes('#project %= \'test\\d+\''));
    });

    it('should escape quotes in label values', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: '=',
            value: "John's Project"
          }
        ]
      });

      assert.ok(result.includes("#project = 'John\\'s Project'"));
    });

    it('should handle empty search criteria array', () => {
      const result = buildSearchQuery({
        searchCriteria: []
      });

      assert.strictEqual(result, '');
    });
  });

  describe('Relation Search Criteria', () => {
    it('should build exists query for relations', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'author',
            type: 'relation',
            op: 'exists'
          }
        ]
      });

      assert.ok(result.includes('~author'));
    });

    it('should build equality query for relations with property access', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: 'Board'
          }
        ]
      });

      // Should auto-enhance to use property access with template translation
      assert.ok(result.includes('~template.noteId = \'_template_board\''));
    });

    it('should build equality query for relations with explicit property', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'author.noteId',
            type: 'relation',
            op: '=',
            value: 'note123'
          }
        ]
      });

      assert.ok(result.includes('~author.noteId = \'note123\''));
    });

    it('should build contains query for relations', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'author',
            type: 'relation',
            op: 'contains',
            value: 'John'
          }
        ]
      });

      assert.ok(result.includes('~author.title *=* \'John\''));
    });

    it('should translate template names to note IDs', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: 'Board'
          }
        ]
      });

      // Should translate 'Board' to template note ID and use noteId property
      assert.ok(result.includes('~template.noteId = \'_template_board\''));
    });

    it('should use noteId property for system relations with note ID values', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: '_template_board'
          }
        ]
      });

      assert.ok(result.includes('~template.noteId = \'_template_board\''));
    });

    it('should use title property for regular relations', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'author',
            type: 'relation',
            op: '=',
            value: 'John Doe'
          }
        ]
      });

      assert.ok(result.includes('~author.title = \'John Doe\''));
    });
  });

  describe('Note Property Search Criteria', () => {
    it('should build query for isArchived property', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'true'
          }
        ]
      });

      assert.ok(result.includes('note.isArchived = true'));
    });

    it('should build query for isProtected property', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'isProtected',
            type: 'noteProperty',
            op: '=',
            value: 'false'
          }
        ]
      });

      assert.ok(result.includes('note.isProtected = false'));
    });

    it('should build query for note type', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'text'
          }
        ]
      });

      assert.ok(result.includes('note.type = \'text\''));
    });

    it('should build query for title contains', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'title',
            type: 'noteProperty',
            op: 'contains',
            value: 'search'
          }
        ]
      });

      assert.ok(result.includes('note.title *=* \'search\''));
    });

    it('should build query for content starts with', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'content',
            type: 'noteProperty',
            op: 'starts_with',
            value: 'Introduction'
          }
        ]
      });

      assert.ok(result.includes('note.content =* \'Introduction\''));
    });

    it('should build query for numeric properties', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'labelCount',
            type: 'noteProperty',
            op: '>',
            value: '5'
          }
        ]
      });

      assert.ok(result.includes('note.labelCount > 5'));
    });

    it('should build query for date properties with ISO format', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: '2024-01-01'
          }
        ]
      });

      assert.ok(result.includes('note.dateCreated >= \'2024-01-01\''));
    });

    it('should build query for date properties with smart date expressions', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'dateModified',
            type: 'noteProperty',
            op: '>=',
            value: 'TODAY-7'
          }
        ]
      });

      assert.ok(result.includes('note.dateModified >= \'TODAY-7\''));
    });

    it('should build query for hierarchy properties', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'parents.noteId',
            type: 'noteProperty',
            op: '=',
            value: 'parent123'
          }
        ]
      });

      assert.ok(result.includes('note.parents.noteId = \'parent123\''));
    });

    it('should build query for deep hierarchy properties', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'parents.parents.title',
            type: 'noteProperty',
            op: 'contains',
            value: 'Archive'
          }
        ]
      });

      assert.ok(result.includes('note.parents.parents.title *=* \'Archive\''));
    });

    it('should build query for children properties', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'children.title',
            type: 'noteProperty',
            op: 'exists'
          }
        ]
      });

      assert.ok(result.includes('note.children.title'));
    });

    it('should build query for ancestors properties', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'ancestors.noteId',
            type: 'noteProperty',
            op: '=',
            value: 'root123'
          }
        ]
      });

      assert.ok(result.includes('note.ancestors.noteId = \'root123\''));
    });
  });

  describe('Boolean Logic and Grouping', () => {
    it('should combine multiple criteria with AND logic', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'status',
            type: 'label',
            op: '=',
            value: 'active',
            logic: 'AND'
          }
        ]
      });

      assert.ok(result.includes('#project'));
      assert.ok(result.includes('#status = \'active\''));
      assert.ok(!result.includes('OR'));
    });

    it('should combine criteria with OR logic using ~ prefix', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'OR'
          },
          {
            property: 'status',
            type: 'label',
            op: '=',
            value: 'active'
          }
        ]
      });

      assert.ok(result.includes('~('));
      assert.ok(result.includes('OR'));
    });

    it('should handle mixed AND/OR logic by grouping', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'status',
            type: 'label',
            op: 'exists',
            logic: 'OR'
          },
          {
            property: 'priority',
            type: 'label',
            op: '=',
            value: 'high'
          }
        ]
      });

      // Should have both AND and OR groups
      assert.ok(result.includes('#project'));
      assert.ok(result.includes('~('));
    });

    it('should ignore logic on last criteria', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'status',
            type: 'label',
            op: '=',
            value: 'active',
            logic: 'OR'  // This should be ignored
          }
        ]
      });

      // Should not have OR grouping since last item logic is ignored
      assert.ok(!result.includes('~('));
    });

    it('should handle single criteria groups', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists'
          }
        ]
      });

      assert.ok(result.includes('#project'));
      assert.ok(!result.includes('~('));
    });
  });

  describe('Cross-Type Boolean Logic', () => {
    it('should combine labels and relations with OR logic', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'OR'
          },
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: 'Board'
          }
        ]
      });

      assert.ok(result.includes('~('));
      assert.ok(result.includes('OR'));
      assert.ok(result.includes('#project'));
      assert.ok(result.includes('~template'));
    });

    it('should combine attributes and note properties with OR logic', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'OR'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'book'
          }
        ]
      });

      assert.ok(result.includes('~('));
      assert.ok(result.includes('OR'));
      assert.ok(result.includes('#project'));
      assert.ok(result.includes('note.type'));
    });

    it('should build complex cross-type queries', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: 'Board',
            logic: 'OR'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'book'
          }
        ]
      });

      assert.ok(result.includes('#project'));
      assert.ok(result.includes('~('));
      assert.ok(result.includes('OR'));
      assert.ok(result.includes('note.type'));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid attribute types gracefully', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'invalid',
            op: 'exists'
          }
        ]
      });

      // Should skip invalid criteria and return empty query
      assert.strictEqual(result, '');
    });

    it('should handle invalid operators gracefully', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'invalid',
            value: 'test'
          }
        ]
      });

      // Should skip invalid operator and return empty query
      assert.strictEqual(result, '');
    });

    it('should handle missing values for operators that need them', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: '='
            // Missing value
          }
        ]
      });

      // Should skip criteria missing required value and return empty query
      assert.strictEqual(result, '');
    });

    it('should handle invalid note property names', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'invalidProperty',
            type: 'noteProperty',
            op: 'exists'
          }
        ]
      });

      // Should skip invalid property and return empty query
      assert.strictEqual(result, '');
    });

    it('should throw error for invalid note types', () => {
      assert.throws(() => {
        buildSearchQuery({
          searchCriteria: [
            {
              property: 'type',
              type: 'noteProperty',
              op: '=',
              value: 'invalidType'
            }
          ]
        });
      }, /Invalid note type/);
    });

    it('should throw error for invalid MIME types', () => {
      assert.throws(() => {
        buildSearchQuery({
          searchCriteria: [
            {
              property: 'mime',
              type: 'noteProperty',
              op: '=',
              value: 'invalid/mime/type'
            }
          ]
        });
      }, /Invalid MIME type format/);
    });

    it('should throw error for invalid date formats', () => {
      assert.throws(() => {
        buildSearchQuery({
          searchCriteria: [
            {
              property: 'dateCreated',
              type: 'noteProperty',
              op: '=',
              value: 'invalid-date'
            }
          ]
        });
      }, /Invalid date format/);
    });

    it('should throw error for invalid boolean values', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'invalid'
          }
        ]
      });

      // Should skip invalid boolean value and return empty query
      assert.strictEqual(result, '');
    });
  });

  describe('Complex Real-World Queries', () => {
    it('should build complex project search query', () => {
      const result = buildSearchQuery({
        text: 'project documentation',
        searchCriteria: [
          {
            property: 'project',
            type: 'label',
            op: 'exists',
            logic: 'AND'
          },
          {
            property: 'status',
            type: 'label',
            op: '=',
            value: 'active',
            logic: 'AND'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'text'
          }
        ],
        limit: 20
      });

      assert.ok(result.includes('project documentation'));
      assert.ok(result.includes('#project'));
      assert.ok(result.includes('#status = \'active\''));
      assert.ok(result.includes('note.type = \'text\''));
      assert.ok(result.includes('limit 20'));
    });

    it('should build template-based search query', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'template',
            type: 'relation',
            op: '=',
            value: 'Board',
            logic: 'AND'
          },
          {
            property: 'parents.noteId',
            type: 'noteProperty',
            op: '=',
            value: 'root123',
            logic: 'AND'
          },
          {
            property: 'isArchived',
            type: 'noteProperty',
            op: '=',
            value: 'false'
          }
        ]
      });

      assert.ok(result.includes('~template.noteId'));
      assert.ok(result.includes('note.parents.noteId'));
      assert.ok(result.includes('note.isArchived = false'));
    });

    it('should build date-range search query', () => {
      const result = buildSearchQuery({
        searchCriteria: [
          {
            property: 'dateCreated',
            type: 'noteProperty',
            op: '>=',
            value: 'TODAY-30',
            logic: 'AND'
          },
          {
            property: 'dateModified',
            type: 'noteProperty',
            op: '<=',
            value: 'TODAY',
            logic: 'AND'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'text',
            logic: 'OR'
          },
          {
            property: 'type',
            type: 'noteProperty',
            op: '=',
            value: 'code'
          }
        ]
      });

      assert.ok(result.includes('note.dateCreated >= \'TODAY-30\''));
      assert.ok(result.includes('note.dateModified <= \'TODAY\''));
      assert.ok(result.includes('~(')); // OR group for types
    });
  });

});