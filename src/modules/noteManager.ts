/**
 * Note Management Module
 * Handles CRUD operations for TriliumNext notes
 */

import { processContentArray } from '../utils/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../utils/verboseUtils.js';
import { getContentRequirements, validateContentForNoteType, extractTemplateRelation, getTemplateContentRules } from '../utils/contentRules.js';
import { SearchOperation } from './searchManager.js';
import { validateAndTranslateTemplate, createTemplateRelationError } from '../utils/templateMapper.js';
import { cleanAttributeName, generateCleaningMessage } from '../utils/attributeNameCleaner.js';

/**
 * Container templates that must remain empty and serve as layout containers
 */
const CONTAINER_TEMPLATES = [
  'Board',      // Kanban/task boards
  'Calendar',   // Calendar interfaces
  'Grid View',  // Grid layouts
  'List View',  // List layouts
  'Table',      // Spreadsheet-like tables
  'Geo Map'     // Geographic maps
];

/**
 * Check if a note is a container template note that should not be updated
 */
function isContainerTemplateNote(noteData: any): boolean {
  const noteType = noteData.type;

  // Only book notes can be container templates
  if (noteType !== 'book') {
    return false;
  }

  // Check if the note has a container template relation
  const attributes = noteData.attributes || [];
  const templateRelation = attributes.find(
    (attr: any) => attr.type === 'relation' && attr.name === 'template'
  )?.value;

  if (!templateRelation) {
    return false;
  }

  // Check if it's a built-in container template
  return CONTAINER_TEMPLATES.includes(templateRelation);
}

/**
 * Generate helpful guidance message for container template update attempts
 */
function generateContainerTemplateGuidance(noteData: any): string {
  const attributes = noteData.attributes || [];
  const templateRelation = attributes.find(
    (attr: any) => attr.type === 'relation' && attr.name === 'template'
  )?.value || 'Container';

  const noteTitle = noteData.title || 'Container Note';
  const noteId = noteData.noteId;

  return `📋 **CONTAINER TEMPLATE NOTE PROTECTION**

Note "${noteTitle}" (${noteId}) is a ${templateRelation} container template note.

**What are container template notes?**
Container template notes provide specialized layouts and functionality for child notes:
- **Board**: Kanban/task board layouts for project management
- **Calendar**: Calendar interfaces for scheduling and events
- **Grid View**: Grid-based layouts for visual organization
- **List View**: List-based layouts with filtering capabilities
- **Table**: Spreadsheet-like table structures for data
- **Geo Map**: Geographic maps with location markers

**Why updates are prevented:**
Container template notes must remain empty to function properly. They provide the structure and layout for child notes that contain the actual content.

**What you probably want to do:**
When you say "update Board Note" or "update Calendar Note", you typically mean:

1. **Create a child note** under this container:
   \`\`\`json
   {
     "parentNoteId": "${noteId}",
     "title": "Your Content Note",
     "type": "text",
     "content": "Your content here"
   }
   \`\`\`

2. **Update an existing child note**:
   - Use search_notes to find child notes
   - Use update_note on the specific child note

3. **View the container structure**:
   - Use get_note to see the current layout
   - Use search_notes to find notes under this container

**If you really need to modify the container:**
- Remove the ~template relation first using manage_attributes
- Then you can update it as a regular book note
- But this will lose the specialized template functionality

**Next steps:**
Would you like me to help you create a child note under this ${templateRelation} container?`;
}

export interface Attribute {
  type: 'label' | 'relation';
  name: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
}

export type NoteType = 'text' | 'code' | 'render' | 'search' | 'relationMap' | 'book' | 'noteMap' | 'mermaid' | 'webView';

export interface NoteOperation {
  parentNoteId?: string;
  title?: string;
  type?: string;
  content?: string;
  mime?: string;
  noteId?: string;
  revision?: boolean;
  includeContent?: boolean;
  attributes?: Attribute[];
  expectedHash?: string;
  // Search parameters
  searchPattern?: string;
  useRegex?: boolean;
  searchFlags?: string;
  mode?: 'overwrite' | 'append';
  // Search and replace parameters
  replacePattern?: string;
}

