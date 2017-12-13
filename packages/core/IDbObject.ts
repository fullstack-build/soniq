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
          type: 'computed' | 'varchar' | 'uuid' | 'jsonb' | 'relation';
          defaultValue: string;
          constraintNames: [string];
          relationName?: string;
        }
      ];
      constraints: {
        [name: string]: {
          type: 'primaryKey' | 'not_null' | 'unique';
          name: string;
          columns: [string];
        }
      };
    };
  };
  relations: {
    [name: string]: IMaxTwoRelations;
  };
  views: any;
}

interface IMaxTwoRelations {
  0: IRelation;
  1: IRelation;
}

interface IRelation {
  name: string;
  schemaName: string;
  tableName: string;
  columnName: string;
  type: 'own' | 'belongTo';
  // Name of the association
  description?: string;
  // joins to
  reference: {
    schemaName: string;
    tableName: string;
    columnName: string;
  };
}
