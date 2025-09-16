- Before creating a new note, perform a search within the current directory to check if a note with the same title already exists. If a duplicate is found, do not create the note. (This check is only within the current directory, not across all notes, since identical titles may exist in different folders.)

- can search_note function, can search via regex search and return the phrases that match the regex search from all matching notes (so not just note id), meanwhile for phrases that match, perhaps we could use literal string (never regex search) to search_and_replace.... (Perhaps search_and_replace can just integrate to update_note function instead...)

- create responseFormatter.ts for manage response structure of all mcp functions
- what's the logic for tests/validation.test.js, is it unit testing? If so, update the info about it at CLAUDE.md