export interface NoteCreateResponse {
  noteId?: string;
  message: string;
  duplicateFound?: boolean;
  duplicateNoteId?: string;
  choices?: {
    skip: string;
    updateExisting: string;
  };
  nextSteps?: string;
}

export interface NoteUpdateResponse {
  noteId: string;
  message: string;
  revisionCreated: boolean;
  conflict?: boolean;
}

export interface NoteSearchReplaceResponse {
  noteId: string;
  message: string;
  matchesFound: number;
  replacementsMade: number;
  revisionCreated: boolean;
  conflict?: boolean;
  searchPattern?: string;
  replacePattern?: string;
  useRegex?: boolean;
}

export interface NoteDeleteResponse {
  noteId: string;
  message: string;
}

export interface NoteGetResponse {
  note: any;
  content?: string;
  contentHash?: string;
  contentRequirements?: {
    requiresHtml: boolean;
    description: string;
    examples: string[];
  };
  search?: {
    pattern: string;
    flags: string;
    matches: RegexMatch[];
    totalMatches: number;
    searchMode?: 'html' | 'plain';
    useRegex?: boolean;
  };
}

export interface RegexMatch {
  match: string;
  index: number;
  length: number;
  groups?: string[];
  htmlContext?: {
    contentType: 'html' | 'plain';
    isHtmlContent: boolean;
  };
}

/**
 * Strip HTML tags from content for text notes
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Execute unified search on content (supports both regex and literal search)
 */
