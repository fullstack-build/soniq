import { IDbSchema } from "@soniq/graphql";

export const authTablesSchema: IDbSchema = {
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
          type: "text",
          queryExpressionIds: [],
        },
        {
          id: "afb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "value",
          type: "text",
          queryExpressionIds: [],
        },
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d8",
          columnIds: ["afb54274-71d9-4f22-93fc-284fcd6a0000"],
          isUniqueIndex: true,
        },
      ],
    },
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d9",
      name: "UserAuthentication",
      schema: "_auth",
      columns: [
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id",
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "userId",
          type: "uuid",
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "isActive",
          type: "boolean",
          properties: {
            defaultExpression: "true",
          },
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "loginProviderSets",
          type: "textArray",
          properties: {
            defaultExpression: "ARRAY[]::text[]",
          },
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "modifyProviderSets",
          type: "textArray",
          properties: {
            defaultExpression: "ARRAY[]::text[]",
          },
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0005",
          name: "invalidTokenTimestamps",
          type: "bigintArray",
          properties: {
            defaultExpression: "ARRAY[]::bigint[]",
          },
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0006",
          name: "totalLogoutTimestamp",
          type: "bigint",
          properties: {
            defaultExpression: "0",
          },
          queryExpressionIds: [],
        },
        {
          id: "ffb54274-71d9-4f22-93fc-284fcd6a0007",
          name: "createdAt",
          type: "createdAt",
          queryExpressionIds: [],
        },
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d9",
          columnIds: ["ffb54274-71d9-4f22-93fc-284fcd6a0001"],
          isUniqueIndex: true,
        },
      ],
    },
    {
      id: "cfb54274-71d9-4f22-93fc-284fcd6aa2d4",
      name: "AuthFactor",
      schema: "_auth",
      columns: [
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0000",
          name: "id",
          type: "id",
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0001",
          name: "userAuthentication",
          type: "manyToOne",
          properties: {
            foreignTableId: "cfb54274-71d9-4f22-93fc-284fcd6aa2d9",
          },
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0002",
          name: "provider",
          type: "text",
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0003",
          name: "meta",
          type: "text",
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0004",
          name: "hash",
          type: "text",
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0005",
          name: "communicationAddress",
          type: "text",
          properties: {
            nullable: true,
          },
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0006",
          name: "proofedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true,
          },
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0007",
          name: "deletedAt",
          type: "dateTimeUTC",
          properties: {
            nullable: true,
          },
          queryExpressionIds: [],
        },
        {
          id: "efb54274-71d9-4f22-93fc-284fcd6a0008",
          name: "createdAt",
          type: "createdAt",
          queryExpressionIds: [],
        },
      ],
      indexes: [
        {
          id: "bfb54274-71d9-4f22-93fc-184fcd6aa2d4",
          columnIds: [
            "efb54274-71d9-4f22-93fc-284fcd6a0001",
            "efb54274-71d9-4f22-93fc-284fcd6a0002",
            "efb54274-71d9-4f22-93fc-284fcd6a0007",
          ],
          isUniqueIndex: true,
        },
        {
          id: "bfb54274-71d9-4f22-93fc-284fcd6aa2d4",
          columnIds: ["efb54274-71d9-4f22-93fc-284fcd6a0001", "efb54274-71d9-4f22-93fc-284fcd6a0002"],
          isUniqueIndex: true,
          condition: `"deletedAt" IS NULL`,
        },
      ],
    },
  ],
};
