import { PoolClient } from "..";

export interface ICurrentExtension {
  name: string;
  codeHash: string;
}

export async function getCurrentExtensions(pgClient: PoolClient): Promise<ICurrentExtension[]> {
  const { rows } = await pgClient.query(`SELECT name, "codeHash" FROM _core."Extensions";`);

  return rows;
}

export interface IRuntimeExtension {
  name: string;
  code: string;
  codeHash: string;
}

export async function getRuntimeExtensions(pgClient: PoolClient): Promise<IRuntimeExtension[]> {
  const { rows } = await pgClient.query(`SELECT name, code, "codeHash" FROM _core."Extensions";`);

  return rows;
}
