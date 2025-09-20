# Validation Submodule - Note Validation Logic

## 🎯 Submodule Purpose

The Validation Submodule provides **comprehensive validation logic** for note operations, ensuring data integrity, type safety, and business rule compliance throughout the note lifecycle.

## 🏗️ Architecture Overview

```
validation/
├── 📄 containerValidator.ts  # [CONTAINER] Container template protection
├── 📄 contentValidator.ts    # [CONTENT] Content type validation
├── 📄 hashValidator.ts       # [HASH] Hash-based conflict detection
└── 📄 typeValidator.ts       # [TYPE] Note type validation
```

## 🔄 Validation Pipeline

```
Note Operation Request
    ↓ [Input Validation]
Type Validator
    ↓ [Content Validation]
Content Validator
    ↓ [Container Validation]
Container Validator
    ↓ [Hash Validation]
Hash Validator
    ↓ [Validation Result]
Operation Proceeds or Fails
```

## 🔧 Core Components

### **Container Validator** (`containerValidator.ts`)
**Purpose**: Prevents accidental modification of container template notes

**Protected Templates:**
- **Board**: Kanban/task board layouts
- **Calendar**: Calendar interfaces
- **Grid View**: Grid-based layouts
- **List View**: List-based layouts
- **Table**: Spreadsheet-like tables
- **Geo Map**: Geographic maps

**Protection Logic:**
```typescript
export function isContainerTemplateNote(noteData: any): boolean {
  const noteType = noteData.type;
  if (noteType !== 'book') return false;

  const templateRelation = noteData.attributes?.find(
    (attr: any) => attr.type === 'relation' && attr.name === 'template'
  )?.value;

  return CONTAINER_TEMPLATES.includes(templateRelation);
}

export function generateContainerTemplateGuidance(templateType: string): string {
  const guidance = {
    'Board': 'Board templates are used for project management with kanban-style columns.',
    'Calendar': 'Calendar templates provide scheduling and event management interfaces.',
    'Grid View': 'Grid View templates organize content in a visual grid layout.',
    'List View': 'List View templates provide structured lists with filtering capabilities.',
    'Table': 'Table templates offer spreadsheet-like data organization.',
    'Geo Map': 'Geo Map templates display geographic information with location markers.'
  };

  return `${guidance[templateType] || 'This template provides specialized functionality.'}\n\n` +
    'Instead of modifying this template directly:\n' +
    '1. Create child notes under this template\n' +
    '2. Use the template\'s specialized interface\n' +
    '3. Customize child notes as needed\n\n' +
    'If you need to modify the template structure:\n' +
    '1. Remove the template relation first\n' +
    '2. Make your changes\n' +
    '3. Reapply the template relation if desired';
}

export function validateContainerTemplateModification(
  noteData: any,
  operation: 'update' | 'attribute'
): ValidationResult {
  if (isContainerTemplateNote(noteData)) {
    const templateType = noteData.attributes?.find(
      (attr: any) => attr.type === 'relation' && attr.name === 'template'
    )?.value;

    return {
      isValid: false,
      error: {
        code: 'CONTAINER_TEMPLATE_PROTECTED',
        message: `Cannot modify ${operation} on container template note '${noteData.title}'`,
        details: {
          templateType,
          noteId: noteData.noteId,
          operation,
          guidance: generateContainerTemplateGuidance(templateType)
        }
      }
    };
  }

  return { isValid: true };
}
```

### **Content Validator** (`contentValidator.ts`)
**Purpose**: Ensures content matches note type requirements

**Validation Rules:**
- **Text Notes**: Auto-detect HTML/Markdown/plain text
- **Code Notes**: Plain text only (no HTML processing)
- **Mermaid Notes**: Plain text diagram definitions
- **Container Templates**: Empty content only
- **System Notes**: Specific content requirements

