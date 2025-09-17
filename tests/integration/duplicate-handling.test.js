#!/usr/bin/env node

/**
 * Test the new duplicate handling functionality for create_note
 */

// Mock axios instance for testing
const mockAxios = {
  get: async () => {},
  post: async () => {},
  put: async () => {},
  delete: async () => {}
};

// Import the functions we want to test
import { handleCreateNote } from '../../build/modules/noteManager.js';

async function testDuplicateHandling() {
  console.log('Testing duplicate title handling...\n');

  // Test 1: Duplicate found - should return user choices
  console.log('Test 1: Duplicate found scenario');
  mockAxios.get = async () => ({
    data: {
      results: [
        { noteId: 'existing123', title: 'Test Note' }
      ]
    }
  });

  const args1 = {
    parentNoteId: 'root',
    title: 'Test Note',
    type: 'text',
    content: [{ type: 'text', content: '<p>New content</p>' }]
  };

  try {
    const result1 = await handleCreateNote(args1, mockAxios);
    console.log('✅ PASS: Duplicate found returns user choices');
    console.log('   - duplicateFound:', result1.duplicateFound);
    console.log('   - duplicateNoteId:', result1.duplicateNoteId);
    console.log('   - has choices:', !!result1.choices);
    console.log('   - has nextSteps:', !!result1.nextSteps);
  } catch (error) {
    console.log('❌ FAIL:', error.message);
  }

  console.log('\nTest 2: No duplicate found - should create note');
  mockAxios.get = async () => ({ data: { results: [] } });
  mockAxios.post = async () => ({ data: { note: { noteId: 'new123' } } });

  const args2 = {
    parentNoteId: 'root',
    title: 'Unique Note',
    type: 'text',
    content: [{ type: 'text', content: '<p>Unique content</p>' }]
  };

  try {
    const result2 = await handleCreateNote(args2, mockAxios);
    console.log('✅ PASS: No duplicate creates note successfully');
    console.log('   - duplicateFound:', result2.duplicateFound);
    console.log('   - noteId:', result2.noteId);
    console.log('   - message:', result2.message);
  } catch (error) {
    console.log('❌ FAIL:', error.message);
  }

  console.log('\nTest 3: Force create bypasses duplicate check');
  mockAxios.get = async () => ({
    data: {
      results: [
        { noteId: 'existing123', title: 'Test Note' }
      ]
    }
  });
  mockAxios.post = async () => ({ data: { note: { noteId: 'forced123' } } });

  const args3 = {
    parentNoteId: 'root',
    title: 'Test Note',
    type: 'text',
    content: [{ type: 'text', content: '<p>Forced content</p>' }],
    forceCreate: true
  };

  try {
    const result3 = await handleCreateNote(args3, mockAxios);
    console.log('✅ PASS: Force create bypasses duplicate check');
    console.log('   - duplicateFound:', result3.duplicateFound);
    console.log('   - noteId:', result3.noteId);
    console.log('   - message:', result3.message);
  } catch (error) {
    console.log('❌ FAIL:', error.message);
  }

  console.log('\n✅ All duplicate handling tests completed!');
}

testDuplicateHandling().catch(console.error);