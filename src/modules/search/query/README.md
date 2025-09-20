# Query Construction Submodule - Search Query Engine

## 🎯 Submodule Purpose

The Query Construction Submodule provides **advanced query building and optimization** for converting structured JSON parameters into Trilium's search DSL, supporting complex boolean logic, template translation, and hierarchy navigation.

## 🏗️ Architecture Overview

```
query/
├── 📄 queryBuilder.ts        # [CORE] Query construction engine
├── 📄 queryValidator.ts      # [VALIDATION] Query validation logic
└── 📄 queryOptimizer.ts      # [OPTIMIZATION] Performance optimization
```

## 🔄 Query Building Pipeline

```
Structured JSON Parameters
    ↓ [Parameter Validation]
Query Builder
    ↓ [DSL Conversion]
Query Optimization
    ↓ [Performance Analysis]
Trilium Search DSL
```

## 🔧 Core Components

### **Query Builder** (`queryBuilder.ts`)
**Purpose**: Converts JSON parameters to Trilium search DSL

**Key Features:**
- **Multi-Operator Support**: exists, contains, regex, date comparisons
- **Boolean Logic**: Complex AND/OR operations with proper grouping
- **Template Translation**: Built-in template name to ID conversion
- **Hierarchy Navigation**: Deep parent/child/ancestor navigation
- **Smart Date Processing**: Native Trilium date expressions

**Query Construction Flow:**
```typescript
// Input: Structured JSON
{
  searchCriteria: [
    { property: 'title', type: 'noteProperty', op: 'contains', value: 'project' },
    { property: 'dateCreated', type: 'noteProperty', op: '>=', value: 'TODAY-7' }
  ]
}

// Output: Trilium DSL
"note.title *=* 'project' note.dateCreated >= 'TODAY-7'"
```

**Operator Mappings:**
```typescript
const OPERATOR_MAP: Record<string, string> = {
  'exists': '',
  'not_exists': '!',
  'contains': '*=*',
  'starts_with': '=*',
  'ends_with': '*=',
  'equals': '=',
  'not_equal': '!=',
  'regex': '%=',
  '>': '>',
  '>=': '>=',
  '<': '<',
  '<=': '<='
};
```

### **Query Validator** (`queryValidator.ts`)
**Purpose**: Validates query parameters and structure

**Validation Features:**
- **Parameter Validation**: Ensures required parameters are present
- **Operator Validation**: Validates operator usage for property types
- **Value Validation**: Validates value formats and types
- **Structure Validation**: Validates query structure and logic

**Validation Rules:**
```typescript
export function validateSearchCriteria(criteria: SearchCriteria[]): ValidationResult {
  const errors: ValidationError[] = [];

  criteria.forEach((c, index) => {
    // Validate property exists
    if (!c.property) {
      errors.push({
        path: `searchCriteria[${index}].property`,
        message: 'Property is required'
      });
    }

    // Validate operator is supported
    if (!SUPPORTED_OPERATORS.includes(c.operator)) {
      errors.push({
        path: `searchCriteria[${index}].operator`,
        message: `Unsupported operator: ${c.operator}`
      });
    }

    // Validate value based on operator
    if (c.operator !== 'exists' && c.operator !== 'not_exists' && !c.value) {
      errors.push({
        path: `searchCriteria[${index}].value`,
        message: 'Value is required for this operator'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

### **Query Optimizer** (`queryOptimizer.ts`)
**Purpose**: Optimizes queries for better performance

**Optimization Features:**
- **Complexity Analysis**: Estimates query cost before execution
- **Suggestion Engine**: Recommends optimization strategies
- **Query Simplification**: Simplifies complex queries when possible
- **Performance Monitoring**: Tracks query performance metrics

**Optimization Analysis:**
```typescript
export function analyzeQueryComplexity(criteria: SearchCriteria[]): QueryAnalysis {
  let complexityScore = 0;
  const suggestions: string[] = [];

  // Count complex operators
  const regexCount = criteria.filter(c => c.operator === 'regex').length;
  const orCount = criteria.filter(c => c.logic === 'OR').length;

  // Calculate complexity
  complexityScore += criteria.length * 10; // Base complexity per criterion
  complexityScore += regexCount * 50; // Regex is expensive
  complexityScore += orCount * 30; // OR operations are complex

  // Generate suggestions
  if (regexCount > 2) {
    suggestions.push('Consider reducing regex patterns for better performance');
  }

  if (orCount > 3) {
    suggestions.push('Consider splitting OR queries into multiple searches');
  }

  if (complexityScore > 200) {
    suggestions.push('Query is very complex, consider simplifying');
  }

  return {
    complexity: complexityScore > 100 ? 'high' : complexityScore > 50 ? 'medium' : 'low',
    score: complexityScore,
    suggestions
  };
}
```

## 🎨 Query Capabilities

### **Attribute Search**
```typescript
// Labels
{ property: 'priority', type: 'label', op: 'exists' }

