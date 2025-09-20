To fix

- move C:\Users\tys\Documents\Coding\triliumnext-mcp\src\types to src\modules\types
- move C:\Users\tys\Documents\Coding\triliumnext-mcp\src\utils to src\modules\utils

- when i say update_note, either try to resolve_note_id or perform search if that note exists or not... Never start with create_note... Or should we perform search_note at current directory for similar notes whenever before we perform create_note or update_note?

- ability to update_note for calendar note, Board note,

- render note keeps failing to be created (if using gemini-2.0-flash, but it successfully executed with better model)


- introduce offset & limit with cache, so that we could save token while not sending same requests again and again to the server... 
- in future, we could have easy way to manage calendar note or board note via LLM via predefined instruction like introducing `resolve_intent` function which returns suggested params when people say they want to create/manage calendar note or board note.... 

- create responseFormatter.ts for manage response structure of all mcp functions, for example, return url of the note...

----

- Add below to user query examples:

User query examples:

# extraction task
1. for the notes i have created or modified on the past 30 days, extract all url links that i have put into.

# note type & template
1. create a render note called 'Ecommerce homepage' where it display an ecommerce homepage
2. create a calendar page, where on 20 Sep 2025  i have a task called 'Happy Moment'
3. Create a Kanban planner called 'Planner', and mention that i have a task called 'Hello world' which is in Progress
