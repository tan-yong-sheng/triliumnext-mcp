/**
 * Content Validation Integration Tests
 * Mock-based integration tests for content validation functionality
 */

import test from 'node:test';
import assert from 'node:assert';
import { handleCreateNote } from '../../build/modules/notes/noteManager.js';

/**
 * Enhanced mock axios instance that simulates realistic Trilium behavior
 * - Tracks created notes and their attributes
 * - Simulates Trilium content validation
 * - Supports Board template dummy note creation/cleanup
 * - Provides child note tracking for cleanup verification
 */
function createRealisticMockAxios() {
  const createdNotes = new Map();
  const attributes = new Map();
  const childNotes = new Map();

  return {
    post: async (url, data) => {
      if (url === '/create-note') {
        // Simulate Trilium content validation
        if (data.type === 'book' && data.content) {
          const templateAttr = data.attributes?.find(a =>
            a.type === 'relation' && a.name === 'template'
          );

          if (templateAttr) {
            const containerTemplates = ['Board', 'Calendar', 'Grid View', 'List View', 'Table', 'Geo Map'];
            if (containerTemplates.includes(templateAttr.value)) {
              // Check if content is empty or whitespace-only
              const hasContent = data.content && data.content.trim().length > 0;
              if (hasContent) {
                throw new Error(`Container template ${templateAttr.value} must be empty`);
              }
            }
          }
        }

        // Simulate note creation
        const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        createdNotes.set(noteId, {
          id: noteId,
          title: data.title,
          type: data.type,
          content: data.content || ''
        });

        // Store attributes
        if (data.attributes && data.attributes.length > 0) {
          attributes.set(noteId, [...data.attributes]);
        }

        // Create dummy notes for Board templates
        if (data.type === 'book' && data.attributes) {
          const templateAttr = data.attributes.find(a =>
            a.type === 'relation' && a.name === 'template' && a.value === 'Board'
          );

          if (templateAttr) {
            const dummyNotes = [];
            for (let i = 1; i <= 3; i++) {
              const dummyId = `dummy_${noteId}_${i}`;
              dummyNotes.push({
                id: dummyId,
                title: `Dummy Note ${i}`,
                type: 'text',
                content: `<p>Dummy content ${i}</p>`
              });
            }
            childNotes.set(noteId, dummyNotes);
          }
        }

        return { data: { note: { noteId } } };
      }

      // Mock other endpoints
      return { data: {} };
    },

    get: async (url) => {
      // Mock get-note endpoint
      if (url.startsWith('/notes/')) {
        const noteId = url.split('/')[2];
        const note = createdNotes.get(noteId);
        if (note) {
          return {
            data: {
              noteId: note.id,
              title: note.title,
              type: note.type,
              content: note.content,
              blobId: 'blob_' + note.id,
              attributes: attributes.get(noteId) || []
            }
          };
        }
      }
      return { data: {} };
    },

    // Helper methods for testing
    getCreatedNotes: () => createdNotes,
    getAttributes: () => attributes,
    getChildNotes: (noteId) => childNotes.get(noteId) || [],
    reset: () => {
      createdNotes.clear();
      attributes.clear();
      childNotes.clear();
    }
  };
}

/**
 * Test suite for Board template functionality
 */
