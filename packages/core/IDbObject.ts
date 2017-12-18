export interface IDbObject {
  tables: {
    [name: string]: {
      isDbModel: boolean;
      schemaName: string;
      name: string;
      description?: string;
      columns: [
        {
          name: string;
          description?: string;
          type: 'computed' | 'customResolver' | 'varchar' | 'float8' | 'bool' | 'uuid' | 'jsonb' | 'relation' | 'enum' | 'customType';
          customType?: string;
          defaultValue?: {
            isExpression: boolean;
            value: 'string';
          };
          constraintNames: [string];
          relationName?: string;
          schemaName?: string;
        }
      ];
      constraints: {
        [name: string]: {
          type: 'primaryKey' | 'not_null' | 'unique' | 'check' | 'validate';
          name: string;
          columns: [string];
          options: {
            param1: string;
            param2: string;
          }
        }
      };
    };
  };
  relations: {
    [name: string]: IMaxTwoRelations;
  };
  enums: {
    [name: string]: [string];
  };
  views: any;
}

interface IMaxTwoRelations {
  0: IDbRelation;
  1?: IDbRelation;
}

export interface IDbRelation {
  name: string;
  schemaName: string;
  tableName: string;
  virtualColumnName: string;
  columnName: string;
  type: 'ONE' | 'MANY';
  onDelete?: 'restrict' | 'cascade' | 'set NULL' | 'set DEFAULT';
  onUpdate?: 'restrict' | 'cascade' | 'set NULL' | 'set DEFAULT';
  // Name of the association
  description?: string;
  // joins to
  reference: {
    schemaName: string;
    tableName: string;
    columnName: string;
  };
}
