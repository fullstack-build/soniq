import { Table, GenericColumn, IdColumn, ManyToOneColumn } from "@fullstack-one/graphql";
export declare const post: Table;
export declare const postId: IdColumn;
export declare const title: GenericColumn;
export declare const content: GenericColumn;
export declare const owner: ManyToOneColumn;
