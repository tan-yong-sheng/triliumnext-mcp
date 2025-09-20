/**
 * Note Creation Module Unit Tests
 * Tests note creation functionality including duplicate detection, content validation, and attribute processing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the main function we want to test
import {
  handleCreateNote,
  checkDuplicateTitleInDirectory,
  createNoteAttributes
} from '../../../../../build/modules/notes/crud/noteCreation.js';

// Mock axios instance for testing
const createMockAxiosInstance = (responses = {}) => ({
  get: async (url) => {
    // Mock search endpoint for duplicate checking
    if (url.includes('/notes?search=')) {
      return responses.search || { data: { results: [] } };
    }
    return { data: {} };
  },
  post: async (url, data) => {
    // Mock attribute creation endpoint
    if (url === '/attributes') {
      return { data: { attributeId: 'attr123', ...data } };
    }
    // Mock note creation endpoint
    if (url === '/create-note') {
      return { data: { note: { noteId: 'new123' } } };
    }
    return { data: {} };
  }
});

describe('Note Creation Module', () => {

  describe('checkDuplicateTitleInDirectory', () => {
    it('should return false when no duplicates found', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await checkDuplicateTitleInDirectory('parent123', 'New Note', mockAxios);

      assert.strictEqual(result.found, false);
      assert.ok(!result.duplicateNoteId);
    });

    it('should return true with duplicate note ID when duplicate found', async () => {
      const duplicateNote = { noteId: 'existing123', title: 'Existing Note' };
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [duplicateNote] } }
      });

      const result = await checkDuplicateTitleInDirectory('parent123', 'Existing Note', mockAxios);

      assert.strictEqual(result.found, true);
      assert.strictEqual(result.duplicateNoteId, 'existing123');
    });

    it('should handle API errors gracefully and return false', async () => {
      const mockAxios = createMockAxiosInstance();
      mockAxios.get = async () => { throw new Error('API Error'); };

      const result = await checkDuplicateTitleInDirectory('parent123', 'Test Note', mockAxios);

      assert.strictEqual(result.found, false);
      assert.ok(!result.duplicateNoteId);
    });

    it('should use correct search query format', async () => {
      let capturedUrl = '';
      const mockAxios = createMockAxiosInstance();
      mockAxios.get = async (url) => {
        capturedUrl = url;
        return { data: { results: [] } };
      };

      await checkDuplicateTitleInDirectory('parent123', 'Test Note', mockAxios);

      assert.ok(capturedUrl.includes('note.title'));
      assert.ok(capturedUrl.includes('Test%20Note'));
      assert.ok(capturedUrl.includes('note.parents.noteId'));
      assert.ok(capturedUrl.includes('parent123'));
    });
  });

  describe('createNoteAttributes', () => {
    it('should create label attributes successfully', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test', position: 10 }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.cleaningResults.length, 0);
      assert.strictEqual(result.results[0].data.noteId, 'note123');
      assert.strictEqual(result.results[0].data.name, 'project');
    });

    it('should clean attribute names with leading symbols', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: '#project', value: 'test' }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.cleaningResults.length, 1);
      assert.strictEqual(result.results[0].data.name, 'project'); // Should be cleaned
      assert.strictEqual(result.cleaningResults[0].cleanedName, 'project');
    });

    it('should translate template relation names to note IDs', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'relation', name: 'template', value: 'Board' }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results.length, 1);
      // Should translate 'Board' to the actual template note ID
      assert.ok(result.results[0].data.value.startsWith('_template_'));
    });

    it('should handle template translation errors', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'relation', name: 'template', value: 'Invalid Template' }
      ];

      await assert.rejects(
        async () => await createNoteAttributes('note123', attributes, mockAxios),
        /Invalid template relation/
      );
    });

    it('should create multiple attributes in parallel', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test1' },
        { type: 'label', name: 'status', value: 'active' },
        { type: 'relation', name: 'template', value: 'Board' }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results.length, 3);
      assert.ok(Array.isArray(result.cleaningResults));
    });

    it('should use default position when not specified', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test' }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results[0].data.position, 10);
    });

    it('should handle custom position when specified', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test', position: 50 }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results[0].data.position, 50);
    });

    it('should set isInheritable to false by default', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test' }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results[0].data.isInheritable, false);
    });

    it('should respect custom isInheritable setting', async () => {
      const mockAxios = createMockAxiosInstance();
      const attributes = [
        { type: 'label', name: 'project', value: 'test', isInheritable: true }
      ];

      const result = await createNoteAttributes('note123', attributes, mockAxios);

      assert.strictEqual(result.results[0].data.isInheritable, true);
    });
  });

  describe('handleCreateNote', () => {
    it('should validate required parameters', async () => {
      const mockAxios = createMockAxiosInstance();

      await assert.rejects(
        async () => await handleCreateNote({
          parentNoteId: undefined,
          title: 'Test Note',
          type: 'text'
        }, mockAxios),
        /parentNoteId, title, and type are required/
      );

      await assert.rejects(
        async () => await handleCreateNote({
          parentNoteId: 'parent123',
          type: 'text'
        }, mockAxios),
        /parentNoteId, title, and type are required/
      );

      await assert.rejects(
        async () => await handleCreateNote({
          parentNoteId: 'parent123',
          title: 'Test Note'
        }, mockAxios),
        /parentNoteId, title, and type are required/
      );
    });

    it('should detect duplicate titles and return user choice options', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [{ noteId: 'existing123' }] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Existing Note',
        type: 'text'
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, true);
      assert.strictEqual(result.duplicateNoteId, 'existing123');
      assert.ok(result.message.includes('existing note'));
      assert.ok(result.choices);
      assert.ok(result.nextSteps);
    });

    it('should create note successfully without duplicates', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'New Note',
        type: 'text',
        content: '<p>Test content</p>'
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
      assert.ok(result.message.includes('Created note'));
    });

    it('should handle empty content by defaulting to empty string', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'New Note',
        type: 'text'
        // No content provided
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
    });

    it('should auto-correct note type for container templates', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Board Note',
        type: 'text', // Should be corrected to 'book'
        content: '',
        attributes: [
          { type: 'relation', name: 'template', value: 'Board' }
        ]
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      // Note type should be auto-corrected to 'book' for Board template
      assert.strictEqual(result.noteId, 'new123');
    });

    it('should reject invalid content for note type', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Invalid Note',
        type: 'render', // Render notes should have empty content
        content: '<p>This should not be allowed</p>'
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
    });

    it('should create attributes when provided', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Note with Attributes',
        type: 'text',
        content: '<p>Test content</p>',
        attributes: [
          { type: 'label', name: 'project', value: 'test' }
        ]
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
    });

    it('should handle attribute creation errors gracefully', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });
      // Make attribute creation fail
      mockAxios.post = async (url) => {
        if (url === '/attributes') {
          throw new Error('Attribute creation failed');
        }
        return { data: { note: { noteId: 'new123' } } };
      };

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Note with Failed Attributes',
        type: 'text',
        content: '<p>Test content</p>',
        attributes: [
          { type: 'label', name: 'project', value: 'test' }
        ]
      }, mockAxios);

      // Note should still be created despite attribute failure
      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
    });

    it('should include MIME type when specified', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Code Note',
        type: 'code',
        content: 'console.log("Hello");',
        mime: 'application/typescript'
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
    });

    it('should handle complex attribute cleaning scenarios', async () => {
      const mockAxios = createMockAxiosInstance({
        search: { data: { results: [] } }
      });

      const result = await handleCreateNote({
        parentNoteId: 'parent123',
        title: 'Note with Complex Attributes',
        type: 'text',
        content: '<p>Test content</p>',
        attributes: [
          { type: 'label', name: '#project', value: 'test' }, // Should be cleaned
          { type: 'label', name: 'status', value: 'active' },
          { type: 'relation', name: '~template', value: 'Board' } // Should be cleaned and translated
        ]
      }, mockAxios);

      assert.strictEqual(result.duplicateFound, false);
      assert.strictEqual(result.noteId, 'new123');
      // Should include cleaning message in response
      assert.ok(result.attributeCleaningMessage);
    });
  });

});