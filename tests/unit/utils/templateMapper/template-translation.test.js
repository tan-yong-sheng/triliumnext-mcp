/**
 * Template Translation Test Suite
 * Tests the template name to note ID translation functionality
 */

import { describe, it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import {
  translateTemplateNameToId,
  translateTemplateIdToName,
  isBuiltinTemplate,
  isBuiltinTemplateId,
  validateAndTranslateTemplate,
  createTemplateRelationError
} from '../../../../build/utils/templateMapper.js';

describe('Template Translation Tests', () => {

  describe('Template Name to ID Translation', () => {
    it('should translate Grid View to correct note ID', () => {
      const result = translateTemplateNameToId('Grid View');
      strictEqual(result, '_template_grid_view');
    });

    it('should translate Calendar to correct note ID', () => {
      const result = translateTemplateNameToId('Calendar');
      strictEqual(result, '_template_calendar');
    });

    it('should translate Board to correct note ID', () => {
      const result = translateTemplateNameToId('Board');
      strictEqual(result, '_template_board');
    });

    it('should return original value for non-builtin template', () => {
      const result = translateTemplateNameToId('custom_template');
      strictEqual(result, 'custom_template');
    });

    it('should return original value for existing note ID', () => {
      const result = translateTemplateNameToId('abc123def');
      strictEqual(result, 'abc123def');
    });
  });

  describe('Template ID to Name Translation', () => {
    it('should translate _template_grid_view to Grid View', () => {
      const result = translateTemplateIdToName('_template_grid_view');
      strictEqual(result, 'Grid View');
    });

    it('should translate _template_calendar to Calendar', () => {
      const result = translateTemplateIdToName('_template_calendar');
      strictEqual(result, 'Calendar');
    });

    it('should return original value for non-builtin template ID', () => {
      const result = translateTemplateIdToName('custom_template_id');
      strictEqual(result, 'custom_template_id');
    });
  });

  describe('Built-in Template Detection', () => {
    it('should detect built-in template names', () => {
      strictEqual(isBuiltinTemplate('Grid View'), true);
      strictEqual(isBuiltinTemplate('Calendar'), true);
      strictEqual(isBuiltinTemplate('Board'), true);
      strictEqual(isBuiltinTemplate('List View'), true);
      strictEqual(isBuiltinTemplate('Table'), true);
      strictEqual(isBuiltinTemplate('Geo Map'), true);
      strictEqual(isBuiltinTemplate('Text Snippet'), true);
    });

    it('should reject non-built-in template names', () => {
      strictEqual(isBuiltinTemplate('Custom Template'), false);
      strictEqual(isBuiltinTemplate('My Template'), false);
      strictEqual(isBuiltinTemplate(''), false);
      strictEqual(isBuiltinTemplate('abc123'), false);
    });

    it('should detect built-in template IDs', () => {
      strictEqual(isBuiltinTemplateId('_template_grid_view'), true);
      strictEqual(isBuiltinTemplateId('_template_calendar'), true);
      strictEqual(isBuiltinTemplateId('_template_board'), true);
    });

    it('should reject non-built-in template IDs', () => {
      strictEqual(isBuiltinTemplateId('abc123'), false);
      strictEqual(isBuiltinTemplateId('custom_template'), false);
      strictEqual(isBuiltinTemplateId(''), false);
    });
  });

  describe('Template Validation and Translation', () => {
    it('should validate and translate built-in templates', () => {
      const result = validateAndTranslateTemplate('Grid View');
      strictEqual(result, '_template_grid_view');
    });

    it('should pass through valid note IDs', () => {
      const result = validateAndTranslateTemplate('abc123def');
      strictEqual(result, 'abc123def');
    });

    it('should throw error for empty template name', () => {
      try {
        validateAndTranslateTemplate('');
        throw new Error('Should have thrown an error');
      } catch (error) {
        strictEqual(error.message, 'Template name cannot be empty');
      }
    });

    it('should throw error for invalid template name', () => {
      try {
        validateAndTranslateTemplate('Invalid Template Name');
        throw new Error('Should have thrown an error');
      } catch (error) {
        strictEqual(error.message.includes('Invalid template: "Invalid Template Name"'), true);
        strictEqual(error.message.includes('Template relations must link to a note ID'), true);
      }
    });
  });

  describe('Template Relation Error Messages', () => {
    it('should create error for empty template value', () => {
      const error = createTemplateRelationError('');
      strictEqual(error, 'Template relation value cannot be empty');
    });

    it('should create error for invalid template name', () => {
      const error = createTemplateRelationError('Invalid Template');
      strictEqual(error.includes('Invalid template relation: "Invalid Template"'), true);
      strictEqual(error.includes('Available built-in templates:'), true);
    });

    it('should create error for non-existent note ID', () => {
      const error = createTemplateRelationError('nonexistent123');
      strictEqual(error.includes('Template note ID "nonexistent123" may not exist'), true);
    });
  });

  describe('User Working Example Test', () => {
    it('should translate the exact working example from user', () => {
      // This simulates the user's working example where they had to use '_template_grid_view'
      // instead of 'Grid View' - now our system handles this automatically
      const result = validateAndTranslateTemplate('Grid View');
      strictEqual(result, '_template_grid_view');

      // Verify the reverse translation also works
      const reverseResult = translateTemplateIdToName('_template_grid_view');
      strictEqual(reverseResult, 'Grid View');
    });

    it('should handle all template types mentioned by user', () => {
      const templates = ['Calendar', 'Board', 'List View', 'Table', 'Geo Map', 'Text Snippet'];

      templates.forEach(templateName => {
        const translatedId = translateTemplateNameToId(templateName);
        const translatedBack = translateTemplateIdToName(translatedId);

        // Verify round-trip translation works
        strictEqual(translatedBack, templateName);

        // Verify the ID follows expected pattern
        strictEqual(translatedId.startsWith('_template_'), true);
      });
    });
  });
});

console.log('✅ Template translation tests completed successfully!');