import { IMutationViewMeta } from "@fullstack-one/schema-builder";

export interface IMutationBuildObject {
  sql: string;
  values: string[];
  mutation: IMutationViewMeta;
  id: any;
}

export interface IMutationInputObject {
  input: {
    [key: string]: any;
  };
}
