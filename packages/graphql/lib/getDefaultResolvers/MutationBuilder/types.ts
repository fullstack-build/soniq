import { IMutationViewMeta } from "@fullstack-one/schema-builder";

export interface IMutationBuild {
  sql: string;
  values: any[];
  mutation: IMutationViewMeta;
  id: any;
}
