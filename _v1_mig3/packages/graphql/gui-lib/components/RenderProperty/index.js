import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import Label from "../Label";
import Input from "../Input";
import MultiSelect from "../MultiSelect";
import Button from "../Button";

class RenderProperty extends Component {
  renderInput() {
    const { styles, value, propertyKey, schema, onChange, appConfig, table } = this.props;

    if (schema != null) {
      if (schema.type === "string" && schema.title === "FOREIGN_TABLE") {
        const tableLabelById = {};
        const tableOptions = appConfig.tables.map((wTable) => {
          tableLabelById[wTable.id] = `${wTable.schema}.${wTable.name}`;
          return {
            value: wTable.id,
            label: tableLabelById[wTable.id]
          };
        });/*.filter((tableOption) => {
          return tableOption.value !== table.id;
        });*/

        return <ReactSelect options={tableOptions} value={{value, label: tableLabelById[value]}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "string" && schema.title === "FOREIGN_COLUMN") {
        const columnLabelById = {};
        const columnOptions = [];

        appConfig.tables/*.filter((wTable) => {
          return wTable.id !== table.id;
        })*/.forEach((wTable) => {
          wTable.columns.forEach((wColumn) => {
            columnLabelById[wColumn.id] = `${wTable.schema}.${wTable.name}.${wColumn.name}`;
            columnOptions.push({
              value: wColumn.id,
              label: columnLabelById[wColumn.id]
            });
          });
        });

        return <ReactSelect options={columnOptions} value={{value, label: columnLabelById[value]}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "string" && schema.title === "FOREIGN_COLUMN_MANY_TO_ONE") {
        const columnLabelById = {};
        const columnOptions = [];

        appConfig.tables/*.filter((wTable) => {
          return wTable.id !== table.id;
        })*/.forEach((wTable) => {
          wTable.columns.forEach((wColumn) => {
            columnLabelById[wColumn.id] = `${wTable.schema}.${wTable.name}.${wColumn.name}`;
            if (wColumn.type === "manyToOne" && wColumn.properties != null && wColumn.properties.foreignTableId === table.id) {
              columnOptions.push({
                value: wColumn.id,
                label: columnLabelById[wColumn.id]
              });
            }
          });
        });

        return <ReactSelect options={columnOptions} value={{value, label: columnLabelById[value]}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "string" && schema.title === "APPLIED_EXPRESSION") {
        const appliedExpressionById = {};
        const appliedExpressionOptions = table.appliedExpressions.map((appliedExpression) => {
          appliedExpressionById[appliedExpression.id] = appliedExpression.name;
          return {
            value: appliedExpression.id,
            label: appliedExpressionById[appliedExpression.id]
          };
        });

        return <ReactSelect options={appliedExpressionOptions} value={{value, label: appliedExpressionById[value]}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "string" && schema.enum != null && Array.isArray(schema.enum)) {
        return <ReactSelect options={schema.enum.map((val) => { return { value: val, label: val } })} value={{value, label: value}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "array" && schema.title === "ENUM_VALUES") {
        return <MultiSelect value={value} placeholder="Add a new value" onChange={(newValue) => {
          onChange(newValue);
        }} />
      }

      if (schema.type === "boolean") {
        return <ReactSelect options={[{value: true, label: "TRUE"}, {value: false, label: "FALSE"}]} value={{value, label: value ? "TRUE" : "FALSE"}} onChange={(newValue) => {
          onChange(newValue.value);
        }} />
      }

      if (schema.type === "string") {
        return <Input value={value} onChange={(newValue) => {
          onChange(newValue);
        }} />
      }
    }

    return <Input value={JSON.stringify(value)} onChange={(newValue) => {
      onChange(JSON.parse(newValue));
    }} />
  }
  render() {
    const { styles, value, propertyKey, schema, required, onRemove } = this.props;

    return (
      <div className={ styles.demo }>
        <Label label={propertyKey}/>
        {this.renderInput()}
        {required ? null : <Button label="REMOVE" onClick={() => {
          onRemove();
        }}/>}
        {/*false ? <ReactSelect options={missingPropertyOptions} value={null}
        onChange={this.handleChange.bind(this)} placeholder={"Add new property"} /> : null*/}
      </div>
    );
  }
}

export default connect(style)(RenderProperty);