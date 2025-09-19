/**
 * Container Template Protection for Attributes
 * Handles detection and protection of container template notes for attribute operations
 */

import { AxiosInstance } from 'axios';

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
 * Check if a note is a container template note that should not have attributes modified
 */
export async function isContainerTemplateNote(noteId: string, axiosInstance: AxiosInstance): Promise<boolean> {
  try {
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
    const noteData = noteResponse.data;

    // Only book notes can be container templates
    if (noteData.type !== 'book') {
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
  } catch (error) {
    // If we can't read the note, assume it's not a container template
    return false;
  }
}

/**
 * Generate guidance message for container template attribute operations
 */
export async function generateContainerAttributeGuidance(
  noteId: string,
  operation: string,
  axiosInstance: AxiosInstance
): Promise<string> {
  try {
    // Get note details for better guidance
    const noteResponse = await axiosInstance.get(`/notes/${noteId}`);
    const noteData = noteResponse.data;

    const templateRelation = noteData.attributes?.find(
      (attr: any) => attr.type === 'relation' && attr.name === 'template'
    )?.value || 'Container';

    const noteTitle = noteData.title || 'Container Note';

    return `📋 **CONTAINER TEMPLATE ATTRIBUTE PROTECTION**

Cannot ${operation} attributes on "${noteTitle}" (${noteId}) because it's a ${templateRelation} container template note.

**What are container template notes?**
Container template notes provide specialized layouts and functionality for child notes:
- **Board**: Kanban/task board layouts for project management
- **Calendar**: Calendar interfaces for scheduling and events
- **Grid View**: Grid-based layouts for visual organization
- **List View**: List-based layouts with filtering capabilities
- **Table**: Spreadsheet-like table structures for data
- **Geo Map**: Geographic maps with location markers

**Why attribute modifications are prevented:**
Container template notes have specific attribute configurations that enable their specialized functionality. Modifying attributes could break the template behavior.

**What you probably want to do:**

1. **Create a child note** with your desired attributes:
   \`\`\`json
   {
     "parentNoteId": "${noteId}",
     "title": "Your Content Note",
     "type": "text",
     "attributes": [
       {
         "type": "label",
         "name": "your-label",
         "value": "your-value"
       }
     ]
   }
   \`\`\`

2. **View current attributes**:
   - Use read_attributes to see existing attributes
   - Use get_note to see the full note structure

3. **Work with child notes**:
   - Use search_notes to find child notes
   - Modify attributes on child notes instead

**If you really need to modify container attributes:**
- Remove the ~template relation first (this will convert it to a regular book note)
- Then you can modify attributes freely
- But this will lose the specialized template functionality

**Next steps:**
Would you like me to help you create a child note under this ${templateRelation} container with your desired attributes?`;
  } catch (error) {
    return `Cannot ${operation} attributes on note ${noteId} because it's a container template note. Container template notes have protected attribute configurations. Create a child note instead or remove the template relation first.`;
  }
}