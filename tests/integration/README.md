# Integration Testing Standards

This directory contains integration tests for the TriliumNext MCP server. Integration tests focus on testing how multiple components work together, including interactions with external systems and APIs.

## Testing Philosophy

- **Real Dependencies**: Use actual external systems when possible (APIs, databases)
- **Component Integration**: Test how multiple modules work together
- **End-to-End Flows**: Test complete business processes and user workflows
- **Environment Parity**: Run in environments similar to production
- **Realistic Data**: Use realistic test data and scenarios

## File Structure

```
tests/integration/
├── duplicate-handling.test.js    # Duplicate note detection workflows
├── api-integration.test.js        # External API integration tests
├── workflow-complex.test.js      # Complex multi-step workflows
└── [other integration tests...]   # Additional integration scenarios
```

## Scope and Boundaries

### What to Test in Integration Tests
- **API interactions** with TriliumNext ETAPI
- **Multi-module workflows** (e.g., create → search → update)
- **Business logic across components**
- **Error handling in real scenarios**
- **Data transformation pipelines**
- **Authentication and authorization flows**

### What NOT to Test in Integration Tests
- **Individual function logic** (use unit tests)
- **UI/UX interactions** (use e2e tests)
- **Performance benchmarks** (use performance tests)
- **External system availability** (use monitoring)

## Test Environment Setup

### Required Environment Variables
```bash
# TriliumNext API Configuration
TRILIUM_API_URL=http://localhost:8080/etapi
TRILIUM_API_TOKEN=your-api-token-here

# Server Configuration
PERMISSIONS=READ;WRITE
VERBOSE=false
```

### Test Data Management
```javascript
// Create test-specific data
const testNote = {
  title: `Integration Test Note - ${Date.now()}`,
  type: 'text',
  content: [{ type: 'text', content: 'Integration test content' }]
};

// Clean up after tests
afterEach(async () => {
  await cleanupTestData(testNoteId);
});
```

## Test Patterns

### 1. API Integration Pattern
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createNote, deleteNote } from '../../../build/modules/noteManager.js';

describe('Note API Integration', () => {
  let createdNoteId;

  it('should create note via real API', async () => {
    const noteData = {
      parentNoteId: 'root',
      title: 'Integration Test Note',
      type: 'text',
      content: [{ type: 'text', content: 'Test content' }]
    };

    const result = await createNote(noteData);
    assert.strictEqual(result.success, true);
    assert.ok(result.noteId);
    createdNoteId = result.noteId;
  });

  it('should retrieve created note', async () => {
    const result = await getNote(createdNoteId);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.note.title, 'Integration Test Note');
  });

  // Clean up
  afterEach(async () => {
    if (createdNoteId) {
      await deleteNote(createdNoteId);
    }
  });
});
```

### 2. Multi-Step Workflow Pattern
```javascript
describe('Complex Note Management Workflow', () => {
  it('should handle create → search → update → delete workflow', async () => {
    // Step 1: Create note
    const createResult = await createNote(testNoteData);
    assert.strictEqual(createResult.success, true);
    const noteId = createResult.noteId;

    // Step 2: Search for note
    const searchResult = await searchNotes({
      text: testNoteData.title
    });
    assert.strictEqual(searchResult.success, true);
    assert.ok(searchResult.notes.some(note => note.noteId === noteId));

    // Step 3: Update note
    const updateResult = await updateNote({
      noteId,
      type: 'text',
      content: [{ type: 'text', content: 'Updated content' }],
      expectedHash: createResult.contentHash
    });
    assert.strictEqual(updateResult.success, true);

    // Step 4: Verify update
    const verifyResult = await getNote(noteId);
    assert.strictEqual(verifyResult.content, 'Updated content');

    // Step 5: Clean up
    await deleteNote(noteId);
  });
});
```

### 3. Error Handling Pattern
```javascript
describe('API Error Handling Integration', () => {
  it('should handle concurrent modification conflicts', async () => {
    // Create initial note
    const createResult = await createNote(testNoteData);
    const noteId = createResult.noteId;

    // Simulate concurrent modification
    const update1 = updateNote({
      noteId,
      type: 'text',
      content: [{ type: 'text', content: 'First update' }],
      expectedHash: createResult.contentHash
    });

    const update2 = updateNote({
      noteId,
      type: 'text',
      content: [{ type: 'text', content: 'Second update' }],
      expectedHash: createResult.contentHash
    });

    const [result1, result2] = await Promise.all([update1, update2]);

    // One should succeed, one should fail with conflict
    const successCount = [result1, result2].filter(r => r.success).length;
    const conflictCount = [result1, result2].filter(r => r.conflict).length;

    assert.strictEqual(successCount, 1);
    assert.strictEqual(conflictCount, 1);
  });
});
```

## Data Management Strategies

### 1. Test Data Isolation
```javascript
// Use unique identifiers to avoid conflicts
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create isolated test environments
const createTestEnvironment = async () => {
  const testFolder = await createNote({
    parentNoteId: 'root',
    title: `Test Folder - ${generateTestId()}`,
    type: 'book'
  });
  return testFolder.noteId;
};
```

### 2. Cleanup Strategies
```javascript
// Comprehensive cleanup
const cleanupTestData = async (noteIds) => {
  for (const noteId of noteIds) {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.warn(`Failed to cleanup note ${noteId}:`, error.message);
    }
  }
};

