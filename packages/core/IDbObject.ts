export interface IDbObject {
  schemas: {
    [name: string]: {
      tables: {
        [name: string]: {
          schemaName: string;
          name: string;
          exposedNames?: [string];
          description?: string;
          columns: {
            [name: string]:
              {
                name: string;
                description?: string;
                type: 'computed' | 'customResolver' | 'varchar' | 'float8' | 'bool' | 'uuid' | 'jsonb' | 'relation' | 'enum' | 'customType';
                customType?: string;
                defaultValue?: {
                  isExpression: boolean;
                  value: 'string';
                };
                constraintNames?: [string];
                relationName?: string;
              }
          }      ;
          constraints: {
            [name: string]: {
              type: 'PRIMARY KEY' | 'notnull' | 'UNIQUE' | 'CHECK' | 'validate';
              name: string;
              columns?: [string];
              options: {
                param1: string;
                param2: string;
              }
            }
          };
        };
      };
      views: any;
    }
  };
  enums: {
    [name: string]: [string];
  };
  relations: {
    [name: string]: IMaxTwoRelations;
  };
}

export interface IMaxTwoRelations extends Array<IDbRelation> {
  0: IDbRelation;
  1: IDbRelation;
}

export interface IDbRelation {
  name: string;
  schemaName: string;
  tableName: string;
  columnName?: string; // if exists (1:m has only on 1 side)
  virtualColumnName: string;
  type: 'ONE' | 'MANY';
  onUpdate?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  onDelete?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  // Name of the association
  description?: string;
  // joins to
  reference?: {
    schemaName: string;
    tableName: string;
    columnName?: string; // if exists (1:m has only on 1 side)
  };
}
