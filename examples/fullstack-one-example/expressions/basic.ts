export = [
  {
    name: 'Owner',
    returnType: 'Boolean',
    generate: (context, params): string => {
      const field = params.field || 'ownerId';
      return `"${context.table}"."${field}" = (_meta."current_user"()).id`;
    },
  }, {
    name: 'Authenticated',
    returnType: 'Boolean',
    generate: (context, params): string => {
      return `(public."current_user"()).id IS NOT NULL`;
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
      return `(substring("${context.table}"."${params.field}" from 1 for ${params.n || 1}) || '.')`;
    },
  },
];
