import { IParsedResolveInfo, IMutationInputObject, IMutationBuildObject } from "../../lib/getDefaultResolvers/types";
import { IMutationViewMeta } from "@fullstack-one/schema-builder";

export interface IMutationBuildTestData {
  query: IParsedResolveInfo<IMutationInputObject>;
  mutation: IMutationViewMeta;
  expected: IMutationBuildObject;
}
