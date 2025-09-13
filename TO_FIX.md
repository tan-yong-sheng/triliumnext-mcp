1. Find recent notes about 'docker' or 'kubernetes'


Perhaps we need to fully remove text params, because we have it defined in searchCriteria already..., and if we did that we should remove fastSearch as well? Because I don't want to make the logic super complicated on SearchCriteria... 
```json
{
  "text": "docker kubernetes",
  "searchCriteria": [
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2025-09-07",
      "logic": "AND"
    }
  ],
  "limit": 10
}
```

Output: (Note: docker should have some items)
```
--- Query Debug ---
Built Query: docker kubernetes note.dateCreated >= '2025-09-07' limit 10
Input Params: {
  "text": "docker kubernetes",
  "searchCriteria": [
    {
      "property": "dateCreated",
      "type": "noteProperty",
      "op": ">=",
      "value": "2025-09-07",
      "logic": "AND"
    }
  ],
  "limit": 10
}
--- End Debug ---

[]
```

if done so, perhaps can we change this search_notes function description to a much smaller ones: [NOT IMPORTANT BEHIND BECAUSE IT JUST A COPY OF search_notes function description...]"""Unified search with comprehensive filtering capabilities including keyword search, date ranges, field-specific searches, attribute searches, note properties, template-based searches, note type filtering, MIME type filtering, and hierarchy navigation through unified searchCriteria structure. CRITICAL: When users want to search for 'docker OR kubernetes' or similar boolean logic, DO NOT use text parameter - instead use searchCriteria with fulltext type. The 'text' parameter only supports single terms or exact phrases without boolean operators. For template search: use relation type with 'template.title' property and built-in template values like 'Calendar', 'Board', 'Text Snippet', 'Grid View', 'Table', 'Geo Map'. For note type search: use noteProperty type with 'type' property and values like 'text', 'code', 'mermaid', 'canvas', 'book', 'image', 'file', 'search', 'relationMap', 'render'. For MIME type search: use noteProperty type with 'mime' property and MIME values like 'text/javascript', 'text/x-python', 'text/vnd.mermaid', 'application/json'. Use hierarchy properties like 'parents.noteId', 'children.noteId', or 'ancestors.noteId' for navigation."""


2. does search_notes have noteProperty note_type = file OR image.... Double check this, recorded at C:\Users\tys\Documents\Coding\triliumnext-mcp\docs\search-query-examples.md

