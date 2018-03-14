export default function (view) {
  let viewName = view.gqlTypeName + '_' + view.name;

  if (view.type === 'CREATE' || view.type === 'UPDATE') {
    viewName = view.type.toLocaleLowerCase() + '_' + viewName;
  }
  if (view.type === 'DELETE') {
    viewName = view.type.toLocaleLowerCase() + '_' + view.gqlTypeName;
  }

  return viewName.toUpperCase();
}
