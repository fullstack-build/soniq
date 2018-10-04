export declare class MutationBuilder {
  private resolverMeta;
  constructor(resolverMeta: any);
  private resolveCreateMutation;
  private resolveUpdateMutation;
  private resolveDeleteMutation;
  build(
    obj: any,
    args: any,
    context: any,
    info: any
  ): {
    sql: string;
    values: any[];
    mutation: any;
    id: any;
  };
}
