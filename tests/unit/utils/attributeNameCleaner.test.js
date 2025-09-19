/**
 * Attribute Name Cleaner Unit Tests
 * Tests for auto-correction of common LLM mistakes in attribute names
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the cleaning functions directly from the build directory
import {
  cleanAttributeName,
  generateCleaningMessage,
  needsCleaning
} from '../../../build/utils/attributeNameCleaner.js';

describe('Attribute Name Cleaner', () => {

  describe('cleanAttributeName', () => {
    it('should remove leading # from label names', () => {
      const result = cleanAttributeName('#startDate', 'label');
      assert.strictEqual(result.cleanedName, 'startDate');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should remove leading ~ from relation names', () => {
      const result = cleanAttributeName('~template', 'relation');
      assert.strictEqual(result.cleanedName, 'template');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'~\' symbol']);
    });

    it('should remove leading label: prefix from attribute names', () => {
      const result = cleanAttributeName('label:startDate', 'label');
      assert.strictEqual(result.cleanedName, 'startDate');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'label:\' prefix']);
    });

    it('should remove leading relation: prefix from attribute names', () => {
      const result = cleanAttributeName('relation:template', 'relation');
      assert.strictEqual(result.cleanedName, 'template');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'relation:\' prefix']);
    });

    it('should not remove trailing # from label names', () => {
      const result = cleanAttributeName('project#', 'label');
      assert.strictEqual(result.cleanedName, 'project#');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });

    it('should not remove trailing ~ from relation names', () => {
      const result = cleanAttributeName('template~', 'relation');
      assert.strictEqual(result.cleanedName, 'template~');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });

    it('should only remove leading symbols, keep trailing symbols', () => {
      const result = cleanAttributeName('#priority#', 'label');
      assert.strictEqual(result.cleanedName, 'priority#');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should handle whitespace trimming', () => {
      const result = cleanAttributeName('  #startDate  ', 'label');
      assert.strictEqual(result.cleanedName, 'startDate');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should not modify clean attribute names', () => {
      const result = cleanAttributeName('startDate', 'label');
      assert.strictEqual(result.cleanedName, 'startDate');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });

    it('should handle edge cases with empty strings', () => {
      const result = cleanAttributeName('', 'label');
      assert.strictEqual(result.cleanedName, '');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });

    it('should handle null/undefined inputs', () => {
      const result1 = cleanAttributeName(null, 'label');
      assert.strictEqual(result1.cleanedName, null);
      assert.strictEqual(result1.wasCleaned, false);

      const result2 = cleanAttributeName(undefined, 'relation');
      assert.strictEqual(result2.cleanedName, undefined);
      assert.strictEqual(result2.wasCleaned, false);
    });

    it('should handle complex mixed symbol cases', () => {
      const result = cleanAttributeName('#~startDate#~', 'label');
      assert.strictEqual(result.cleanedName, '~startDate#~');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should preserve internal symbols', () => {
      const result = cleanAttributeName('start#date', 'label');
      assert.strictEqual(result.cleanedName, 'start#date');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });

    it('should handle multiple leading symbols', () => {
      const result = cleanAttributeName('##priority', 'label');
      assert.strictEqual(result.cleanedName, '#priority');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should handle multiple corrections in sequence (prefix + symbol)', () => {
      const result = cleanAttributeName('label:#startDate', 'label');
      assert.strictEqual(result.cleanedName, 'startDate');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, [
        'Removed leading \'label:\' prefix',
        'Removed leading \'#\' symbol'
      ]);
    });

    it('should handle multiple corrections in sequence (prefix + symbol for relation)', () => {
      const result = cleanAttributeName('relation:~template', 'relation');
      assert.strictEqual(result.cleanedName, 'template');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, [
        'Removed leading \'relation:\' prefix',
        'Removed leading \'~\' symbol'
      ]);
    });

    it('should not remove multiple trailing symbols', () => {
      const result = cleanAttributeName('template~~', 'relation');
      assert.strictEqual(result.cleanedName, 'template~~');
      assert.strictEqual(result.wasCleaned, false);
      assert.deepStrictEqual(result.corrections, []);
    });
  });

  describe('needsCleaning', () => {
    it('should return true for names with leading #', () => {
      assert.strictEqual(needsCleaning('#startDate', 'label'), true);
    });

    it('should return true for names with leading ~', () => {
      assert.strictEqual(needsCleaning('~template', 'relation'), true);
    });

    it('should return true for names with leading label: prefix', () => {
      assert.strictEqual(needsCleaning('label:startDate', 'label'), true);
      assert.strictEqual(needsCleaning('label:endDate', 'relation'), true);
    });

    it('should return true for names with leading relation: prefix', () => {
      assert.strictEqual(needsCleaning('relation:template', 'relation'), true);
      assert.strictEqual(needsCleaning('relation:author', 'label'), true);
    });

    it('should return false for names with trailing #', () => {
      assert.strictEqual(needsCleaning('project#', 'label'), false);
    });

    it('should return false for names with trailing ~', () => {
      assert.strictEqual(needsCleaning('template~', 'relation'), false);
    });

    it('should return false for clean names', () => {
      assert.strictEqual(needsCleaning('startDate', 'label'), false);
      assert.strictEqual(needsCleaning('template', 'relation'), false);
    });

    it('should return false for names with internal symbols', () => {
      assert.strictEqual(needsCleaning('start#date', 'label'), false);
      assert.strictEqual(needsCleaning('template~name', 'relation'), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(needsCleaning('', 'label'), false);
      assert.strictEqual(needsCleaning(null, 'label'), false);
      assert.strictEqual(needsCleaning(undefined, 'relation'), false);
    });

    it('should detect only leading symbol patterns', () => {
      assert.strictEqual(needsCleaning('#priority#', 'label'), true);
      assert.strictEqual(needsCleaning('~template~', 'relation'), true);
      assert.strictEqual(needsCleaning('  #startDate  ', 'label'), true);
      assert.strictEqual(needsCleaning('priority#', 'label'), false);
      assert.strictEqual(needsCleaning('template~', 'relation'), false);
    });

    it('should be type-specific', () => {
      assert.strictEqual(needsCleaning('#startDate', 'label'), true);
      assert.strictEqual(needsCleaning('#startDate', 'relation'), false);
      assert.strictEqual(needsCleaning('~template', 'relation'), true);
      assert.strictEqual(needsCleaning('~template', 'label'), false);
    });
  });

  describe('generateCleaningMessage', () => {
    it('should generate message for single correction', () => {
      const results = [
        { wasCleaned: true, corrections: ['Removed leading \'#\' symbol'] }
      ];
      const message = generateCleaningMessage(results);
      assert.ok(message.includes('Auto-Corrections Applied'));
      assert.ok(message.includes('Fixed 1 attribute name(s)'));
      assert.ok(message.includes('1× Removed leading \'#\' symbol'));
    });

    it('should generate message for multiple corrections', () => {
      const results = [
        { wasCleaned: true, corrections: ['Removed leading \'#\' symbol'] },
        { wasCleaned: true, corrections: ['Removed leading \'~\' symbol', 'Removed trailing \'#\' symbol'] }
      ];
      const message = generateCleaningMessage(results);
      assert.ok(message.includes('Auto-Corrections Applied'));
      assert.ok(message.includes('Fixed 2 attribute name(s)'));
      assert.ok(message.includes('1× Removed leading \'#\' symbol'));
      assert.ok(message.includes('1× Removed leading \'~\' symbol'));
      assert.ok(message.includes('1× Removed trailing \'#\' symbol'));
    });

    it('should return empty string for no corrections', () => {
      const results = [
        { wasCleaned: false, corrections: [] },
        { wasCleaned: false, corrections: [] }
      ];
      const message = generateCleaningMessage(results);
      assert.strictEqual(message, '');
    });

    it('should include educational information', () => {
      const results = [
        { wasCleaned: true, corrections: ['Removed leading \'#\' symbol'] }
      ];
      const message = generateCleaningMessage(results);
      assert.ok(message.includes('Common LLM Mistakes Fixed'));
      assert.ok(message.includes('Attribute names should NOT start with label: or relation: prefixes'));
      assert.ok(message.includes('Attribute names should NOT start with # or ~ symbols'));
      assert.ok(message.includes('# symbols are for attribute values in search queries'));
      assert.ok(message.includes('~ symbols are for attribute values in search queries'));
    });

    it('should handle complex correction scenarios', () => {
      const results = [
        { wasCleaned: true, corrections: ['Removed leading \'#\' symbol'] },
        { wasCleaned: true, corrections: ['Removed leading \'~\' symbol'] },
        { wasCleaned: true, corrections: ['Removed leading \'#\' symbol'] }
      ];
      const message = generateCleaningMessage(results);
      assert.ok(message.includes('Fixed 3 attribute name(s)'));
      assert.ok(message.includes('2× Removed leading \'#\' symbol'));
      assert.ok(message.includes('1× Removed leading \'~\' symbol'));
    });

    it('should handle prefix corrections in message generation', () => {
      const results = [
        { wasCleaned: true, corrections: ['Removed leading \'label:\' prefix'] },
        { wasCleaned: true, corrections: ['Removed leading \'relation:\' prefix'] }
      ];
      const message = generateCleaningMessage(results);
      assert.ok(message.includes('Fixed 2 attribute name(s)'));
      assert.ok(message.includes('1× Removed leading \'label:\' prefix'));
      assert.ok(message.includes('1× Removed leading \'relation:\' prefix'));
    });
  });

  describe('Integration with attribute types', () => {
    it('should work correctly with label attributes', () => {
      const result = cleanAttributeName('#important', 'label');
      assert.strictEqual(result.cleanedName, 'important');
      assert.strictEqual(result.wasCleaned, true);
    });

    it('should work correctly with relation attributes', () => {
      const result = cleanAttributeName('~template', 'relation');
      assert.strictEqual(result.cleanedName, 'template');
      assert.strictEqual(result.wasCleaned, true);
    });

    it('should handle mixed cases for both types', () => {
      const labelResult = cleanAttributeName('##project', 'label');
      assert.strictEqual(labelResult.cleanedName, '#project');
      assert.strictEqual(labelResult.wasCleaned, true);

      const relationResult = cleanAttributeName('~~template', 'relation');
      assert.strictEqual(relationResult.cleanedName, '~template');
      assert.strictEqual(relationResult.wasCleaned, true);
    });

    it('should preserve valid attribute names for both types', () => {
      const labelResult = cleanAttributeName('priority', 'label');
      assert.strictEqual(labelResult.cleanedName, 'priority');
      assert.strictEqual(labelResult.wasCleaned, false);

      const relationResult = cleanAttributeName('author', 'relation');
      assert.strictEqual(relationResult.cleanedName, 'author');
      assert.strictEqual(relationResult.wasCleaned, false);
    });
  });

  describe('Real-world LLM mistake patterns', () => {
    it('should fix common LLM mistake patterns', () => {
      const testCases = [
        { input: '#startDate', expected: 'startDate', type: 'label' },
        { input: '#endDate', expected: 'endDate', type: 'label' },
        { input: '#priority', expected: 'priority', type: 'label' },
        { input: '#status', expected: 'status', type: 'label' },
        { input: '~template', expected: 'template', type: 'relation' },
        { input: '~author', expected: 'author', type: 'relation' },
        { input: '~publisher', expected: 'publisher', type: 'relation' },
        { input: '#category', expected: 'category', type: 'label' },
        { input: '~template~', expected: 'template~', type: 'relation' },
        { input: '#project#', expected: 'project#', type: 'label' },
        { input: '#language', expected: 'language', type: 'label' },
        { input: '~version', expected: 'version', type: 'relation' },
        { input: 'label:startDate', expected: 'startDate', type: 'label' },
        { input: 'label:endDate', expected: 'endDate', type: 'label' },
        { input: 'relation:template', expected: 'template', type: 'relation' },
        { input: 'relation:author', expected: 'author', type: 'relation' },
        { input: 'label:#priority', expected: 'priority', type: 'label' },
        { input: 'relation:~template', expected: 'template', type: 'relation' }
      ];

      testCases.forEach(({ input, expected, type }) => {
        const result = cleanAttributeName(input, type);
        assert.strictEqual(result.cleanedName, expected, `Failed for input: ${input}`);
        assert.strictEqual(result.wasCleaned, true, `Expected cleaning for input: ${input}`);
      });
    });

    it('should not modify valid real-world attribute names', () => {
      const validCases = [
        { input: 'startDate', type: 'label' },
        { input: 'endDate', type: 'label' },
        { input: 'priority', type: 'label' },
        { input: 'template', type: 'relation' },
        { input: 'author', type: 'relation' },
        { input: 'publisher', type: 'relation' },
        { input: 'category', type: 'label' },
        { input: 'project', type: 'label' },
        { input: 'language', type: 'label' },
        { input: 'version', type: 'relation' },
        { input: 'start#date', type: 'label' }, // Internal symbols preserved
        { input: 'template#name', type: 'relation' } // Internal symbols preserved
      ];

      validCases.forEach(({ input, type }) => {
        const result = cleanAttributeName(input, type);
        assert.strictEqual(result.cleanedName, input, `Should not modify valid input: ${input}`);
        assert.strictEqual(result.wasCleaned, false, `Should not clean valid input: ${input}`);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle strings with only symbols', () => {
      const result = cleanAttributeName('###', 'label');
      assert.strictEqual(result.cleanedName, '##');
      assert.strictEqual(result.wasCleaned, true);
    });

    it('should handle strings with only whitespace', () => {
      const result = cleanAttributeName('   ', 'label');
      assert.strictEqual(result.cleanedName, '');
      assert.strictEqual(result.wasCleaned, false);
    });

    it('should handle mixed whitespace and symbols', () => {
      const result = cleanAttributeName('  #  startDate  #  ', 'label');
      assert.strictEqual(result.cleanedName, 'startDate  #');
      assert.strictEqual(result.wasCleaned, true);
      assert.deepStrictEqual(result.corrections, ['Removed leading \'#\' symbol']);
    });

    it('should handle numeric attribute names', () => {
      const result = cleanAttributeName('#123', 'label');
      assert.strictEqual(result.cleanedName, '123');
      assert.strictEqual(result.wasCleaned, true);
    });

    it('should handle special characters in attribute names', () => {
      const result = cleanAttributeName('#user-name', 'label');
      assert.strictEqual(result.cleanedName, 'user-name');
      assert.strictEqual(result.wasCleaned, true);
    });

    it('should handle user example case with label: prefixes', () => {
      const testCases = [
        { input: 'label:startDate', expected: 'startDate' },
        { input: 'label:endDate', expected: 'endDate' },
        { input: 'label:startTime', expected: 'startTime' },
        { input: 'label:endTime', expected: 'endTime' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = cleanAttributeName(input, 'label');
        assert.strictEqual(result.cleanedName, expected, `Failed for input: ${input}`);
        assert.strictEqual(result.wasCleaned, true, `Expected cleaning for input: ${input}`);
        assert.deepStrictEqual(result.corrections, ['Removed leading \'label:\' prefix']);
      });
    });
  });

});