// Use test lifecycle hooks
afterEach(async () => {
  await cleanupTestData(createdNoteIds);
});

after(async () => {
  await cleanupGlobalTestData();
});
```

## External System Testing

### API Contract Testing
```javascript
describe('TriliumNext ETAPI Contract', () => {
  it('should adhere to expected API response format', async () => {
    const response = await axios.get(`${process.env.TRILIUM_API_URL}/notes`, {
      headers: { 'Authorization': `Bearer ${process.env.TRILIUM_API_TOKEN}` }
    });

    assert.ok(Array.isArray(response.data));
    assert.ok(response.data.length > 0);

    // Validate response structure
    const firstNote = response.data[0];
    assert.ok(firstNote.noteId);
    assert.ok(firstNote.title);
    assert.ok(firstNote.type);
  });
});
```

### Authentication Testing
```javascript
describe('Authentication Integration', () => {
  it('should reject requests without valid token', async () => {
    try {
      await axios.get(`${process.env.TRILIUM_API_URL}/notes`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      assert.fail('Should have thrown authentication error');
    } catch (error) {
      assert.strictEqual(error.response.status, 401);
    }
  });
});
```

## Performance Considerations

### 1. Test Execution Time
- Keep individual tests under 10 seconds
- Use timeouts for external calls
- Implement retry logic for flaky external services

```javascript
// Timeout wrapper
const withTimeout = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), timeoutMs)
    )
  ]);
};

it('should complete within timeout', async () => {
  const result = await withTimeout(slowOperation());
  assert.ok(result.success);
});
```

### 2. Resource Management
```javascript
// Connection pooling for database/API calls
class TestConnectionPool {
  constructor(maxConnections = 5) {
    this.pool = [];
    this.maxConnections = maxConnections;
  }

  async getConnection() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return createNewConnection();
  }

  releaseConnection(connection) {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(connection);
    } else {
      connection.close();
    }
  }
}
```

## Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run with Environment Variables
```bash
TRILIUM_API_URL=http://localhost:8080/etapi \
TRILIUM_API_TOKEN=your-token \
npm run test:integration
```

### Run Specific Integration Test
```bash
npm run build && node --test tests/integration/duplicate-handling.test.js
```

## Best Practices

### 1. Test Reliability
- Use retry logic for external API calls
- Implement proper error handling and cleanup
- Make tests idempotent (can run multiple times safely)
- Use unique test data to avoid conflicts

### 2. Environment Management
- Use environment-specific configurations
- Don't hardcode API endpoints or credentials
- Provide clear setup and teardown instructions
- Use containers or virtual environments for consistency

### 3. Reporting and Debugging
- Log meaningful information for debugging
- Include API request/response details in error messages
- Use descriptive test names that explain the business scenario
- Provide clear setup instructions for developers

### 4. Security Considerations
- Use test-specific API tokens with limited permissions
- Never commit real credentials or secrets
- Clean up sensitive test data after tests
- Use separate test databases/instances when possible

## Resources

- [Node.js Test Documentation](https://nodejs.org/api/test.html)
- [Integration Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html#IntegrationTests)
- [API Testing Guidelines](https://www.moesif.com/blog/technical/api-design/REST-API-Testing-Best-Practices/)