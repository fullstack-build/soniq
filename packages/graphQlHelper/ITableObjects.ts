export interface ITableObjects {
  [tableName: string]: {
    isDbModel: boolean;
    tableName: string;
    description?: string;
    foreignKeys: [{
      // Name of the association
      name: string;
      description?: string;
      // joins from
      field: string;
      // joins to
      reference: {
        schema: string;
        model: string;
        field: string;
      }
    }];
    fields: [{
      name: string;
      description?: string;
      type: 'computed' | 'varchar' | 'uuid' | 'jsonb' | 'relation';
      defaultValue: string;
      constraints: {
        isPrimaryKey: boolean;
        nullable: boolean;
        unique: boolean;
      }
    }];
  };
}
