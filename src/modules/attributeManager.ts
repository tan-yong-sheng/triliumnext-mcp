/**
 * Attribute Management Module
 * Handles CRUD operations for TriliumNext labels and relations
 */

export interface AttributeOperation {
  operation: string;
  attributeType?: string;
  noteId?: string;
  attributeId?: string;
  name?: string;
  value?: string;
  position?: number;
  isInheritable?: boolean;
  includeValues?: boolean;
  sortBy?: string;
}

export interface AttributeResult {
  type: string;
  name: string;
  count: number;
  values?: string[];
}

export interface AttributeListResponse {
  operation: string;
  attributeType: string;
  summary: string;
  attributes: AttributeResult[];
}

export interface AttributeCRUDResponse {
  operation: string;
  success: boolean;
  message: string;
  attribute?: any;
}

/**
 * Generate dynamic tool schema based on permissions
 */
export function createAttributeToolSchema(hasRead: boolean, hasWrite: boolean) {
  // Dynamic description based on permissions
  let description = "Attribute management system for ";
  let operationsList: string[] = [];
  
  if (hasRead && hasWrite) {
    description += "CRUD operations on note labels and relations. Supports creating, reading, updating, deleting, and discovering both labels (#tags) and relations (~connections) across notes.";
    operationsList = ["list", "create", "update", "delete", "get"];
  } else if (hasRead) {
    description += "read operations on note labels and relations. Supports discovering and retrieving both labels (#tags) and relations (~connections) across notes.";
    operationsList = ["list", "get"];
  } else if (hasWrite) {
    description += "write operations on note labels and relations. Supports creating, updating, and deleting both labels (#tags) and relations (~connections) on notes.";
    operationsList = ["create", "update", "delete"];
  }

  return {
    name: "manage_attributes",
    description,
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: operationsList,
          description: hasRead && hasWrite 
            ? "Operation to perform: 'list' (discover attributes), 'create' (add to note), 'update' (modify), 'delete' (remove), 'get' (get details)"
            : hasRead 
              ? "Operation to perform: 'list' (discover attributes), 'get' (get details)"
              : "Operation to perform: 'create' (add to note), 'update' (modify), 'delete' (remove)"
        },
        attributeType: {
          type: "string",
          enum: ["label", "relation", "both"],
          description: "Type of attribute: 'label' for #tags, 'relation' for ~connections, 'both' for list operation (default: both)",
          default: "both"
        },
        ...(hasWrite && {
          noteId: {
            type: "string",
            description: "Note ID for create/update/delete operations"
          }
        }),
        ...((hasWrite || hasRead) && {
          attributeId: {
            type: "string",
            description: hasWrite && hasRead 
              ? "Attribute ID for update/delete/get operations (specific attribute instance)"
              : hasWrite 
                ? "Attribute ID for update/delete operations (specific attribute instance)"
                : "Attribute ID for get operation (specific attribute instance)"
          }
        }),
        ...(hasWrite && {
          name: {
            type: "string",
            description: "Name of the attribute for create operations (e.g., 'book', 'author', 'priority' for labels; 'authorOf', 'relatedTo' for relations)"
          }
        }),
        ...(hasWrite && {
          value: {
            type: "string",
            description: "Value for create/update operations: for labels (optional, e.g., 'high', 'completed'), for relations (target noteId - the note being connected to)"
          }
        }),
        ...(hasWrite && {
          position: {
            type: "number",
            description: "Position of the attribute among other attributes (optional, for ordering)"
          }
        }),
        ...(hasWrite && {
          isInheritable: {
            type: "boolean",
            description: "Whether the attribute should be inherited by child notes (optional, default: false)"
          }
        }),
        // List operation parameters (available when READ permission)
        ...(hasRead && {
          includeValues: {
            type: "boolean",
            description: "For list operation: include attribute values along with names (default: false)",
            default: false
          }
        }),
        ...(hasRead && {
          sortBy: {
            type: "string",
            enum: ["name", "usage", "type"],
            description: "For list operation: sort results by name alphabetically, usage count, or attribute type (default: name)",
            default: "name"
          }
        })
      },
      required: ["operation"],
    },
  };
}

/**
 * Handle list operation for attributes
 */
