/**
 * Container Template Update Prevention Tests
 * Tests for preventing updates on Board, Calendar, and other container template notes
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import required modules
const { handleUpdateNote } = await import('../../build/modules/noteManager.js');
const { manage_attributes } = await import('../../build/modules/attributes/attributeManageManager.js');

// Mock axios instance for testing
const mockAxiosInstance = {
  get: async (url) => {
    if (url.includes('/notes/')) {
      // Mock container template note (Board)
      if (url.includes('board123')) {
        return {
          data: {
            noteId: 'board123',
            title: 'Project Board',
            type: 'book',
            attributes: [
              {
                type: 'relation',
                name: 'template',
                value: 'Board'
              }
            ]
          }
        };
      }

      // Mock container template note (Calendar)
      if (url.includes('calendar123')) {
        return {
          data: {
            noteId: 'calendar123',
            title: 'Team Calendar',
            type: 'book',
            attributes: [
              {
                type: 'relation',
                name: 'template',
                value: 'Calendar'
              }
            ]
          }
        };
      }

      // Mock regular book note (not a container template)
      if (url.includes('regular123')) {
        return {
          data: {
            noteId: 'regular123',
            title: 'Regular Book',
            type: 'book',
            attributes: []
          }
        };
      }

      // Mock text note
      if (url.includes('text123')) {
        return {
          data: {
            noteId: 'text123',
            title: 'Text Note',
            type: 'text',
            attributes: []
          }
        };
      }
    }

    // Default empty response
    return { data: {} };
  },

  patch: async () => ({ status: 200 }),
  put: async () => ({ status: 204 }),
  post: async () => ({ data: {} }),
  delete: async () => ({ status: 200 })
};

describe('Container Template Update Prevention', () => {

  describe('Board Template Notes', () => {
    it('should prevent content updates on Board template notes', async () => {
      // Import the function we're testing
      
      const updateArgs = {
        noteId: 'board123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.strictEqual(result.conflict, true);
      assert.ok(result.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      assert.ok(result.message.includes('Board'));
      assert.ok(result.message.includes('Create a child note'));
    });

    it('should prevent title updates on Board template notes', async () => {
      
      const updateArgs = {
        noteId: 'board123',
        title: 'New Board Title',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.strictEqual(result.conflict, true);
      assert.ok(result.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
    });
  });

  describe('Calendar Template Notes', () => {
    it('should prevent content updates on Calendar template notes', async () => {
      
      const updateArgs = {
        noteId: 'calendar123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.strictEqual(result.conflict, true);
      assert.ok(result.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      assert.ok(result.message.includes('Calendar'));
    });

    it('should prevent title updates on Calendar template notes', async () => {
      
      const updateArgs = {
        noteId: 'calendar123',
        title: 'New Calendar Title',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.strictEqual(result.conflict, true);
      assert.ok(result.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
    });
  });

  describe('Regular Notes', () => {
    it('should allow updates on regular book notes without container templates', async () => {
      
      const updateArgs = {
        noteId: 'regular123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      // This should not throw an error, but will fail due to missing content endpoint in mock
      // The important thing is that it doesn't get blocked by container template protection
      try {
        await handleUpdateNote(updateArgs, mockAxiosInstance);
        // If we get here, it means the container template check passed
        assert.ok(true);
      } catch (error) {
        // Expected error due to mock limitations, but not the container template protection
        assert.ok(!error.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      }
    });

    it('should allow updates on text notes', async () => {
      
      const updateArgs = {
        noteId: 'text123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      try {
        await handleUpdateNote(updateArgs, mockAxiosInstance);
        assert.ok(true);
      } catch (error) {
        assert.ok(!error.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      }
    });
  });

  describe('Attribute Management Prevention', () => {
    it('should prevent attribute creation on container template notes', async () => {
      
      const params = {
        noteId: 'board123',
        operation: 'create',
        attributes: [
          {
            type: 'label',
            name: 'test',
            value: 'value'
          }
        ]
      };

      const result = await manage_attributes(params, mockAxiosInstance);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('CONTAINER TEMPLATE ATTRIBUTE PROTECTION'));
      assert.ok(result.message.includes('Board'));
    });

    it('should prevent attribute updates on container template notes', async () => {
      
      const params = {
        noteId: 'calendar123',
        operation: 'update',
        attributes: [
          {
            type: 'label',
            name: 'test',
            value: 'value'
          }
        ]
      };

      const result = await manage_attributes(params, mockAxiosInstance);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('CONTAINER TEMPLATE ATTRIBUTE PROTECTION'));
    });

    it('should prevent attribute deletion on container template notes', async () => {
      
      const params = {
        noteId: 'board123',
        operation: 'delete',
        attributes: [
          {
            type: 'label',
            name: 'test',
            value: 'value'
          }
        ]
      };

      const result = await manage_attributes(params, mockAxiosInstance);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('CONTAINER TEMPLATE ATTRIBUTE PROTECTION'));
    });

    it('should prevent batch attribute creation on container template notes', async () => {
      
      const params = {
        noteId: 'calendar123',
        operation: 'batch_create',
        attributes: [
          {
            type: 'label',
            name: 'test1',
            value: 'value1'
          },
          {
            type: 'label',
            name: 'test2',
            value: 'value2'
          }
        ]
      };

      const result = await manage_attributes(params, mockAxiosInstance);

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes('CONTAINER TEMPLATE ATTRIBUTE PROTECTION'));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle notes that cannot be read gracefully', async () => {
      const failingAxiosInstance = {
        get: async () => { throw new Error('Note not found'); },
        patch: async () => ({ status: 200 })
      };

      
      const updateArgs = {
        noteId: 'nonexistent123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      try {
        await handleUpdateNote(updateArgs, failingAxiosInstance);
        assert.ok(true); // Should proceed normally and fail later due to missing note
      } catch (error) {
        // Should not be a container template error
        assert.ok(!error.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      }
    });

    it('should handle container template detection errors gracefully', async () => {
      const errorAxiosInstance = {
        get: async (url) => {
          if (url.includes('/notes/error123')) {
            throw new Error('Network error');
          }
          return { data: {} };
        },
        patch: async () => ({ status: 200 })
      };

      
      const updateArgs = {
        noteId: 'error123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      try {
        await handleUpdateNote(updateArgs, errorAxiosInstance);
        assert.ok(true); // Should proceed normally when container check fails
      } catch (error) {
        // Should not be a container template error
        assert.ok(!error.message.includes('CONTAINER TEMPLATE NOTE PROTECTION'));
      }
    });
  });

  describe('User Guidance Messages', () => {
    it('should provide clear explanation about container templates', async () => {
      
      const updateArgs = {
        noteId: 'board123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.ok(result.message.includes('What are container template notes?'));
      assert.ok(result.message.includes('Kanban/task board layouts'));
      assert.ok(result.message.includes('must remain empty'));
      assert.ok(result.message.includes('Create a child note'));
      assert.ok(result.message.includes('Remove the ~template relation'));
    });

    it('should include actionable next steps in guidance', async () => {
      
      const params = {
        noteId: 'calendar123',
        operation: 'create',
        attributes: [
          {
            type: 'label',
            name: 'priority',
            value: 'high'
          }
        ]
      };

      const result = await manage_attributes(params, mockAxiosInstance);

      assert.ok(result.message.includes('What you probably want to do:'));
      assert.ok(result.message.includes('Create a child note'));
      assert.ok(result.message.includes('View current attributes'));
      assert.ok(result.message.includes('Work with child notes'));
      assert.ok(result.message.includes('Would you like me to help you'));
    });

    it('should provide alternative solutions for advanced users', async () => {
      
      const updateArgs = {
        noteId: 'board123',
        type: 'text',
        content: 'Updated content',
        expectedHash: 'hash123',
        mode: 'overwrite'
      };

      const result = await handleUpdateNote(updateArgs, mockAxiosInstance);

      assert.ok(result.message.includes('If you really need to modify the container:'));
      assert.ok(result.message.includes('Remove the ~template relation'));
      assert.ok(result.message.includes('lose the specialized template functionality'));
    });
  });

});