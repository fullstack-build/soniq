export const authTablesSchema = {
  schemas: ["_file_storage"],
  tables: [
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d8",
      name: "Files",
      schema: "_file_storage",
      columns: [
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id"
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "extension",
          type: "text"
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "type",
          type: "text"
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "ownerUserId",
          type: "uuid",
          properties: {
            nullable: true
          }
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "entityId",
          type: "uuid",
          properties: {
            nullable: true
          }
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0005",
          name: "verifiedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true
          }
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0006",
          name: "deletedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true
          }
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0007",
          name: "createdAt",
          type: "createdAt"
        }
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d8",
          columnIds: ["afb54274-71d9-4f22-93fc-284fcd6a0000"],
          isUniqueIndex: true
        }
      ]
    },
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d9",
      name: "Columns",
      schema: "_file_storage",
      columns: [
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "schemaName",
          type: "text"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "tableName",
          type: "text"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "columnName",
          type: "text"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "types",
          type: "jsonb"
        }
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d9",
          columnIds: ["ffb54274-71d9-4f22-93fc-284fcd6a0001", "ffb54274-71d9-4f22-93fc-284fcd6a0002", "ffb54274-71d9-4f22-93fc-284fcd6a0003"],
          isUniqueIndex: true
        }
      ]
    },
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d4",
      name: "Settings",
      schema: "_file_storage",
      columns: [
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "key",
          type: "text"
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "value",
          type: "text",
          properties: {
            nullable: true
          }
        }
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-184fcd6aa2d4",
          columnIds: ["efb54274-71d9-4f22-93fc-284fcd6a0000"],
          isUniqueIndex: true
        }
      ]
    }
  ]
};
