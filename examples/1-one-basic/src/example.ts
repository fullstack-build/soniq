import { IDbSchema } from "@fullstack-one/graphql";

export const exampleSchema: IDbSchema = {
  schemas: ['one_example'],
  permissionViewSchema: "_gql",
  tables: [{
    id: "57afcca1-37b2-4c5e-8f6e-6bab43500001",
    name: "User",
    schema: "one_example",
    columns: [{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500001",
      type: "id", 
      name: "id",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500002",
      type: "text", 
      name: "firstName",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"],
      properties: {
        moveSelectToQuery: true,
        defaultExpression: "'test'::text"
      }
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500003",
      type: "text", 
      name: "lastName",
      properties: {
        moveSelectToQuery: true
      },
      appliedQueryExpressionIds: ["20354d7a-e4fe-47af-8ff6-187bca92f3f9"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500004",
      type: "enum", 
      name: "gender",
      properties: {
        values: ["male", "female", "diverse"],
        nullable: true
      },
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500005",
      type: "manyToOne", 
      name: "favoritePost",
      properties: {
        foreignTableId: "57afcca1-37b2-4c5e-8f6e-6bab43500002",
        nullable: true
      },
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500006",
      type: "updatedAt",
      name: "updatedAt",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500007",
      type: "createdAt",
      name: "createdAt",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500008",
      type: "file", 
      name: "images",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"],
      properties: {
        nullable: true
      }
    },{
      id: "67afcca1-37b2-4c5e-8f6e-6bab43500010",
      type: "computed", 
      name: "countOfUsers",
      appliedQueryExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"],
      properties: {
        moveSelectToQuery: true,
        appliedExpressionId: "20354d7a-e4fe-47af-8ff6-187bca92f3e9"
      }
    }],
    indexes: [{
      id: "77afcca1-37b2-4c5e-8f6e-6bab43500001",
      columnIds: ["67afcca1-37b2-4c5e-8f6e-6bab43500002", "67afcca1-37b2-4c5e-8f6e-6bab43500003"],
      isUniqueIndex: true
    }],
    appliedExpressions: [{
      id: "42afcca1-37b2-4c5e-7f6e-6bab43500001",
      expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500003",
      params: {}
    },{
      id: "20354d7a-e4fe-47af-8ff6-187bca92f3f9",
      expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500002",
      params: {
        column: "67afcca1-37b2-4c5e-8f6e-6bab43500001"
      }
    },{
      id: "20354d7a-e4fe-47af-8ff6-187bca92f3e9",
      expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500005",
      params: {}
    }],
    mutations: [{
      id: "67af42a1-37b2-4c5e-8f6e-6bab43500001",
      name: "Test",
      type: "CREATE",
      appliedExpressionIds: ["42afcca1-37b2-4c5e-7f6e-6bab43500001"],
      columns: [{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500002",
        isRequired: true
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500003",
        isRequired: true
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500004",
        isRequired: false
      }]
    },{
      id: "67af42a1-37b2-4c5e-8f6e-6bab43500001",
      name: "Test",
      type: "UPDATE",
      appliedExpressionIds: ["20354d7a-e4fe-47af-8ff6-187bca92f3f9"],
      columns: [{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500001",
        isRequired: true
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500002",
        isRequired: true
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500003",
        isRequired: true
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500004",
        isRequired: false
      },{
        columnId: "67afcca1-37b2-4c5e-8f6e-6bab43500008",
        isRequired: false
      }]
    }]
  },{
    id: "57afcca1-37b2-4c5e-8f6e-6bab43500002",
    name: "Post",
    schema: "one_example",
    columns: [{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500001",
      type: "id", 
      name: "id",
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500002",
      type: "text", 
      name: "title",
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500003",
      type: "text", 
      name: "content",
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500013",
      type: "int", 
      name: "sortPosition",
      properties: {
        defaultExpression: "0"
      },
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500004",
      type: "manyToOne", 
      name: "owner",
      properties: {
        foreignTableId: "57afcca1-37b2-4c5e-8f6e-6bab43500001"
      },
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500005",
      type: "dateTimeUTC",
      name: "deletedAt",
      properties: {
        nullable: true
      },
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500006",
      type: "updatedAt",
      name: "updatedAt",
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500007",
      type: "createdAt",
      name: "createdAt",
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "87afcca1-37b2-4c5e-8f6e-6bab43500008",
      type: "oneToMany",
      name: "comments",
      properties: {
        foreignTableId: "57afcca1-37b2-4c5e-8f6e-6bab43500003",
        foreignColumnId: "97afcca1-37b2-4c5e-8f6e-6bab43500004"
      },
      appliedQueryExpressionIds: ["43afcca1-37b2-4c5e-7f6e-6bab43500001"]
    }],
    indexes: [],
    appliedExpressions: [{
      id: "43afcca1-37b2-4c5e-7f6e-6bab43500001",
      expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500003",
      params: {}
    }]
  },{
    id: "57afcca1-37b2-4c5e-8f6e-6bab43500003",
    name: "Comment",
    schema: "one_example",
    columns: [{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500001",
      type: "id", 
      name: "id",
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500002",
      type: "text", 
      name: "message",
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500003",
      type: "manyToOne", 
      name: "post",
      properties: {
        foreignTableId: "57afcca1-37b2-4c5e-8f6e-6bab43500002"
      },
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500004",
      type: "manyToOne", 
      name: "owner",
      properties: {
        foreignTableId: "57afcca1-37b2-4c5e-8f6e-6bab43500001"
      },
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500005",
      type: "dateTimeUTC",
      name: "deletedAt",
      properties: {
        nullable: true
      },
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500006",
      type: "updatedAt",
      name: "updatedAt",
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    },{
      id: "97afcca1-37b2-4c5e-8f6e-6bab43500007",
      type: "createdAt",
      name: "createdAt",
      appliedQueryExpressionIds: ["44afcca1-37b2-4c5e-7f6e-6bab43500001"]
    }],
    checks: [{
      id: "17afcca1-37b2-4c5e-8f6e-6bab43500001",
      definition: "message ~~ '%evil%'::text"
    }],
    appliedExpressions: [{
      id: "44afcca1-37b2-4c5e-7f6e-6bab43500001",
      expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500003",
      params: {}
    }]
  }],
  expressions: [{
    id: "17afcca1-37b2-4c5e-7f6e-6bab43500003",
    name: "Anyone",
    gqlReturnType: "String",
    placeholders: [],
    authRequired: false,
    nameTemplate: "Anyone",
    sqlTemplate: "TRUE"
  },{
    id: "17afcca1-37b2-4c5e-7f6e-6bab43500001",
    name: "currentUserId",
    gqlReturnType: "String",
    placeholders: [],
    authRequired: true,
    nameTemplate: "currentUserId",
    sqlTemplate: "_auth.current_user_id()"
  },{
    id: "17afcca1-37b2-4c5e-7f6e-6bab43500004",
    name: "currentUserIdOrNull",
    gqlReturnType: "String",
    placeholders: [],
    authRequired: true,
    nameTemplate: "currentUserIdOrNull",
    sqlTemplate: "_auth.current_user_id_or_null()"
  },{
    id: "17afcca1-37b2-4c5e-7f6e-6bab43500002",
    name: "Owner",
    gqlReturnType: "Boolean",
    placeholders: [{
      key: "column",
      type: "INPUT",
      inputType: "LOCAL_COLUMN"
    },{
      key: "currentUserIdOrNull",
      type: "EXPRESSION",
      appliedExpression: {
        id: "17afcca1-37b2-4c5e-6f6e-6bab43500001",
        expressionId: "17afcca1-37b2-4c5e-7f6e-6bab43500004",
        params: {}
      }
    }],
    nameTemplate: "Owner_${column.columnName}",
    sqlTemplate: "${currentUserIdOrNull} = ${column.columnSelector} AND ${currentUserIdOrNull} IS NOT NULL"
  },{
    id: "17afcca1-37b2-4c5e-7f6e-6bab43500005",
    name: "countOfUsers",
    gqlReturnType: "Int",
    placeholders: [],
    authRequired: false,
    nameTemplate: "countOfUsers",
    sqlTemplate: `(SELECT count(*) FROM one_example."User")`
  },]
}