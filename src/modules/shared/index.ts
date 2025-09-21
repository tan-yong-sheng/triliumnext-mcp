/**
 * Shared Utilities Module
 * Centralized exports for cross-cutting utilities used across all modules
 */

// Note utilities
export { buildNoteParams } from '../../modules/utils/formatting/noteBuilder.js';
export { trimNoteResults, formatNotesForListing } from '../../modules/utils/formatting/noteFormatter.js';

// Content utilities
export { processContent, prepareContentForApi } from '../../modules/utils/content/contentProcessor.js';
export { validateContentForNoteType, getContentRequirements } from '../../modules/utils/validation/contentRules.js';

// Attribute utilities
export {
  translate_template_relation,
  format_attributes_for_display,
  validate_attribute,
  check_attribute_exists,
  generate_attribute_cleaning_message
} from '../../modules/utils/attributes/attributeUtils.js';
export { cleanAttributeName } from '../../modules/utils/attributes/attributeNameCleaner.js';

// Validation utilities
export {
  validateManageAttributes,
  validateCreateNote,
  validateSearchNotes,
  validateUpdateNote,
  safeValidate
} from '../../modules/utils/validation/validationUtils.js';

// Template utilities
export { isBuiltinTemplate } from '../../modules/utils/content/templateMapper.js';

// Permission utilities
export { PermissionChecker } from '../../modules/utils/system/permissionUtils.js';

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
} from '../../modules/utils/system/verboseUtils.js';

// Error handling utilities
export {
  createAttributeError,
  createNoteError,
  createSearchError,
  createPermissionError,
  createValidationError,
  createConflictError,
  createContainerTemplateError
} from '../utils/system/errorUtils.js';

// Search operations
export { SearchOperation, handleSearchNotes } from '../search/searchManager.js';

// Type definitions
export * from '../../modules/types/index.js';