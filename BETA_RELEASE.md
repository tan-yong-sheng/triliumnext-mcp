# Beta Release Guide

## Publishing Beta Version 0.3.0-beta.1

### Prerequisites
- Ensure you're logged into npm: `npm whoami`
- Ensure all changes are committed to git
- Version is already updated to `0.3.0-beta.1` in package.json

### Publishing Commands

```bash
# 1. Build the project
npm run build

# 2. Publish as beta (will use version from package.json)
npm publish --tag beta

# 3. Verify beta publication
npm view triliumnext-mcp@beta version
```

### User Installation

Users can now install the beta version with:
```bash
npm install -g triliumnext-mcp@beta
```

### Version Management

**For future beta iterations**:
```bash
# Increment beta version (0.3.0-beta.1 → 0.3.0-beta.2)
npm version prerelease

# Publish new beta
npm publish --tag beta
```

**When ready for stable release**:
```bash
# Update to stable version
npm version 0.3.0

# Publish as latest (stable)
npm publish
```

### What This Beta Includes

- ✅ **FastSearch logic fixes**: Fixed limit/orderBy parameter handling
- ✅ **Enhanced logic consistency**: Required logic fields for all array parameters  
- ⚠️ **Relation search support**: Implemented but untested functionality
- ✅ **Removed manage_attributes**: Cleaned up unreliable functionality

### Testing Requests

**Please test**:
1. **FastSearch with limits**: `{"text": "search term", "limit": 5}` should work
2. **Logic consistency**: OR/AND operations in noteProperties and attributes
3. **Relation search**: `{"attributes": [{"type": "relation", "name": "author", "logic": "OR"}]}` 

**Known testing needs**:
- Relation search functionality validation against live TriliumNext instances
- Complex OR/AND logic combinations
- Performance with large note databases

### Rollback Plan

If issues are discovered:
```bash
# Users can downgrade to stable
npm install -g triliumnext-mcp@latest

# Publisher can deprecate beta
npm deprecate triliumnext-mcp@0.3.0-beta.1 "Use stable version instead"
```

### Next Steps After Beta Testing

1. Collect user feedback
2. Test relation search functionality
3. Fix any discovered issues
4. Release stable 0.3.0 when ready