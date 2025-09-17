# Validation Utils Test Suite

## Overview

This folder contains the comprehensive test suite, splitted into logical components to improve maintainability and organization.

### Modular Structure
```
tests/unit/utils/validationUtils/
├── index.test.js                    # Core validation functions (safeValidate, createValidationError)
├── searchCriteria.test.js           # Search criteria schema validation
├── attribute.test.js                 # Attribute schema validation
├── manageAttributes.test.js          # Manage attributes request validation
├── createNote.test.js                # Create note request validation
├── searchNotes.test.js               # Search notes request validation
├── dataType.test.js                  # Data type validation & edge cases
└── errorMessage.test.js             # Error message formatting & validation
└── README.md                         # This documentation file
```

## Test File Organization

### 1. **index.test.js** - Core Validation Functions
- **Purpose**: Tests the fundamental validation utilities
- **Functions Tested**: `safeValidate`, `createValidationError`
- **Test Count**: ~10 tests
- **Key Features**:
  - Core validation function behavior
  - Error handling patterns
  - ZodError vs regular error handling
  - Success/error response format

### 2. **searchCriteria.test.js** - Search Criteria Validation
- **Purpose**: Tests `searchCriteriaSchema` validation
- **Schema**: `searchCriteriaSchema`
- **Test Count**: ~25 tests
- **Coverage**:
  - Basic validation (property, type, operator, value, logic)
  - All supported operators (exists, contains, regex, etc.)
  - Type validation (label, relation, noteProperty)
  - Logic validation (AND, OR)
  - Edge cases and special characters

### 3. **attribute.test.js** - Attribute Schema Validation
- **Purpose**: Tests `attributeSchema` validation
- **Schema**: `attributeSchema`
- **Test Count**: ~35 tests
- **Coverage**:
  - Label and relation attribute validation
  - Name validation (empty, whitespace, special characters)
  - Position validation (negative numbers, defaults)
  - Inheritable flag validation
  - Complete attribute validation with all fields

### 4. **manageAttributes.test.js** - Manage Attributes Validation
- **Purpose**: Tests `manageAttributesSchema` validation
- **Schema**: `manageAttributesSchema`
- **Test Count**: ~30 tests
- **Coverage**:
  - Batch create operations
  - Single operations (create, update, delete)
  - Read operation validation
  - Note ID validation
  - Attribute array validation
  - Complex batch operations

### 5. **createNote.test.js** - Create Note Validation
- **Purpose**: Tests `createNoteSchema` validation
- **Schema**: `createNoteSchema`
- **Test Count**: ~45 tests
- **Coverage**:
  - Basic note creation validation
  - All supported note types
  - Content validation (text, data-url, MIME types)
  - Parent note ID validation
  - Title validation
  - Attributes integration
  - Required field validation
  - Optional parameters (forceCreate, mime)

### 6. **searchNotes.test.js** - Search Notes Validation
- **Purpose**: Tests `searchNotesSchema` validation
- **Schema**: `searchNotesSchema`
- **Test Count**: ~40 tests
- **Coverage**:
  - Text search validation
  - Search criteria validation
  - Limit parameter validation
  - Combined parameter validation
  - Complex search scenarios
  - Edge cases and invalid requests

### 7. **dataType.test.js** - Data Type Validation
- **Purpose**: Tests validation of different data types across schemas
- **Schemas**: Multiple (searchNotes, searchCriteria, etc.)
- **Test Count**: ~35 tests
- **Coverage**:
  - Date string validation (ISO format, ranges)
  - Numeric value validation (counts, sizes)
  - Boolean value validation (true/false)
  - String property validation
  - Mixed data type validation
  - Edge cases and complex scenarios

### 8. **errorMessage.test.js** - Error Message Validation
- **Purpose**: Tests error message formatting and validation error handling
- **Functions**: `createValidationError`, error formatting
- **Test Count**: ~25 tests
- **Coverage**:
  - Required field error messages
  - Enum value error messages
  - Validation error function testing
  - Field-specific error messages
  - Multiple error handling
  - Error message format consistency
  - Edge case error scenarios


## Running Tests

### Individual Test Files
```bash
# Run specific validation test files
npm test -- tests/unit/utils/validationUtils/index.test.js
npm test -- tests/unit/utils/validationUtils/searchCriteria.test.js
npm test -- tests/unit/utils/validationUtils/attribute.test.js
npm test -- tests/unit/utils/validationUtils/manageAttributes.test.js
npm test -- tests/unit/utils/validationUtils/createNote.test.js
npm test -- tests/unit/utils/validationUtils/searchNotes.test.js
npm test -- tests/unit/utils/validationUtils
/dataType.test.js
npm test -- tests/unit/utils/validationUtils/errorMessage.test.js
```

### Test Categories
```bash
# Run all validation tests
npm run test:unit

# Run all tests
npm test
```

