# Module Architecture - Business Logic Domains

## 🏗️ Domain-Driven Architecture

This directory implements a **domain-driven design** where each module represents a distinct business domain with clear boundaries and responsibilities.

## 📁 Domain Structure

```
modules/
├── 📁 attributes/     # [DOMAIN] Attribute & Label Management
├── 📁 notes/         # [DOMAIN] Note CRUD Operations
├── 📁 resolve/       # [DOMAIN] Note Resolution Service
├── 📁 search/        # [DOMAIN] Search & Query Engine
├── 📁 tools/         # [DOMAIN] MCP Tool Definitions
├── 📁 shared/        # [SHARED] Cross-Domain Utilities
├── 📁 types/         # [TYPES] Internal Type Definitions
└── 📁 utils/         # [UTILS] Core Module Utilities
```

## 🎯 Architectural Patterns

### **1. Domain Module Pattern**
Each domain follows the **Manager → Handler → Submodules** pattern:

```
Domain Module Structure:
├── 📄 [Domain]Manager.ts     # [CORE] Business Logic
├── 📄 [Domain]Handler.ts     # [PROTOCOL] MCP Integration
├── 📁 crud/                  # [OPERATIONS] CRUD Operations
├── 📁 operations/            # [SPECIALIZED] Domain Operations
├── 📁 validation/            # [RULES] Validation Logic
└── 📄 types.ts              # [MODELS] Domain Types
```

### **2. Submodule Organization**
Complex domains are organized into focused submodules:

**Example: Search Domain**
```
search/
├── 📄 searchManager.ts      # Core search logic
├── 📄 searchHandler.ts      # MCP request handling
├── 📁 filtering/            # Result filtering logic
└── 📁 query/                # Query building logic
```

## 🔄 Module Communication Patterns

### **Dependencies Flow**
```
utils/ → shared/ → [Domain Modules] → tools/
```

**Rules:**
- **No Circular Dependencies**: Clear dependency hierarchy
- **Shared Utilities**: Common functionality in `shared/` and `utils/`
- **Domain Isolation**: Business logic contained within domains

### **Inter-Module Communication**
```typescript
// ✅ Correct: Import from other domains
import { SearchOperation } from '../search/searchManager.js';

// ❌ Avoid: Direct import from submodules of other domains
import { buildSearchQuery } from '../search/query/queryBuilder.js';
```

## 🏛️ Module Responsibilities

### **Attributes Domain** (`attributes/`)
- **Purpose**: Label and relation management
- **Features**: CRUD operations, batch processing, template relations
- **Handlers**: `attributeManageHandler`, `attributeReadHandler`, `attributeListHandler`
- **Key Patterns**: Operation-specific permissions, container template protection

### **Notes Domain** (`notes/`)
- **Purpose**: Note lifecycle management
- **Features**: CRUD operations, content validation, duplicate detection
- **Handlers**: `noteHandler` (centralized routing)
- **Key Patterns**: Content type validation, hash-based conflict detection

### **Resolve Domain** (`resolve/`)
- **Purpose**: Note title resolution and identification
- **Features**: Fuzzy matching, user choice workflow
- **Handlers**: `resolveHandler`
- **Key Patterns**: Intelligent prioritization, search fallback

### **Search Domain** (`search/`)
- **Purpose**: Advanced search capabilities
- **Features**: Query building, result filtering, complexity analysis
- **Handlers**: `searchHandler`
- **Key Patterns**: Validation, optimization, hierarchy navigation

### **Tools Domain** (`tools/`)
- **Purpose**: MCP tool schema definitions
- **Features**: Permission-based tool generation, JSON schemas
- **Key Patterns**: Dynamic tool availability, schema validation

### **Shared Domain** (`shared/`)
- **Purpose**: Cross-domain utilities and constants
- **Features**: Shared interfaces, validation rules, constants
- **Key Patterns**: Reusable components, domain-agnostic utilities

## 🛡️ Security by Domain

### **Permission Integration**
```typescript
// Each domain implements permission checks
if (!server.hasPermission('READ')) {
  throw new McpError(ErrorCode.InvalidParams, 'Read permission required');
}
```

### **Domain-Specific Validation**
- **Attributes**: Container template protection
- **Notes**: Content type validation
- **Search**: Query complexity validation
- **Tools**: Schema validation

## 📊 Module Metrics

| Domain | Files | Lines | Tests | Complexity |
|--------|-------|-------|-------|------------|
| **attributes** | 8 | ~800 | 45+ | Medium |
| **notes** | 6 | ~600 | 25+ | Medium |
| **resolve** | 2 | ~200 | 10+ | Low |
| **search** | 5 | ~900 | 80+ | High |
| **tools** | 3 | ~300 | 15+ | Low |
| **shared** | 6 | ~400 | 20+ | Low |
| **Total** | 30 | ~3,200 | 195+ | Medium |

## 🚀 Module Development Guide

### **Adding a New Domain**
1. **Create Domain Directory**: `src/modules/[domain]/`
2. **Implement Manager**: `[Domain]Manager.ts` with business logic
3. **Implement Handler**: `[Domain]Handler.ts` with MCP integration
4. **Add Submodules**: Organize complexity into subfolders
5. **Update Tool Definitions**: Add to `tools/definitions/`
6. **Add Tests**: Comprehensive test coverage
7. **Update Documentation**: Module README

### **Domain Module Template**
```typescript
// [Domain]Manager.ts - Business Logic
export async function handle[Domain]Operation(args, axiosInstance) {
  // Business rules, validation, ETAPI calls
  return { result: 'success' };
}

// [Domain]Handler.ts - MCP Integration
export async function handle[Domain]Request(args, axiosInstance, server) {
  // Permission checks, input validation, error handling
  return await handle[Domain]Operation(args, axiosInstance);
}
```

## 📚 Domain Documentation

- **[Attributes Domain](./attributes/README.md)** - Label and relation management
- **[Notes Domain](./notes/README.md)** - Note lifecycle operations
- **[Resolve Domain](./resolve/README.md)** - Note resolution service
- **[Search Domain](./search/README.md)** - Search engine architecture
- **[Tools Domain](./tools/README.md)** - MCP tool definitions
- **[Shared Utilities](./shared/README.md)** - Cross-domain utilities
- **[Type System](./types/README.md)** - Internal type definitions

## 🔗 Related Documentation

- **[Source Architecture](../README.md)** - High-level architecture overview
- **[Testing Strategy](../../../tests/README.md)** - Testing patterns and guide
- **[Development Workflow](../../CLAUDE.md)** - Development processes and standards

---

**Module Architecture Version**: v2.0
**Design Pattern**: Domain-Driven Design with Clean Architecture