// Relations
{ property: 'template', type: 'relation', op: '=', value: 'Board' }

// Mixed Logic
{ property: 'project', type: 'label', logic: 'OR' },
{ property: 'client', type: 'label' }
```

### **Note Property Search**
```typescript
// Content Properties
{ property: 'title', type: 'noteProperty', op: 'contains', value: 'meeting' }
{ property: 'content', type: 'noteProperty', op: 'starts_with', value: 'Introduction' }

// System Properties
{ property: 'isArchived', type: 'noteProperty', op: '=', value: 'false' }
{ property: 'type', type: 'noteProperty', op: '=', value: 'text' }

// Date Properties
{ property: 'dateModified', type: 'noteProperty', op: '>=', value: 'TODAY-30' }

// Numeric Properties
{ property: 'labelCount', type: 'noteProperty', op: '>', value: '5' }
```

### **Hierarchy Navigation**
```typescript
// Direct Children
{ property: 'parents.title', type: 'noteProperty', op: '=', value: 'Projects' }

// Deep Hierarchy
{ property: 'parents.parents.noteId', type: 'noteProperty', op: '=', value: 'root' }

// All Descendants
{ property: 'ancestors.title', type: 'noteProperty', op: '=', value: 'Archive' }
```

### **Advanced Operators**
- **exists/not_exists**: Property existence checks
- **contains/starts_with/ends_with**: String matching
- **regex**: Regular expression patterns
- **date comparisons**: Smart date expressions (TODAY, MONTH-1, etc.)

## 🛡️ Query Security

### **Input Validation**
- **Schema Validation**: JSON Schema compliance
- **Type Safety**: TypeScript type checking
- **Business Rules**: Domain-specific constraints
- **API Limits**: Query complexity restrictions

### **Query Sanitization**
- **SQL Injection Prevention**: Safe parameter handling
- **XSS Prevention**: Output sanitization
- **Resource Limits**: Query complexity limits
- **Timeout Protection**: Query execution timeouts

## 📊 Performance Considerations

### **Complexity Management**
- **Query Cost Estimation**: Pre-execution complexity analysis
- **Resource Allocation**: Memory and CPU usage monitoring
- **Timeout Handling**: Graceful timeout management
- **Caching Strategies**: Query result caching

### **Optimization Strategies**
- **Index Utilization**: Efficient index usage
- **Query Simplification**: Automatic query simplification
- **Parallel Processing**: Multi-threaded query execution
- **Batch Operations**: Efficient batch processing

## 🧪 Testing Strategy

### **Test Categories**
1. **Query Building**: DSL generation accuracy
2. **Operator Support**: All operators and combinations
3. **Validation Logic**: Input validation rules
4. **Optimization**: Performance optimization validation
5. **Edge Cases**: Unusual scenarios and error conditions

### **Test Coverage**
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end query workflows
- **Performance Tests**: Optimization effectiveness
- **Security Tests**: Input validation and sanitization

## 🔧 Extension Points

### **Adding New Operators**
1. **Update Operator Mapping**: Add to `OPERATOR_MAP`
2. **Update Validation**: Add operator validation rules
3. **Add Tests**: Operator-specific test cases
4. **Update Documentation**: Operator usage examples

### **Adding New Property Types**
1. **Property Mapping**: Add to `buildNotePropertyQuery()`
2. **Validation**: Add type-specific validation
3. **Operators**: Supported operators for the property
4. **Documentation**: Usage examples

### **Enhancing Optimization**
1. **New Metrics**: Additional complexity metrics
2. **Optimization Rules**: New optimization strategies
3. **Caching**: Enhanced caching mechanisms
4. **Monitoring**: Performance monitoring improvements

## 📈 Query Metrics

| Query Type | Complexity | Performance | Usage Frequency |
|-------------|------------|--------------|------------------|
| **Simple Text** | Low | Very Fast | High |
| **Attribute Search** | Medium | Fast | Medium |
| **Hierarchy Search** | High | Moderate | Low |
| **Complex Boolean** | High | Slow | Low |

## 📚 Related Documentation

- **[Search Domain](../README.md)** - Search domain overview
- **[Search Examples](../../../docs/search-examples/)** - Usage patterns and examples
- **[Query Optimization Guide](../../../docs/query-optimization.md)** - Optimization strategies
- **[Trilium Search DSL](../../../docs/trilium-search-dsl.md)** - Trilium syntax reference

---

**Query Construction Submodule Version**: v2.0 (Enhanced)
**Architecture Pattern**: Query Engine with Optimization
**Last Updated**: September 2024