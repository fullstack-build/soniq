export interface IDatabaseObject {
  [tableName: string]: {
    isDbModel: boolean;
    schemaName: string;
    tableName: string;
    description?: string;
    fields: [{
      name: string;
      description?: string;
      type: 'computed' | 'varchar' | 'uuid' | 'jsonb' | 'relation';
      defaultValue: string;
      constraints: {
        isPrimaryKey: boolean;
        nullable: boolean;
        unique: boolean;
      },
      relation?: {
        type: 'own' | 'belongTo'
        // Name of the association
        name: string;
        description?: string;
        // joins to
        reference: {
          schema: string;
          model: string;
          field: string;
        }
      };
    }];
  };
}
