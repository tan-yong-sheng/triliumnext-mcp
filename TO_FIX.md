- Before creating a new note, perform a search within the current directory to check if a note with the same title already exists. If a duplicate is found, do not create the note. (This check is only within the current directory, not across all notes, since identical titles may exist in different folders.)


- can search_note function, can search via regex search and return the phrases that match the regex search from all matching notes (so not just note id), meanwhile for phrases that match, perhaps we could use literal string (never regex search) to search_and_replace.... (Perhaps search_and_replace can just integrate to update_note function instead...)

- in future, we could have easy way to manage calendar note or board note via LLM via predefined instruction like introducing `resolve_intent` function which returns suggested params when people say they want to create/manage calendar note or board note.... 

- create responseFormatter.ts for manage response structure of all mcp functions
- what's the logic for tests/validation.test.js, is it unit testing? If so, update the info about it at CLAUDE.md




----

Plan to enhance 'update_note' capabilites and deprecate append_note function, as below (but pre-requisities is search_notes will need to return regex search result of matching strings of each notes besides just returning note id...)
```
Q: can claude code has append text capabilities with update function? Or is there other dedicated function?

- In Claude Code (Anthropic’s code interpreter / “computer use” style tool), there isn’t usually a dedicated append function for text files. The main primitive is typically:

update → modifies text in-place based on a regex search/replace pattern.

Sometimes you’ll see higher-level helpers like search_and_replace or replace_text, but those are essentially wrappers for the same regex-based update.

If you want to append text (e.g., add content to the end of a file), you usually do it by calling update with a regex that matches the end of the file and then replaces it with itself + new content. Example:

{
  "updates": [
    {
      "pattern": ".*",
      "multiple": true,
      "replacement": "\\g<0>\nNew text to append here"
    }
  ]
}

That regex matches the whole file (.* with multiple: true makes it greedy across all lines), then the replacement reinserts the matched text (\g<0>) and adds your new content at the end.

So:

No separate “append” function in Claude Code.

Appending is done through the same update API with a full-text match.

👉 Do you want me to show you a few regex patterns for appending text at the end, at the start, or after a specific section?
```