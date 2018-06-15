export = [
  {
    name: 'Owner',
    type: 'expression',
    gqlReturnType: 'Boolean',
    getNameWithParams: (params: any = {}): string => {
      if (params.field != null) {
        return `Owner_${params.field}`;
      }
      return 'Owner';
    },
    generate: (context, params: any = {}): string => {
      const field = params.field || 'ownerId';
      return `${context.getField(field)} = ${context.getExpression('currentUserId')}`;
    },
  },
  {
    name: 'currentUserId',
    type: 'function',
    gqlReturnType: 'ID',
    requiresAuth: true,
    generate: (context, params): string => {
      return `_meta.current_user_id()`;
    },
  }, {
    name: 'Authenticated',
    type: 'expression',
    gqlReturnType: 'Boolean',
    generate: (context, params): string => {
      return `${context.getExpression('currentUserId')} IS NOT NULL`;
    },
  }, {
    name: 'Anyone',
    type: 'expression',
    gqlReturnType: 'Boolean',
    generate: (context, params): string => {
      return `TRUE`;
    },
  },
  {
    name: 'Admin',
    type: 'expression',
    gqlReturnType: 'Boolean',
    generate: (context, params: any = {}): string => {
      return `(SELECT "isAdmin" FROM "User" WHERE id = ${context.getExpression('currentUserId')})`;
    },
  }, {
    name: 'FirstNOfField',
    type: 'expression',
    gqlReturnType: 'String',
    getNameWithParams: (params: any = {}): string => {
      if (params.n != null) {
        return `FirstNOfField_${params.field}_${params.n}`;
      }
      return `FirstNOfField_${params.field}`;
    },
    generate: (context, params): string => {
      return `(substring(${context.getField(params.field)} from 1 for ${params.n || 1}) || '.')`;
    },
  },
];
