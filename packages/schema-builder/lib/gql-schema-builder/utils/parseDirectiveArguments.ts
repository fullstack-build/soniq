import { ArgumentNode, DirectiveNode, ListValueNode, ObjectValueNode, ObjectFieldNode } from "graphql";

function getArgumentsValue(node: DirectiveNode): any {
  const obj: any = {};

  Object.values(node.arguments).forEach((field: ArgumentNode) => {
    if (field.value.kind === "IntValue") {
      obj[field.name.value] = parseInt(field.value.value, 10);
    }

    if (field.value.kind === "FloatValue") {
      obj[field.name.value] = parseFloat(field.value.value);
    }

    if (field.value.kind === "StringValue") {
      obj[field.name.value] = field.value.value.toString();
    }

    if (field.value.kind === "BooleanValue") {
      obj[field.name.value] = field.value.value === true;
    }

    if (field.value.kind === "ObjectValue") {
      obj[field.name.value] = getObjectValue(field.value);
    }

    if (field.value.kind === "ListValue") {
      obj[field.name.value] = getListValues(field.value);
    }
  });

  return obj;
}

function getObjectValue(node: ObjectValueNode): any {
  const obj: any = {};

  Object.values(node.fields).forEach((field: ObjectFieldNode | any) => {
    const type = field.value.kind;
    let value = field.value.value;

    if (type === "IntValue") {
      obj[field.name.value] = parseInt(value, 10);
    }

    if (type === "FloatValue") {
      obj[field.name.value] = parseFloat(value);
    }

    if (type === "StringValue") {
      obj[field.name.value] = value.toString();
    }

    if (type === "BooleanValue") {
      obj[field.name.value] = value === "true";
    }

    if (type === "ObjectValue") {
      value = field.value;
      obj[field.name.value] = getObjectValue(value);
    }

    if (type === "ListValue") {
      value = field.value;
      obj[field.name.value] = getListValues(value);
    }
  });

  return obj;
}

function getListValues(node: ListValueNode): any[] {
  const arr: any[] = [];

  Object.values(node.values).forEach((field: any) => {
    const type = field.kind;
    const value = field.value;

    if (type === "IntValue") {
      arr.push(parseInt(value, 10));
    }

    if (type === "FloatValue") {
      arr.push(parseFloat(value));
    }

    if (type === "StringValue") {
      arr.push(value.toString());
    }

    if (type === "BooleanValue") {
      arr.push(value === "true");
    }

    if (type === "ObjectValue") {
      arr.push(getObjectValue(field));
    }

    if (type === "ListValue") {
      arr.push(getListValues(field));
    }
  });

  return arr;
}

export function parseDirectiveArguments(directiveNode: DirectiveNode) {
  return getArgumentsValue(directiveNode);
}
