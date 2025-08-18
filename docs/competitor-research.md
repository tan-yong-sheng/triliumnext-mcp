Here’s a concise yet comprehensive summary of the **cyanheads/obsidian-mcp-server** repository’s **search functionality**, focusing on the **`obsidianGlobalSearchTool`** and its parameters:

---

### **1. Core Features & Parameters**
#### **A. Basic Text Search**
- **Parameter**: `query` (string, **required**)
  - Searches for exact or partial text matches in note **content** or **filenames**.
  - Example: `{ query: "project update" }`

#### **B. Path Scoping**
- **Parameter**: `searchInPath` (string, optional)
  - Restricts search to a **vault-relative subfolder** (e.g., `Notes/Work`).
  - Supports nested paths (e.g., `Projects/2025/Q3`).
  - Example: `{ query: "budget", searchInPath: "Finance/2025" }`

#### **C. Date Filtering**
- **Parameters**:
  - `modified_since` (string, optional): Filters notes modified **after** a specific date/time.
  - `modified_until` (string, optional): Filters notes modified **before** a specific date/time.
- **Supports**:
  - Natural language (e.g., `"2 weeks ago"`, `"today"`).
  - ISO dates (e.g., `"2025-01-15"`).
  - Uses `date-fns` for parsing.
- **Example**:
  ```ts
  {
    query: "meeting",
    modified_since: "30 days ago",  // Notes modified in the last 30 days
    modified_until: "today"          // Up to today
  }
  ```

#### **D. Regex Support**
- **Parameter**: `useRegex` (boolean, optional, default: `false`)
  - Treats `query` as a **JavaScript regex pattern** (e.g., `/^# \w+/gm`).
  - Enables pattern-based searches (e.g., find all `TODO:` items).
- **Example**:
  ```ts
  {
    query: "\\d{4}-\\d{2}-\\d{2}",  // Match YYYY-MM-DD dates
    useRegex: true
  }
  ```

#### **E. Pagination**
- **Parameter**: `pageSize` (number, optional)
  - Limits results per "page" (default: no limit).
  - **Note**: Only caps results; no `pageNumber` for deep pagination.
- **Example**: `{ query: "research", pageSize: 10 }`

#### **F. Context Length Control**
- **Parameter**: `contextLength` (number, optional, default: `100`)
  - Controls characters shown **around each match** (improves readability).
- **Example**: `{ query: "algorithm", contextLength: 50 }`

#### **G. Case Sensitivity**
- **Parameter**: `caseSensitive` (boolean, optional, default: `false`)
  - If `true`, matches case exactly (e.g., `Query` ≠ `query`).
- **Example**: `{ query: "API", caseSensitive: true }`

---

### **2. Input Schema (Zod Validation)**
```ts
const ObsidianGlobalSearchInputSchema = z.object({
  query: z.string().min(1).describe("The search query (text or regex pattern)"),
  searchInPath: z.string().optional().describe(
    "Optional vault-relative path (e.g., 'Notes/Projects')"
  ),
  contextLength: z.number().int().positive().optional().default(100),
  modified_since: z.string().optional().describe(
    "Filter files modified *since* this date/time (e.g., '2 weeks ago')"
  ),
  modified_until: z.string().optional().describe(
    "Filter files modified *until* this date/time (e.g., 'today')"
  ),
  useRegex: z.boolean().optional().default(false),
  caseSensitive: z.boolean().optional().default(false),
  pageSize: z.number().int().positive().optional()
});
```

---

### **3. Key Workflows**
#### **A. Time-Bound Research**
- **Use Case**: Review notes from the last 30 days.
  ```ts
  await globalSearch({
    query: "quarterly report",
    modified_since: "30 days ago",
    contextLength: 150
  });
  ```

#### **B. Pattern-Based Searches**
- **Use Case**: Find all `TODO:` items in a project folder.
  ```ts
  await globalSearch({
    query: "TODO:\\s+.+",
    useRegex: true,
    searchInPath: "Projects"
  });
  ```

#### **C. Scoped Searches**
- **Use Case**: Search for "budget" in the `Finance/2025` folder.
  ```ts
  await globalSearch({
    query: "budget",
    searchInPath: "Finance/2025",
    pageSize: 5
  });
  ```

---

### **4. Implementation Details**
| **Feature**               | **Parameter**       | **Default** | **Notes**                                  |
|---------------------------|----------------------|-------------|--------------------------------------------|
| Basic Text Search         | `query`              | N/A         | Required.                                  |
| Path Scoping              | `searchInPath`       | `null`      | Vault-relative path.                       |
| Date Filtering            | `modified_since`/`until` | `null`  | Uses `date-fns` for parsing.               |
| Regex Support             | `useRegex`           | `false`     | Compiles `query` as regex.                 |
| Pagination                | `pageSize`           | `null`      | Limits results; no `pageNumber`.           |
| Context Length Control     | `contextLength`      | `100`       | Characters around matches.                 |
| Case Sensitivity          | `caseSensitive`      | `false`     | Exact case matching if `true`.             |

---

### **5. Limitations**
- **No Native Tag Search**: Tags must be searched as plain text (e.g., `query: "#urgent"`).
- **Basic Pagination**: Only limits results; no cursor-based pagination.
- **Performance**: Regex searches on large vaults may be slow (mitigate with `searchInPath`).

---

### **6. Comparison to Other Repos**
| **Feature**               | **cyanheads**               | **StevenStavrakis**          | **jacksteamdev**               |
|---------------------------|-----------------------------|-----------------------------|---------------------------------|
| **Tag Search**            | ❌ (text-only)              | ✅ (`tag:` prefix)          | ❌                              |
| **Date Filtering**        | ✅ (`modified_since`/`until`) | ❌                          | ✅ (via `mtime` metadata)       |
| **Regex Support**         | ✅ (`useRegex`)              | ❌                          | ❌                              |
| **Pagination**            | ✅ (`pageSize`)              | ❌                          | ❌                              |
| **Context Control**       | ✅ (`contextLength`)         | ❌                          | ❌                              |
| **Path Scoping**          | ✅ (`searchInPath`)          | ✅                          | ✅ (API path)                   |

---

### **7. Example Queries**
1. **Recent Notes**:
   ```ts
   await globalSearch({
     query: "project",
     modified_since: "7 days ago"
   });
   ```

2. **Regex + Path**:
   ```ts
   await globalSearch({
     query: "\\d{3}-\\d{3}-\\d{4}",  // Phone numbers
     useRegex: true,
     searchInPath: "Contacts"
   });
   ```

3. **Case-Sensitive Search**:
   ```ts
   await globalSearch({
     query: "API_Key",  // Exact case
     caseSensitive: true
   });
   ```

---
### **Key Takeaways**
- **Strengths**: Best for **time-bound** and **pattern-based** searches (regex, date filtering).
- **Weaknesses**: Lacks native tag support; pagination is basic.
- **Best For**: Users needing **advanced filtering** (dates, regex) or **large-vault management** (context length, pagination).