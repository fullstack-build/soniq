export default [
  {
    name: 'Owner',
    returnType: 'Boolean',
    generate: (context, params) => {
      const field = params.field || 'ownerUserId';
      return `"${context.entity}"."${field}" = (public."current_user"()).id`;
    },
  }, {
    name: 'Authenticated',
    returnType: 'Boolean',
    generate: (context, params) => {
      return `(public."current_user"()).id IS NOT NULL`;
    },
  }, {
    name: 'Admin',
    returnType: 'Boolean',
    generate: (context, params) => {
      return `current_user().roles @> ARRAY["ADMIN"]::varchar[]`;
    },
  }, {
    name: 'Anyone',
    returnType: 'Boolean',
    generate: (context, params) => {
      return `TRUE`;
    },
  }, {
    name: 'FirstNofField',
    returnType: 'String',
    generate: (context, params) => {
      return `(substring("${context.entity}"."${context.field || params.field}" from 1 for ${params.n || 1}) || ".")`;
    },
  },
];
