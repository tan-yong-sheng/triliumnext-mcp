# Unit Testing Standards

This directory contains unit tests for the TriliumNext MCP server. Unit tests focus on testing individual functions, modules, and components in isolation.

## Testing Philosophy

- **Isolation**: Each test should be independent and not rely on external systems or other tests
- **Fast Execution**: Unit tests should run quickly (milliseconds per test)
- **Focused Scope**: Test one specific behavior or function per test case
- **Mocking**: Use mocks for external dependencies (API calls, databases, etc.)
- **Deterministic**: Tests should produce the same result every time

## File Structure

```
tests/unit/
├── utils/                    # Utility function tests
│   └── validationUtils/      # Validation utilities (organized by concern)
│       ├── index.test.js     # Core validation functions
│       ├── searchCriteria.test.js
│       ├── attribute.test.js
│       ├── manageAttributes.test.js
│       ├── createNote.test.js
│       ├── searchNotes.test.js
│       ├── dataType.test.js
│       └── errorMessage.test.js
└── [other modules...]        # Future module test directories
```

## Naming Conventions

### Test Files
- **Pattern**: `[module-name].test.js` or `[feature-area].test.js`
- **Location**: Mirror the source structure where practical
- **Examples**:
  - `validationUtils.test.js` → Tests for `src/utils/validationUtils.js`
  - `noteManager.test.js` → Tests for `src/modules/noteManager.js`

### Test Functions
- **Pattern**: `should [expected behavior] when [condition]`
- **Use `describe()` blocks** to group related tests
- **Use `it()` functions** for individual test cases

### Examples
```javascript
describe('safeValidate', () => {
  it('should successfully validate valid data', () => {
    // Test implementation
  });

  it('should return error for invalid data', () => {
    // Test implementation
  });
});
```

## Test Structure

### Basic Test Template
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the function/module being tested
import { functionToTest } from '../../../path/to/module.js';

describe('Module Being Tested', () => {
  it('should [expected behavior]', () => {
    // Arrange: Set up test data
    const testData = { /* test data */ };

    // Act: Call the function
    const result = functionToTest(testData);

    // Assert: Check the result
    assert.strictEqual(result.expected, actual);
  });
});
```

## Testing Patterns

### 1. Happy Path Testing
```javascript
it('should return correct result for valid input', () => {
  const input = { valid: 'data' };
  const expected = { success: true };
  const result = functionToTest(input);
  assert.deepStrictEqual(result, expected);
});
```

### 2. Error Testing
```javascript
it('should throw error for invalid input', () => {
  const input = { invalid: 'data' };
  assert.throws(() => functionToTest(input), /Expected error message/);
});
```

### 3. Edge Case Testing
```javascript
it('should handle edge cases properly', () => {
  const edgeCases = [null, undefined, '', 0, []];
  edgeCases.forEach(case => {
    const result = functionToTest(case);
    assert.ok(result.handledProperly);
  });
});
```

## Mocking and Stubs

### Creating Mocks
```javascript
// Mock external dependencies
const mockApi = {
  call: () => ({ data: 'mock response' })
};

// Mock functions
const mockFunction = (input) => {
  return `mocked: ${input}`;
};
```

### Using Mocks in Tests
```javascript
it('should use mock dependency', () => {
  const originalDependency = module.dependency;
  module.dependency = mockFunction;

  try {
    const result = module.functionUnderTest();
    assert.ok(result.includes('mocked'));
  } finally {
    module.dependency = originalDependency;
  }
});
```

## Assertion Guidelines

### Use Appropriate Assertions
- **`assert.strictEqual(a, b)`** - For strict equality (===)
- **`assert.deepStrictEqual(a, b)`** - For object/array comparison
- **`assert.ok(value)`** - For truthy values
- **`assert.throws(fn, regex)`** - For expected errors
- **`assert.rejects(promise, regex)`** - For async errors

### Provide Clear Error Messages
```javascript
// Good
assert.strictEqual(result.success, true,
  `Expected success but got failure: ${result.error}`);

// Avoid
assert.strictEqual(result.success, true);
```

## Data-Driven Testing

### Using Arrays of Test Cases
```javascript
const testCases = [
  { input: 'valid', expected: true, description: 'should accept valid input' },
  { input: 'invalid', expected: false, description: 'should reject invalid input' },
  { input: '', expected: false, description: 'should reject empty input' }
];

testCases.forEach(({ input, expected, description }) => {
  it(description, () => {
    const result = functionToTest(input);
    assert.strictEqual(result, expected);
  });
});
```

## Validation Testing

### Schema Validation Pattern
```javascript
describe('Schema Validation', () => {
  it('should validate correct data structure', () => {
    const validData = { /* valid structure */ };
    const result = safeValidate(schema, validData);
    assert.strictEqual(result.success, true);
  });

  it('should reject invalid data structure', () => {
    const invalidData = { /* invalid structure */ };
    const result = safeValidate(schema, invalidData);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Expected error message'));
  });
});
```

## Running Tests

### Run All Unit Tests
```bash
npm run test:unit
```

### Run Specific Test File
```bash
npm run build && node --test tests/unit/utils/validationUtils/index.test.js
```

### Run Tests with Specific Pattern
```bash
npm run build && node --test tests/unit/**/*.test.js
```

## Best Practices

### 1. Test Independence
- Each test should set up its own data
- Don't rely on test execution order
- Clean up after tests (use `try/finally` for mocks)

### 2. Readability
- Use descriptive test names
- Group related tests with `describe()`
- Add comments for complex test logic

### 3. Maintenance
- Keep tests simple and focused
- Update tests when code changes
- Remove obsolete tests

### 4. Coverage
- Aim for high coverage of core functionality
- Test both success and failure paths
- Focus on business logic over trivial code

## Resources

- [Node.js Test Documentation](https://nodejs.org/api/test.html)
- [Assertion Documentation](https://nodejs.org/api/assert.html)
- [Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)