export enum IS_VALUE {
  Null = "NULL",
  NotNull = "NOT_NULL",
  True = "TRUE",
  NotTrue = "NOT_TRUE",
  False = "FALSE",
  NotFalse = "NOT_FALSE",
  Unknown = "UNKNOWN",
  NotUnknown = "NOT_UNKNOWN"
}

export interface IPost {
  id: string; // uuid _meta.uuid_generate_v4()
  updatedAt?: string; // customType timestamp timezone('UTC'::text, now())
  createdAt?: string; // customType timestamp timezone('UTC'::text, now())
  title?: string; // varchar
  content?: string; // varchar
  images?: any; // jsonb
  ownerSecret?: string; // varchar
  contributorSecret?: string; // varchar
  ownerId: string; // uuid _meta.current_user_id()
}

export interface IUniqueDemo {
  id: string; // uuid _meta.uuid_generate_v4()
  updatedAt?: string; // customType timestamp timezone('UTC'::text, now())
  createdAt?: string; // customType timestamp timezone('UTC'::text, now())
  simpleUnique?: string; // varchar
  namedUnique?: string; // varchar
  multipleUnique2?: string; // varchar
  multipleUnique1?: string; // varchar
  multipleUniqueExpression1?: boolean; // bool
  multipleUniqueExpression2?: boolean; // bool
}

export interface IUser {
  id: string; // uuid _meta.uuid_generate_v4()
  updatedAt?: string; // customType timestamp timezone('UTC'::text, now())
  createdAt?: string; // customType timestamp timezone('UTC'::text, now())
  tenantId?: string; // varchar 'default'::character varying
  email?: string; // varchar
  password?: any; // jsonb
  isAdmin?: boolean; // bool
  firstLetterOfUserName?: any; // computed
  payload?: any; // jsonb
  stripeAccount?: any; // customResolver
  testDefault?: any; // customType date now()
  acceptedPrivacyTermsAtInUTC?: string; // customType timestamp
  acceptedPrivacyTermsVersion?: number; // int4
}
