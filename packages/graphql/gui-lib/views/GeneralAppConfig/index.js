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
import PropertyBox from "../../components/PropertyBox";
import PropertyEdit from "../../components/PropertyEdit";
import PropertyPopup from "../../components/PropertyPopup";
import AddProperty from "../../components/AddProperty";
import uuid from "uuid";

class GeneralAppConfig extends Component {
  newTable() {
    const { appConfig, updateAppConfig } = this.props;

    const tables = [...appConfig.tables];
    tables.push({
      id: uuid.v4(),
      name: "NewTable",
      schema: appConfig.schemas[0],
      columns: [],
      appliedExpressions: [],
      checks: [],
      indexes: [],
      mutations: []
    });
    updateAppConfig({
      ...appConfig,
      tables
    });
  }
  newExpression() {
    const { appConfig, updateAppConfig } = this.props;

    const expressions = [...appConfig.expressions];
    expressions.push({
      id: uuid.v4(),
      name: "NewExpression",
      gqlReturnType: "Boolean",
      placeholders: [],
      authRequired: false,
      sqlTemplate: "TRUE"
    });
    updateAppConfig({
      ...appConfig,
      expressions
    });
  }
  render() {
    const { styles, appConfig, updateAppConfig, openTable, openExpression } = this.props;
    return (
      <div>
        <input value={ JSON.stringify(appConfig) } onChange={ (event) => { 
          updateAppConfig(JSON.parse(event.target.value));
        } } />
        <Section title="General">
          <Label label="Schemas"></Label>
          <MultiSelect value={ appConfig.schemas } onChange={ (schemas) => {
            updateAppConfig({
              ...appConfig,
              schemas
            });
          } } />
          <Label label="View Schema"></Label>
          <Input value={ appConfig.permissionViewSchema } onChange={ (permissionViewSchema) => {
            updateAppConfig({
              ...appConfig,
              permissionViewSchema
            });
          } } />
        </Section>
        <Section title="Tables" color={"#FFEB00"}>
          <table className={ styles.table }>
            <tbody>
              <tr>
                <th>NAME</th>
                <th>SCHEMA</th>
                <th>ACTIONS</th>
              </tr>
              { appConfig.tables.map((table, index) => {
                return <tr key={table.id}>
                  <td><div className={styles.name}>{table.name}</div></td>
                  <td><div className={styles.name}>{table.schema}</div></td>
                  <td width="124px"><Button label="Edit" onClick={ () => {
                    openTable(table.id);
                  } } />&nbsp;&nbsp;<Button label="Remove" onClick={ () => {
                    const tables = [...appConfig.tables];
                    tables.splice(index, 1);
                    updateAppConfig({
                      ...appConfig,
                      tables
                    });
                  } } /></td>
                </tr>
              }) }
              </tbody>
            </table>
            <Button label="Create new table" onClick={ this.newTable.bind(this) } />
          </Section>
          <Section title="Expressions" color={"#FF2894"}>
            <table className={ styles.table }>
              <tbody>
                <tr>
                  <th>NAME</th>
                  <th>GQL-RETURN-TYPE</th>
                  <th>AUTH-REQUIRED</th>
                  <th>ACTIONS</th>
                </tr>
                { appConfig.expressions.map((expression, index) => {
                  return <tr key={expression.id}>
                    <td><div className={styles.name}>{expression.name}</div></td>
                    <td><div className={styles.name}>{expression.gqlReturnType}</div></td>
                    <td><div className={styles.name}>{expression.authRequired == null ? "INHERIT" : expression.authRequired === true ? "TRUE" : "FALSE"}</div></td>
                    <td width="124px"><Button label="Edit" onClick={ () => {
                      openExpression(expression.id);
                    } } />&nbsp;&nbsp;<Button label="Remove" onClick={ () => {
                      const expressions = [...appConfig.expressions];
                      expressions.splice(index, 1);
                      updateAppConfig({
                        ...appConfig,
                        expressions
                      });
                    } } /></td>
                  </tr>
                }) }
            </tbody>
          </table>
          <Button label="Create new expression" onClick={ this.newExpression.bind(this) } />
        </Section>
      </div>
    );
  }
}

export default connect(style)(GeneralAppConfig);