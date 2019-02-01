#!/usr/bin/env node
// tslint:disable:no-console

import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GraphQl } from "@fullstack-one/graphql";
import { GraphQLSchema } from "graphql";

function getSchema(schemaString: string, config: any): GraphQLSchema {
  console.log("Start schema loader function ...");

  return null;
  // return Container.get(GraphQl).getExecutableSchema();
}

export default getSchema;