**Content Validation:**
```typescript
export function validateContentForNoteType(content: ContentSection[], noteType: NoteType): ValidationResult {
  if (!content || content.length === 0) {
    // Empty content is allowed for most types
    return { isValid: true };
  }

  const contentText = content.map(section => section.content).join('\n');

  switch (noteType) {
    case 'text':
      return validateTextContent(contentText);
    case 'code':
      return validateCodeContent(contentText);
    case 'mermaid':
      return validateMermaidContent(contentText);
    case 'book':
      return validateBookContent(contentText);
    case 'search':
      return validateSearchContent(contentText);
    default:
      return { isValid: true }; // Most types allow flexible content
  }
}

export function validateTextContent(content: string): ValidationResult {
  // Text notes can contain HTML, Markdown, or plain text
  // No specific validation needed, but we can provide optimization
  if (content.trim() === '') {
    return { isValid: true };
  }

  // Check if content is plain text (no HTML tags)
  const isPlainText = !/<[^>]*>/.test(content);

  return {
    isValid: true,
    suggestion: isPlainText ? 'Consider using HTML formatting for better text note display' : undefined
  };
}

export function validateCodeContent(content: string): ValidationResult {
  // Code notes should be plain text only
  if (/<[^>]*>/.test(content)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_CODE_CONTENT',
        message: 'Code notes cannot contain HTML markup. Use plain text only.',
        suggestion: 'Remove HTML tags and use plain text for code content.'
      }
    };
  }

  return { isValid: true };
}

export function validateMermaidContent(content: string): ValidationResult {
  // Mermaid notes should be plain text diagram definitions
  if (/<[^>]*>/.test(content)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_MERMAID_CONTENT',
        message: 'Mermaid notes cannot contain HTML markup. Use plain text diagram definitions only.',
        suggestion: 'Remove HTML tags and provide valid Mermaid diagram syntax.'
      }
    };
  }

  // Basic Mermaid syntax validation
  const hasValidMermaid = /^(graph|flowchart|sequenceDiagram|gantt|pie|classDiagram|stateDiagram|journey|gitGraph|erDiagram|mindmap|timeline|quadrantChart|requirementDiagram|c4C|c4P|c4I|c4E|c4D)/im.test(content);

  if (!hasValidMermaid && content.trim()) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_MERMAID_SYNTAX',
        message: 'Content does not appear to contain valid Mermaid diagram syntax.',
        suggestion: 'Use valid Mermaid diagram syntax (e.g., "graph TD; A-->B")'
      }
    };
  }

  return { isValid: true };
}
```

### **Hash Validator** (`hashValidator.ts`)
**Purpose**: Prevents concurrent modification conflicts using hash-based validation

**Hash Validation:**
```typescript
export function validateBlobIdHash(
  currentBlobId: string,
  expectedHash: string
): ValidationResult {
  if (!expectedHash) {
    return {
      isValid: false,
      error: {
        code: 'MISSING_HASH',
        message: 'Expected hash is required for validation',
        suggestion: 'Call get_note first to retrieve the current blobId (content hash)'
      }
    };
  }

  if (currentBlobId !== expectedHash) {
    return {
      isValid: false,
      error: {
        code: 'HASH_MISMATCH',
        message: 'Note has been modified by another user',
        details: {
          currentBlobId,
          expectedHash,
          suggestion: 'Get the latest note content and retry your changes'
        }
      }
    };
  }

  return { isValid: true };
}

export function generateHashValidationMessage(result: ValidationResult): string {
  if (!result.error) return '';

  switch (result.error.code) {
    case 'MISSING_HASH':
      return 'Missing required hash parameter. You must call get_note first to retrieve the current blobId before updating.';

    case 'HASH_MISMATCH':
      return `CONFLICT: Note has been modified by another user. Current blobId: ${result.error.details.currentBlobId}, expected: ${result.error.details.expectedHash}. Please get the latest note content and retry.`;

    default:
      return result.error.message;
  }
}
```

### **Type Validator** (`typeValidator.ts`)
**Purpose**: Validates note types and MIME type compatibility

**Type Validation:**
```typescript
export function validateNoteType(type: string): ValidationResult {
  const validTypes = [
    'text', 'code', 'mermaid', 'book', 'search',
    'relationMap', 'render', 'webView', 'noteMap'
  ];

  if (!validTypes.includes(type)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_NOTE_TYPE',
        message: `Invalid note type: ${type}`,
        suggestion: `Valid types are: ${validTypes.join(', ')}`
      }
    };
  }

  return { isValid: true };
}

export function validateMimeTypeCompatibility(noteType: string, mimeType?: string): ValidationResult {
  if (!mimeType) return { isValid: true };

  const compatibilityMap: Record<string, string[]> = {
    'code': ['text/plain', 'text/x-python', 'text/x-javascript', 'text/x-typescript', 'text/x-java', 'text/x-csharp', 'text/x-cpp', 'text/x-ruby', 'text/x-go', 'text/x-php', 'text/x-swift', 'text/x-kotlin', 'text/x-rust', 'text/x-sql', 'text/x-yaml', 'text/x-json', 'text/x-xml', 'text/x-html', 'text/x-css', 'text/x-markdown', 'text/x-shellscript'],
    'mermaid': ['text/vnd.mermaid', 'text/plain'],
    'text': ['text/plain', 'text/html', 'text/markdown'],
    'render': ['text/html', 'application/xhtml+xml'],
    'webView': ['text/html', 'application/xhtml+xml']
  };

  const compatibleMimeTypes = compatibilityMap[noteType] || [];

  if (compatibleMimeTypes.length > 0 && !compatibleMimeTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: {
        code: 'MIME_TYPE_INCOMPATIBLE',
        message: `MIME type '${mimeType}' is not compatible with note type '${noteType}'`,
        suggestion: `Compatible MIME types for ${noteType} are: ${compatibleMimeTypes.join(', ')}`
      }
    };
  }

  return { isValid: true };
}
```

## 🎨 Validation Integration

