# TriliumNext MCP: Future Development Plans


## Immediate Next Features

### 1. Append Note Function
- **Function**: `append_note`
- **Purpose**: Add content to existing notes without replacing entire content
- **Parameters**:
  - `noteId`: Target note ID
  - `content`: Text content to append
  - `revision`: boolean (default: false) - Whether to create revision before appending
- **Implementation**: 
  - Read current note content via GET `/notes/{noteId}/content`
  - Concatenate new content to existing content
  - Update note content via PUT `/notes/{noteId}/content`
  - Optionally create revision via POST `/notes/{noteId}/revision` if `revision=true`

### 2. Enhanced Update Note Function
- **Enhancement**: Add `revision` parameter to existing `update_note` function
- **Purpose**: Allow users to control whether revisions are created during updates
- **Parameters**: 
  - Add `revision`: boolean (default: false) - Whether to create revision before updating
- **Implementation**: Call POST `/notes/{noteId}/revision` before update if `revision=true`

### 3. Revision Parameter Strategy Analysis

**Research Outcome: Different Default Values Recommended**

Based on analysis of Trilium's ETAPI and common use patterns:

#### **`update_note` → `revision=true` (default)**
**Rationale:**
- **High-impact operation**: Complete content replacement
- **Data safety**: Prevents accidental loss of entire note content
- **User expectation**: Major edits typically warrant version history
- **Recovery capability**: Easy rollback for full content changes
- **Trilium best practice**: Major modifications should preserve history

#### **`append_note` → `revision=false` (default)**
**Rationale:**
- **Incremental operation**: Adding content, not replacing
- **Lower risk**: Original content remains intact
- **Performance consideration**: Frequent appends (logs, journals) shouldn't create excessive revisions
- **User workflow**: Append operations are often frequent and minor
- **Storage efficiency**: Avoid revision bloat for routine additions

#### **Implementation Strategy:**
```typescript
// Different defaults based on operation risk
update_note(noteId: string, content: string, revision: boolean = true)   // Safe default
append_note(noteId: string, content: string, revision: boolean = false)  // Performance default
```

#### **Benefits of This Approach:**
1. **Risk-appropriate defaults**: High-risk operations default to safe behavior
2. **Performance optimization**: Low-risk operations avoid unnecessary overhead
3. **User control**: Both functions allow explicit override
4. **Backward compatibility**: `update_note` enhancement maintains safety
5. **Intuitive behavior**: Matches user expectations for each operation type

#### **API Call Examples:**
```javascript
// Safe by default - creates revision before major change
update_note("noteId", "completely new content")  // revision=true

// Efficient by default - no revision for minor addition  
append_note("noteId", "\n- New log entry")      // revision=false

// Explicit control when needed
update_note("noteId", "new content", false)     // Skip revision
append_note("noteId", "\n- Important note", true) // Force revision
```

This strategy balances data safety with performance based on the inherent risk profile of each operation.


3. Add label management + search via label of Note


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
