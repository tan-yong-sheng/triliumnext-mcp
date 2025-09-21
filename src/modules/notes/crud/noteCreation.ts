/**
 * Note Creation Operations
 * Handles note creation with duplicate detection, content validation, and attribute processing
 */

import { prepareContentForApi } from '../../../modules/utils/core/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../../../modules/utils/core/verboseUtils.js';
import { validateContentForNoteType, extractTemplateRelation } from '../../../modules/utils/core/contentRules.js';
import { validateAndTranslateTemplate, createTemplateRelationError } from '../../../modules/utils/core/templateMapper.js';
import { cleanAttributeName, generateCleaningMessage } from '../../../modules/utils/core/attributeNameCleaner.js';
import { SearchOperation } from '../../search/searchManager.js';
import { Attribute, NoteOperation, NoteCreateResponse } from '../noteManager.js';

/**
 * Check if a note with the same title already exists in the same directory
 */
export async function checkDuplicateTitleInDirectory(
  parentNoteId: string,
  title: string,
  axiosInstance: any
): Promise<{ found: boolean; duplicateNoteId?: string }> {
  // Search for notes with exact title in the same parent directory
  const searchParams: SearchOperation = {
    searchCriteria: [
      {
        property: "title",
        op: "=",
        value: title,
        logic: "AND"
      },
      {
        property: "parents.noteId",
        op: "=",
        value: parentNoteId,
        logic: "AND"
      }
    ]
  };

  try {
    // Use the search function to find duplicates
    const response = await axiosInstance.get(`/notes?search=note.title%20%3D%20%27${encodeURIComponent(title)}%27%20AND%20note.parents.noteId%20%3D%20%27${encodeURIComponent(parentNoteId)}%27&fastSearch=false&includeArchivedNotes=true`);
    const results = response.data.results || [];

    logVerbose("checkDuplicateTitleInDirectory", `Search for duplicate title "${title}" in parent ${parentNoteId} found ${results.length} results`);

    if (results.length > 0) {
      return { found: true, duplicateNoteId: results[0].noteId };
    }
    return { found: false };
  } catch (error) {
    logVerboseError("checkDuplicateTitleInDirectory", error);
    // If search fails, proceed cautiously (don't block creation)
    return { found: false };
  }
}

/**
 * Create attributes for a note (helper function)
 */
export async function createNoteAttributes(
  noteId: string,
  attributes: Attribute[],
  axiosInstance: any
): Promise<{ results: any[]; cleaningResults: any[] }> {
  const cleaningResults: any[] = [];

  const attributePromises = attributes.map(async (attr) => {
    // Clean attribute name first
    const cleaningResult = cleanAttributeName(attr.name, attr.type);
    if (cleaningResult.wasCleaned) {
      cleaningResults.push(cleaningResult);
    }

    // Use cleaned attribute name
    const cleanedAttr = {
      ...attr,
      name: cleaningResult.cleanedName
    };

    // Translate template names to note IDs for template relations
    let processedValue = cleanedAttr.value || '';
    if (cleanedAttr.type === "relation" && cleanedAttr.name === "template" && cleanedAttr.value) {
      try {
        processedValue = validateAndTranslateTemplate(cleanedAttr.value);
        logVerbose("createNoteAttributes", `Translated template relation`, {
          from: cleanedAttr.value,
          to: processedValue
        });
      } catch (error) {
        logVerboseError("createNoteAttributes", error);
        throw new Error(createTemplateRelationError(cleanedAttr.value));
      }
    }

    const attributeData = {
      noteId: noteId,
      type: cleanedAttr.type,
      name: cleanedAttr.name,
      value: processedValue,
      position: cleanedAttr.position || 10,
      isInheritable: cleanedAttr.isInheritable || false
    };

    logVerboseApi("POST", `/attributes`, attributeData);
    const response = await axiosInstance.post(`/attributes`, attributeData);
    logVerbose("createNoteAttributes", `Created ${cleanedAttr.type} '${cleanedAttr.name}' for note ${noteId}`, response.data);
    return response;
  });

  const results = await Promise.all(attributePromises);
  logVerbose("createNoteAttributes", `Successfully created ${results.length} attributes for note ${noteId}`);

  return { results, cleaningResults };
}

