# Test Structure Documentation

## Overview

This project uses a well-organized test structure that separates tests by their type and purpose, making it easier to maintain and run specific test categories.

## Directory Structure

```
tests/
├── unit/                    # Unit tests (fast, isolated)
│   └── utils/
│       └── validationUtils.test.js
├── integration/             # Integration tests (medium speed, workflow testing)
│   └── duplicate-handling.test.js
└── e2e/                     # End-to-end tests (slowest, real API testing)
    (empty - ready for future MCP protocol tests)
```

## Test Types

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions in isolation
- **Speed**: Fast execution
- **Dependencies**: No external dependencies, uses mock data
- **Examples**:
  - Schema validation logic
  - Utility functions
  - Individual component behavior

### Integration Tests (`tests/integration/`)
- **Purpose**: Test multiple modules working together
- **Speed**: Medium execution speed
- **Dependencies**: Mocks external APIs but tests real workflows
- **Examples**:
  - Business logic across function boundaries
  - API workflow testing
  - Complex scenarios with multiple dependencies

### End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete application workflows
- **Speed**: Slow execution
- **Dependencies**: Real external systems and APIs
- **Examples**:
  - MCP protocol communication
  - Real TriliumNext API integration
  - Complete user scenarios

## Available NPM Scripts

```json
{
  "test": "npm run build && node --test tests/**/*.test.js",
  "test:unit": "npm run build && node --test tests/unit/**/*.test.js",
  "test:integration": "npm run build && node --test tests/integration/**/*.test.js",
  "test:e2e": "npm run build && node --test tests/e2e/**/*.test.js",
  "check": "npm run test"
}
```

### Usage Examples

```bash
# Run all tests
npm test

# Run only unit tests (fast feedback during development)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e
```

## Test Naming Conventions

### File Naming
- Use `.test.js` extension for all test files
- Name files after the module/function they test
- Examples:
  - `validationUtils.test.js` → Tests `validationUtils.ts`
  - `duplicate-handling.test.js` → Tests duplicate handling functionality

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names in `it` blocks
- Follow the pattern: "should [expected behavior]"

Example:
```javascript
describe('Validation Utils', () => {
  describe('Create Note Validation', () => {
    it('should validate correct create note request', () => {
      // test implementation
    });
  });
});
```

## Import Patterns

### Importing from Build Directory
Tests import from the `build/` directory to test the actual compiled code:

```javascript
// Unit test importing utilities
import {
  validationUtilsSchema,
  safeValidate
} from '../../../build/utils/validationUtils.js';

// Integration test importing modules
import { handleCreateNote } from '../../build/modules/noteManager.js';
```

### Path Resolution
- From `tests/unit/utils/` → `../../../build/utils/`
- From `tests/integration/` → `../../build/modules/`
- From `tests/e2e/` → `../../build/`

## Current Test Coverage

### Unit Tests (27 tests)
- **validationUtils.test.js**: Complete validation schema testing
  - Search criteria validation
  - Attribute validation
  - Manage attributes validation
  - Create note validation
  - Search notes validation
  - Edge cases and complex validation
  - Data type validation
  - Error message validation

### Integration Tests (1 test)
- **duplicate-handling.test.js**: Duplicate title detection
  - Duplicate found scenario
  - No duplicate found scenario
  - Force create bypass scenario

### End-to-End Tests (0 tests)
- Ready for future MCP protocol testing

## Adding New Tests

### For Unit Tests
1. Create file in `tests/unit/` appropriate subfolder
2. Import individual functions from `build/`
3. Test with mock data only
4. Focus on single function behavior

### For Integration Tests
1. Create file in `tests/integration/`
2. Import multiple modules from `build/`
3. Test workflows and business logic
4. Mock external APIs but test real interactions

### For End-to-End Tests
1. Create file in `tests/e2e/`
2. Test complete user scenarios
3. Use real external systems when possible
4. Focus on real-world usage patterns

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Assertions**: Use descriptive assertion messages
3. **Mock External Dependencies**: Use mocks for APIs, databases, etc.
4. **Test Edge Cases**: Include invalid inputs and error conditions
5. **Keep Tests Fast**: Optimize for quick feedback during development
6. **Document Complex Scenarios**: Add comments for complex test setups
