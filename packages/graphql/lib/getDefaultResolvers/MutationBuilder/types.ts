import { IMutationViewMeta } from "@fullstack-one/schema-builder";

export interface IMutationBuild {
  sql: string;
  values: string[];
  mutation: IMutationViewMeta;
  id: any;
}
