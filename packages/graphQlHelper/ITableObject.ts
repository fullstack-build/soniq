export interface ITableObject {
  tableName: string;
  description?: string;
  primaryKey: string;
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
    type: 'computed' | 'varchar' | 'uuid';
    constraints: {
      nullable: boolean;
    }
  }];
}