function executeUnifiedSearch(
  content: string,
  pattern: string,
  useRegex: boolean = true,
  flags: string = 'g'
): RegexMatch[] {
  try {
    // Filter flags based on search mode
    const effectiveFlags = filterFlagsForMode(flags, useRegex);

    let searchPattern: string;
    if (useRegex) {
      searchPattern = pattern;
    } else {
      // Escape special regex characters for literal search
      searchPattern = escapeRegExp(pattern);
    }

    const regex = new RegExp(searchPattern, effectiveFlags);
    const matches: RegexMatch[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
        length: match[0].length,
        groups: match.length > 1 ? match.slice(1) : undefined
      });
    }

    return matches;
  } catch (error) {
    const searchType = useRegex ? "regex" : "literal";
    throw new Error(`Invalid ${searchType} pattern: ${pattern}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Filter flags based on search mode (regex vs literal)
 */
function filterFlagsForMode(flags: string, useRegex: boolean): string {
  const validFlags = new Set(flags.split(''));

  if (!useRegex) {
    // Remove regex-only flags for literal search
    validFlags.delete('s');  // dotall - no meaning for literal search
    validFlags.delete('y');  // sticky - limited utility for literal search
  }

  return Array.from(validFlags).join('');
}


/**
 * Execute search and replace on content
 */
function executeSearchReplace(
  content: string,
  searchPattern: string,
  replacePattern: string,
  useRegex: boolean = true,
  flags: string = 'g'
): { newContent: string; replacements: number } {
  try {
    let newContent = content;
    let replacements = 0;

    if (useRegex) {
      // Regex-based replacement
      const regex = new RegExp(searchPattern, flags);
      replacements = (content.match(regex) || []).length;
      newContent = content.replace(regex, replacePattern);
    } else {
      // Literal string replacement
      const searchRegex = new RegExp(escapeRegExp(searchPattern), flags);
      replacements = (content.match(searchRegex) || []).length;
      newContent = content.replace(searchRegex, replacePattern);
    }

    return { newContent, replacements };
  } catch (error) {
    throw new Error(`Search and replace failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Escape special regex characters for literal string matching
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a note with the same title already exists in the same directory
 */
async function checkDuplicateTitleInDirectory(
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
 * Handle create note operation
 */
export async function handleCreateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteCreateResponse> {
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

  // Validate content with template-aware rules
  const contentValidation = await validateContentForNoteType(
    content,
    correctedType as NoteType,
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
  const processed = await processContentArray(validatedContent, correctedType);
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
          response.data.attributeCleaningMessage = cleaningMessage;
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
    duplicateFound: false
  };
}


/**
 * Create attributes for a note (helper function)
 */
async function createNoteAttributes(
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
 * Handle update note operation
 */
export async function handleUpdateNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteUpdateResponse> {
  const {
    noteId,
    title,
    type,
    content: rawContent,
    mime,
    revision = true,
    expectedHash,
    mode
  } = args;

  if (!noteId || !expectedHash) {
    throw new Error("noteId and expectedHash are required for update operation.");
  }

  if (!mode) {
    throw new Error("mode is required for update operation. Please specify either 'overwrite' or 'append'.");
  }

  // Step 0: Check if this is a container template note (Board, Calendar, etc.)
  try {
    const currentNote = await axiosInstance.get(`/notes/${noteId}`);

    if (isContainerTemplateNote(currentNote.data)) {
      return {
        noteId,
        message: generateContainerTemplateGuidance(currentNote.data),
        revisionCreated: false,
        conflict: true
      };
    }
  } catch (error) {
    // If we can't read the note to check if it's a container, continue with normal update
    logVerbose("handleUpdateNote", "Could not check container template status, proceeding with normal update", error);
  }

  // Check if this is a title-only update
  const isTitleOnlyUpdate = title && !rawContent;

  // Check if this is a multi-parameter update (title + content)
  const isMultiParamUpdate = title && rawContent;

  // For content updates (with or without title), validate required fields
  if (rawContent && !type) {
    throw new Error("type is required when updating content.");
  }

  let revisionCreated = false;

  // Step 1: Get current note state for validation
  try {
    const currentNote = await axiosInstance.get(`/notes/${noteId}`);
    const currentContent = await axiosInstance.get(`/notes/${noteId}/content`, {
      responseType: 'text'
    });

    // Step 2: Hash validation if provided
    if (expectedHash) {
      const currentBlobId = currentNote.data.blobId;
      if (currentBlobId !== expectedHash) {
        return {
          noteId,
          message: `CONFLICT: Note has been modified by another user. ` +
                   `Current blobId: ${currentBlobId}, expected: ${expectedHash}. ` +
                   `Please get the latest note content and retry.`,
          revisionCreated: false,
          conflict: true
        };
      }
    }

    // Step 2.5: Type change validation if provided
    if (type && type !== currentNote.data.type) {
      const currentType = currentNote.data.type;
      const newType = type;

      // Check for incompatible type changes with template relations
      const existingAttributes = currentNote.data.attributes || [];
      const templateRelation = existingAttributes.find(
        (attr: any) => attr.type === 'relation' && attr.name === 'template'
      )?.value;

      if (templateRelation) {
        // Container templates require 'book' type
        const containerTemplates = [
          'board', '_template_board',
          'grid view', '_template_grid_view',
          'list view', '_template_list_view',
          'geo map', '_template_geo_map',
          'calendar', '_template_calendar'
        ];

        const isContainerTemplate = containerTemplates.includes(templateRelation.toLowerCase());

        if (isContainerTemplate && newType !== 'book') {
          return {
            noteId,
            message: `TYPE CHANGE CONFLICT: Cannot change note type from "${currentType}" to "${newType}" while it has a "${templateRelation}" template relation.

📋 **Template Compatibility Rules**:
Container templates (Board, Calendar, Grid View, List View, Geo Map) require type "book" to function properly.

🛠️ **Solutions**:
1. **Keep current type**: Use type "book" to maintain template functionality
2. **Remove template**: Delete the ~template relation first, then change type
3. **Choose different template**: Switch to a template compatible with type "${newType}"

💡 **For most use cases**: If you want a regular note with "${templateRelation}" features, consider:
- Using type "text" with the ~template relation removed
- Creating a child note inside this container for your content

Please remove the template relation first or keep type as "book".`,
            revisionCreated: false,
            conflict: true
          };
        }

        // Book type can only be used with container templates
        if (newType === 'book' && !isContainerTemplate) {
          return {
            noteId,
            message: `TYPE CHANGE CONFLICT: Cannot change note type to "book" while it has a "${templateRelation}" template relation.

📋 **Book Type Requirements**:
Book type should only be used with container templates (Board, Calendar, Grid View, List View, Geo Map) that provide specialized layouts.

🛠️ **Solutions**:
1. **Use type "text"**: Best for regular notes with content
2. **Switch to container template**: Change ~template to "Board", "Calendar", etc. for specialized layouts
3. **Keep current type**: Use "${currentType}" for optimal functionality

💡 **Recommendation**: For regular notes with template relations, type "text" usually provides the best experience.

Please choose a compatible template or use type "text".`,
            revisionCreated: false,
            conflict: true
          };
        }
      }

      // Validate content compatibility for type changes with content updates
      if (rawContent && currentContent.data) {
        try {
          // Test if existing content is compatible with new type
          await validateContentForNoteType(
            currentContent.data,
            newType as NoteType,
            currentContent.data,
            templateRelation
          );
        } catch (validationError) {
          const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
          return {
            noteId,
            message: `CONTENT COMPATIBILITY ERROR: Cannot change note type from "${currentType}" to "${newType}" with current content.

📋 **Content Requirements for ${newType}**:
${errorMessage}

🛠️ **Solutions**:
1. **Clean content**: Remove HTML, formatting, or incompatible elements
2. **Keep current type**: Use "${currentType}" for existing content
3. **Manual conversion**: Convert content manually to match ${newType} requirements

💡 **Content Guidelines**:
- **Code notes**: Plain text only (no HTML tags)
- **Text notes**: HTML content (plain text auto-wrapped in <p> tags)
- **Mermaid notes**: Plain text diagram definitions only

Please modify the content to be compatible with type "${newType}" or keep the current type.`,
            revisionCreated: false,
            conflict: true
          };
        }
      }

      logVerbose("handleUpdateNote", `Type change validation passed: ${currentType} → ${newType}`, {
        templateRelation,
        hasContent: !!rawContent
      });
    }

    // Handle title-only update (efficient PATCH operation)
    if (isTitleOnlyUpdate) {
      // For title-only updates, skip revision creation for efficiency
      const patchData: any = { title };

      // Add MIME type if provided
      if (mime) {
        patchData.mime = mime;
      }

      // Add note type if provided (new capability)
      if (type) {
        patchData.type = type;
      }

      logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
      const response = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const typeMessage = type ? ` and type updated to "${type}"` : "";
      const mimeMessage = mime ? ` and MIME type updated to "${mime}"` : "";
      return {
        noteId,
        message: `Note ${noteId} title updated successfully to "${title}"${typeMessage}${mimeMessage}`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Handle content updates (with optional title change)
    // Step 3: Get existing template relations for content validation
    let existingTemplateRelation: string | undefined;
    try {
      // Check if the note has existing template relations
      const existingAttributes = currentNote.data.attributes || [];
      existingTemplateRelation = existingAttributes.find(
        (attr: any) => attr.type === 'relation' && attr.name === 'template'
      )?.value;
    } catch (error) {
      // If we can't read existing attributes, proceed without template validation
      logVerbose("handleUpdateNote", "Could not read existing attributes for template validation", error);
    }

    // Step 4: Content type validation with template awareness (always enabled)
    let finalContent = rawContent;
    const validationResult = await validateContentForNoteType(
      rawContent as string,
      type as NoteType,
      currentContent.data,
      existingTemplateRelation
    );

    if (!validationResult.valid) {
      return {
        noteId,
        message: `CONTENT_VALIDATION_ERROR: ${validationResult.error}`,
        revisionCreated: false,
        conflict: false
      };
    }

    // Use validated/corrected content
    finalContent = validationResult.content;

    // Step 5: Create revision if requested
    if (revision) {
      try {
        await axiosInstance.post(`/notes/${noteId}/revision`);
        revisionCreated = true;
      } catch (error) {
        console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
        // Continue with update even if revision creation fails
      }
    }

    // Step 6: Process and update content based on mode
    // Content is optional - if not provided, default to empty string
    finalContent = finalContent || "";

    let processedContent: string;

    if (mode === 'append') {
      // For append mode, get current content and append new content
      const newProcessed = await processContentArray(finalContent, currentNote.data.type);
      if (newProcessed.error) {
        throw new Error(`New content processing error: ${newProcessed.error}`);
      }

      // Append new content to existing content (currentContent.data is already processed)
      processedContent = currentContent.data + newProcessed.content;
    } else if (mode === 'overwrite') {
      // For overwrite mode, replace entire content
      const processed = await processContentArray(finalContent, currentNote.data.type);
      if (processed.error) {
        throw new Error(`Content processing error: ${processed.error}`);
      }
      processedContent = processed.content;
    } else {
      throw new Error(`Invalid mode: ${mode}. Mode must be either 'overwrite' or 'append'.`);
    }

    const contentResponse = await axiosInstance.put(`/notes/${noteId}/content`, processedContent, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (contentResponse.status !== 204) {
      throw new Error(`Unexpected response status: ${contentResponse.status}`);
    }

    // Step 7: Update title, type, and MIME type if provided (multi-parameter update)
    if (isMultiParamUpdate && (title || type || mime)) {
      const patchData: any = {};

      if (title) {
        patchData.title = title;
      }

      if (type) {
        patchData.type = type;
      }

      if (mime) {
        patchData.mime = mime;
      }

      // Only make PATCH call if there's something to update
      if (Object.keys(patchData).length > 0) {
        logVerboseApi("PATCH", `/notes/${noteId}`, patchData);
        const titleResponse = await axiosInstance.patch(`/notes/${noteId}`, patchData, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (titleResponse.status !== 200) {
          throw new Error(`Unexpected response status for title/mime update: ${titleResponse.status}`);
        }
      }
    }

    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";
    const correctionMsg = (finalContent !== rawContent) ? " (content auto-corrected)" : "";
    const modeMsg = mode === 'append' ? " (content appended)" : " (content overwritten)";
    const titleMsg = (isMultiParamUpdate && title) ? ` (title updated to "${title}")` : "";
    const typeMsg = (isMultiParamUpdate && type) ? ` (type updated to "${type}")` : "";
    const mimeMsg = (isMultiParamUpdate && mime) ? ` (MIME type updated to "${mime}")` : "";

    return {
      noteId,
      message: `Note ${noteId} updated successfully${revisionMsg}${correctionMsg}${modeMsg}${titleMsg}${typeMsg}${mimeMsg}`,
      revisionCreated,
      conflict: false
    };

  } catch (error) {
    if ((error as any).response?.status === 404) {
      throw new Error(`Note ${noteId} not found`);
    }
    throw error;
  }
}

/**
 * Handle search and replace operation
 */
export async function handleSearchReplaceNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteSearchReplaceResponse> {
  const {
    noteId,
    searchPattern,
    replacePattern,
    useRegex = true,
    searchFlags = 'g',
    revision = true,
    expectedHash
  } = args;

  if (!noteId) {
    throw new Error("noteId is required for search_and_replace operation.");
  }

  if (!searchPattern) {
    throw new Error("searchPattern is required for search_and_replace operation.");
  }

  if (!replacePattern) {
    throw new Error("replacePattern is required for search_and_replace operation.");
  }

  if (!expectedHash) {
    throw new Error("expectedHash is required for search_and_replace operation. You must call get_note first to retrieve the current blobId.");
  }

  let revisionCreated = false;

  try {
    // Step 1: Get current note state and content
    const currentNote = await axiosInstance.get(`/notes/${noteId}`);
    const currentContent = await axiosInstance.get(`/notes/${noteId}/content`, {
      responseType: 'text'
    });

    // Step 2: Hash validation
    const currentBlobId = currentNote.data.blobId;
    if (currentBlobId !== expectedHash) {
      return {
        noteId,
        message: `CONFLICT: Note has been modified by another user. ` +
                 `Current blobId: ${currentBlobId}, expected: ${expectedHash}. ` +
                 `Please get the latest note content and retry.`,
        matchesFound: 0,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: true,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    const noteType = currentNote.data.type;
    const originalContent = currentContent.data;

    // Step 3: Execute search and replace
    const { newContent, replacements } = executeSearchReplace(
      originalContent,
      searchPattern,
      replacePattern,
      useRegex,
      searchFlags
    );

    // Step 4: Handle no matches case
    if (replacements === 0) {
      return {
        noteId,
        message: `No matches found for pattern "${searchPattern}" in note ${noteId}. No changes made.`,
        matchesFound: 0,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: false,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    // Step 5: Validate new content based on note type
    const validationResult = await validateContentForNoteType(
      newContent,
      noteType as NoteType,
      originalContent
    );

    if (!validationResult.valid) {
      return {
        noteId,
        message: `CONTENT_TYPE_MISMATCH: ${validationResult.error}`,
        matchesFound: replacements,
        replacementsMade: 0,
        revisionCreated: false,
        conflict: false,
        searchPattern,
        replacePattern,
        useRegex
      };
    }

    // Use validated/corrected content
    const finalContent = validationResult.content;

    // Step 6: Create revision if requested
    if (revision) {
      try {
        await axiosInstance.post(`/notes/${noteId}/revision`);
        revisionCreated = true;
      } catch (error) {
        console.error(`Warning: Failed to create revision for note ${noteId}:`, error);
        // Continue with update even if revision creation fails
      }
    }

    // Step 7: Update content
    const contentResponse = await axiosInstance.put(`/notes/${noteId}/content`, finalContent, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (contentResponse.status !== 204) {
      throw new Error(`Unexpected response status: ${contentResponse.status}`);
    }

    // Step 8: Return success response
    const correctionMsg = (finalContent !== newContent) ? " (content auto-corrected)" : "";
    const revisionMsg = revisionCreated ? " (revision created)" : " (no revision)";

    return {
      noteId,
      message: `Search and replace completed successfully for note ${noteId}. Found ${replacements} match(es) and made ${replacements} replacement(s).${correctionMsg}${revisionMsg}`,
      matchesFound: replacements,
      replacementsMade: replacements,
      revisionCreated,
      conflict: false,
      searchPattern,
      replacePattern,
      useRegex
    };

  } catch (error) {
    if ((error as any).response?.status === 404) {
      throw new Error(`Note ${noteId} not found`);
    }
    throw error;
  }
}

/**
 * Handle delete note operation
 */
export async function handleDeleteNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteDeleteResponse> {
  const { noteId } = args;

  if (!noteId) {
    throw new Error("noteId is required for delete operation.");
  }

  await axiosInstance.delete(`/notes/${noteId}`);

  return {
    noteId,
    message: `Deleted note: ${noteId}`
  };
}

/**
 * Handle get note operation
 */
export async function handleGetNote(
  args: NoteOperation,
  axiosInstance: any
): Promise<NoteGetResponse> {
  const {
    noteId,
    includeContent = true,
    searchPattern,
    useRegex = true,
    searchFlags = 'g'
  } = args;

  if (!noteId) {
    throw new Error("noteId is required for get operation.");
  }

  const noteResponse = await axiosInstance.get(`/notes/${noteId}`);

  if (!includeContent) {
    return {
      note: noteResponse.data
    };
  }

  const noteData = noteResponse.data;

  // Get note content (works for all note types including file/image)
  const { data: noteContent } = await axiosInstance.get(`/notes/${noteId}/content`, {
    responseType: 'text'
  });

  // Get blobId (Trilium's built-in content hash) and content requirements
  const blobId = noteData.blobId;
  const contentRequirements = getContentRequirements(noteData.type);

  // Handle search if pattern is provided
  if (searchPattern) {
    // Use original content directly (no HTML stripping)
    const searchContent = noteContent;

    // Execute unified search on original content
    const matches = executeUnifiedSearch(searchContent, searchPattern, useRegex, searchFlags);

    // Enhance matches with HTML context information
    const enhancedMatches = matches.map(match => ({
      ...match,
      htmlContext: {
        contentType: (contentRequirements.requiresHtml ? 'html' : 'plain') as 'html' | 'plain',
        isHtmlContent: contentRequirements.requiresHtml
      }
    }));

    return {
      note: noteData,
      contentHash: blobId,
      search: {
        pattern: searchPattern,
        flags: searchFlags,
        matches: enhancedMatches,
        totalMatches: enhancedMatches.length,
        searchMode: contentRequirements.requiresHtml ? 'html' : 'plain',
        useRegex
      }
    };
  }

  // Standard response without search
  return {
    note: noteData,
    content: noteContent,
    contentHash: blobId, // Use blobId as content hash
    contentRequirements
  };
}