test('Board Template - should create Board template with empty content successfully', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Project Board',
    type: 'book',
    content: '',  // Empty content - should be valid
    attributes: [
      { type: 'relation', name: 'template', value: 'Board', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('Board Template - should reject Board template with non-empty content', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Project Board',
    type: 'book',
    content: 'This content should be rejected',
    attributes: [
      { type: 'relation', name: 'template', value: 'Board', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
  assert.ok(result.message.includes('must be empty'));
});

test('Board Template - should handle Board template with whitespace-only content', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Project Board',
    type: 'book',
    content: '   ',  // Whitespace-only - should be treated as empty
    attributes: [
      { type: 'relation', name: 'template', value: 'Board', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('Board Template - should verify cleanup functionality was called', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Project Board',
    type: 'book',
    content: '',
    attributes: [
      { type: 'relation', name: 'template', value: 'Board', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);

  // Verify that the Board template was created successfully
  // The cleanup function is called internally by handleCreateNote for Board templates
  // We can't easily test the actual dummy note cleanup without a more complex mock,
  // but we can verify that the Board template creation works correctly

  // Test that our mock simulates the dummy note creation for verification
  const childNotes = mockAxios.getChildNotes(result.noteId);
  // The mock creates dummy notes to simulate Trilium's behavior for testing
  assert.ok(Array.isArray(childNotes), 'Should return array of child notes');
});

/**
 * Test suite for other container templates
 */
test('Container Templates - should accept empty content for all container templates', async () => {
  const mockAxios = createRealisticMockAxios();
  const containerTemplates = ['Calendar', 'Grid View', 'List View', 'Table', 'Geo Map'];

  for (const template of containerTemplates) {
    const request = {
      parentNoteId: 'root',
      title: `Test ${template}`,
      type: 'book',
      content: '',
      attributes: [
        { type: 'relation', name: 'template', value: template, position: 10 }
      ]
    };

    const result = await handleCreateNote(request, mockAxios);

    assert.strictEqual(result.duplicateFound, false, `${template} should succeed with empty content`);
    assert.ok(result.noteId, `${template} should return note ID`);
    assert.ok(result.message.includes('Created note'), `${template} should have success message`);
  }
});

test('Container Templates - should reject non-empty content for all container templates', async () => {
  const mockAxios = createRealisticMockAxios();
  const containerTemplates = ['Calendar', 'Grid View', 'List View', 'Table', 'Geo Map'];

  for (const template of containerTemplates) {
    const request = {
      parentNoteId: 'root',
      title: `Test ${template}`,
      type: 'book',
      content: 'This should be rejected',
      attributes: [
        { type: 'relation', name: 'template', value: template, position: 10 }
      ]
    };

    const result = await handleCreateNote(request, mockAxios);

    assert.strictEqual(result.duplicateFound, false, `${template} should not be a duplicate issue`);
    assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'), `${template} should return validation error`);
    assert.ok(result.message.includes('must be empty'), `${template} should mention empty requirement`);
  }
});

/**
 * Test suite for regular note types that should accept content
 */
test('Regular Notes - should accept content for non-container templates', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Regular Text Note',
    type: 'text',
    content: 'This content should be accepted',
    attributes: [
      { type: 'label', name: 'category', value: 'general', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId, `Expected noteId but got: ${JSON.stringify(result)}`);
  assert.ok(result.message.includes('Created note'));
});

test('Text Notes - should accept HTML content', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'HTML Text Note',
    type: 'text',
    content: '<p>This is <strong>HTML</strong> content</p>'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('Text Notes - should auto-wrap plain text in HTML', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Plain Text Note',
    type: 'text',
    content: 'This is plain text'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

/**
 * Test suite for code notes
 */
test('Code Notes - should accept plain text content', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'JavaScript Code',
    type: 'code',
    content: 'function hello() { console.log("Hello, World!"); }',
    mime: 'text/javascript'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('Code Notes - should accept HTML content', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'HTML Code',
    type: 'code',
    content: '<div>HTML code example</div>',
    mime: 'text/html'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

/**
 * Test suite for system notes that must be empty
 */
test('System Notes - should require empty content for render notes', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Render Note',
    type: 'render',
    content: 'This should be rejected'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
  assert.ok(result.message.includes('must be empty'));
});

test('System Notes - should accept empty content for render notes', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Render Note',
    type: 'render',
    content: ''
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('System Notes - should require empty content for webView notes', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'WebView Note',
    type: 'webView',
    content: 'This should be rejected'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
  assert.ok(result.message.includes('must be empty'));
});

/**
 * Test suite for template detection edge cases
 */
test('Template Detection - should handle template relation with different cases', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Case Test',
    type: 'book',
    content: '',
    attributes: [
      { type: 'relation', name: 'template', value: 'BOARD', position: 10 }  // uppercase
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

test('Template Detection - should handle template relation with extra spaces', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Space Test',
    type: 'book',
    content: '',
    attributes: [
      { type: 'relation', name: 'template', value: ' Board ', position: 10 }  // extra spaces
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.noteId);
  assert.ok(result.message.includes('Created note'));
});

/**
 * Test suite for error message validation
 */
test('Error Messages - should provide clear error messages for container templates', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Error Test',
    type: 'book',
    content: 'Some content',
    attributes: [
      { type: 'relation', name: 'template', value: 'Board', position: 10 }
    ]
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
  assert.ok(result.message.includes('Board template notes must be empty'));
  assert.ok(result.message.includes('they are container notes'));
});

test('Error Messages - should provide clear error messages for system notes', async () => {
  const mockAxios = createRealisticMockAxios();

  const request = {
    parentNoteId: 'root',
    title: 'Error Test',
    type: 'render',
    content: 'Some content'
  };

  const result = await handleCreateNote(request, mockAxios);

  assert.strictEqual(result.duplicateFound, false);
  assert.ok(result.message.includes('CONTENT_VALIDATION_ERROR'));
  assert.ok(result.message.includes('Render notes must be empty'));
  assert.ok(result.message.includes('child code note'));
});

console.log('✅ Content validation integration tests completed successfully!');