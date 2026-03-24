#!/usr/bin/env node

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { createReadTools } from '../../build/modules/toolDefinitions.js';
import { handleListChildrenNotes } from '../../build/modules/noteManager.js';
import { handleListChildrenNotesRequest } from '../../build/modules/noteHandler.js';

describe('list_children_notes migration', () => {
  it('exposes list_children_notes', () => {
    const tools = createReadTools();
    const toolNames = tools.map(tool => tool.name);

    assert.ok(toolNames.includes('list_children_notes'));
  });

  it('fetches direct children through a single search query', async () => {
    const calls = [];
    const axiosInstance = {
      get: async (url) => {
        calls.push(url);
        const parsed = new URL(url, 'http://localhost');
        assert.strictEqual(parsed.pathname, '/notes');
        assert.strictEqual(parsed.searchParams.get('fastSearch'), 'false');
        assert.strictEqual(parsed.searchParams.get('includeArchivedNotes'), 'true');
        assert.strictEqual(
          parsed.searchParams.get('search'),
          "note.parents.noteId = 'parent123' orderBy note.dateCreated desc, note.title"
        );

        return {
          data: {
            results: [
              {
                noteId: 'child-a',
                title: 'Alpha',
                type: 'text',
                mime: 'text/html',
                dateModified: '2026-03-24T00:00:00.000Z'
              },
              {
                noteId: 'child-b',
                title: 'Beta',
                type: 'code',
                mime: 'text/javascript',
                dateModified: '2026-03-23T00:00:00.000Z'
              }
            ]
          }
        };
      }
    };

    const result = await handleListChildrenNotes({ noteId: 'parent123' }, axiosInstance);

    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(result, {
      parentNoteId: 'parent123',
      totalChildCount: 2,
      fetchedCount: 2,
      failedCount: 0,
      children: [
        {
          noteId: 'child-a',
          title: 'Alpha',
          type: 'text',
          mime: 'text/html',
          dateModified: '2026-03-24T00:00:00.000Z'
        },
        {
          noteId: 'child-b',
          title: 'Beta',
          type: 'code',
          mime: 'text/javascript',
          dateModified: '2026-03-23T00:00:00.000Z'
        }
      ]
    });
  });

  it('escapes quotes in the parent note id search query', async () => {
    const calls = [];
    const axiosInstance = {
      get: async (url) => {
        calls.push(url);
        const parsed = new URL(url, 'http://localhost');
        assert.strictEqual(
          parsed.searchParams.get('search'),
          "note.parents.noteId = 'parent''123' orderBy note.dateCreated desc, note.title"
        );

        return {
          data: {
            results: []
          }
        };
      }
    };

    const result = await handleListChildrenNotes({ noteId: "parent'123" }, axiosInstance);

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(result.parentNoteId, "parent'123");
    assert.strictEqual(result.totalChildCount, 0);
  });

  it('routes list_children_notes requests through the note handler', async () => {
    const axiosInstance = {
      get: async () => ({
        data: {
          results: []
        }
      })
    };

    const permissionChecker = {
      hasPermission: (permission) => permission === 'READ'
    };

    const response = await handleListChildrenNotesRequest(
      { noteId: 'parent123' },
      axiosInstance,
      permissionChecker
    );

    assert.match(response.content[0].text, /"parentNoteId": "parent123"/);
    assert.match(response.content[0].text, /"children": \[\]/);
  });
});
