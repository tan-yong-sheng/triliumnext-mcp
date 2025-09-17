# End-to-End (E2E) Testing Standards

This directory contains end-to-end tests for the TriliumNext MCP server. E2E tests simulate real user scenarios and validate the complete system from the user's perspective, including the MCP protocol, TriliumNext integration, and actual user workflows.

## Testing Philosophy

- **User-Centric**: Test from the perspective of real users and their workflows
- **Complete System**: Test the entire stack including MCP protocol, API, and TriliumNext
- **Real Scenarios**: Use realistic user stories and business workflows
- **Production Environment**: Run in environments that mirror production setup
- **Black Box**: Focus on external behavior rather than internal implementation

## Scope and Boundaries

### What to Test in E2E Tests
- **Complete user workflows** (e.g., create note → search → update → delete)
- **MCP protocol compliance** and tool interactions
- **Real-time collaboration scenarios** (concurrent access, conflicts)
- **Integration with Claude AI assistants** and other MCP clients
- **Performance under realistic load** and user behavior
- **Security and authentication flows** from user perspective

### What NOT to Test in E2E Tests
- **Individual function logic** (use unit tests)
- **Module integration** (use integration tests)
- **Internal system metrics** (use monitoring)
- **Performance micro-benchmarks** (use performance tests)

## File Structure

```
tests/e2e/
├── mcp-protocol/               # MCP protocol compliance tests
│   ├── tool-discovery.test.js
│   ├── request-handling.test.js
│   └── error-responses.test.js
├── user-workflows/             # Real user scenario tests
│   ├── note-management.test.js
│   ├── search-workflows.test.js
│   ├── template-usage.test.js
│   └── collaboration.test.js
├── performance/               # Performance and load tests
│   ├── concurrent-users.test.js
│   ├── large-datasets.test.js
│   └── response-time.test.js
└── deployment/               # Deployment and environment tests
    ├── docker-integration.test.js
    ├── environment-config.test.js
    └── health-checks.test.js
```

## Test Environment Setup

### Complete Stack Requirements
```bash
# MCP Server Environment
TRILIUM_API_URL=http://localhost:8080/etapi
TRILIUM_API_TOKEN=production-grade-token
PERMISSIONS=READ;WRITE
VERBOSE=false

# TriliumNext Instance
# Running with realistic data and configuration
# Database with test user accounts
# Real file system for attachments

# MCP Client Simulation
# Claude AI client simulation
# Real MCP protocol messages
# Actual tool calls and responses
```

### Docker-Based Test Environment
```yaml
# docker-compose.e2e.yml
version: '3.8'
services:
  triliumnext:
    image: triliumnext/server:latest
    environment:
      - TRILIUM_DATA_DIR=/data
    volumes:
      - trilium_data:/data
    ports:
      - "8080:8080"

  mcp-server:
    build: .
    environment:
      - TRILIUM_API_URL=http://triliumnext:8080/etapi
      - TRILIUM_API_TOKEN=${TEST_API_TOKEN}
    depends_on:
      - triliumnext

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - ./tests/e2e:/app/tests/e2e
    depends_on:
      - mcp-server
      - triliumnext
```

## Test Patterns

### 1. MCP Protocol Testing
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MCPServer } from '../../../build/index.js';

