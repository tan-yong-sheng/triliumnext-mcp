/**
 * Note Update Operations
 * Handles note updates with hash validation, content type safety, and container template protection
 */

import { prepareContentForApi } from '../../../utils/contentProcessor.js';
import { logVerbose, logVerboseError, logVerboseApi } from '../../../utils/verboseUtils.js';
import { validateContentForNoteType, getContentRequirements } from '../../../utils/contentRules.js';
import { isContainerTemplateNote, generateContainerTemplateGuidance } from '../validation/containerValidator.js';
import { NoteOperation, NoteUpdateResponse } from '../noteManager.js';

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
            newType as any,
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
      type as any,
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
      const newProcessed = await prepareContentForApi(finalContent, currentNote.data.type);
      if (newProcessed.error) {
        throw new Error(`New content processing error: ${newProcessed.error}`);
      }

      // Append new content to existing content (currentContent.data is already processed)
      processedContent = currentContent.data + newProcessed.content;
    } else if (mode === 'overwrite') {
      // For overwrite mode, replace entire content
      const processed = await prepareContentForApi(finalContent, currentNote.data.type);
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