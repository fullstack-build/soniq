import { IMutationViewMeta } from "../../RuntimeInterfaces";

export interface IMutationBuildObject {
  sql: string;
  values: string[];
  mutation: IMutationViewMeta;
  id: string | null;
}

export interface IMutationInputObject {
  input: {
    [key: string]: unknown;
  };
}
