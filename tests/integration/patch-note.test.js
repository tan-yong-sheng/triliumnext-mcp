#!/usr/bin/env node

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

import { createWriteTools } from '../../build/modules/toolDefinitions.js';
import { handlePatchNote } from '../../build/modules/noteManager.js';
import { handlePatchNoteRequest } from '../../build/modules/noteHandler.js';

describe('patch_note unification', () => {
  it('exposes patch_note with mode-based patch items only', () => {
    const tools = createWriteTools();
    const toolNames = tools.map(tool => tool.name);
    const patchTool = tools.find(tool => tool.name === 'patch_note');
    const legacyToolName = ['search', '_and', '_replace', '_note'].join('');

    assert.ok(toolNames.includes('patch_note'));
    assert.ok(!toolNames.includes(legacyToolName));
    assert.ok(patchTool);

    const patchSchema = patchTool.inputSchema.properties.patches.items.properties;

    assert.ok(patchSchema.mode);
    assert.ok(patchSchema.selector);
    assert.ok(patchSchema.scope);
    assert.ok(patchSchema.occurrence);
    assert.ok(patchSchema.context);
    assert.ok(patchSchema.context.properties.before);
    assert.ok(patchSchema.context.properties.after);
    assert.deepStrictEqual(patchTool.inputSchema.required, ['noteId', 'expectedHash', 'patches']);
  });

  it('applies mixed mode patches atomically on a text note', async () => {
    const calls = [];
    let putBody = null;

    const axiosInstance = {
      get: async (url) => {
        calls.push(`GET ${url}`);

        if (url === '/notes/abc123') {
          return { data: { blobId: 'hash-1', type: 'text' } };
        }

        if (url === '/notes/abc123/content') {
          return { data: '<h1>Old Title</h1><p>Todo one</p><p>Todo two</p>' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async (url) => {
        calls.push(`POST ${url}`);
        return { status: 204 };
      },
      put: async (url, body) => {
        calls.push(`PUT ${url}`);
        putBody = body;
        return { status: 204 };
      }
    };

    const result = await handlePatchNote({
      noteId: 'abc123',
      expectedHash: 'hash-1',
      patches: [
        {
          mode: 'css',
          operation: 'replace',
          selector: 'h1',
          content: '<h1>New Title</h1>'
        },
          {
            mode: 'literal',
            operation: 'replace',
            selector: 'Todo',
            content: 'Done',
            occurrence: 2
          }
        ]
      }, axiosInstance);

    assert.strictEqual(result.appliedCount, 2);
    assert.strictEqual(result.failedCount, 0);
    assert.strictEqual(result.conflict, undefined);
    assert.strictEqual(result.revisionCreated, true);
    assert.strictEqual(putBody, '<h1>New Title</h1><p>Todo one</p><p>Done two</p>');
    assert.ok(calls.some(call => call === 'POST /notes/abc123/revision'));
    assert.ok(calls.some(call => call === 'PUT /notes/abc123/content'));
  });

  it('supports literal context disambiguation on repeated text', async () => {
    let putBody = null;

    const axiosInstance = {
      get: async (url) => {
        if (url === '/notes/abc123') {
          return { data: { blobId: 'hash-3', type: 'text' } };
        }

        if (url === '/notes/abc123/content') {
          return { data: '<div><h2>Project A</h2><p>Draft</p></div><div><h2>Project B</h2><p>Draft</p></div>' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async () => ({ status: 204 }),
      put: async (url, body) => {
        putBody = body;
        return { status: 204 };
      }
    };

    const result = await handlePatchNote({
      noteId: 'abc123',
      expectedHash: 'hash-3',
      patches: [
        {
          mode: 'literal',
          operation: 'replace',
          selector: 'Draft',
          content: 'Final',
          context: {
            before: '<h2>Project B</h2>',
            after: '</div>'
          }
        }
      ]
    }, axiosInstance);

    assert.strictEqual(result.appliedCount, 1);
    assert.strictEqual(result.failedCount, 0);
    assert.strictEqual(putBody, '<div><h2>Project A</h2><p>Draft</p></div><div><h2>Project B</h2><p>Final</p></div>');
  });

  it('rejects invalid patches before writing anything', async () => {
    let revisionCalls = 0;
    let putCalls = 0;

    const axiosInstance = {
      get: async (url) => {
        if (url === '/notes/abc123') {
          return { data: { blobId: 'hash-1', type: 'text' } };
        }

        if (url === '/notes/abc123/content') {
          return { data: '<h1>Old Title</h1>' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async () => {
        revisionCalls += 1;
        return { status: 204 };
      },
      put: async () => {
        putCalls += 1;
        return { status: 204 };
      }
    };

    await assert.rejects(
      () => handlePatchNote({
        noteId: 'abc123',
        expectedHash: 'hash-1',
        patches: [
          {
            mode: 'css',
            operation: 'replace',
            selector: 'h1',
            content: '<h1>New Title</h1>'
          },
          {
            mode: 'css',
            operation: 'replace',
            selector: '',
            content: '<h2>Broken</h2>'
          }
        ]
      }, axiosInstance),
      /patches\[1\]\.selector/
    );

    assert.strictEqual(revisionCalls, 0);
    assert.strictEqual(putCalls, 0);
  });

  it('rejects whitespace-only selectors in the handler before dispatching', async () => {
    let getCalls = 0;

    const axiosInstance = {
      get: async () => {
        getCalls += 1;
        throw new Error('should not be called');
      }
    };

    const permissionChecker = {
      hasPermission: (permission) => permission === 'WRITE'
    };

    await assert.rejects(
      () => handlePatchNoteRequest(
        {
          noteId: 'abc123',
          expectedHash: 'hash-1',
          patches: [
            {
              mode: 'css',
              operation: 'replace',
              selector: '   ',
              content: '<h1>New Title</h1>'
            }
          ]
        },
        axiosInstance,
        permissionChecker
      ),
      (error) => error.code === ErrorCode.InvalidParams && /selector/.test(error.message)
    );

    assert.strictEqual(getCalls, 0);
  });

  it('rejects unsafe regex patterns before applying search patches', async () => {
    let putCalls = 0;

    const axiosInstance = {
      get: async (url) => {
        if (url === '/notes/abc123') {
          return { data: { blobId: 'hash-4', type: 'text' } };
        }

        if (url === '/notes/abc123/content') {
          return { data: 'aaaaab' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async () => ({ status: 204 }),
      put: async () => {
        putCalls += 1;
        return { status: 204 };
      }
    };

    await assert.rejects(
      () => handlePatchNote({
        noteId: 'abc123',
        expectedHash: 'hash-4',
        patches: [
          {
            mode: 'regex',
            operation: 'replace',
            selector: '(a+)+$',
            content: 'x'
          }
        ]
      }, axiosInstance),
      /safe regular expression/
    );

    assert.strictEqual(putCalls, 0);
  });

  it('supports multiline replacement on code notes', async () => {
    let putBody = null;

    const axiosInstance = {
      get: async (url) => {
        if (url === '/notes/code123') {
          return { data: { blobId: 'hash-2', type: 'code' } };
        }

        if (url === '/notes/code123/content') {
          return { data: 'const a = 1;\nconst b = 2;\nconsole.log(a + b);' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async () => ({ status: 204 }),
      put: async (url, body) => {
        putBody = body;
        return { status: 204 };
      }
    };

    const result = await handlePatchNote({
      noteId: 'code123',
      expectedHash: 'hash-2',
      patches: [
        {
          mode: 'line',
          operation: 'replace',
          selector: '2',
          content: 'const b = 3;\nconst c = 4;'
        }
      ]
    }, axiosInstance);

    assert.strictEqual(result.appliedCount, 1);
    assert.strictEqual(result.failedCount, 0);
    assert.strictEqual(putBody, 'const a = 1;\nconst b = 3;\nconst c = 4;\nconsole.log(a + b);');
  });

  it('routes patch_note requests through the note handler', async () => {
    const axiosInstance = {
      get: async (url) => {
        if (url === '/notes/abc123') {
          return { data: { blobId: 'hash-1', type: 'text' } };
        }

        if (url === '/notes/abc123/content') {
          return { data: '<h1>Old Title</h1>' };
        }

        throw new Error(`Unexpected GET ${url}`);
      },
      post: async () => ({ status: 204 }),
      put: async () => ({ status: 204 })
    };

    const permissionChecker = {
      hasPermission: (permission) => permission === 'WRITE'
    };

    const response = await handlePatchNoteRequest(
      {
        noteId: 'abc123',
        expectedHash: 'hash-1',
        patches: [
          {
            mode: 'css',
            operation: 'replace',
            selector: 'h1',
            content: '<h1>New Title</h1>'
          }
        ]
      },
      axiosInstance,
      permissionChecker
    );

    assert.match(response.content[0].text, /"appliedCount": 1/);
    assert.match(response.content[0].text, /"revisionCreated": true/);
  });
});