/**
 * Handle create note operation
 */
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse & { attributeCleaningMessage?: string }> {
  const { parentNoteId, title, type, content: rawContent, mime, attributes } = args;

  // Validate required parameters
  if (!parentNoteId || !title || !type) {
    throw new Error("parentNoteId, title, and type are required for create operation.");
  }

  // Check for duplicate title in the same directory
  const duplicateCheck = await checkDuplicateTitleInDirectory(parentNoteId, title, axiosInstance);
  if (duplicateCheck.found) {
    return {
      message: `Found existing note with title "${title}" in this directory. Please choose how to proceed:`,
      duplicateFound: true,
      duplicateNoteId: duplicateCheck.duplicateNoteId,
      choices: {
        skip: "Skip creation - do nothing",
        updateExisting: "Update existing - replace content of existing note with new content"
      },
      nextSteps: `Please specify your choice by calling create_note again with a different title, or use update_note with noteId: ${duplicateCheck.duplicateNoteId}`
    };
  }

  // Process content to ETAPI format
  // Content is optional - if not provided, default to empty string
  const content = rawContent || "";

  // Extract template relation for content validation
  const templateRelation = extractTemplateRelation(attributes);

  // Clean template relation for consistent processing
  const cleanedTemplateRelation = templateRelation ? templateRelation.trim() : '';

  // Auto-correct note type for container templates
  let correctedType = type;
  if (templateRelation) {
    // List of container templates that require 'book' type
    const containerTemplates = [
      'board', '_template_board',
      'grid view', '_template_grid_view',
      'list view', '_template_list_view',
      'geo map', '_template_geo_map',
      'calendar', '_template_calendar'
    ];

    const isContainerTemplate = cleanedTemplateRelation &&
      containerTemplates.includes(cleanedTemplateRelation.toLowerCase());

    if (isContainerTemplate && type !== 'book') {
      logVerbose("handleCreateNote", `Auto-correcting note type from '${type}' to 'book' for ${templateRelation} template`);
      correctedType = 'book';
    }
  }

  // Handle empty/undefined content case - default to empty string for text notes
  let finalContent = content;
  if ((finalContent === undefined || finalContent === null || finalContent === '') && correctedType === 'text') {
    finalContent = '';
  }

  // Validate content with template-aware rules
  const contentValidation = await validateContentForNoteType(
    finalContent,
    correctedType as any,
    undefined,
    templateRelation
  );

  if (!contentValidation.valid) {
    return {
      message: `CONTENT_VALIDATION_ERROR: ${contentValidation.error}`,
      duplicateFound: false,
      nextSteps: "Please adjust your content according to the requirements and try again."
    };
  }

  // Use validated content (may have been auto-corrected)
  const validatedContent = contentValidation.content;

  // Process content to ETAPI format
  const processed = await prepareContentForApi(validatedContent, correctedType);
  if (processed.error) {
    throw new Error(`Content processing error: ${processed.error}`);
  }

  const processedContent = processed.content;

  // Create note with processed content (empty for file/image-only notes)
  const noteData: any = {
    parentNoteId,
    title,
    type: correctedType,
    content: processedContent
  };

  // Add MIME type if specified
  if (mime) {
    noteData.mime = mime;
  }

  const response = await axiosInstance.post("/create-note", noteData);
  const noteId = response.data.note.noteId;

  let attributeCleaningMessage = '';

  // Handle attributes if provided
  if (attributes && attributes.length > 0) {
    try {
      logVerbose("handleCreateNote", `Creating ${attributes.length} attributes for note ${noteId}`, attributes);
      const attributeResult = await createNoteAttributes(noteId, attributes, axiosInstance);
      logVerbose("handleCreateNote", `Successfully created all attributes for note ${noteId}`);

      // Add cleaning information to response if any corrections were made
      if (attributeResult.cleaningResults && attributeResult.cleaningResults.length > 0) {
        const cleaningMessage = generateCleaningMessage(attributeResult.cleaningResults);
        if (cleaningMessage) {
          attributeCleaningMessage = cleaningMessage;
        }
      }
    } catch (attributeError) {
      const errorMsg = `Note created but attributes failed to apply: ${attributeError instanceof Error ? attributeError.message : attributeError}`;
      logVerboseError("handleCreateNote", attributeError);
      console.warn(errorMsg);
    }
  }


  return {
    noteId: noteId,
    message: `Created note: ${noteId}`,
    duplicateFound: false,
    attributeCleaningMessage
  };
}