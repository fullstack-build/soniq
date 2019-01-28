import { ArgumentNode, DirectiveNode, ListValueNode, ObjectValueNode, ObjectFieldNode } from "graphql";

function getArgumentsValue(node: DirectiveNode) {
  const obj = {};

  Object.values(node.arguments).forEach((field: ArgumentNode | any) => {
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

function getObjectValue(node: ObjectValueNode) {
  const obj = {};

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

function getListValues(node: ListValueNode) {
  const arr = [];

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

export function parseDirectiveArguments(argument: DirectiveNode) {
  return getArgumentsValue(argument);
}
