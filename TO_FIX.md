- first, i need to check 15 detailed practical examples covering all CRUD operations for manage_attributes at C:\Users\tys\Documents\Coding\triliumnext-mcp\docs\create-notes-examples\manage-attributes-examples.md
- the read_attributes feature of manage_attributes function can be run on 'READ' mode (and not for WRITE), for example, read_attributes. Others such as update_attributes, create_attributes and delete_attributes should only be allowed to run under circumstances where 'WRITE' environment variable is set... Also, make sure its tool description of manage_attributes function is dynamically updated with 'READ' or 'WRITE' attributes made...


- double check if we're using utils/permissionUtils to manage all permission related things for every mcp functions... Don't write code first, just research
- create responseFormatter.ts for manage response structure of all mcp functions
