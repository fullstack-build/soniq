export type Maybe<T> = T | null;

export interface UserFilter {
  OR?: Maybe<UserFilter[]>;

  AND?: Maybe<UserFilter[]>;

  id?: Maybe<Operators>;

  email?: Maybe<Operators>;

  firstLetterOfUserName?: Maybe<Operators>;

  payload?: Maybe<Operators>;

  _Anyone?: Maybe<Operators>;

  _currentUserId?: Maybe<Operators>;

  _FirstNOfField_email_1?: Maybe<Operators>;

  _Owner_id?: Maybe<Operators>;
}

export interface Operators {
  equals?: Maybe<string>;

  equalsNot?: Maybe<string>;

  isDistinctFrom?: Maybe<string>;

  isNotDistinctFrom?: Maybe<string>;

  greaterThan?: Maybe<string>;

  greaterThanOrEqual?: Maybe<string>;

  lessThan?: Maybe<string>;

  lessThanOrEqual?: Maybe<string>;

  is?: Maybe<IsValue>;

  in?: Maybe<string[]>;

  notIn?: Maybe<string[]>;

  includes?: Maybe<string>;

  includesNot?: Maybe<string>;

  contains?: Maybe<string[]>;

  isContainedBy?: Maybe<string[]>;

  like?: Maybe<string>;

  notLike?: Maybe<string>;

  similarTo?: Maybe<string>;

  notSimilarTo?: Maybe<string>;

  posixMatchCaseSensitive?: Maybe<string>;

  posixMatchCaseInsensitive?: Maybe<string>;

  posixNoMatchCaseSensitive?: Maybe<string>;

  posixNoMatchCaseInsensitive?: Maybe<string>;
}

export interface PostFilter {
  OR?: Maybe<PostFilter[]>;

  AND?: Maybe<PostFilter[]>;

  id?: Maybe<Operators>;

  title?: Maybe<Operators>;

  content?: Maybe<Operators>;

  ownerId?: Maybe<Operators>;

  ownerSecret?: Maybe<Operators>;

  _currentUserId?: Maybe<Operators>;

  _Admin?: Maybe<Operators>;
}

export interface IPossibleValues {
  values: (Maybe<string>)[];
}

export interface UserCreateMe {
  email?: Maybe<string>;

  acceptedPrivacyTermsAtInUTC?: Maybe<string>;

  acceptedPrivacyTermsVersion?: Maybe<number>;
}

export interface UserUpdateMe {
  email?: Maybe<string>;

  payload?: Maybe<PayloadInput>;
}

export interface PayloadInput {
  data: string;

  secret: number;
}

export interface UserDelete {
  id: string;
}

export interface PostCreateMe {
  title?: Maybe<string>;

  content?: Maybe<string>;
  /** List of FileNames. Allowed types: ["DEFAULT"] */
  images?: Maybe<string[]>;

  ownerId: string;

  ownerSecret?: Maybe<string>;
}

export interface PostUpdateMe {
  id: string;

  title?: Maybe<string>;

  content?: Maybe<string>;
  /** List of FileNames. Allowed types: ["DEFAULT"] */
  images?: Maybe<string[]>;

  ownerSecret?: Maybe<string>;
}

export interface PostDelete {
  id: string;
}

export interface PayloadDataInput {
  title: string;

  content: string;
}

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

export enum UserOrderBy {
  IdAsc = "id_ASC",
  IdDesc = "id_DESC",
  EmailAsc = "email_ASC",
  EmailDesc = "email_DESC",
  FirstLetterOfUserNameAsc = "firstLetterOfUserName_ASC",
  FirstLetterOfUserNameDesc = "firstLetterOfUserName_DESC",
  PayloadAsc = "payload_ASC",
  PayloadDesc = "payload_DESC",
  _AnyoneAsc = "_Anyone_ASC",
  _AnyoneDesc = "_Anyone_DESC",
  _CurrentUserIdAsc = "_currentUserId_ASC",
  _CurrentUserIdDesc = "_currentUserId_DESC",
  _FirstNOfFieldEmail_1Asc = "_FirstNOfField_email_1_ASC",
  _FirstNOfFieldEmail_1Desc = "_FirstNOfField_email_1_DESC",
  _OwnerIdAsc = "_Owner_id_ASC",
  _OwnerIdDesc = "_Owner_id_DESC"
}

