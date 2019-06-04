export class GQLSDL {
  public static convert(gqlObj: any): string {
    const gqlSDL = [];
    Object.values(gqlObj).forEach((table: any) => {
      gqlSDL.push(`type ${table.tableName} @table {`);
      Object.values(table.properties).forEach((property: any) => {
        gqlSDL.push(`  ${property.name}: ${property.type}${property.nullable ? "" : "!"}`);
      });

      gqlSDL.push(`}`);
    });
    return gqlSDL.join("\n");
  }
}
