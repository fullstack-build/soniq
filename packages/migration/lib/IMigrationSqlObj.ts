
export interface IAction {
  ignore: boolean;
  add: boolean;
  remove: boolean;
  rename: boolean;
  change: boolean;
}

export interface ISqlObj {
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
            [name: string]: {
                name: string;
                sql: ISqlObj;
              }
          };
          constraints?: {
            sql: ISqlObj;
          };
        };
      },
      views?: {
        [name: string]: {
            name: string;
            sql: ISqlObj;
          }
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
  isFileColumn?: {
    sql: ISqlObj;
  };
}
