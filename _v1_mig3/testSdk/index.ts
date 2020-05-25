export interface IOperator {
  equals?: string;
  equalsNot?: string;
}

export interface ITransactionResult {
  errors?: [];
  data?: any;
}

export type TReturnId = any;

export interface IUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  ownedPosts?: IPost[];
}

export interface IUserSelection {
  id?: boolean;
  firstName?: boolean;
  lastName?: boolean;
  ownedPosts?: boolean | IPostSelection;
}

export interface IUserCreateAnyone {
  firstName: string;
  lastName?: string;
}

export interface IUserUpdateOwner {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface IUserFilter {
  AND?: IUserFilter[];
  OR?: IUserFilter[];
  id?: IOperator;
  firstName?: IOperator;
  lastName?: IOperator;
}

export enum EUserOrderBy {
  id_ASC,
  id_DESC,
  firstName_ASC,
  firstName_DESC,
  lastName_ASC,
  lastName_DESC
}

export interface IUserQueryOptions {
  where?: IUserFilter;
  limit?: number;
  offset?: number;
  orderBy?: EUserOrderBy | EUserOrderBy[];
}

export interface IPost {
  id?: string;
  title?: string;
  content?: string;
  owner?: IUser;
}

export interface IPostSelection {
  id?: boolean;
  title?: boolean;
  content?: boolean;
  owner?: boolean | IUserSelection;
}

export interface IPostCreateOwner {
  title: string;
  content?: string;
  ownerId: string;
}

export interface IPostFilter {
  AND?: IPostFilter[];
  OR?: IPostFilter[];
  id?: IOperator;
  firstName?: IOperator;
  lastName?: IOperator;
}

export enum EPostOrderBy {
  id_ASC,
  id_DESC,
  title_ASC,
  title_DESC,
  content_ASC,
  content_DESC
}

export interface IPostQueryOptions {
  where?: IPostFilter;
  limit?: number;
  offset?: number;
  orderBy?: EPostOrderBy | EPostOrderBy[];
}

export interface IUserOperations {
  findAll: (selection?: boolean | IUserSelection, options?: IUserQueryOptions) => Promise<IUser[]>;
  createAnyone: (user: IUserCreateAnyone, selection?: boolean | IUserSelection) => Promise<IUser>;
  updateOwner: (user: IUserUpdateOwner, selection?: boolean | IUserSelection) => Promise<IUser>;
}

export interface IUserMutations {
  createAnyone: (user: IUserCreateAnyone, selection?: boolean | IUserSelection) => TReturnId;
  updateOwner: (user: IUserUpdateOwner, selection?: boolean | IUserSelection) => TReturnId;
}

export interface IPostOperations {
  findAll: (selection?: boolean | IPostSelection, options?: IPostQueryOptions) => Promise<IPost[]>;
  createOwner: (user: IPostCreateOwner, selection?: boolean | IPostSelection) => Promise<IPost>;
}

export interface IPostMutations {
  createOwner: (user: IPostCreateOwner, selection?: boolean | IPostSelection) => TReturnId;
}

export class One {
  public user: IUserOperations;
  public post: IPostOperations;

  constructor() {
    this.user = {
      findAll: async (selection: boolean | IUserSelection = true, options?: IUserQueryOptions): Promise<IUser[]> => {
        return [];
      },
      createAnyone: async (user: IUserCreateAnyone, selection: boolean | IUserSelection = true): Promise<IUser> => {
        return null;
      },
      updateOwner: async (user: IUserUpdateOwner, selection: boolean | IUserSelection = true): Promise<IUser> => {
        return null;
      }
    }
    this.post = {
      findAll: async (selection: boolean | IPostSelection = true, options?: IPostQueryOptions): Promise<IPost[]> => {
        return [];
      },
      createOwner: async (user: IPostCreateOwner, selection: boolean | IPostSelection = true): Promise<IPost> => {
        return null;
      },
    }
  }

  public createTransaction(): OneTransaction {
    return new OneTransaction();
  }
}

export class OneTransaction {
  private beginCalled: boolean = false;
  private commitCalled: boolean = false;
  private rollbackCalled: boolean = false;
  public user: IUserMutations;
  public post: IPostMutations;

  constructor() {
    this.user = {
      createAnyone: (user: IUserCreateAnyone, selection: boolean | IUserSelection = true): TReturnId => {
        return null;
      },
      updateOwner: (user: IUserUpdateOwner, selection: boolean | IUserSelection = true): TReturnId => {
        return null;
      }
    }
    this.post = {
      createOwner: (user: IPostCreateOwner, selection: boolean | IPostSelection = true): TReturnId => {
        return null;
      }
    }
  }

  public begin() {
    if (this.beginCalled !== false) {
      throw new Error("You can call begin() only once per transaction.");
    }
    this.beginCalled = true;
    return;
  }

  public commit() {
    if (this.beginCalled !== true) {
      throw new Error("You can not commit a transaction, which has not begun.");
    }
    if (this.commitCalled !== false) {
      throw new Error("You can call commit() only once per transaction.");
    }
    if (this.rollbackCalled !== false) {
      throw new Error("You can not call commit() on a transaction which has been rolled back.");
    }
    this.commitCalled = true;
    return;
  }

  public rollback() {
    if (this.beginCalled !== true) {
      throw new Error("You can not rollback a transaction, which has not begun.");
    }
    if (this.rollbackCalled !== false) {
      throw new Error("You can call rollback() only once per transaction.");
    }
    if (this.commitCalled !== false) {
      throw new Error("You can not call rollback() on a transaction which has been committed.");
    }
    this.rollbackCalled = true;
    return;
  }

  public async run(): Promise<ITransactionResult> {
    if (this.beginCalled === true && this.commitCalled !== true && this.rollbackCalled !== true) {
      throw new Error("A transaction must have");
    }

    return {
      data: {
        foo: "bar"
      }
    };
  }
}

const one = new One();

(async () => {
  const users = await one.user.findAll({
    id: true,
    ownedPosts: {
      id: true,
      title: true
    }
  });

  const tra = one.createTransaction();

  tra.begin();
  const userTempId = tra.user.createAnyone({
    firstName: "Hans"
  });
  tra.post.createOwner({
    title: "Foobar",
    ownerId: userTempId
  });
  tra.commit();

  const result = await tra.run();


})();