# Smart Recovery Mechanism for Update Operations

## Overview

The Trilium Note's MCP server now includes an intelligent recovery mechanism that automatically helps users when they attempt to update notes that don't exist due to typos or incorrect note IDs. This feature provides a smooth user experience by suggesting similar notes and guiding users toward appropriate next steps.

## How It Works

### Trigger Scenario
The smart recovery mechanism activates when:
- User requests `update_note` with a note ID that doesn't exist
- The system returns a 404 error or "not found" message
- Instead of failing with a simple error, the system automatically searches for similar notes

### Recovery Process
1. **Error Detection**: Catches 404 errors during update operations
2. **Name Extraction**: Smart parsing of the failed note ID to extract searchable terms
3. **Similarity Search**: Uses fuzzy matching to find similar note titles
4. **Result Categorization**: Separates results into exact matches and similar matches
5. **Intelligent Suggestions**: Provides actionable guidance with context about the intended update

## Features

### Smart Name Extraction
- Handles various note ID formats (alphanumeric IDs, human-readable names)
- Cleans up separators and normalizes spacing
- Preserves meaningful search terms

### Advanced Similarity Algorithm
- **Levenshtein Distance**: Calculates edit distance between strings
- **Substring Matching**: Identifies partial matches
- **Word-Based Search**: Breaks down multi-word queries for broader matching
- **Confidence Scoring**: Rates matches from 0% to 100% similarity

### Context-Aware Recovery
- Shows what the user was trying to update
- Preserves update intent (title, content, type changes)
- Provides relevant command examples
- Guides users through next steps

## Usage Examples

### Scenario 1: Typo in Note Name

**User Request**: "Update note 'Project Planes' with new meeting notes"

**Recovery Response**:
```
❌ Note "Project Planes" not found

🔍 Found 2 similar note(s) for "Project Planes":

✅ **Exact Matches**:
1. "Project Plans" (ID: abc123def, Type: text)

🤔 **Similar Matches**:
1. "Project Planning" (ID: xyz789uvw, Type: text, 85% similar)

💡 **Next Steps**:
1. **Use one of the suggested notes above** - Copy the note ID and retry your update
2. **Create a new note** - If none of these match, use create_note with your intended content
3. **Search more broadly** - Use search_notes with different keywords

🛠️ **Commands to try**:
- Get note details: `get_note({ noteId: "abc123def" })`
- Create new note: `create_note({ parentNoteId: "root", title: "Project Planes", type: "text", content: "Your content here" })`
- Search similar: `search_notes({ text: "Project Planes" })`
```

### Scenario 2: No Similar Notes Found

**User Request**: "Update note 'NonExistentNote' with meeting notes"

**Recovery Response**:
```
❌ Note "NonExistentNote" not found

🔍 No similar notes found for "NonExistentNote".

💡 **Suggestions**:
1. **Check the note ID** - Verify you have the correct note identifier
2. **Create a new note** - Use create_note if this is a new note you want to create
3. **Search existing notes** - Use search_notes to find related content

📝 **Your intended update**:
- Title: "Meeting Notes"
- Content: "Updated project status and action items..."

🛠️ **Commands to try**:
- Get note details: `get_note({ noteId: "CORRECT_NOTE_ID" })`
- Create new note: `create_note({ parentNoteId: "root", title: "NonExistentNote", type: "text", content: "Your content here" })`
- Search similar: `search_notes({ text: "NonExistentNote" })`
```

### Scenario 3: Partial Match with High Confidence

**User Request**: "Update note 'Team Mtg' with quarterly results"

