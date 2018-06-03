export = [
  {
    name: 'Owner',
    returnType: 'Boolean',
    generate: (context, params): string => {
      const field = params.field || 'ownerId';
      return `${context.table}."${field}" = ${context.currentUserId()}`;
    },
  }, {
    name: 'Authenticated',
    returnType: 'Boolean',
    generate: (context, params): string => {
      return `${context.currentUserId()} IS NOT NULL`;
    },
  }, {
    name: 'Admin',
    returnType: 'Boolean',
    generate: (context, params): string => {
      return `current_user().roles @> ARRAY["ADMIN"]::varchar[]`;
    },
  }, {
    name: 'Anyone',
    returnType: 'Boolean',
    generate: (context, params): string => {
      return `TRUE`;
    },
  }, {
    name: 'FirstNOfField',
    returnType: 'String',
    generate: (context, params): string => {
      return `(substring("${context.tableName}"."${params.field}" from 1 for ${params.n || 1}) || '.')`;
      // return `'TEST'`;
    },
  },
];
