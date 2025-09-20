# TriliumNext MCP Server - Source Code Architecture

## 🏗️ Architecture Overview

This directory contains the complete source code for the TriliumNext MCP Server, a production-ready implementation following clean architecture principles with modular design patterns.

## 📁 Directory Structure

```
src/
├── 📄 index.ts                    # [ENTRY POINT] Server bootstrap (~150 lines)
├── 📁 modules/                    # [BUSINESS LOGIC] Domain-driven modules
│   ├── 📁 attributes/             # Attribute management domain
│   ├── 📁 notes/                   # Note operations domain
│   ├── 📁 resolve/                 # Note resolution domain
│   ├── 📁 search/                  # Search functionality domain
│   ├── 📁 tools/                   # Tool definitions domain
│   ├── 📁 shared/                  # Shared utilities domain
│   ├── 📁 types/                   # Type definitions
│   └── 📁 utils/                   # Core utilities
├── 📁 types/                      # [PUBLIC TYPES] External type definitions
└── 📁 utils/                      # [CORE UTILS] Shared utility functions
```

## 🎯 Design Principles

### **1. Clean Architecture**
```
External Layers (MCP Protocol)
    ↓
Business Logic (Domain Modules)
    ↓
Core Utilities (Foundational)
```

**Key Benefits:**
- Framework independence (MCP protocol as external concern)
- Testable business logic (no external dependencies in domain modules)
- Maintainable codebase (clear separation of concerns)

### **2. Domain-Driven Design**
Each module represents a business domain with its own:
- **Business Logic** (Managers)
- **Protocol Handling** (Handlers)
- **Validation Rules** (Validators)
- **Data Models** (Types)

### **3. Modular Architecture Pattern**
```
Request Flow: MCP Client → Tool Definitions → Handler → Manager → ETAPI
```

**Component Responsibilities:**
- **📋 Tool Definitions**: JSON Schema definitions for MCP protocol
- **🎯 Handlers**: MCP request/response processing + permission validation
- **⚙️ Managers**: Business logic + Trilium ETAPI integration
- **🔧 Utilities**: Cross-cutting concerns (validation, logging, etc.)

## 🏛️ Layer Architecture

### **Presentation Layer** (`src/`)
- **`index.ts`**: MCP server bootstrap and routing
- **Type Safety**: Comprehensive TypeScript types
- **Configuration**: Environment variable management

### **Application Layer** (`src/modules/`)
- **Domain Logic**: Business rules and workflows
- **Use Cases**: CRUD operations, search, resolution
- **Integration**: Trilium ETAPI communication

### **Infrastructure Layer** (`src/utils/`)
- **External Services**: HTTP client configuration
- **Data Persistence**: API integration patterns
- **Cross-cutting**: Validation, logging, error handling

## 🔄 Data Flow Architecture

```
1. MCP Client Request
   ↓ [Route by tool name]
2. Handler (Permission Check + Input Validation)
   ↓ [Business Logic Delegation]
3. Manager (Domain Processing + ETAPI Call)
   ↓ [Response Transformation]
4. MCP Client Response
```

**Key Flow Characteristics:**
- **Unidirectional**: Clear request/response flow
- **Stateless**: Each request handled independently
- **Validated**: Input validation at multiple layers
- **Secure**: Permission checks at handler level

## 🛡️ Security Architecture

### **Permission Model**
```
PERMISSIONS="READ;WRITE" → Tool Generation → Runtime Checks
```

**Security Layers:**
1. **Environment**: Permission configuration
2. **Tool Generation**: Dynamic tool availability
3. **Handler Level**: Operation-specific validation
4. **Manager Level**: Business rule enforcement

### **Input Validation**
```
JSON Schema → Zod Validation → Business Rules → API Constraints
```

**Validation Strategy:**
- **Schema Level**: MCP protocol compliance
- **Type Level**: Runtime type safety
- **Business Level**: Domain-specific rules
- **API Level**: Trilium constraints

## 📊 Architecture Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **Lines of Code** | ~2,000+ | Well-organized, documented code |
| **Test Coverage** | 250+ tests | Comprehensive test suite |
| **Modules** | 6 domains | Clear domain separation |
| **Files** | 39+ TS files | Organized structure |
| **Build Time** | < 2s | Fast compilation |

## 🚀 Getting Started

### **Quick Start**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Trilium credentials

# 3. Build and run
npm run build
npm run inspector  # Test with MCP inspector
```

### **Development Workflow**
```bash
# Development
npm run watch          # Watch mode development

# Testing
npm run test           # Full test suite
npm run check          # Build + validation

# Deployment
npm run build         # Production build
```

## 📚 Next Steps

1. **[Module Architecture](./modules/README.md)** - Deep dive into business domains
2. **[Type System](./types/README.md)** - Type definitions and interfaces
3. **[Utility Libraries](./utils/README.md)** - Shared utilities and helpers
4. **[Testing Guide](../../tests/README.md)** - Testing strategy and patterns

## 🤝 Contributing

This architecture welcomes contributions that:
- **Follow established patterns** in the respective domains
- **Maintain separation of concerns** between layers
- **Add comprehensive tests** for new functionality
- **Update documentation** for architectural changes

---

**Architecture Version**: v2.0 (Modular Refactoring Complete)
**Maintainers**: TriliumNext MCP Team