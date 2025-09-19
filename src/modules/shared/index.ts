/**
 * Shared Utilities Module
 * Centralized exports for cross-cutting utilities used across all modules
 */

// Note utilities
export { buildNoteParams } from '../../utils/noteBuilder.js';
export { trimNoteResults, formatNotesForListing } from '../../utils/noteFormatter.js';

// Content utilities
export { processContent, prepareContentForApi } from '../../utils/contentProcessor.js';
export { validateContentForNoteType, getContentRequirements } from '../../utils/contentRules.js';

// Attribute utilities
export {
  translate_template_relation,
  format_attributes_for_display,
  validate_attribute,
  check_attribute_exists,
  generate_attribute_cleaning_message
} from '../../utils/attributeUtils.js';
export { cleanAttributeName } from '../../utils/attributeNameCleaner.js';

// Validation utilities
export {
  validateManageAttributes,
  validateCreateNote,
  validateSearchNotes,
  validateUpdateNote,
  safeValidate
} from '../../utils/validationUtils.js';

// Template utilities
export { isBuiltinTemplate } from '../../utils/templateMapper.js';

// Permission utilities
export { PermissionChecker } from '../../utils/permissionUtils.js';

// Logging utilities
export {
  logVerbose,
  logVerboseInput,
  logVerboseOutput,
  logVerboseApi,
  logVerboseError,
  logVerboseAxiosError,
  logVerboseTransform,
  createSearchDebugInfo,
  createListSummary
} from '../../utils/verboseUtils.js';

// Error handling utilities
export {
  createAttributeError,
  createNoteError,
  createSearchError,
  createPermissionError,
  createValidationError,
  createConflictError,
  createContainerTemplateError
} from '../utils/errorUtils.js';

// Search operations
export { SearchOperation, handleSearchNotes } from '../search/searchManager.js';

// Type definitions
export * from '../../types/index.js';