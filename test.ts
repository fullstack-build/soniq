
class Schema {
  constructor(tables: Table[]) {

  }
}

class Table {
  constructor(columns: Column[]) {

  }
}

class Column {
  constructor(name: string) {

  }
}

interface TextColumnProperties {
  nullable?: boolean;
  defaultExpression?: string;
  moveToQuery?: boolean;
}

class TextColumn extends Column {
  constructor(name: string, properties?: TextColumnProperties) {
    super(name);
  }
}

class IdColumn extends Column {
  constructor() {
    super("id");
  }
}

const User = new Table([
  new IdColumn(),
  new TextColumn("firstName"),
  new TextColumn("lastName", {nullable: true})
])

const schema = new Schema([
  User
])