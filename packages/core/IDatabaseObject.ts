interface IRelation {
  name: string;
  schemaName: string;
  tableName: string;
  fieldName: string;
  type: 'own' | 'belongTo';
  // Name of the association
  description?: string;
  // joins to
  reference: {
    schemaName: string;
    tableName: string;
    fieldName: string;
  };
}

interface IMaxTwoRelations {
  0: IRelation;
  1: IRelation;
}

export interface IDatabaseObject {
  tables: {
    [name: string]: {
      isDbModel: boolean;
      schemaName: string;
      name: string;
      description?: string;
      fields: [
        {
          name: string;
          description?: string;
          type: 'computed' | 'varchar' | 'uuid' | 'jsonb' | 'relation';
          defaultValue: string;
          constraints: {
            isPrimaryKey: boolean;
            nullable: boolean;
            unique: boolean;
          };
        }
      ];
    };
  };
  relations: {
    [name: string]: IMaxTwoRelations;
  };
}
