
export interface IAction {
  ignore: boolean;
  add: boolean;
  remove: boolean;
  rename: boolean;
  change: boolean;
}

interface ISqlObj {
  up: undefined[];
  down: undefined[];
}

export interface IMigrationSqlObj {
  version: number;
  schemas?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
      tables?: {
        [name: string]: {
          name: string;
          sql: ISqlObj;
          columns: {
            [name: string]:
              {
                name: string;
                sql: ISqlObj;
              }
          };
          constraints?: {
            sql: ISqlObj;
          };
        };
      }
    }
  };
  enums?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
    };
  };
  relations?: {
    [name: string]: {
      name: string;
      sql: ISqlObj;
    };
  };
  auth?: {
    sql: ISqlObj;
  };
}
