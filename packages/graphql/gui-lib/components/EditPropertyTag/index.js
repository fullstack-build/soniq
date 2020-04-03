import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import Select from "../../components/Select";
import Label from "../Label";
import Input from "../Input";
import MultiSelect from "../MultiSelect";
import Button from "../Button";
import PropertyBox from "../PropertyBox";
import PropertyPopup from "../PropertyPopup";

const UNUSED_NULL_VALUE = "__UNUSED_NULL_VALUE__";

class EditPropertyTag extends Component {
  constructor(props) {
    super(props);

    this.state = {
      popupOpen: false
    }
  }
  togglePopup() {
    this.setState({
      ...this.state,
      popupOpen: !this.state.popupOpen
    });
  }
  renderTag() {
    const { styles, value, propertyKey, schema, onChange, appConfig, table, column } = this.props;

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

        /* return <Select options={tableOptions} value={{value, label: tableLabelById[value]}} onChange={(event) => {
          onChange(event.value);
        }} />*/

        return <PropertyBox label={ propertyKey } value={ (value != null && tableLabelById[value] != null) ? tableLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 235, 0)" />
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

        /* return <Select options={columnOptions} value={{value, label: columnLabelById[value]}} onChange={(event) => {
          onChange(event.value);
        }} /> */

        return <PropertyBox label={ propertyKey } value={ (value != null && columnLabelById[value] != null) ? columnLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 144, 0)" />
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

        /* return <Select options={columnOptions} value={{value, label: columnLabelById[value]}} onChange={(event) => {
          onChange(event.value);
        }} />*/

        return <PropertyBox label={ propertyKey } value={ (value != null && columnLabelById[value] != null) ? columnLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 144, 0)" />
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

        /* return <Select options={appliedExpressionOptions} value={{value, label: appliedExpressionById[value]}} onChange={(event) => {
          onChange(event.value);
        }} /> */

        return <PropertyBox label={ propertyKey } value={ (value != null && appliedExpressionById[value] != null) ? appliedExpressionById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 40, 148)" />
      }

      if (schema.type === "string" && schema.enum != null && Array.isArray(schema.enum)) {
        /* return <Select options={schema.enum.map((val) => { return { value: val, label: val } })} value={{value, label: value}} onChange={(event) => {
          onChange(event.value);
        }} />*/

        return <PropertyBox label={ propertyKey } value={ value != null ? value : "__PLEASE SELECT__" } backgroundColor="rgb(207, 247, 0)" />
      }

      if (schema.type === "array" && schema.title === "ENUM_VALUES") {
        return <PropertyBox label={ propertyKey } value={ (value != null && value.length > 0) ? value.join(", ") : "[]" } backgroundColor="rgb(0, 185, 69)" />
      }

      if (schema.type === "boolean") {
        return <PropertyBox label={ propertyKey } value={ value ? "TRUE" : "FALSE" } backgroundColor="#52b7ff" />;
      }

      if (schema.type === "string") {
        return <PropertyBox label={ propertyKey } value={ (value != null && value.length > 0) ? value : "--EMPTY--" } backgroundColor="#4711AE" color="#ffffff" />;
      }
    }

    return <PropertyBox label={ propertyKey } value={ JSON.stringify(value) } backgroundColor="#ff0000" />

    return <Input value={JSON.stringify(value)} onChange={(event) => {
      onChange(JSON.parse(event));
    }} />
  }
  renderPopup() {
    const { styles, value, propertyKey, schema, onChange, appConfig, table, column, required, onRemove } = this.props;

    const headers = [{key: "Column", value: column.name}, {key: "Column", value: propertyKey}];

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

        tableOptions.unshift({value: UNUSED_NULL_VALUE, label: "Please select a table...", disabled: true});

        return <PropertyPopup backgroundColor="rgb(255, 235, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={tableOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (schema.type === "string" && schema.title === "FOREIGN_COLUMN") {
        const columnLabelById = {};
        const columnOptions = [{value: UNUSED_NULL_VALUE, label: "Please select a column...", disabled: true}];

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

        return <PropertyPopup backgroundColor="rgb(255, 144, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={columnOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (schema.type === "string" && schema.title === "FOREIGN_COLUMN_MANY_TO_ONE") {
        const columnLabelById = {};
        const columnOptions = [{value: UNUSED_NULL_VALUE, label: "Please select a column...", disabled: true}];

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

        return <PropertyPopup backgroundColor="rgb(255, 144, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={columnOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
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

        appliedExpressionOptions.unshift({value: UNUSED_NULL_VALUE, label: "Please select an applied expression...", disabled: true});

        return <PropertyPopup backgroundColor="rgb(255, 40, 148)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={appliedExpressionOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (schema.type === "string" && schema.enum != null && Array.isArray(schema.enum)) {
        const enumOptions = schema.enum.map((val) => { return { value: val, label: val } });

        enumOptions.unshift({value: UNUSED_NULL_VALUE, label: "Please select an option...", disabled: true});

        return <PropertyPopup backgroundColor="rgb(207, 247, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={enumOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (schema.type === "array" && schema.title === "ENUM_VALUES") {
        return <PropertyPopup backgroundColor="rgb(0, 185, 69)" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <MultiSelect value={value} placeholder="Add a new value" onChange={(newValue) => {
            onChange(newValue);
          }} />
        </PropertyPopup>
      }

      if (schema.type === "boolean") {
        return <PropertyPopup backgroundColor="#52b7ff" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Select options={[{value: 'TRUE', label: "TRUE"}, {value: 'FALSE', label: "FALSE"}]} value={value ? "TRUE" : "FALSE"} onChange={(event) => {
            onChange(event.target.value.toUpperCase() === 'TRUE');
          }} />
        </PropertyPopup>
      }

      if (schema.type === "string") {
        return <PropertyPopup backgroundColor="#4711AE" color="#ffffff" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
          <Input value={value} onChange={(newValue) => {
            onChange(newValue);
          }} />
        </PropertyPopup>
      }
    }

    return <PropertyPopup backgroundColor="#ff0000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ required ? null : this.onRemove.bind(this) }>
      <Input value={JSON.stringify(value)} onChange={(newValue) => {
        onChange(JSON.parse(newValue));
      }} />
    </PropertyPopup>
  }
  onRemove() {
    const sure = confirm("Do you really want to remove this property?");
    if (sure !== true) {
      return;
    }
    this.setState({
      ...this.state,
      popupOpen: false
    });
    setTimeout(() => {
      this.props.onRemove();
    }, 100);
  }
  render() {
    const { styles, value, propertyKey, schema, required, onRemove } = this.props;

    // return this.renderInput(propertyKey);

    return (
      <div className={ styles.wrapper }>
        <div className={ styles.wrapper } onClick={ this.togglePopup.bind(this) }>{this.renderTag(propertyKey)}</div>
        {this.state.popupOpen ? this.renderPopup() : null}
        {/*false ? <Select options={missingPropertyOptions} value={null}
        onChange={this.handleChange.bind(this)} placeholder={"Add new property"} /> : null*/}
      </div>
    );
  }
}

export default connect(style)(EditPropertyTag);