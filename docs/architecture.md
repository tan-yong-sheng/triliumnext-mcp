# TriliumNext MCP Server Architecture

## Overview

The TriliumNext MCP Server is a Model Context Protocol (MCP) server that provides AI assistants with tools to interact with TriliumNext Notes instances through the External API (ETAPI). The server follows a modular architecture with clear separation of concerns, comprehensive permission management, and robust validation.

## Project Structure

```
triliumnext-mcp/
├── src/                          # Source code
│   ├── index.ts                  # Main server entry point
│   ├── modules/                  # Business logic modules
│   │   ├── toolDefinitions.ts    # MCP tool schema definitions
│   │   ├── *Manager.ts           # Business logic managers
│   │   ├── *Handler.ts           # MCP request handlers
│   │   └── searchQueryBuilder.ts # Search query builder
│   └── utils/                    # Utility modules
│       ├── permissionUtils.ts    # Permission management
│       ├── validationUtils.ts    # Zod schema validation
│       ├── verboseUtils.ts      # Verbose formatting
│       ├── noteFormatter.ts      # Output formatting
│       ├── contentProcessor.ts   # Content processing utilities
│       └── noteBuilder.ts        # Note creation helper utilities
├── tests/                        # Test files
│   └── validation.test.js        # Zod validation tests
├── docs/                         # Documentation
│   ├── search-examples/          # Search query examples
│   ├── create-notes-examples/    # Note creation examples
│   └── *.md                     # Architecture and user guides
├── build/                        # Compiled JavaScript output
├── package.json                  # Project configuration
├── tsconfig.json                # TypeScript configuration
├── CLAUDE.md                    # Project memory and documentation
└── openapi.yaml                  # TriliumNext ETAPI specification
```

## Core Architecture Patterns

### 1. Modular Design Pattern

The codebase follows a **Manager → Handler → Tool Definition** pattern:

```
Request Flow:
MCP Client → Tool Definitions → Handler → Manager → ETAPI
```

**Managers** (`*Manager.ts`):
- Core business logic and data processing
- Direct interaction with Trilium ETAPI
- No MCP-specific concerns

**Handlers** (`*Handler.ts`):
- MCP request/response processing
- Permission validation
- Input/output formatting
- Error handling for MCP protocol

**Tool Definitions** (`toolDefinitions.ts`):
- JSON Schema definitions for MCP tools
- Permission-based tool availability
- Dynamic tool generation

### 2. Permission-Based Architecture

Tools are dynamically generated based on environment permissions:

```typescript
// Permission environment variable examples
PERMISSIONS="READ"           // Read-only access
PERMISSIONS="WRITE"          // Write-only access
PERMISSIONS="READ;WRITE"     // Full access
```

**Permission Tools Mapping**:
- **READ**: `search_notes`, `resolve_note_id`, `get_note`, `manage_attributes` (read-only)
- **WRITE**: `create_note`, `update_note`, `append_note`, `delete_note`, `manage_attributes` (write-only)

### 3. Separation of Concerns

```
src/
├── index.ts           # MCP server setup and routing (150 lines)
├── modules/           # Domain-specific modules
│   ├── toolDefinitions.ts  # Schema definitions
│   ├── *Manager.ts   # Business logic (no MCP knowledge)
│   └── *Handler.ts   # MCP protocol handling
└── utils/             # Reusable utilities
    ├── permissionUtils.ts  # Permission checking
    ├── validationUtils.ts  # Type validation
    └── *Utils.ts     # Helper functions
```

## Module Responsibilities

### Core Server (`src/index.ts`)

**Purpose**: Lightweight MCP server setup and request routing

**Key Responsibilities**:
- MCP server initialization and configuration
- Environment variable management
- Request routing to appropriate handlers
- Error handling and logging

**Size**: ~150 lines (down from 1400+ lines in monolithic version)

### Tool Definitions (`src/modules/toolDefinitions.ts`)

**Purpose**: MCP tool schema definitions and permission-based tool generation