export async function handleListAttributes(
  args: AttributeOperation,
  axiosInstance: any
): Promise<AttributeListResponse> {
  const attributeType = args.attributeType || "both";
  const includeValues = args.includeValues === true;
  const sortBy = args.sortBy || "name";

  // Build search query based on attributeType
  let searchQuery = "";
  if (attributeType === "label") {
    searchQuery = "note.labelCount > 0";
  } else if (attributeType === "relation") {
    searchQuery = "note.relationCount > 0";
  } else {
    // both: get notes with any attributes
    searchQuery = "note.attributeCount > 0";
  }

  const params = new URLSearchParams();
  params.append("search", searchQuery);
  params.append("fastSearch", "false");
  params.append("includeArchivedNotes", "true");

  const response = await axiosInstance.get(`/notes?${params.toString()}`);
  const allNotes = response.data.results || [];

  // Extract attributes from all notes
  const attributeMap = new Map<string, { 
    type: string; 
    count: number; 
    values: Set<string> 
  }>();

  allNotes.forEach((note: any) => {
    if (note.attributes && Array.isArray(note.attributes)) {
      note.attributes.forEach((attr: any) => {
        // Filter by attribute type if specified
        if (attributeType !== "both" && attr.type !== attributeType) {
          return;
        }

        const attrKey = `${attr.type}:${attr.name}`;
        if (!attributeMap.has(attrKey)) {
          attributeMap.set(attrKey, { 
            type: attr.type, 
            count: 0, 
            values: new Set() 
          });
        }
        const attrInfo = attributeMap.get(attrKey)!;
        attrInfo.count++;
        if (attr.value) {
          attrInfo.values.add(attr.value);
        }
      });
    }
  });

  // Format results
  let results: AttributeResult[] = [];
  
  if (includeValues) {
    // Include values for each attribute
    results = Array.from(attributeMap.entries()).map(([key, info]) => {
      const [type, name] = key.split(':');
      return {
        type,
        name,
        count: info.count,
        values: Array.from(info.values).sort()
      };
    });
  } else {
    // Just attribute names with usage count and type
    results = Array.from(attributeMap.entries()).map(([key, info]) => {
      const [type, name] = key.split(':');
      return {
        type,
        name,
        count: info.count
      };
    });
  }

  // Sort results
  if (sortBy === "usage") {
    results.sort((a, b) => b.count - a.count);
  } else if (sortBy === "type") {
    results.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  const typeText = attributeType === "both" ? "attributes" : `${attributeType}s`;
  const summary = `Found ${results.length} unique ${typeText} across ${allNotes.length} notes with ${typeText}`;
  
  return {
    operation: "list",
    attributeType,
    summary,
    attributes: results
  };
}

/**
 * Handle create operation for attributes
 */
export async function handleCreateAttribute(
  args: AttributeOperation,
  axiosInstance: any
): Promise<AttributeCRUDResponse> {
  const { noteId, name, value, position, isInheritable, attributeType } = args;
  
  if (!noteId || !name) {
    throw new Error("noteId and name are required for create operation.");
  }

  // Determine type from attributeType, but validate it's not "both"
  let type = attributeType;
  if (type === "both") {
    throw new Error("attributeType must be 'label' or 'relation' for create operation, not 'both'.");
  }

  // Validate relation value requirement
  if (type === "relation" && !value) {
    throw new Error("Relations require a value (target noteId).");
  }

  const attributeData: any = {
    noteId,
    type,
    name,
    value: value || "",
    isInheritable: isInheritable || false
  };

  if (position !== undefined) {
    attributeData.position = position;
  }

  const response = await axiosInstance.post('/attributes', attributeData);
  
  return {
    operation: "create",
    success: true,
    message: `Created ${type} '${name}' on note ${noteId}`,
    attribute: response.data
  };
}

/**
 * Handle update operation for attributes
 */
export async function handleUpdateAttribute(
  args: AttributeOperation,
  axiosInstance: any
): Promise<AttributeCRUDResponse> {
  const { attributeId, value, position } = args;
  
  if (!attributeId) {
    throw new Error("attributeId is required for update operation.");
  }

  // Get current attribute to check type for validation
  const currentAttr = await axiosInstance.get(`/attributes/${attributeId}`);
  const currentType = currentAttr.data.type;

  const updateData: any = {};
  
  // For relations, only position can be updated (OpenAPI constraint)
  if (currentType === "relation") {
    if (value !== undefined) {
      throw new Error("Relation values cannot be updated. Only position can be modified for relations.");
    }
    if (position !== undefined) updateData.position = position;
  } else {
    // For labels, both value and position can be updated
    if (value !== undefined) updateData.value = value;
    if (position !== undefined) updateData.position = position;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid update fields provided.");
  }

  const response = await axiosInstance.patch(`/attributes/${attributeId}`, updateData);
  
  return {
    operation: "update",
    success: true,
    message: `Updated ${currentType} attribute ${attributeId}`,
    attribute: response.data
  };
}

/**
 * Handle delete operation for attributes
 */
export async function handleDeleteAttribute(
  args: AttributeOperation,
  axiosInstance: any
): Promise<AttributeCRUDResponse> {
  const { attributeId } = args;
  
  if (!attributeId) {
    throw new Error("attributeId is required for delete operation.");
  }

  // Get attribute info before deletion for better messaging
  const attrResponse = await axiosInstance.get(`/attributes/${attributeId}`);
  const attrType = attrResponse.data.type;
  const attrName = attrResponse.data.name;

  await axiosInstance.delete(`/attributes/${attributeId}`);
  
  return {
    operation: "delete",
    success: true,
    message: `Deleted ${attrType} '${attrName}' (${attributeId})`
  };
}

/**
 * Handle get operation for attributes
 */
export async function handleGetAttribute(
  args: AttributeOperation,
  axiosInstance: any
): Promise<AttributeCRUDResponse> {
  const { attributeId } = args;
  
  if (!attributeId) {
    throw new Error("attributeId is required for get operation.");
  }

  const response = await axiosInstance.get(`/attributes/${attributeId}`);
  
  return {
    operation: "get",
    success: true,
    message: `Retrieved attribute details for ${attributeId}`,
    attribute: response.data
  };
}