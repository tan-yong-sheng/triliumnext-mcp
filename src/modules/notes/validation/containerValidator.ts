/**
 * Container Template Validation
 * Handles detection and protection of container template notes
 */

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
export function isContainerTemplateNote(noteData: any): boolean {
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
export function generateContainerTemplateGuidance(noteData: any): string {
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