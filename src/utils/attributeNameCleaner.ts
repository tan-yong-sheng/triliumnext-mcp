/**
 * Attribute Name Cleaner Utility
 * Auto-corrects common LLM mistakes in attribute names by removing
 * leading/trailing # and ~ symbols that don't belong in attribute names.
 */

import { logVerbose } from './verboseUtils.js';

/**
 * Cleaning result interface
 */
export interface CleaningResult {
  cleanedName: string;
  wasCleaned: boolean;
  originalName: string;
  corrections: string[];
}

/**
 * Clean attribute name by removing invalid leading/trailing symbols
 *
 * Trilium ETAPI requires attribute names to be clean without # or ~ symbols.
 * LLMs often mistakenly add these symbols to attribute names.
 *
 * @param attributeName The attribute name to clean
 * @param attributeType The type of attribute (label or relation)
 * @returns CleaningResult with details about any corrections made
 */
export function cleanAttributeName(
  attributeName: string,
  attributeType: 'label' | 'relation'
): CleaningResult {
  const originalName = attributeName;
  const corrections: string[] = [];

  if (!attributeName || typeof attributeName !== 'string') {
    return {
      cleanedName: attributeName,
      wasCleaned: false,
      originalName,
      corrections: []
    };
  }

  let cleanedName = attributeName.trim();

  // Remove leading # symbol (common LLM mistake for labels)
  if (attributeType === 'label' && cleanedName.startsWith('#')) {
    cleanedName = cleanedName.substring(1).trim();
    corrections.push(`Removed leading '#' symbol`);
  }

  // Remove leading ~ symbol (common LLM mistake for relations)
  if (attributeType === 'relation' && cleanedName.startsWith('~')) {
    cleanedName = cleanedName.substring(1).trim();
    corrections.push(`Removed leading '~' symbol`);
  }

  const wasCleaned = corrections.length > 0;

  // Log corrections if any were made
  if (wasCleaned) {
    logVerbose('cleanAttributeName', `Auto-corrected ${attributeType} name`, {
      original: originalName,
      corrected: cleanedName,
      corrections,
      attributeType
    });
  }

  return {
    cleanedName,
    wasCleaned,
    originalName,
    corrections
  };
}

/**
 * Clean an array of attributes
 *
 * @param attributes Array of attributes to clean
 * @returns Array of cleaned attributes with cleaning information
 */
export function cleanAttributeNames(
  attributes: Array<{type: 'label' | 'relation'; name: string}>
): Array<{
  type: 'label' | 'relation';
  name: string;
  cleaningResult?: CleaningResult;
}> {
  return attributes.map(attribute => {
    const cleaningResult = cleanAttributeName(attribute.name, attribute.type);

    return {
      ...attribute,
      name: cleaningResult.cleanedName,
      cleaningResult: cleaningResult.wasCleaned ? cleaningResult : undefined
    };
  });
}

/**
 * Generate user-friendly message about corrections
 *
 * @param cleaningResults Array of cleaning results
 * @returns User-friendly message describing corrections
 */
export function generateCleaningMessage(cleaningResults: CleaningResult[]): string {
  const totalCorrections = cleaningResults.filter(r => r.wasCleaned).length;

  if (totalCorrections === 0) {
    return '';
  }

  const correctionsByType = cleaningResults.reduce((acc, result) => {
    if (result.wasCleaned) {
      result.corrections.forEach(correction => {
        acc[correction] = (acc[correction] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const correctionSummary = Object.entries(correctionsByType)
    .map(([correction, count]) => `${count}× ${correction}`)
    .join(', ');

  return `🔧 **Auto-Corrections Applied**\n` +
         `Fixed ${totalCorrections} attribute name(s): ${correctionSummary}\n\n` +
         `💡 **Common LLM Mistakes Fixed**:\n` +
         `• Attribute names should NOT start with # or ~ symbols\n` +
         `• # symbols are for attribute values in search queries (e.g., #book)\n` +
         `• ~ symbols are for attribute values in search queries (e.g., ~template)\n` +
         `• Attribute names should be plain text (e.g., "startDate", "template")`;
}

/**
 * Check if an attribute name needs cleaning
 *
 * @param attributeName The attribute name to check
 * @returns True if the name needs cleaning
 */
export function needsCleaning(attributeName: string, attributeType: 'label' | 'relation' = 'label'): boolean {
  if (!attributeName || typeof attributeName !== 'string') {
    return false;
  }

  const trimmed = attributeName.trim();
  return (attributeType === 'label' && trimmed.startsWith('#')) ||
         (attributeType === 'relation' && trimmed.startsWith('~'));
}