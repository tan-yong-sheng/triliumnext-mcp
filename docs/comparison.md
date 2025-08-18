# Feature Feasibility: Obsidian MCP vs Trilium ETAPI

| Feature | Use case | ETAPI support | Feasible? | Notes/How to implement | Impact |
|---|---|---|---|---|---|
| Date-range search (start_date/end_date on created/modified) | Notes created/updated in last 30 days | /notes search DSL supports utcDateCreated, utcDateModified and ranges; orderBy supports utcDateCreated/utcDateModified | Yes | Map params to DSL: utcDateModified:START..END or utcDateCreated:START..END; add orderBy=utcDateModified&orderDirection=desc&limit | High |
| Path scoping (ancestorNoteId/Depth) | Only within project/journal subtree | ancestorNoteId, ancestorDepth on /notes | Yes | Resolve subtree root ID, pass ancestorNoteId and optional ancestorDepth (eqN/ltN/gtN) | High |
| Tag/label filtering | Find #tag or label:value | Search query string supports labels via #label and name:value | Yes | Compose search: "query #tag name:value" | High |
| Fast search toggle | Title-only quick find | fastSearch boolean on /notes | Yes | Expose fastSearch flag passthrough | Medium |
| Sort/limit controls | Top N most recent/large notes | orderBy, orderDirection, limit on /notes | Yes | Pass through to ETAPI; recommend utcDateModified desc | High |
| Regex search | Pattern matches like phone numbers | No explicit regex flag | Partial | DSL text is not regex; true regex unsupported; could approximate via specific DSL where possible | Medium-Low |
| Context snippet length | Return N chars around match | Not provided by ETAPI | No (server-side) | Implement client-side snippetting after fetching note content; increases requests/processing | Medium |
| Debug parsed query | Show how query was parsed | debug boolean on /notes returns debugInfo | Yes | Pass debug=true and expose debugInfo | Low-Medium |
| Pagination (cursor/page) | Paged result browsing | limit only; no cursor/page param | Partial | Emulate with limit+orderBy and client-side offsets; beware drift in changing datasets | Medium |
| Recent activity quick filters | Today/7/30 days quick buttons | Supported via date range DSL | Yes | Precompute START..END from now; prefer utcDateModified | High |
| Combine filters (date+path+tag) | Recent tagged notes in folder | Combine search query with ancestorNoteId, limit, orderBy | Yes | Build composite query and params together | High |