**Key Functions**:
- `createReadTools()`: Generate READ permission tools
- `createWriteTools()`: Generate WRITE permission tools
- `createReadAttributeTools()`: Generate READ-only attribute tools
- `createWriteAttributeTools()`: Generate WRITE-only attribute tools
- `generateTools()`: Main tool generation function

**Key Features**:
- Dynamic tool availability based on permissions
- JSON Schema compliance for MCP protocol

### Business Logic Managers (`src/modules/*Manager.ts`)

#### Note Manager (`noteManager.ts`)
- Note CRUD operations
- Revision management
- Integration with Trilium ETAPI `/notes` endpoint

#### Search Manager (`searchManager.ts`)
- Unified search query processing
- Hierarchy navigation support
- FastSearch optimization logic

#### Attribute Manager (`attributeManager.ts`)
- Full CRUD operations for labels and relations
- Batch processing for performance
- Template relation support

#### Resolve Manager (`resolveManager.ts`)
- Title-based note resolution
- Fuzzy matching and prioritization
- Multiple result handling

### Request Handlers (`src/modules/*Handler.ts`)

#### Attribute Handler (`attributeHandler.ts`)
- Operation-specific permission validation
- Read operations require READ permission
- Write operations require WRITE permission
- Error handling and response formatting

#### Note Handler (`noteHandler.ts`)
- Note operation permissions (READ/WRITE)
- Revision control
- Parameter validation and error handling

#### Search Handler (`searchHandler.ts`)
- Search permission validation (READ)
- Search criteria processing
- Result formatting and debugging

#### Resolve Handler (`resolveHandler.ts`)
- Note resolution permissions (READ)
- User choice workflow for multiple matches
- Result prioritization and formatting

### Utility Modules (`src/utils/`)

#### Permission Utils (`permissionUtils.ts`)
- Permission checking interface and utilities
- `PermissionChecker` interface for dependency injection
- Environment variable parsing

#### Validation Utils (`validationUtils.ts`)
- Comprehensive Zod schema validation
- Runtime type checking for all MCP parameters
- 25+ test cases for edge cases and error conditions

#### Verbose Utils (`verboseUtils.ts`)
- Debug information formatting
- Response structure standardization
- Error message formatting


#### Note Formatter (`noteFormatter.ts`)
- Output formatting for note listings
- JSON structure standardization
- Search result formatting

#### Search Query Builder (`searchQueryBuilder.ts`)
- Converts JSON parameters to Trilium search DSL
- Boolean logic processing (AND/OR)
- Parentheses handling and negation operators

## Data Flow Architecture

### 1. Tool Request Flow

```
1. MCP Client Request
   ↓
2. Tool Definitions (JSON Schema validation)
   ↓
3. Handler (Permission validation + MCP processing)
   ↓
4. Manager (Business logic + ETAPI calls)
   ↓
5. TriliumNext ETAPI
   ↓
6. Response formatting
   ↓
7. MCP Client Response
```

### 2. Permission Checking Flow

```
Environment Variables → PermissionChecker → Handler Permission Checks → Tool Availability
```

### 3. Search Query Flow

```
JSON Parameters → SearchQueryBuilder → Trilium DSL → ETAPI Search → Results → Formatting
```

## Key Design Decisions

### 1. ES Modules over CommonJS

**Choice**: ES modules (`import/export`) throughout codebase

**Rationale**:
- Modern JavaScript standard
- Better tooling support
- Static analysis capabilities
- Future-proof architecture

### 2. TypeScript for Type Safety

**Choice**: Strict TypeScript configuration with comprehensive types

**Rationale**:
- Compile-time error detection
- Better IDE support and autocomplete
- Self-documenting code
- Refactoring safety

### 3. Zod for Runtime Validation

**Choice**: Zod schemas for parameter validation

**Rationale**:
- Runtime type safety
- Clear error messages
- Schema-driven validation
- Integration with TypeScript types

### 4. Modular Architecture over Monolithic

