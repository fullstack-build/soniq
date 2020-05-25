import React, { Component } from "react";
import { connect } from "react-fela";
import Input from "../../components/Input";
import Label from "../../components/Label";
import Section from "../../components/Section";
import Button from "../../components/Button";
import MultiSelect from "../../components/MultiSelect";
import Select from "../../components/Select";
import { style } from "./style";
import PathList from "../../components/PathList";
import { columnExtensionPropertySchemas } from "../../testColumnConfig";
import ReactSelect from 'react-select';
import EditProperties from "../../components/EditProperties";

import uuid from "uuid";
import AddProperty from "../../components/AddProperty";
import PropertyPopup from "../../components/PropertyPopup";
import EditableText from "../../components/EditableText";
import EditExpressionParams from "../../components/EditExpressionParams";
import EditIndexProperties from "../../components/EditIndexProperties";
import EditMutationColumnTag from "../../components/EditMutationColumnTag";

const MUTATION_OPTIONS = [{
  value: "CREATE",
  label: "CREATE"
},{
  value: "UPDATE",
  label: "UPDATE"
},{
  value: "DELETE",
  label: "DELETE"
}];

class TableAppConfig extends Component {
  constructor(props) {
    super(props);

    this.state = {
      addColumnPopupOpen: false
    };
  }
  toggleAddColumnPopup() {
    this.setState({
      ...this.state,
      addColumnPopupOpen: !this.state.addColumnPopupOpen
    });
  }
  getTable() {
    const { appConfig, tableId } = this.props;
    for (let index in appConfig.tables) {
      if (appConfig.tables[index].id === tableId) {
        return {
          tableIndex: parseInt(index),
          table: appConfig.tables[index]
        };
      }
    }
  }
  addColumn(type) {
    console.log("Foobar", type);
    const { appConfig, updateAppConfig } = this.props;
    const { tableIndex } = this.getTable();
    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    newAppConfig.tables[tableIndex].columns.push({
      id: uuid.v4(),
      type,
      name: "new_col",
      properties: {},
      appliedQueryExpressionIds: []
    });

    updateAppConfig({
      ...newAppConfig
    });
  }
  addAppliedExpression(expressionId) {
    const { appConfig, updateAppConfig } = this.props;
    const { tableIndex } = this.getTable();
    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    newAppConfig.tables[tableIndex].appliedExpressions.push({
      id: uuid.v4(),
      expressionId,
      name: "new_exp",
      params: {}
    });

    updateAppConfig({
      ...newAppConfig
    });
  }
  addIndex() {
    const { appConfig, updateAppConfig } = this.props;
    const { tableIndex } = this.getTable();
    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    if (newAppConfig.tables[tableIndex].indexes == null) {
      newAppConfig.tables[tableIndex].indexes = [];
    }

    newAppConfig.tables[tableIndex].indexes.push({
      id: uuid.v4(),
      columnIds: []
    });

    updateAppConfig({
      ...newAppConfig
    });
  }
  addCheck() {
    const { appConfig, updateAppConfig } = this.props;
    const { tableIndex } = this.getTable();
    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    if (newAppConfig.tables[tableIndex].checks == null) {
      newAppConfig.tables[tableIndex].checks = [];
    }

    newAppConfig.tables[tableIndex].checks.push({
      id: uuid.v4(),
      definition: "TRUE"
    });

    updateAppConfig({
      ...newAppConfig
    });
  }
  addMutation(type) {
    const { appConfig, updateAppConfig } = this.props;
    const { tableIndex } = this.getTable();
    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    if (newAppConfig.tables[tableIndex].mutations == null) {
      newAppConfig.tables[tableIndex].mutations = [];
    }

    newAppConfig.tables[tableIndex].mutations.push({
      id: uuid.v4(),
      type,
      name: "new_mut",
      columns: [],
      appliedExpressionIds: []
    });

    updateAppConfig({
      ...newAppConfig
    });
  }
  render() {
    const { styles, appConfig, updateAppConfig } = this.props;
    const { table, tableIndex } = this.getTable();

    const columnExtensionPropertySchemaByType = {};
    const typeOptions = columnExtensionPropertySchemas.map((type) => {
      columnExtensionPropertySchemaByType[type.type] = type;
      return {
        value: type.type,
        label: type.type
      };
    });

    const expressionById = {};

    const expressionOptions = appConfig.expressions.map((expression) => {
      expressionById[expression.id] = expression;

      return {
        value: expression.id,
        label: expression.name
      };
    });

    const appliedExpressionNameById = {};

    table.appliedExpressions.forEach((appliedExpression) => {
      appliedExpressionNameById[appliedExpression.id] = appliedExpression;
    });

    const appliedExpressionOptions = table.appliedExpressions.filter((appliedExpression) => {
      return expressionById[appliedExpression.expressionId] != null && expressionById[appliedExpression.expressionId].gqlReturnType === "Boolean"
    }).map((appliedExpression) => {
      return {
        value: appliedExpression.id,
        label: appliedExpression.name
      };
    });

    const schemaOptions = appConfig.schemas.map((schema) => {
      return {
        value: schema,
        label: schema
      };
    });

    const columnById = {};

    const localColumnOptions = table.columns.map((column) => {
      columnById[column.id] = column;

      return {
        value: column.id,
        label: column.name
      };
    });

    /*

    options?: {
      disableSecurityBarrierForReadViews?: boolean;
      disallowGenericRootLevelAggregation?: boolean;
    }

    */

    const booleanValue = (bool) => {
      return bool == null ? "NULL" : (bool === true ? "TRUE" : "FALSE");
    };

    const booleanOptions = [{value: "NULL", label: "DEFAULT (FALSE)"}, {value: "TRUE", label: "TRUE"}, {value: "FALSE", label: "FALSE"}]

    return (
      <div>
        <Section title="TABLE">
          <Label label="Name"></Label>
          <Input value={ table.name } onChange={ (tableName) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            newAppConfig.tables[tableIndex].name = tableName;

            updateAppConfig({
              ...newAppConfig
            });
          } } />
          <Label label="Schema"></Label>
          <Select options={ schemaOptions } value={ table.schema } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            newAppConfig.tables[tableIndex].schema = event.target.value;

            updateAppConfig({
              ...newAppConfig
            });
          }} />
          <Label label="Disable security-barrier for read-views"></Label>
          <Select options={ booleanOptions } value={ booleanValue(table.options != null ? table.options.disableSecurityBarrierForReadViews : null) } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            if (newAppConfig.tables[tableIndex].options == null) {
              newAppConfig.tables[tableIndex].options = {};
            }

            if (event.target.value === "NULL") {
              newAppConfig.tables[tableIndex].options.disableSecurityBarrierForReadViews = null;
              delete newAppConfig.tables[tableIndex].options.disableSecurityBarrierForReadViews;
            } else {
              newAppConfig.tables[tableIndex].options.disableSecurityBarrierForReadViews = event.target.value === "TRUE" ? true : false;
            }

            if (Object.keys(newAppConfig.tables[tableIndex].options).length < 1) {
              newAppConfig.tables[tableIndex].options = null;
              delete newAppConfig.tables[tableIndex].options;
            }

            updateAppConfig({
              ...newAppConfig
            });
          }} />
          <Label label="Disallow generic root-level-aggregation"></Label>
          <Select options={ booleanOptions } value={ booleanValue(table.options != null ? table.options.disallowGenericRootLevelAggregation : null) } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            if (newAppConfig.tables[tableIndex].options == null) {
              newAppConfig.tables[tableIndex].options = {};
            }

            if (event.target.value === "NULL") {
              newAppConfig.tables[tableIndex].options.disallowGenericRootLevelAggregation = null;
              delete newAppConfig.tables[tableIndex].options.disallowGenericRootLevelAggregation;
            } else {
              newAppConfig.tables[tableIndex].options.disallowGenericRootLevelAggregation = event.target.value === "TRUE" ? true : false;
            }

            if (Object.keys(newAppConfig.tables[tableIndex].options).length < 1) {
              newAppConfig.tables[tableIndex].options = null;
              delete newAppConfig.tables[tableIndex].options;
            }

            updateAppConfig({
              ...newAppConfig
            });
          }} />
        </Section>
        <Section title="Columns" color={"#FFEB00"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                <th>NAME</th>
                <th>TYPE</th>
                <th>PROPERTIES</th>
                <th>READ-PERMISSIONS</th>
                <th>ACTIONS</th>
              </tr>
              { table.columns.map((column, columnIndex) => {

                const columnAppliedExpressionOptions = appliedExpressionOptions.slice().filter((option) => {
                  return column.appliedQueryExpressionIds.indexOf(option.value) < 0;
                });

                return <tr key={column.id}>
                  <td>
                    {/* <div className={ styles.name }>{column.name}</div>*/}
                    <EditableText width={160} value={ column.name } onChange={ (name) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].columns[columnIndex].name = name;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                  <td> { /* column.type */ }
                    <div>
                      <div className={ styles.type }>{column.type}</div>
                    </div>
                    { /* <Select options={ typeOptions } value={ column.type } onChange={(event) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].columns[columnIndex].type = event.target.value;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    }} /> */ }
                  </td>
                  <td>
                    <EditProperties value={column.properties} type={column.type} schema={columnExtensionPropertySchemaByType[column.type].schema} appConfig={appConfig} table={table} column={column} onChange={(properties) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].columns[columnIndex].properties = properties;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    }} />
                  </td>
                  <td>
                    <div>
                      {column.appliedQueryExpressionIds.map((appliedExpressionId, index) => {
                        const name = appliedExpressionNameById[appliedExpressionId].name;

                        return <div className={ styles.expression } key={ appliedExpressionId } onClick={ () => {
                          const sure = confirm(`Do you really want to remove the expression ${name} from column ${column.name}?`);
                          if (sure !== true) {
                            return;
                          }
                          const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                          newAppConfig.tables[tableIndex].columns[columnIndex].appliedQueryExpressionIds.splice(index, 1);

                          updateAppConfig({
                            ...newAppConfig
                          });
                        } }>{name}</div>;
                      })}
                      {columnAppliedExpressionOptions.length > 0 ? <AddProperty options={columnAppliedExpressionOptions} onSelect={ (appliedQueryExpressionId) => {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].columns[columnIndex].appliedQueryExpressionIds.push(appliedQueryExpressionId);

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } } /> : null}
                    </div>
                    {/* <ReactSelect isMulti options={appliedExpressionOptions} value={column.appliedQueryExpressionIds.map((appliedExpressionId) => {
                      console.log("FOOBAR", appliedExpressionId);
                      return {
                        value: appliedExpressionId,
                        label: appliedExpressionNameById[appliedExpressionId].name
                      };
                    })} onChange={(newValue) => {
                        console.log(newValue)
                      if (newValue != null) {
                        const appliedQueryExpressionIds = newValue.map((val) => {
                          return val.value;
                        });


                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].columns[columnIndex].appliedQueryExpressionIds = appliedQueryExpressionIds;

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } else {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].columns[columnIndex].appliedQueryExpressionIds = [];

                        updateAppConfig({
                          ...newAppConfig
                        });
                      }
                    }} />*/}
                  </td>
                  <td width="124px">
                    <div>
                      <Button label="Remove" onClick={ () => {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].columns.splice(columnIndex, 1);

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } } />
                    </div>
                  </td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={typeOptions} onSelect={ this.addColumn.bind(this) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section title="Applied-Expressions" color={"#FF2894"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                {/*<th>ID</th>*/}
                <th>NAME</th>
                <th>EXPRESSION</th>
                <th>PARAMS</th>
                <th>ACTIONS</th>
              </tr>
              { table.appliedExpressions.map((appliedExpression, appliedExpressionIndex) => {
                return <tr key={appliedExpression.id}>
                  {/*<td>{expression.id}</td>*/}
                  <td>
                    {/* <div className={ styles.name }>{column.name}</div>*/}
                    <EditableText width={160} value={ appliedExpression.name } onChange={ (name) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].appliedExpressions[appliedExpressionIndex].name = name;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                  <td>
                    <div>
                      <div className={ styles.type }>{expressionById[appliedExpression.expressionId].name}</div>
                    </div>
                  </td>
                  <td>
                    <EditExpressionParams value={ appliedExpression.params } appliedExpression={ appliedExpression } expression={expressionById[appliedExpression.expressionId]} appConfig={appConfig} table={table} onChange={(params) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].appliedExpressions[appliedExpressionIndex].params = params;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    }} />
                  </td>
                  <td width="124px"><Button label="Remove" onClick={ () => {
                    for (let i in table.columns) {
                      if (table.columns[i].appliedQueryExpressionIds.indexOf(appliedExpression.id) >= 0) {
                        alert(`This Applied-Expression is still in use in at least one column [${table.columns[i].name}].`);
                        return;
                      }
                    }
                    for (let i in table.mutations) {
                      if (table.mutations[i].appliedExpressionIds.indexOf(appliedExpression.id) >= 0) {
                        alert(`This Applied-Expression is still in use in at least one mutation [${table.mutations[i].name}].`);
                        return;
                      }
                    }

                    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                    newAppConfig.tables[tableIndex].appliedExpressions.splice(appliedExpressionIndex, 1);

                    updateAppConfig({
                      ...newAppConfig
                    });
                  } } /></td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={expressionOptions} onSelect={ this.addAppliedExpression.bind(this) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section title="Indexes" color={"#808080"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                {/*<th>ID</th>*/}
                <th>ID</th>
                <th>COLUMNS</th>
                <th>PROPERTIES</th>
                <th>ACTIONS</th>
              </tr>
              { (table.indexes || []).map((index, indexIndex) => {
                const indexLocalColumnOptions = localColumnOptions.slice().filter((option) => {
                  return index.columnIds.indexOf(option.value) < 0;
                });

                return <tr key={index.id}>
                  <td>
                    <div className={ styles.name }>{index.id}</div>
                  </td>
                 {/* <td>
                    {/* <div className={ styles.name }>{column.name}</div>* /}
                    <EditableText width={160} value={ index.name } onChange={ (name) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].index[indexIndex].name = name;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>*/}
                  <td>
                    <div>
                      {index.columnIds.map((columnId, columnIdIndex) => {
                        const indexColumn = columnById[columnId];

                        return <div className={ styles.column } key={ columnId } onClick={ () => {
                          const sure = confirm(`Do you really want to remove the column ${indexColumn.name} from index ${index.id}?`);
                          if (sure !== true) {
                            return;
                          }
                          const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                          newAppConfig.tables[tableIndex].indexes[indexIndex].columnIds.splice(columnIdIndex, 1);

                          updateAppConfig({
                            ...newAppConfig
                          });
                        } }>{indexColumn.name}</div>;
                      })}
                      {indexLocalColumnOptions.length > 0 ? <AddProperty options={indexLocalColumnOptions} onSelect={ (newColumnId) => {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].indexes[indexIndex].columnIds.push(newColumnId);

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } } /> : null}
                    </div>
                  </td>
                  <td>
                    <EditIndexProperties value={ index } index={ index } appConfig={appConfig} table={table} onChange={(newIndex) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].indexes[indexIndex] = newIndex;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    }} />
                  </td>
                  <td width="124px"><Button label="Remove" onClick={ () => {
                    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                    newAppConfig.tables[tableIndex].indexes.splice(indexIndex, 1);

                    updateAppConfig({
                      ...newAppConfig
                    });
                  } } /></td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={[]} onSelect={ this.addIndex.bind(this) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section title="Checks" color={"#808080"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                {/*<th>ID</th>*/}
                <th>ID</th>
                <th>DEFINITION</th>
                <th>ACTIONS</th>
              </tr>
              { (table.checks || []).map((check, checkIndex) => {

                return <tr key={check.id}>
                  <td>
                    <div className={ styles.name }>{check.id}</div>
                  </td>
                  <td>
                    <EditableText width={160} value={ check.definition } onChange={ (definition) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].checks[checkIndex].definition = definition;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                  <td width="124px"><Button label="Remove" onClick={ () => {
                    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                    newAppConfig.tables[tableIndex].checks.splice(checkIndex, 1);

                    updateAppConfig({
                      ...newAppConfig
                    });
                  } } /></td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={[]} onSelect={ this.addCheck.bind(this) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section title="Mutations" color={"#808080"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                {/*<th>ID</th>*/}
                <th>NAME</th>
                <th>TYPE</th>
                <th>COLUMNS</th>
                <th>PERMISSIONS</th>
                <th>ACTIONS</th>
              </tr>
              { (table.mutations || []).map((mutation, mutationIndex) => {

                const mutationLocalColumnOptions = localColumnOptions.slice().filter((option) => {
                  for (let i in mutation.columns) {
                    if (mutation.columns[i].columnId === option.value) {
                      return false;
                    }
                  }
                  return true;
                });

                const mutationAppliedExpressionOptions = appliedExpressionOptions.slice().filter((option) => {
                  return mutation.appliedExpressionIds.indexOf(option.value) < 0;
                });

                return <tr key={mutation.id}>
                  <td>
                    <EditableText width={160} value={ mutation.name } onChange={ (name) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.tables[tableIndex].mutations[mutationIndex].name = name;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                  <td>
                    <div>
                      <div className={ styles.type }>{mutation.type}</div>
                    </div>
                  </td>
                  <td>
                    {mutation.type !== "DELETE" ? <div>
                      {mutation.columns.map((mutationColumn, columnIndex) => {
                        const muColumn = columnById[mutationColumn.columnId];

                        return <EditMutationColumnTag key={mutationColumn.columnId} muColumn={ muColumn } mutationColumn={ mutationColumn } mutation={ mutation } onRemove={ () => {
                          const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                          newAppConfig.tables[tableIndex].mutations[mutationIndex].columns.splice(columnIndex, 1);

                          updateAppConfig({
                            ...newAppConfig
                          });
                        } } onChange={ (isRequired) => {
                          const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                          newAppConfig.tables[tableIndex].mutations[mutationIndex].columns[columnIndex].isRequired = isRequired;

                          updateAppConfig({
                            ...newAppConfig
                          });
                        } } />
                      })}
                      {mutationLocalColumnOptions.length > 0 ? <AddProperty options={mutationLocalColumnOptions} onSelect={ (newColumnId) => {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].mutations[mutationIndex].columns.push({
                          columnId: newColumnId,
                          isRequired: false
                        });

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } } /> : null}
                    </div> : null}
                  </td>
                  <td>
                    <div>
                      {mutation.appliedExpressionIds.map((appliedExpressionId, index) => {
                        const name = appliedExpressionNameById[appliedExpressionId].name;

                        return <div className={ styles.expression } key={ appliedExpressionId } onClick={ () => {
                          const sure = confirm(`Do you really want to remove the expression ${name} from column ${mutation.name}?`);
                          if (sure !== true) {
                            return;
                          }
                          const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                          newAppConfig.tables[tableIndex].mutations[mutationIndex].appliedExpressionIds.splice(index, 1);

                          updateAppConfig({
                            ...newAppConfig
                          });
                        } }>{name}</div>;
                      })}
                      {mutationAppliedExpressionOptions.length > 0 ? <AddProperty options={mutationAppliedExpressionOptions} onSelect={ (appliedQueryExpressionId) => {
                        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                        newAppConfig.tables[tableIndex].mutations[mutationIndex].appliedExpressionIds.push(appliedQueryExpressionId);

                        updateAppConfig({
                          ...newAppConfig
                        });
                      } } /> : null}
                    </div>
                  </td>
                  <td width="124px"><Button label="Remove" onClick={ () => {
                    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                    newAppConfig.tables[tableIndex].mutations.splice(mutationIndex, 1);

                    updateAppConfig({
                      ...newAppConfig
                    });
                  } } /></td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={MUTATION_OPTIONS} onSelect={ this.addMutation.bind(this) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        {/* =========== POPUPS =========== POPUPS =========== POPUPS =========== POPUPS =========== */}
        {this.state.addColumnPopupOpen ? <PropertyPopup backgroundColor="#34C6CD" headers={[{key: "Action", value: "New Column"}]} onFinish={ this.toggleAddColumnPopup.bind(this) }>
          <h1>Foobar</h1>
        </PropertyPopup> : null}
      </div>
    );
  }
}

export default connect(style)(TableAppConfig);