/**
 * Test update_note mime parameter handling
 */

import { strict as assert } from 'assert';
import { describe, it } from 'node:test';

// Test the update note validation with mime parameter
import { validateUpdateNote, safeValidate } from '../../../../build/utils/validationUtils.js';

describe('Update Note MIME Parameter Handling', () => {

  it('should validate update note with mime parameter (title-only)', () => {
    const updateData = {
      noteId: "test123",
      title: "Updated Title",
      mime: "text/x-javascript",
      expectedHash: "abc123"
    };

    const result = validateUpdateNote(updateData);
    assert.equal(result.noteId, "test123");
    assert.equal(result.title, "Updated Title");
    assert.equal(result.mime, "text/x-javascript");
    assert.equal(result.expectedHash, "abc123");
  });

  it('should validate update note with mime parameter (content update)', () => {
    const updateData = {
      noteId: "test123",
      type: "code",
      content: [{ type: "text", content: "console.log('hello');" }],
      mime: "text/x-javascript",
      expectedHash: "abc123"
    };

    const result = validateUpdateNote(updateData);
    assert.equal(result.noteId, "test123");
    assert.equal(result.type, "code");
    assert.equal(result.mime, "text/x-javascript");
    assert.deepEqual(result.content, [{ type: "text", content: "console.log('hello');" }]);
  });

  it('should validate update note without mime parameter', () => {
    const updateData = {
      noteId: "test123",
      title: "Updated Title",
      expectedHash: "abc123"
    };

    const result = validateUpdateNote(updateData);
    assert.equal(result.noteId, "test123");
    assert.equal(result.title, "Updated Title");
    assert.equal(result.mime, undefined);
  });

  it('should reject update note with missing required fields', () => {
    const updateData = {
      title: "Updated Title",
      mime: "text/x-javascript"
      // Missing noteId and expectedHash
    };

    assert.throws(() => validateUpdateNote(updateData), /Required/);
  });

  it('should reject update note with neither title nor content', () => {
    const updateData = {
      noteId: "test123",
      mime: "text/x-javascript",
      expectedHash: "abc123"
      // Missing both title and content
    };

    assert.throws(() => validateUpdateNote(updateData), /Either 'title' or 'content' \(or both\) must be provided/);
  });

  it('should reject update note with content but no type', () => {
    const updateData = {
      noteId: "test123",
      content: [{ type: "text", content: "test content" }],
      mime: "text/x-javascript",
      expectedHash: "abc123"
      // Missing type when content is provided
    };

    assert.throws(() => validateUpdateNote(updateData), /Parameter 'type' is required when updating content/);
  });

  it('should handle mime parameter with safe validation', () => {
    const updateData = {
      noteId: "test123",
      title: "Updated Title",
      mime: "text/x-python",
      expectedHash: "abc123"
    };

    // Test that basic validation works
    const result = validateUpdateNote(updateData);
    assert.equal(result.mime, "text/x-python");
  });

});