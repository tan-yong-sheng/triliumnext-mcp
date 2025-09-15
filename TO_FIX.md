- first, i need to check 15 detailed practical examples covering all CRUD operations for manage_attributes at C:\Users\tys\Documents\Coding\triliumnext-mcp\docs\create-notes-examples\manage-attributes-examples.md
- the read_attributes feature of manage_attributes function can be run on 'READ' mode (and not for WRITE), for example, read_attributes. Other features for manage_attributes function such as update_attributes, create_attributes and delete_attributes should only be allowed to run under circumstances where 'WRITE' environment variable is set... Also, make sure its tool description of manage_attributes function is dynamically updated with 'READ' or 'WRITE' attributes made... Don't write code first, just research

- check DEBUG environment variable works for verboseUtils.js, for setting to false might also see the debug message which shouldn't be the case...
- if WRITE environment variable is set while READ is not set, throw an error please
- create responseFormatter.ts for manage response structure of all mcp functions
- what's the logic for tests/validation.test.js, is it unit testing? If so, update the info about it at CLAUDE.md