**Choice**: Separated concerns into specialized modules

**Rationale**:
- Easier testing and maintenance
- Better code organization
- Reduced cognitive load
- Team development scalability

### 5. Permission-Based Tool Generation

**Choice**: Dynamic tool availability based on permissions

**Rationale**:
- Principle of least privilege
- Clear security boundaries
- Better user experience
- Flexible deployment options

## API Integration

### TriliumNext ETAPI Integration

**Base URL**: `http://localhost:8080/etapi` (configurable)

**Key Endpoints Used**:
- `/notes` - Note CRUD operations
- `/attributes` - Attribute management
- `/search` - Search operations

**Authentication**:
- Authorization header with API token
- Token from `TRILIUM_API_TOKEN` environment variable

### MCP Protocol Integration

**SDK**: `@modelcontextprotocol/sdk` v0.6.0

**Protocol Features**:
- JSON Schema tool definitions
- Structured request/response handling
- Error management
- Permission-based tool availability

## Configuration and Environment

### Required Environment Variables

```bash
TRILIUM_API_TOKEN    # Authentication token (required)
TRILIUM_API_URL      # API endpoint (optional, defaults to http://localhost:8080/etapi)
PERMISSIONS          # Semicolon-separated permissions (optional, defaults to READ;WRITE)
VERBOSE              # Debug logging (optional, defaults to false)
```

### Build Configuration

**TypeScript**: Strict compilation with ES modules
**Output**: `build/` directory with executable permissions
**Testing**: Node.js built-in test runner with TAP output

## Security Considerations

### 1. Permission Model

- Granular READ/WRITE permissions
- Operation-specific permission checks
- Principle of least privilege
- No permission escalation

### 2. Input Validation

- Zod schema validation for all parameters
- Runtime type checking
- SQL injection prevention
- XSS protection

### 3. API Security

- Token-based authentication
- HTTPS communication (recommended)
- No credential logging
- Secure error messages

## Performance Optimizations

### 1. Batch Processing

- Parallel attribute creation
- Batch operations for multiple items
- Efficient memory usage

### 2. FastSearch Integration

- Automatic fastSearch detection
- Performance-based query optimization
- Fallback to full search when needed

### 3. Caching Strategies

- Response caching where appropriate
- Connection pooling via axios
- Efficient data structures

## Testing Strategy

### 1. Unit Testing

- 25+ Zod validation test cases
- Edge case coverage
- Error condition testing
- Data type validation

### 2. Integration Testing

- Permission combination testing
- End-to-end workflow validation
- API compatibility testing
- Build verification

### 3. Performance Testing

- Query optimization validation
- Memory usage monitoring
- Response time measurement

## Extensibility

### 1. Adding New Tools

1. Define tool schema in `toolDefinitions.ts`
2. Create handler in appropriate `*Handler.ts` file
3. Implement business logic in `*Manager.ts`
4. Add validation schemas in `validationUtils.ts`
5. Update documentation and tests

### 2. Adding New Permissions

1. Update `permissionUtils.ts`
2. Modify tool generation functions
3. Update handler permission checks
4. Test permission combinations

### 3. Adding New Search Features

1. Extend `searchQueryBuilder.ts`
2. Update validation schemas
3. Add documentation examples
4. Test with actual Trilium instances

## Future Enhancements

### Phase 2: Enhanced create_note Integration
- One-step workflow with parallel processing
- Optional `attributes` parameter
- Performance optimization

### Additional Features
- Webhook support for real-time updates
- Advanced search operators
- Caching layer for improved performance
- Plugin system for extensibility

## Documentation Resources

- **CLAUDE.md**: Project memory and implementation details
- **docs/search-examples/**: Search query examples and patterns
- **docs/create-notes-examples/**: Note creation and attribute management examples
- **API Reference**: Based on `openapi.yaml` specification

This architecture provides a solid foundation for scalable, maintainable, and secure TriliumNext MCP server development while maintaining flexibility for future enhancements.