### **Note Creation Validation**
```typescript
export function validateNoteCreation(params: CreateNoteOperation): ValidationResult {
  // Validate note type
  const typeValidation = validateNoteType(params.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate MIME type compatibility
  const mimeValidation = validateMimeTypeCompatibility(params.type, params.mime);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }

  // Validate content
  const contentValidation = validateContentForNoteType(params.content || [], params.type);
  if (!contentValidation.isValid) {
    return contentValidation;
  }

  // Validate title
  if (!params.title || params.title.trim().length === 0) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_TITLE',
        message: 'Note title is required and cannot be empty'
      }
    };
  }

  return { isValid: true };
}
```

### **Note Update Validation**
```typescript
export function validateNoteUpdate(
  currentNote: Note,
  updateParams: UpdateNoteOperation
): ValidationResult {
  // Check if it's a container template
  const containerValidation = validateContainerTemplateModification(currentNote, 'update');
  if (!containerValidation.isValid) {
    return containerValidation;
  }

  // Validate hash if provided
  if (updateParams.expectedHash) {
    const hashValidation = validateBlobIdHash(
      currentNote.blobId || '',
      updateParams.expectedHash
    );
    if (!hashValidation.isValid) {
      return hashValidation;
    }
  }

  // Validate content type
  if (updateParams.content) {
    const contentValidation = validateContentForNoteType(updateParams.content, updateParams.type);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  // Validate MIME type if changing
  if (updateParams.mime) {
    const mimeValidation = validateMimeTypeCompatibility(updateParams.type, updateParams.mime);
    if (!mimeValidation.isValid) {
      return mimeValidation;
    }
  }

  return { isValid: true };
}
```

## 🛡️ Validation Security

### **Input Sanitization**
- **Content Sanitization**: Remove potentially dangerous content
- **HTML Escaping**: Prevent XSS attacks
- **Type Safety**: Strong typing prevents injection attacks
- **Length Validation**: Prevent buffer overflow attacks

### **Error Handling Security**
- **Information Leakage**: Don't expose sensitive information
- **Consistent Errors**: Provide consistent error messages
- **Graceful Degradation**: Fail safely when validation fails
- **Audit Trail**: Log validation failures for security monitoring

## 📊 Performance Considerations

### **Validation Optimization**
- **Early Returns**: Fail fast on validation errors
- **Lazy Validation**: Only validate when necessary
- **Caching**: Cache validation results where appropriate
- **Batch Validation**: Validate multiple items efficiently

### **Memory Management**
- **Streaming**: Validate large content in chunks
- **Garbage Collection**: Optimize for memory efficiency
- **Object Reuse**: Reuse validation objects
- **Memory Profiling**: Monitor validation memory usage

## 🧪 Testing Strategy

### **Test Categories**
1. **Container Validation**: Template protection logic
2. **Content Validation**: Content type validation rules
3. **Hash Validation**: Conflict detection logic
4. **Type Validation**: Note type and MIME validation
5. **Integration Tests**: End-to-end validation workflows
6. **Error Handling**: Validation error scenarios

### **Test Coverage**
- **Unit Tests**: Individual validation function testing
- **Integration Tests**: Validation workflow testing
- **Security Tests**: Input validation and sanitization
- **Performance Tests**: Validation performance optimization
- **Edge Cases**: Boundary conditions and error scenarios

## 🔧 Extension Points

### **Adding New Validation Rules**
1. **Create Validation Function**: Add new validation logic
2. **Update Integration**: Integrate with validation pipeline
3. **Add Tests**: Comprehensive test coverage
4. **Update Documentation**: Document validation rules

### **Enhancing Container Protection**
1. **New Template Types**: Add new container template types
2. **Advanced Rules**: More sophisticated protection rules
3. **Custom Messages**: Template-specific guidance messages
4. **Recovery Options**: Template recovery workflows

### **Advanced Content Validation**
1. **Format Detection**: Enhanced format detection
2. **Content Analysis**: Content quality analysis
3. **Plagiarism Detection**: Content originality checking
4. **Semantic Validation**: Content meaning validation

## 📈 Validation Metrics

| Validation Type | Complexity | Performance | Usage Frequency |
|------------------|------------|--------------|------------------|
| **Container Validation** | Medium | Fast | Medium |
| **Content Validation** | High | Moderate | High |
| **Hash Validation** | Low | Very Fast | Medium |
| **Type Validation** | Low | Very Fast | High |

## 📚 Related Documentation

- **[Notes Domain](../README.md)** - Notes domain overview
- **[Validation System](../../../docs/validation-system.md)** - Overall validation approach
- **[Container Template Guide](../../../docs/container-template-protection.md)** - Protection details
- **[Content Type Guide](../../../docs/content-type-guide.md)** - Content validation rules

---

**Validation Submodule Version**: v2.0 (Enhanced)
**Architecture Pattern**: Validation Pipeline with Security
**Last Updated**: September 2024