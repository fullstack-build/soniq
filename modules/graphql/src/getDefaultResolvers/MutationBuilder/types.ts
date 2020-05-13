/* eslint-disable @typescript-eslint/no-explicit-any */
import { IMutationViewMeta } from "../../RuntimeInterfaces";

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
