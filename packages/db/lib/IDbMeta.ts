export interface IDbMeta {
  version: number;
  schemas?: {
    [name: string]: {
      name: string;
      oldName?: string;
      tables?: {
        [name: string]: {
          schemaName: string;
          oldSchemaName?: string;
          name: string;
          oldName?: string;
          exposedNames?: [string];
          description?: string;
          isAuth?: boolean;
          versioning?: {
            isActive: boolean;
          };
          immutable?: {
            isUpdatable?: boolean;
            isDeletable?: boolean;
          };
          fileTrigger?: {
            isActive: boolean;
          };
          columns: {
            [name: string]:
              {
                name: string;
                oldName?: string;
                description?: string;
                type: 'computed' | 'customResolver' | 'varchar' | 'float8' | 'bool' | 'uuid' | 'jsonb' | 'relation' | 'enum' | 'customType';
                customType?: string;
                defaultValue?: {
                  isExpression: boolean;
                  value: 'string';
                };
                triggerUpdatedAt?: {
                  isActive: boolean;
                };
                constraintNames?: [string];
                relationName?: string;
                auth?: {
                  isTenant?: boolean;
                  isUsername?: boolean,
                  isPassword?: boolean
                };
                isFileColumn?: {
                  isActive: boolean
                };
              }
          };
          constraints?: {
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
      views?: any;
    }
  };
  enums?: {
    [name: string]: {
      name: string;
      values: [string];
      columns?: {
        [name: string]: {
          schemaName: string;
          tableName: string;
          columnName: string;
        }
      }
    };
  };
  relations?: {
    [name: string]: {
      [sideName: string]: IDbRelation;
    };
  };
  exposedNames?: {
    [name: string]: {
      schemaName: string;
      tableName: string;
    }
  };
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
