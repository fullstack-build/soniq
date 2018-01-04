export interface IMigrationObject {
  schemas: {
    [name: string]: {
      statements: [string];
      tables: {
        [name: string]: {
          statements: [string];
          columns: {
            [name: string]: {
              statements: [string];
            }
          };
          constraints: {
            [name: string]: {
              statements: [string];
            }
          };
        };
      };
    }
  };
  enumsStaments: {
    [name: string]: [string];
  };
  relationsStatemens: {
    [name: string]: [string];
  };
}
