# TriliumNext MCP: Future Development Plans

## Immediate Next Features

### 1. List Children Note Function (`list_children_notes`)
- **Function**: `list_children_notes` - Separate function for tree navigation
- **Purpose**: Provide simple directory listing capabilities without complicating search
- **Parameters**:
  - `parentNoteId`: string (required) - List direct children of this note
  - `orderBy`: string (optional) - Sort order (e.g., 'note.title', 'note.dateCreated desc')
  - `limit`: number (optional) - Maximum results to return
  - `includeArchivedNotes`: boolean (optional, default: false)
- **Implementation**: 
  - Use ETAPI search with `ancestorNoteId` and `ancestorDepth=eq1`
  - Empty search query to match all children
  - Single API call efficiency (avoid N+1 problem)
  - Returns full Note objects with metadata
- **Usage Examples**:
  ```javascript
  // List all direct children of a note
  list_children_notes({ parentNoteId: "abc123" })
  
  // List children sorted by creation date
  list_children_notes({ 
    parentNoteId: "abc123", 
    orderBy: "note.dateCreated desc",
    limit: 20
  })
  ```
- **Benefits**: 
  - Keeps `search_notes_advanced` focused on search functionality
  - Simple, intuitive API for tree navigation
  - Essential for file explorer-like workflows

#### Common Workflow Patterns:
**`list_children_notes` → `search_notes_advanced` → Action**

- **Project Status Check**: List project folders → Search for status notes in each → Generate report
- **Learning Progress**: List subject areas → Find recent activity in each → Track progress  
- **Documentation Gaps**: List code modules → Check doc coverage in each → Identify missing docs
- **Meeting Summary**: List monthly folders → Search meetings in each → Compile summary
- **Knowledge Navigation**: List topic folders → Search related content → Discover connections

### 2. Append Note Function
- **Function**: `append_note`
- **Purpose**: Add content to existing notes without replacing entire content
- **Parameters**:
  - `noteId`: Target note ID
  - `content`: Text content to append
  - `revision`: boolean (default: false) - Whether to create revision before appending
- **Implementatiowrn**: 
  - Read current note content via GET `/notes/{noteId}/content`
  - Concatenate new content to existing content
  - Update note content via PUT `/notes/{noteId}/content`
  - Optionally create revision via POST `/notes/{noteId}/revision` if `revision=true`

### 3. Enhanced Update Note Function
- **Enhancement**: Add `revision` parameter to existing `update_note` function
- **Purpose**: Allow users to control whether revisions are created during updates
- **Parameters**: 
  - Add `revision`: boolean (default: false) - Whether to create revision before updating
- **Implementation**: Call POST `/notes/{noteId}/revision` before update if `revision=true`


---

# TriliumNext MCP: Search Enhancements PRD (Trilium ETAPI only)

## 1. Goals
- Provide powerful, ETAPI-native search tools usable by AI clients
- Prioritize recent-activity workflows and scoped discovery
- Keep implementation simple, leveraging ETAPI /notes and search DSL

## 2. Scope (Included)
- Date-range filters on created/modified (UTC)
- Path scoping via ancestorNoteId (+ancestorDepth)
- Tag/label filtering (#tag and name:value)
- Fast search toggle
- Sort/limit controls
- Debug passthrough
- Composite queries (combine above)

## 3. Out of Scope / Waitlist
- Regex search (no ETAPI support)
- Context snippets around matches (client-side post-fetch)
- Cursor/page-based pagination (ETAPI exposes limit only)

## 4. API Surface (MCP Tools)
### search_notes
Inputs:
- query: string (optional) raw DSL segment appended to constructed filters
- start_date: ISO8601 string (optional)
- end_date: ISO8601 string (optional)
- date_field: "modified" | "created" (default: modified)
- ancestor_note_id: string (optional)
- ancestor_depth: string (eqN | ltN | gtN) (optional)
- tags: string[] (optional) e.g. ["#urgent", "#work"]
- labels: Record<string,string> (optional) e.g. { "status": "open" }
- fast_search: boolean (optional)
- order_by: string (default: "utcDateModified")
- order_direction: "asc" | "desc" (default: "desc")
- limit: number (default: 50)
- debug: boolean (optional)

Behavior:
- Build Trilium search string using DSL: labels/tags + query + date range
- Pass ancestorNoteId/Depth, fastSearch, orderBy, orderDirection, limit, debug as query params
- Return Note[] and optional debugInfo

Examples:
1) Recent modified, last 30 days, tagged
- Inputs: start_date=NOW-30d, end_date=NOW, tags=["#meeting"]
- DSL: utcDateModified:START..END #meeting

2) Created date in project subtree
- Inputs: date_field=created, ancestor_note_id=<projectRoot>
- Params: ancestorNoteId=<projectRoot>, orderBy=utcDateCreated

### 4.1 Trilium Search DSL (Primer)
- Full-text keywords (implicit AND):
  - towers tolkien
- Exact phrase:
  - "Two Towers"
- Tags (labels with no value):
  - #book  #meeting
- Key/value labels:
  - status:open  priority:high
- Date ranges (UTC fields):
  - utcDateModified:2025-07-20..2025-08-18
  - utcDateCreated:2025-08-01..
  - Use ISO dates/times; open-ended ranges supported with missing side
- Combine filters by spaces (AND):
  - utcDateModified:START..END #work status:open "quarterly report"

Notes:
- Subtree scoping, sorting, limits, and fast mode are ETAPI params (not DSL): ancestorNoteId/Depth, orderBy/orderDirection, limit, fastSearch.

### get_note
- Passthrough to ETAPI /notes/{noteId} and /notes/{noteId}/content

## 5. Mapping Rules
- Date field
  - modified → utcDateModified:START..END
  - created → utcDateCreated:START..END
- Tags → append "#tag" tokens
- Labels → append "name:value" tokens
- Free query → append as-is to DSL

## 6. Validation & Errors
- If start_date > end_date → 400
- If both tags and labels empty and query empty and no date → allow but warn via message field
- Clamp limit to sane max (e.g., 500)

## 7. Security & Permissions
- Respect PERMISSIONS env (READ required)
- Never expose ETAPI token

## 8. Telemetry (optional)
- Count searches, result counts, ETAPI latency (no PII)

## 9. Testing
- Unit: DSL builder with combinations (date ranges, tags, labels, subtree)
- Integration (with inspector): verify /notes returns expected ordering and limits
- Edge: empty results, invalid dates, ancestorDepth combos

## 10. Milestones
1) DSL builder + param mapping
2) search_notes tool with ETAPI integration
3) Debug passthrough + tests
4) Polishing (errors, limits, docs in README)

## 11. Non-Goals
- Implementing regex engine
- Implementing cursor pagination
- Fetching note bodies for snippet generation