**Recovery Response**:
```
❌ Note "Team Mtg" not found

🔍 Found 3 similar note(s) for "Team Mtg":

✅ **Exact Matches**:
1. "Team Meeting" (ID: def456ghi, Type: text)

🤔 **Similar Matches**:
1. "Team Meeting Notes" (ID: jkl012mno, Type: text, 90% similar)
2. "Team Status Meeting" (ID: pqr345stu, Type: text, 75% similar)

💡 **Next Steps**:
1. **Use one of the suggested notes above** - Copy the note ID and retry your update
2. **Create a new note** - If none of these match, use create_note with your intended content
3. **Search more broadly** - Use search_notes with different keywords
```

## Technical Implementation

### Core Components

#### 1. Note Recovery Utilities (`src/utils/noteRecovery.ts`)
- `extractNoteNameFromId()`: Parses note IDs for searchable terms
- `searchForSimilarNotes()`: Performs fuzzy search with similarity scoring
- `generateRecoveryMessage()`: Creates user-friendly recovery messages

#### 2. Enhanced Update Handler (`src/modules/notes/noteHandler.ts`)
- Smart error detection in `handleUpdateNoteRequest`
- Automatic recovery workflow integration
- Context preservation for update operations

### Algorithm Details

#### Similarity Calculation
The system uses a multi-layered approach:

1. **Exact Match**: 100% similarity for identical strings
2. **Substring Match**: Similarity based on length ratio
3. **Levenshtein Distance**: Edit distance-based similarity calculation
4. **Word Breakdown**: Individual word matching for multi-word queries

#### Search Strategy
- Primary search: `note.title *=* 'extracted_name'`
- Secondary search: Individual word matches for multi-word queries
- Result limit: Top 5 similar matches to avoid overwhelming users
- Confidence threshold: 30% minimum similarity for inclusion

## Benefits

### For Users
- **Better Experience**: Helpful suggestions instead of cryptic errors
- **Typo Forgiveness**: Automatic recovery from common spelling mistakes
- **Guided Actions**: Clear next steps and command examples
- **Context Awareness**: Shows what they were trying to accomplish

### For LLM Integration
- **Structured Responses**: Machine-readable suggestions with confidence scores
- **Recovery Pathways**: Clear options for retrying or creating new content
- **Error Resilience**: Graceful handling of ambiguous note references
- **Workflow Continuation**: LLMs can recover from failed operations automatically

## Error Handling

### Graceful Degradation
- Search failures return empty results without breaking the recovery flow
- Network issues are logged and handled gracefully
- Malformed note IDs are cleaned and processed intelligently

### Logging and Debugging
- Verbose logging for all recovery operations
- Error context preservation for troubleshooting
- Performance metrics for search operations

## Integration Notes

### Backward Compatibility
- Existing update operations work exactly as before when successful
- No changes to required parameters or response format
- Recovery mechanism only activates on 404 errors

### Performance Considerations
- Search operations are limited to 10 results maximum
- Similarity calculations are optimized for common use cases
- Caching strategies can be added for frequently accessed notes

## Future Enhancements

### Potential Improvements
- **Machine Learning**: Advanced similarity models for better matching
- **User Preferences**: Customizable similarity thresholds and search scope
- **Batch Operations**: Recovery for multiple note operations
- **Learning System**: Adaptive suggestions based on user behavior

### Extension Points
- **Custom Search Providers**: Plugin architecture for specialized search
- **Internationalization**: Multi-language support for recovery messages
- **Analytics**: Usage tracking and effectiveness metrics
- **UI Integration**: Visual feedback in client applications

## Best Practices

### For Users
- **Verify Note IDs**: Use recovery suggestions to confirm correct note identifiers
- **Leverage Search**: Use the provided search commands for broader exploration
- **Create Intelligently**: Follow the guidance when creating new notes

### For Developers
- **Context Preservation**: Always include update intent in recovery workflows
- **Error Boundaries**: Ensure recovery mechanisms don't break existing functionality
- **Performance Monitoring**: Track recovery success rates and user satisfaction

This smart recovery mechanism significantly improves the user experience by transforming frustrating "not found" errors into helpful, actionable guidance that helps users successfully complete their intended tasks.