export const authTablesSchema = {
  schemas: ["_auth"],
  tables: [
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d8",
      name: "Settings",
      schema: "_auth",
      columns: [
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "key",
          type: "text"
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "value",
          type: "text"
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
      name: "UserAuthentication",
      schema: "_auth",
      columns: [
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "userId",
          type: "uuid"
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "isActive",
          type: "boolean",
          properties: {
            defaultExpression: "true"
          }
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "loginProviderSets",
          type: "textArray",
          properties: {
            defaultExpression: "ARRAY[]::text[]"
          }
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "modifyProviderSets",
          type: "textArray",
          properties: {
            defaultExpression: "ARRAY[]::text[]"
          }
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0005",
          name: "invalidTokenTimestamps",
          type: "bigintArray",
          properties: {
            defaultExpression: "ARRAY[]::bigint[]"
          }
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0006",
          name: "totalLogoutTimestamp",
          type: "bigint",
          properties: {
            defaultExpression: "0"
          }
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0007",
          name: "createdAt",
          type: "createdAt"
        }
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d9",
          columnIds: ["ffb54274-71d9-4f22-93fc-284fcd6a0001"],
          isUniqueIndex: true
        }
      ]
    },
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d4",
      name: "AuthFactor",
      schema: "_auth",
      columns: [
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id"
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "userAuthentication",
          type: "manyToOne",
          properties: {
            foreignTableId: "cfb54274-71d9-4f22-93fc-284fcd6aa2d9"
          }
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "provider",
          type: "text"
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "meta",
          type: "text"
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "hash",
          type: "text"
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0005",
          name: "communicationAddress",
          type: "text",
          properties: {
            nullable: true
          }
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0006",
          name: "proofedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true
          }
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0007",
          name: "deletedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true
          }
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0008",
          name: "createdAt",
          type: "createdAt"
        }
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-184fcd6aa2d4",
          columnIds: ["efb54274-71d9-4f22-93fc-284fcd6a0001", "efb54274-71d9-4f22-93fc-284fcd6a0002", "efb54274-71d9-4f22-93fc-284fcd6a0007"],
          isUniqueIndex: true
        },
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d4",
          columnIds: ["efb54274-71d9-4f22-93fc-284fcd6a0001", "efb54274-71d9-4f22-93fc-284fcd6a0002"],
          isUniqueIndex: true,
          condition: `"deletedAt" IS NULL`
        }
      ]
    }
  ]
};
