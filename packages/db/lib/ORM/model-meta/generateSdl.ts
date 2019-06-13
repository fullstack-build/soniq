import { IModelMeta, IColumnMeta, IEnumMeta, IEntityMeta } from "./types";

export function generateSdl(modelMeta: IModelMeta): string {
  const enumsSdl = generateEnumsSdl(Object.values(modelMeta.enums));
  const typesSdl = generateTypesSdl(Object.values(modelMeta.entities));
  return `${enumsSdl}\n${typesSdl}`;
}

function generateEnumsSdl(enumMetas: IEnumMeta[]): string {
  const sdlLines = [];

  enumMetas.forEach(({ name, values }) => {
    sdlLines.push(`enum ${name} {`);
    values.forEach((value) => sdlLines.push(`  ${value}`));
    sdlLines.push(`}\n`);
  });

  return sdlLines.join("\n");
}

function generateTypesSdl(entityMetas: IEntityMeta[]): string {
  const sdlLines = [];

  entityMetas.forEach(({ name, columns: fields }) => {
    sdlLines.push(`type ${name} @table {`);
    Object.values(fields).forEach((field) => sdlLines.push(generateFieldSdl(name, field)));
    sdlLines.push("}\n");
  });

  return sdlLines.join("\n");
}

function generateFieldSdl(entityName: string, { name, columnOptions, directives }: IColumnMeta): string {
  const type = columnOptions.enumName ? columnOptions.enumName : columnOptions.gqlType;
  if (type == null) {
    throw new Error(
      `orm.sdl.field.type.isNull: field: ${entityName}.${name}, enumName: ${columnOptions.enumName}, gqlType: ${columnOptions.gqlType}`
    );
  }
  return `  ${name}: ${type}${columnOptions.nullable ? "" : "!"} ${directives ? directives.join(" ") : ""}`;
}