describe('MCP Protocol Compliance', () => {
  let server;
  let client;

  before(async () => {
    // Start MCP server
    server = new MCPServer();
    await server.start();

    // Connect MCP client
    client = new MCPClient();
    await client.connect(server.port);
  });

  it('should respond to tools/list request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

    const response = await client.send(request);
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 1);
    assert.ok(Array.isArray(response.result.tools));
    assert.ok(response.result.tools.length > 0);
  });

  it('should handle tool calls correctly', async () => {
    const toolCall = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'create_note',
        arguments: {
          parentNoteId: 'root',
          title: 'E2E Test Note',
          type: 'text',
          content: [{ type: 'text', content: 'Created via MCP protocol' }]
        }
      }
    };

    const response = await client.send(toolCall);
    assert.strictEqual(response.result.success, true);
    assert.ok(response.result.noteId);
  });

  after(async () => {
    await client.disconnect();
    await server.stop();
  });
});
```

### 2. User Workflow Testing
```javascript
describe('Complete User Workflows', () => {
  it('should handle complete note lifecycle', async () => {
    // Simulate user creating a project note
    const createResponse = await simulateMCPToolCall({
      name: 'create_note',
      arguments: {
        parentNoteId: 'root',
        title: 'Project Requirements',
        type: 'text',
        content: [{
          type: 'text',
          content: '# Project Requirements\n\n## Features\n- User authentication\n- Data export\n'
        }]
      }
    });

    assert.strictEqual(createResponse.success, true);
    const projectId = createResponse.noteId;

    // Simulate user searching for the project
    const searchResponse = await simulateMCPToolCall({
      name: 'search_notes',
      arguments: {
        text: 'Project Requirements'
      }
    });

    assert.strictEqual(searchResponse.success, true);
    assert.ok(searchResponse.notes.some(note => note.noteId === projectId));

    // Simulate user adding subtasks
    const subtaskResponse = await simulateMCPToolCall({
      name: 'create_note',
      arguments: {
        parentNoteId: projectId,
        title: 'Implementation Tasks',
        type: 'book',
        content: [{ type: 'text', content: 'Task list for implementation' }]
      }
    });

    // Simulate user updating project status
    const updateResponse = await simulateMCPToolCall({
      name: 'update_note',
      arguments: {
        noteId: projectId,
        type: 'text',
        content: [{
          type: 'text',
          content: '# Project Requirements (IN PROGRESS)\n\n## Features\n- User authentication ✓\n- Data export\n'
        }],
        expectedHash: createResponse.contentHash
      }
    });

    assert.strictEqual(updateResponse.success, true);

    // Cleanup: Delete the entire project hierarchy
    await simulateMCPToolCall({
      name: 'delete_note',
      arguments: {
        noteId: projectId
      }
    });
  });
});
```

### 3. Performance and Load Testing
```javascript
describe('Performance Under Load', () => {
  it('should handle concurrent user sessions', async () => {
    const numUsers = 10;
    const operationsPerUser = 5;

    // Simulate multiple concurrent users
    const userPromises = Array.from({ length: numUsers }, async (_, userId) => {
      const userOperations = [];

      for (let i = 0; i < operationsPerUser; i++) {
        const operation = simulateMCPToolCall({
          name: 'create_note',
          arguments: {
            parentNoteId: 'root',
            title: `User ${userId} - Note ${i}`,
            type: 'text',
            content: [{ type: 'text', content: `Content from user ${userId}` }]
          }
        });
        userOperations.push(operation);
      }

      return Promise.all(userOperations);
    });

    const startTime = Date.now();
    const results = await Promise.all(userPromises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all operations succeeded
    const flatResults = results.flat();
    const successCount = flatResults.filter(r => r.success).length;
    const totalCount = flatResults.length;

    assert.strictEqual(successCount, totalCount,
      `All operations should succeed. Success: ${successCount}/${totalCount}`);

    // Performance assertions
    console.log(`Completed ${totalCount} operations in ${duration}ms`);
    const avgTimePerOperation = duration / totalCount;
    assert.ok(avgTimePerOperation < 1000,
      `Average operation time should be < 1s, was ${avgTimePerOperation}ms`);
  });
});
```

### 4. Real-time Collaboration Testing
```javascript
describe('Real-time Collaboration', () => {
  it('should handle concurrent note editing', async () => {
    // Create initial note
    const createResponse = await simulateMCPToolCall({
      name: 'create_note',
      arguments: {
        parentNoteId: 'root',
        title: 'Collaborative Document',
        type: 'text',
        content: [{ type: 'text', content: 'Initial content' }]
      }
    });

    const noteId = createResponse.noteId;

    // Simulate two users editing simultaneously
    const user1Edits = simulateMCPToolCall({
      name: 'update_note',
      arguments: {
        noteId,
        type: 'text',
        content: [{ type: 'text', content: 'User 1 edits' }],
        expectedHash: createResponse.contentHash
      }
    });

    const user2Edits = simulateMCPToolCall({
      name: 'update_note',
      arguments: {
        noteId,
        type: 'text',
        content: [{ type: 'text', content: 'User 2 edits' }],
        expectedHash: createResponse.contentHash
      }
    });

    const [result1, result2] = await Promise.allSettled([user1Edits, user2Edits]);

    // One should succeed, one should detect conflict
    const successCount = [result1, result2].filter(r =>
      r.status === 'fulfilled' && r.value.success).length;
    const conflictCount = [result1, result2].filter(r =>
      r.status === 'fulfilled' && r.value.conflict).length;

    assert.strictEqual(successCount, 1, 'One edit should succeed');
    assert.strictEqual(conflictCount, 1, 'One edit should detect conflict');
  });
});
```

## Test Data Management

### 1. Realistic Test Data
```javascript
// Generate realistic test data
const generateRealisticNote = (type, index) => {
  const templates = {
    text: {
      title: `Meeting Notes ${new Date().toLocaleDateString()}`,
      content: `# Team Meeting

**Date:** ${new Date().toISOString().split('T')[0]}
**Attendees:** John, Sarah, Mike

## Action Items
- [ ] Research new technologies
- [ ] Update documentation
- [ ] Schedule follow-up

## Decisions
- Move forward with TypeScript migration
- Adopt new testing framework`
    },
    book: {
      title: `Project ${index} - ${['Alpha', 'Beta', 'Gamma'][index % 3]}`,
      content: `Project documentation and resources`
    },
    code: {
      title: `${['JavaScript', 'Python', 'TypeScript'][index % 3]} Utility Function`,
      content: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export default calculateTotal;`
    }
  };

  return templates[type] || templates.text;
};
```

### 2. Cleanup and Isolation
```javascript
// Comprehensive cleanup system
class TestDataManager {
  constructor() {
    this.createdResources = new Set();
  }

  async createNote(noteData) {
    const result = await simulateMCPToolCall({
      name: 'create_note',
      arguments: noteData
    });

    if (result.success) {
      this.createdResources.add({
        type: 'note',
        id: result.noteId,
        parentId: noteData.parentNoteId
      });
    }

    return result;
  }

  async cleanup() {
    // Clean up in reverse order (children first)
    const resources = Array.from(this.createdResources).reverse();

    for (const resource of resources) {
      try {
        await simulateMCPToolCall({
          name: 'delete_note',
          arguments: { noteId: resource.id }
        });
      } catch (error) {
        console.warn(`Failed to cleanup ${resource.type} ${resource.id}:`, error.message);
      }
    }

    this.createdResources.clear();
  }
}
```

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run with Docker Environment
```bash
# Start test environment
docker-compose -f docker-compose.e2e.yml up -d

# Wait for services to be ready
sleep 30

# Run tests
npm run test:e2e

# Cleanup
docker-compose -f docker-compose.e2e.yml down -v
```

### Run Specific Test Suite
```bash
npm run build && node --test tests/e2e/mcp-protocol/tool-discovery.test.js
```

## Performance Monitoring

### 1. Metrics Collection
```javascript
// Test performance metrics
class TestMetrics {
  constructor() {
    this.metrics = [];
  }

  startTimer(label) {
    this.metrics.push({
      label,
      startTime: Date.now(),
      endTime: null,
      duration: null
    });
  }

  endTimer(label) {
    const metric = this.metrics.find(m => m.label === label && !m.endTime);
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
    }
  }

  getReport() {
    return this.metrics
      .filter(m => m.duration !== null)
      .map(m => `${m.label}: ${m.duration}ms`)
      .join('\n');
  }
}
```

### 2. Performance Assertions
```javascript
it('should meet performance requirements', async () => {
  const metrics = new TestMetrics();

  metrics.startTimer('tool_discovery');
  await simulateMCPToolCall({ name: 'tools/list' });
  metrics.endTimer('tool_discovery');

  metrics.startTimer('note_creation');
  await simulateMCPToolCall({ name: 'create_note', arguments: testNote });
  metrics.endTimer('note_creation');

  metrics.startTimer('search_operation');
  await simulateMCPToolCall({ name: 'search_notes', arguments: { text: 'test' } });
  metrics.endTimer('search_operation');

  // Performance assertions
  const toolDiscoveryTime = metrics.metrics.find(m => m.label === 'tool_discovery').duration;
  assert.ok(toolDiscoveryTime < 1000, `Tool discovery should be < 1s, was ${toolDiscoveryTime}ms`);

  const noteCreationTime = metrics.metrics.find(m => m.label === 'note_creation').duration;
  assert.ok(noteCreationTime < 2000, `Note creation should be < 2s, was ${noteCreationTime}ms`);

  console.log('Performance Report:\n' + metrics.getReport());
});
```

## Best Practices

### 1. Test Reliability
- Use explicit waits and timeouts instead of fixed delays
- Implement retry logic for flaky network operations
- Clean up test data thoroughly to avoid state leakage
- Use unique identifiers to avoid test interference

### 2. Environment Management
- Containerize test environments for consistency
- Use separate databases/instances for testing
- Implement health checks before running tests
- Provide clear setup and teardown procedures

### 3. Error Handling and Debugging
- Log detailed information for debugging failures
- Capture screenshots or state on test failures
- Implement meaningful assertions with helpful error messages
- Use test isolation to prevent cascading failures

### 4. Security and Compliance
- Use test-specific credentials with limited permissions
- Never use production data or credentials in tests
- Clean up sensitive test data after execution
- Test security scenarios (unauthorized access, input validation)

## Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [E2E Testing Best Practices](https://www.browserstack.com/guide/end-to-end-testing)
- [Performance Testing Guidelines](https://docs.microsoft.com/en-us/azure/devops/test/load-testing/)
- [Docker Testing Patterns](https://docs.docker.com/develop/test/)