export enum PostOrderBy {
  IdAsc = "id_ASC",
  IdDesc = "id_DESC",
  TitleAsc = "title_ASC",
  TitleDesc = "title_DESC",
  ContentAsc = "content_ASC",
  ContentDesc = "content_DESC",
  OwnerIdAsc = "ownerId_ASC",
  OwnerIdDesc = "ownerId_DESC",
  OwnerSecretAsc = "ownerSecret_ASC",
  OwnerSecretDesc = "ownerSecret_DESC",
  _CurrentUserIdAsc = "_currentUserId_ASC",
  _CurrentUserIdDesc = "_currentUserId_DESC",
  _AdminAsc = "_Admin_ASC",
  _AdminDesc = "_Admin_DESC"
}

export enum FILE_TYPES {
  Default = "DEFAULT"
}

export type Json = any;

// ====================================================
// Scalars
// ====================================================

// ====================================================
// Types
// ====================================================

export interface Query {
  /** Returns an array of users. */
  users: User[];
  /** Returns an array of posts. */
  posts: Post[];
  /** Tells if the given token is valid and gives some meta information. */
  getTokenMeta?: Maybe<TokenMeta>;

  add?: Maybe<AdditionPayload>;
  /** this is an example custom query */
  getRandomValueOutOfArray?: Maybe<IRandomResult>;
}

export interface User {
  id: string;

  email?: Maybe<string>;

  firstLetterOfUserName?: Maybe<string>;

  payload?: Maybe<Payload>;

  posts: Post[];

  stripeAccount?: Maybe<string>;

  _Anyone?: Maybe<boolean>;

  _currentUserId?: Maybe<string>;

  _FirstNOfField_email_1?: Maybe<string>;

  _Owner_id?: Maybe<boolean>;
}

export interface Payload {
  data?: Maybe<string>;

  secret: number;
}

export interface Post {
  id: string;

  title?: Maybe<string>;

  content?: Maybe<string>;
  /** List of Files. Allowed types: ["DEFAULT"] */
  images?: Maybe<(Maybe<BucketFile>)[]>;

  owner?: Maybe<User>;

  ownerSecret?: Maybe<string>;

  _currentUserId?: Maybe<string>;

  _Admin?: Maybe<boolean>;
}

export interface BucketFile {
  fileName: string;

  objects: BucketObject[];
}

export interface BucketObject {
  objectName: string;

  presignedGetUrl: string;

  info: string;
}

export interface TokenMeta {
  isValid: boolean;

  userId: string;

  provider: string;

  timestamp: string;

  issuedAt: number;

  expiresAt: number;
}

export interface AdditionPayload {
  sum: number;
}

export interface IRandomResult {
  randomResult: string;
}

export interface Mutation {
  USER_CREATE_ME: string;

  USER_UPDATE_ME: User;

  USER_DELETE: string;

  POST_CREATE_ME: string;

  POST_UPDATE_ME: Post;

  POST_DELETE: string;
  /** Validates a Facebook-Token and creates a Fullstack-ONE Auth-Token to login. */
  createAuthTokenFromFacebookToken?: Maybe<AuthToken>;
  /** Creates a new file for upload. Login required. */
  createFile?: Maybe<UploadFile>;
  /** Verifies a new file after upload. Login required. */
  verifyFile?: Maybe<BucketFile>;
  /** Deletes temporary files of the current user which have not been added to any entity. If you provide a fileName only this will be deleted. Login required. */
  clearUpFiles?: Maybe<(Maybe<string>)[]>;
  /** Login a user. Get back an accessToken and metadata about it. */
  login?: Maybe<LoginData>;
  /** Creates a temporary token and sends it to the user, to create a new password. You can provide `meta` information. This can help if you want to send different emails depending on the client of the user (Native App, Webapp, Desktop, ...). Another use-case could be to use this mutation to re-send a registration-email. */
  forgotPassword?: Maybe<boolean>;
  /** Set a new password with a temporary token. This will invalidate all other sessions. */
  setPassword?: Maybe<boolean>;
  /** Invalidates the given accessToken and deletes the auth cookie if set. */
  invalidateUserToken?: Maybe<boolean>;
  /** Invalidates all accessTokens ever issued to the user and deletes the auth cookie if set. */
  invalidateAllUserTokens?: Maybe<boolean>;
  /** Sets the given accessToken into a cookie. With a set cookie, normal queries an mutations are authorized. However, auth mutations will ignore this cookie. */
  refreshUserToken?: Maybe<LoginData>;
  /** Creates a JWT-Token which verifies the user-approval of the privacy terms */
  createPrivacyAgreementAcceptanceToken?: Maybe<PrivacyAgreementAcceptanceToken>;
}

