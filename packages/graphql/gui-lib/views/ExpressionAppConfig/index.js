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
import PropertyBox from "../../components/PropertyBox";
import EditableText from "../../components/EditableText";
import EditExpressionParams from "../../components/EditExpressionParams";
import EditIndexProperties from "../../components/EditIndexProperties";
import EditMutationColumnTag from "../../components/EditMutationColumnTag";
import sqlFormatter from "sql-formatter";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-pgsql";
import "ace-builds/src-noconflict/theme-github";
import EditExpressionStaticPlaceholderTag from "../../components/EditExpressionStaticPlaceholderTag";

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

class ExpressionAppConfig extends Component {
  getExpression() {
    const { appConfig, expressionId } = this.props;
    for (let index in appConfig.expressions) {
      if (appConfig.expressions[index].id === expressionId) {
        return {
          expressionIndex: parseInt(index),
          expression: appConfig.expressions[index]
        };
      }
    }
  }
  format() {
    const { updateAppConfig, appConfig } = this.props;
    const { expression, expressionIndex } = this.getExpression();

    const value = sqlFormatter.format(expression.sqlTemplate, {
      language: "sql", // Defaults to "sql"
      indent: "  "   // Defaults to two spaces
    });

    const newAppConfig = JSON.parse(JSON.stringify(appConfig));

    newAppConfig.expressions[expressionIndex].sqlTemplate = value;

    updateAppConfig({
      ...newAppConfig
    });
  }
  renderPlaceholder(placeholder, placeholderIndex, expression, expressionIndex, expressionById, localTable) {
    const { styles, appConfig, updateAppConfig } = this.props;

    if (placeholder.type === "EXPRESSION") {
      console.log(">", placeholder.appliedExpression.expressionId, expressionById[placeholder.appliedExpression.expressionId]);
      return <EditExpressionParams value={ placeholder.appliedExpression.params } appliedExpression={ placeholder.appliedExpression } expression={expressionById[placeholder.appliedExpression.expressionId]} appConfig={appConfig} table={localTable} onChange={(params) => {
        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

        newAppConfig.expressions[expressionIndex].placeholders[placeholderIndex].appliedExpression.params = params;

        updateAppConfig({
          ...newAppConfig
        });
      }} />;
    }

    if (placeholder.type === "STATIC") {
      return <EditExpressionStaticPlaceholderTag paramKey={placeholder.key} value={placeholder.value} expression={expression} placeholder={placeholder} appConfig={appConfig} table={localTable} onChange={(newPropertyValue) => {
        const newAppConfig = JSON.parse(JSON.stringify(appConfig));

        newAppConfig.expressions[expressionIndex].placeholders[placeholderIndex].value = newPropertyValue;

        updateAppConfig({
          ...newAppConfig
        });
      }} />
    }

    if (placeholder.type === "INPUT") {
      return <div></div>;
    }

    return <div style={{color: "#ff0000"}}>{"NOT IMPLEMENTED"}</div>
  }
  getNewPlaceholderKey() {
    const { expression } = this.getExpression();
    let resultNotFound = true;
    let counter = 0;

    const allPlaceholderKeys = expression.placeholders.map((placeholder) => {
      return placeholder.key;
    });

    while (resultNotFound) {
      const key = `new_placeholder_${counter}`;

      if (allPlaceholderKeys.indexOf(key) < 0) {
        resultNotFound = false;
        return key;
      } else {
        counter++;
      }
    }
  }
  addPlaceholder(expressionById, value) {
    const key = this.getNewPlaceholderKey();
    const { appConfig, updateAppConfig } = this.props;
    const { expression, expressionIndex } = this.getExpression();

    const newAppConfig = JSON.parse(JSON.stringify(appConfig));
    
    if (value.startsWith("INPUT")) {
      newAppConfig.expressions[expressionIndex].placeholders.push({
        key,
        type: "INPUT",
        inputType: value.split(":")[1]
      });
    } else if (value.startsWith("STATIC")) {
      newAppConfig.expressions[expressionIndex].placeholders.push({
        key,
        type: "STATIC",
        inputType: value.split(":")[1]
      });
    } else {
      newAppConfig.expressions[expressionIndex].placeholders.push({
        key,
        type: "EXPRESSION",
        appliedExpression: {
          id: uuid.v4(),
          name: `${expression.name}_${expressionById[value].name}`,
          expressionId: value,
          params: {}
        }
      });
    }

    updateAppConfig({
      ...newAppConfig
    });
  }
  render() {
    const { styles, appConfig, updateAppConfig } = this.props;
    const { expression, expressionIndex } = this.getExpression();

    const expressionById = {};

    const expressionOptions = appConfig.expressions.map((wExpression) => {
      expressionById[wExpression.id] = wExpression;

      return {
        value: wExpression.id,
        label: `Expression: ${wExpression.name}`
      };
    });

    expressionOptions.unshift({
      value: "STATIC:FOREIGN_TABLE",
      label: "Static: Foreign table"
    });

    expressionOptions.unshift({
      value: "STATIC:FOREIGN_COLUMN",
      label: "Static: Foreign column"
    });

    expressionOptions.unshift({
      value: "STATIC:LOCAL_COLUMN",
      label: "Static: Local column"
    });

    expressionOptions.unshift({
      value: "INPUT:STRING",
      label: "Input: String"
    });

    expressionOptions.unshift({
      value: "INPUT:FOREIGN_TABLE",
      label: "Input: Foreign table"
    });

    expressionOptions.unshift({
      value: "INPUT:FOREIGN_COLUMN",
      label: "Input: Foreign column"
    });

    expressionOptions.unshift({
      value: "INPUT:LOCAL_COLUMN",
      label: "Input: Local column"
    });

    const gqlReturnTypeOptions = [{
      value: "Boolean",
      label: "Boolean"
    }, {
      value: "String",
      label: "String"
    }, {
      value: "Int",
      label: "Int"
    }, {
      value: "Float",
      label: "Float"
    }, {
      value: "ID",
      label: "ID"
    }, {
      value: "JSON",
      label: "JSON"
    }];

    let localTable = {columns: []};

    const localTableOptions = appConfig.tables.map((table) => {
      if (expression.localTableId != null && table.id === expression.localTableId) {
        localTable = table;
      }

      return {
        value: table.id,
        label: `"${table.schema}"."${table.name}"`
      };
    });

    localTableOptions.unshift({
      value: "NULL",
      label: "- None -"
    });

    return (
      <div>
        <Section title="GENERAL">
          <Label label="Name"></Label>
          <Input value={ expression.name } onChange={ (expressionName) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            newAppConfig.expressions[expressionIndex].name = expressionName;

            updateAppConfig({
              ...newAppConfig
            });
          } } />
          <Label label="GQL-Return-Type"></Label>
          <Select options={ gqlReturnTypeOptions } value={ expression.gqlReturnType } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));

            newAppConfig.expressions[expressionIndex].gqlReturnType = event.target.value;

            updateAppConfig({
              ...newAppConfig
            });
          }} />
          <Label label="Auth required"></Label>
          <Select options={ [{value: "NULL", label: "INHERIT"},{value: "TRUE", label: "TRUE"},{value: "FALSE", label: "FALSE"}] } value={ expression.authRequired == null ? "NULL" : (expression.authRequired === true ? "TRUE" : "FALSE") } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));
            
            if (event.target.value === "NULL") {
              newAppConfig.expressions[expressionIndex].authRequired = null;
              delete newAppConfig.expressions[expressionIndex].authRequired;
            } else {
              newAppConfig.expressions[expressionIndex].authRequired = event.target.value === "TRUE" ? true : false;
            }

            updateAppConfig({
              ...newAppConfig
            });
          }} />
          <Label label="Local Table (optional)"></Label>
          <Select options={ localTableOptions } value={ expression.localTableId == null ? "NULL" : expression.localTableId } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));
            
            if (event.target.value === "NULL") {
              newAppConfig.expressions[expressionIndex].localTableId = null;
              delete newAppConfig.expressions[expressionIndex].localTableId;
            } else {
              newAppConfig.expressions[expressionIndex].localTableId = event.target.value;
            }

            updateAppConfig({
              ...newAppConfig
            });
          }} />
          <Label label="Exclude from where-clause"></Label>
          <Select options={ [{value: "NULL", label: "DEFAULT (FALSE)"},{value: "TRUE", label: "TRUE"},{value: "FALSE", label: "FALSE"}] } value={ expression.excludeFromWhereClause == null ? "NULL" : (expression.excludeFromWhereClause === true ? "TRUE" : "FALSE") } onChange={(event) => {
            const newAppConfig = JSON.parse(JSON.stringify(appConfig));
            
            if (event.target.value === "NULL") {
              newAppConfig.expressions[expressionIndex].excludeFromWhereClause = null;
              delete newAppConfig.expressions[expressionIndex].excludeFromWhereClause;
            } else {
              newAppConfig.expressions[expressionIndex].excludeFromWhereClause = event.target.value === "TRUE" ? true : false;
            }

            updateAppConfig({
              ...newAppConfig
            });
          }} />
        </Section>
        <Section title="PLACEHOLDERS" color={"#FF2894"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                {/*<th>ID</th>*/}
                <th>KEY</th>
                <th>TYPE</th>
                <th>PARAMS</th>
                <th>ACTIONS</th>
              </tr>
              { expression.placeholders.map((placeholder, placeholderIndex) => {
                return <tr key={"#" + placeholderIndex}>
                  {/*<td>{expression.id}</td>*/}
                  <td>
                    {/* <div className={ styles.name }>{column.name}</div>*/}
                    <EditableText width={160} value={ placeholder.key } onChange={ (key) => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.expressions[expressionIndex].placeholders[placeholderIndex].key = key;

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                  <td>
                    <div>
                      {placeholder.type === "STATIC" ? <div className={ styles.type }>{placeholder.type}</div> : null}
                      {placeholder.type === "EXPRESSION" ? <PropertyBox label={ placeholder.type } value={ expressionById[placeholder.appliedExpression.expressionId].name } backgroundColor="#34C6CD" /> : null}
                      {placeholder.type === "INPUT" ? <PropertyBox label={ placeholder.type } value={ placeholder.inputType } backgroundColor="#34C6CD" /> : null}
                    </div>
                  </td>
                  <td>{ this.renderPlaceholder(placeholder, placeholderIndex, expression, expressionIndex, expressionById, localTable) }</td>
                  <td>
                    <Button label="Remove" onClick={ () => {
                      const newAppConfig = JSON.parse(JSON.stringify(appConfig));

                      newAppConfig.expressions[expressionIndex].placeholders.splice(placeholderIndex, 1);

                      updateAppConfig({
                        ...newAppConfig
                      });
                    } } />
                  </td>
                </tr>
              }) }
              <tr>
                <td colSpan={5}>
                  <div style={{textAlign: "center"}}>
                    <span style={{textAlign: "left"}}>
                      <AddProperty options={expressionOptions} onSelect={ this.addPlaceholder.bind(this, expressionById) } />
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Section title="DEFINITION">
          <AceEditor
            mode="pgsql"
            theme="github"
            value={expression.sqlTemplate}
            onChange={(value) => {
              const newAppConfig = JSON.parse(JSON.stringify(appConfig));

              newAppConfig.expressions[expressionIndex].sqlTemplate = value;

              updateAppConfig({
                ...newAppConfig
              });
            }}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{ $blockScrolling: true }}
            width={"700px"}
          />
          {/*<br/>
          <Button label="Format" onClick={ this.format.bind(this) } />*/}
        </Section>
        
      </div>
    );
  }
}

export default connect(style)(ExpressionAppConfig);