
function getObjectValue(node) {
  const obj = {};

  Object.values(node.value.fields).forEach((field: any) => {

    const type = field.value.kind;
    const value = field.value.value;

    if (type === 'IntValue') {
      obj[field.name.value] = parseInt(value, 10);
    }

    if (type === 'FloatValue') {
      obj[field.name.value] = parseFloat(value);
    }

    if (type === 'StringValue') {
      obj[field.name.value] = value.toString();
    }

    if (type === 'ObjectValue') {
      obj[field.name.value] = getObjectValue(value);
    }
  });

  return obj;
}

export default (argument) => {
  return getObjectValue(argument);
};
