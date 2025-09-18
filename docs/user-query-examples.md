# User Query Examples

This document provides simple examples of natural language queries you can try with the TriliumNext MCP server.

## Basic Search Queries

### Simple Text Search
- "Find notes containing 'docker'"
- "Search for 'kubernetes' in my notes"
- "Show me notes about 'machine learning'"
- "Find notes with 'API' in them"

### Date-Based Searches
- "Find notes created in the last 7 days"
- "Show me notes I edited last week"
- "What notes were modified in December 2024?"
- "Find notes created between January and June this year"
- "Show me my most recent 10 notes"

### Content and Title Searches
- "Find notes with 'project' in the title"
- "Search for notes containing 'deadline' in the content"
- "Find notes whose title starts with 'Meeting'"
- "Show me notes with titles ending in 'Notes'"
- "Find notes with 'tutorial' in title and 'steps' in content"
- show all my n8n folders please. -> (Note: it will search note with note type of 'book' and title contains n8n)

### Advanced Combined Searches
- "Search for 'n8n' notes created since 2024"
- "Show me text notes that aren't archived"
- "Find recent notes about 'docker' or 'kubernetes'"
- "Find notes with phone number/emails in the content"

## Note Navigation

### Folder and Hierarchy Browsing
- "Show me what's in my 'Projects' folder"
- "List all notes under 'Work' folder"
- "Find notes in 'Archive' and its subfolders"
- "What are the children of this note?"
- "Show me everything I have"

### Finding Specific Notes
- "Find my note called 'Weekly Review'"
- "Where is my 'Project Planning' note?"
- "Find the note named 'Meeting Notes'"

## Note Types and Organization

### By Note Type
- "Find all my code notes"
- "Show me canvas/drawing notes"
- "Find Mermaid diagram notes"
- "List all book/folder notes"

### By Labels and Tags
- "Find notes with #book label"
- "Show me notes tagged as #important"
- "Find notes with #project tag"

### By File Types (Code Notes)
- "Find JavaScript code files"
- "Show me Python notes"
- "Find TypeScript code notes"
- "List HTML and CSS files"

## Content Management

### Adding Content
- "Add today's progress to my work log"
- "Append this meeting summary to my notes"
- "Add this code snippet to my development notes"

### Updating Content
- "Update my project plan with this new version"
- "Replace the content of my draft note"
- "Rewrite this note with corrected information"

### Note Creation
- "Create a new note called 'Weekly Review'"
- "Make a new note in my 'Projects' folder"
- "Create a code note for JavaScript"

### Getting Note Content
- "Show me the content of my 'TODO' note"
- "What's in my 'Meeting Notes'?"

### Content Extraction and Pattern Matching
- "Extract all URLs from note with ID QNwfEYTxLzVP"
- "Find all email addresses in my project note"
- "Extract phone numbers from the meeting notes"
- "Get all dates mentioned in note ABC123"
- "Search for specific patterns in note XYZ789"

## Attribute Management

### Viewing Attributes
- "Show me all attributes on my project note"
- "What labels and relations are attached to this note?"
- "List all tags and metadata for the meeting notes"

### Adding Labels and Tags
- "Add a #status label with value 'In Progress' to my project note"
- "Tag this note as #important"
- "Add a #priority label with value 'High' to the task note"
- "Create a #project label with value 'Website Redesign' on the current note"

### Working with Templates
- "Apply the Board template to this note"
- "Set this note to use the Calendar template"
- "Make this note use the Text Snippet template"
- "Apply the Grid View template to my project folder"

### Managing Relations
- "Create an author relation pointing to Tolkien"
- "Set up a publisher relation for this book note"
- "Add a template relation using Board template"
- "Create a series relation connecting related notes"

### Updating Attributes
- "Change the status label from 'In Progress' to 'Completed'"
- "Update the priority label to 'Urgent'"
- "Modify the project label value to 'New Project Name'"
- "Change the template relation to use Calendar instead of Board"

### Batch Operations
- "Add multiple tags at once: #important, #frontend, #javascript"
- "Create several labels for status tracking"
- "Set up multiple template relations in one operation"

### Removing Attributes
- "Remove the #draft label from this note"
- "Delete the old status attribute"
- "Remove the template relation"

## Example Questions for Testing

### Simple Tests
- "Find notes about 'testing'"
- "Show me recent notes"
- "What's in my root folder?"

### Intermediate Tests
- "Find notes created this month with 'docker' in them"
- "Show me code notes about 'python'"

### Advanced Tests
- "Find notes that are either books by a specific author OR created this week"
- "Show me notes with 'project' in title OR 'deadline' in content"
- "Find notes under 'Work' folder that were modified recently"

### Attribute Management Tests
- "Add status=In Progress and priority=High labels to my project note"
- "Apply the Board template to this folder note"
- "Show me all attributes currently on the weekly review note"
- "Update the status label from 'Planning' to 'In Progress'"
- "Remove the #draft label from all completed notes"
- "Create author and publisher relations for this book note"
- "Batch add multiple project tags to related notes"

## Tips for Better Results

1. **Be specific**: "Find notes about docker" works better than "find stuff"
2. **Use quotes**: For exact phrases, use quotes like "machine learning"
3. **Specify time ranges**: "last week", "this month", "since 2024"
4. **Combine criteria**: "Find code notes about python created recently"
5. **Use note names**: "Find my 'Project Planning' note" for specific notes
6. **For template relations**: Use built-in template names like "Board", "Calendar", "Text Snippet", "Grid View"
7. **For attribute updates**: Remember that only label values and positions can be updated - other properties require delete + recreate
8. **Batch operations**: Use batch_create for adding multiple attributes at once for better performance