export interface AuthToken {
  token: string;

  payload?: Maybe<AuthTokenPayload>;
}

export interface AuthTokenPayload {
  email: string;

  providerName: string;

  profileId: string;

  tenant: string;

  profile?: Maybe<Json>;
}

export interface UploadFile {
  extension: string;

  type: string;

  fileName: string;

  uploadFileName: string;

  presignedPutUrl: string;
}

export interface LoginData {
  userId: string;

  refreshToken?: Maybe<string>;

  accessToken?: Maybe<string>;

  sessionExpirationTimestamp: string;

  payload?: Maybe<AccessTokenPayload>;
}

export interface AccessTokenPayload {
  userId: string;

  provider: string;

  timestamp: string;

  userToken: string;

  userTokenMaxAgeInSeconds: number;
}

export interface PrivacyAgreementAcceptanceToken {
  token: string;

  acceptedAtInUTC: string;

  acceptedVersion: number;
}

export interface PayloadData {
  title?: Maybe<string>;

  content?: Maybe<string>;
}

export interface UniqueDemo {
  id: string;

  updatedAt?: Maybe<string>;

  createdAt?: Maybe<string>;

  simpleUnique?: Maybe<string>;

  namedUnique?: Maybe<string>;

  multipleUnique2?: Maybe<string>;

  multipleUnique1?: Maybe<string>;

  multipleUniqueExpression1?: Maybe<boolean>;

  multipleUniqueExpression2?: Maybe<boolean>;
}

// ====================================================
// Arguments
// ====================================================

export interface UsersQueryArgs {
  where?: Maybe<UserFilter>;

  orderBy?: Maybe<UserOrderBy[]>;

  limit?: Maybe<number>;

  offset?: Maybe<number>;
}
export interface PostsQueryArgs {
  where?: Maybe<PostFilter>;

  orderBy?: Maybe<PostOrderBy[]>;

  limit?: Maybe<number>;

  offset?: Maybe<number>;
}
export interface GetTokenMetaQueryArgs {
  accessToken?: Maybe<string>;

  tempToken?: Maybe<boolean>;

  tempTokenExpiration?: Maybe<boolean>;
}
export interface AddQueryArgs {
  a: number;

  b: number;
}
export interface GetRandomValueOutOfArrayQueryArgs {
  possibleValues: IPossibleValues;
}
export interface PostsUserArgs {
  where?: Maybe<PostFilter>;

  orderBy?: Maybe<PostOrderBy[]>;

  limit?: Maybe<number>;

  offset?: Maybe<number>;
}
export interface UserCreateMeMutationArgs {
  input: UserCreateMe;

  authToken?: Maybe<string>;

  privacyAgreementAcceptanceToken?: Maybe<string>;

  meta?: Maybe<string>;
}
export interface UserUpdateMeMutationArgs {
  input: UserUpdateMe;
}
export interface UserDeleteMutationArgs {
  input: UserDelete;
}
export interface PostCreateMeMutationArgs {
  input: PostCreateMe;
}
export interface PostUpdateMeMutationArgs {
  input: PostUpdateMe;
}
export interface PostDeleteMutationArgs {
  input: PostDelete;
}
export interface CreateAuthTokenFromFacebookTokenMutationArgs {
  token: string;

  tenant?: Maybe<string>;

  privacyAgreementAcceptanceToken?: Maybe<string>;
}
export interface CreateFileMutationArgs {
  extension: string;

  type?: Maybe<FileTypes>;
}
export interface VerifyFileMutationArgs {
  fileName: string;
}
export interface ClearUpFilesMutationArgs {
  fileName?: Maybe<string>;
}
export interface LoginMutationArgs {
  username: string;

  tenant?: Maybe<string>;

  password?: Maybe<string>;

  authToken?: Maybe<string>;
}
export interface ForgotPasswordMutationArgs {
  username: string;

  tenant?: Maybe<string>;

  meta?: Maybe<string>;
}
export interface SetPasswordMutationArgs {
  accessToken?: Maybe<string>;

  password: string;
}
export interface RefreshUserTokenMutationArgs {
  refreshToken: string;
}
export interface CreatePrivacyAgreementAcceptanceTokenMutationArgs {
  acceptedVersion: number;
}
