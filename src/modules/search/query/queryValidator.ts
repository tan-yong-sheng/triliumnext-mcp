/**
 * Search Query Validation
 * Handles validation of search criteria and parameters
 */

interface SearchCriteria {
  property: string;
  type: 'label' | 'relation' | 'noteProperty';
  op?: string;
  value?: string;
  logic?: 'AND' | 'OR';
}

interface SearchStructuredParams {
  text?: string;
  limit?: number;
  searchCriteria?: SearchCriteria[];
}

/**
 * Validates search parameters to ensure they meet minimum requirements
 */
export function validateSearchParams(params: SearchStructuredParams): { valid: boolean; error?: string } {
  // Check if at least one search parameter is provided
  if (!params.text && (!params.searchCriteria || params.searchCriteria.length === 0)) {
    return {
      valid: false,
      error: "At least one search parameter must be provided (text or searchCriteria)"
    };
  }

  // Validate individual search criteria
  if (params.searchCriteria && params.searchCriteria.length > 0) {
    for (let i = 0; i < params.searchCriteria.length; i++) {
      const criteria = params.searchCriteria[i];
      const validation = validateSearchCriteria(criteria);
      if (!validation.valid) {
        return {
          valid: false,
          error: `Invalid search criteria at index ${i}: ${validation.error}`
        };
      }
    }
  }

  // Validate limit parameter
  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit <= 0) {
      return {
        valid: false,
        error: "Limit must be a positive number"
      };
    }
  }

  return { valid: true };
}

/**
 * Validates individual search criteria
 */
export function validateSearchCriteria(criteria: SearchCriteria): { valid: boolean; error?: string } {
  // Validate type
  if (!['label', 'relation', 'noteProperty'].includes(criteria.type)) {
    return {
      valid: false,
      error: `Invalid search criteria type: '${criteria.type}'. Must be 'label', 'relation', or 'noteProperty'`
    };
  }

  // Validate property name
  if (!criteria.property || typeof criteria.property !== 'string' || criteria.property.trim() === '') {
    return {
      valid: false,
      error: "Property name is required and cannot be empty"
    };
  }

  // Validate operator
  if (criteria.op) {
    const validOperators = [
      'exists', 'not_exists', '=', '!=', '>', '<', '>=', '<=',
      'contains', 'starts_with', 'ends_with', 'regex', 'not_equal'
    ];
    if (!validOperators.includes(criteria.op)) {
      return {
        valid: false,
        error: `Invalid operator: '${criteria.op}'. Valid operators are: ${validOperators.join(', ')}`
      };
    }
  }

  // Validate value for operators that require it
  const operatorsNeedingValue = ['=', '!=', '>', '<', '>=', '<=', 'contains', 'starts_with', 'ends_with', 'regex', 'not_equal'];
  if (operatorsNeedingValue.includes(criteria.op || 'exists') && !criteria.value) {
    return {
      valid: false,
      error: `Value is required for operator '${criteria.op}'`
    };
  }

  // Validate logic operator
  if (criteria.logic && !['AND', 'OR'].includes(criteria.logic)) {
    return {
      valid: false,
      error: `Invalid logic operator: '${criteria.logic}'. Must be 'AND' or 'OR'`
    };
  }

  return { valid: true };
}

/**
 * Validates note type values for search
 */
export function validateNoteTypeForSearch(value: string): { valid: boolean; error?: string } {
  const validNoteTypes = [
    'text', 'code', 'render', 'search', 'relationMap', 'book', 'noteMap', 'mermaid', 'webView'
  ];

  if (!validNoteTypes.includes(value)) {
    return {
      valid: false,
      error: `Invalid note type: '${value}'. Valid note types are: ${validNoteTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validates MIME type values for search
 */
export function validateMimeTypeForSearch(value: string): { valid: boolean; error?: string } {
  // Allow any text/* or application/* MIME type
  if (!value.match(/^(text|application)\/[a-zA-Z0-9][a-zA-Z0-9\-_.]*$/)) {
    return {
      valid: false,
      error: `Invalid MIME type format: '${value}'. Must follow pattern 'text/*' or 'application/*'`
    };
  }

  return { valid: true };
}

/**
 * Validates date format for date properties
 */
export function validateDateForSearch(value: string, property: string): { valid: boolean; error?: string } {
  // ISO date formats: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

  // TriliumNext smart date expressions
  const smartDatePatterns = [
    /^TODAY([+-]\d+)?$/,           // TODAY, TODAY-7, TODAY+30
    /^MONTH([+-]\d+)?$/,          // MONTH, MONTH-1, MONTH+1
    /^YEAR([+-]\d+)?$/,           // YEAR, YEAR+1, YEAR-1
    /^MONDAY([+-]\d+)?$/,         // MONDAY, MONDAY-1
    /^TUESDAY([+-]\d+)?$/,        // TUESDAY, TUESDAY+1
    /^WEDNESDAY([+-]\d+)?$/,      // WEDNESDAY
    /^THURSDAY([+-]\d+)?$/,       // THURSDAY
    /^FRIDAY([+-]\d+)?$/,         // FRIDAY
    /^SATURDAY([+-]\d+)?$/,       // SATURDAY
    /^SUNDAY([+-]\d+)?$/          // SUNDAY
  ];

  // Check if it's a valid ISO date, ISO datetime, or smart date expression
  const isValidISO = isoDateRegex.test(value) || isoDateTimeRegex.test(value);
  const isValidSmartDate = smartDatePatterns.some(pattern => pattern.test(value.toUpperCase()));

  if (!isValidISO && !isValidSmartDate) {
    return {
      valid: false,
      error: `Invalid date format for property '${property}'. Must use ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ' (e.g., '2024-01-01T00:00:00.000Z') or TriliumNext smart expressions like 'TODAY-7', 'MONTH-1', 'YEAR+1'.`
    };
  }

  // For ISO dates, check if the date is actually valid
  if (isValidISO) {
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) {
      return {
        valid: false,
        error: `Invalid date value for property '${property}': '${value}'. Please provide a valid ISO date.`
      };
    }
  }

  return { valid: true };
}