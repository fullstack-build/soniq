import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import Select from "../Select";
import Label from "../Label";
import Input from "../Input";
import MultiSelect from "../MultiSelect";
import Button from "../Button";
import PropertyBox from "../PropertyBox";
import PropertyPopup from "../PropertyPopup";

const UNUSED_NULL_VALUE = "__UNUSED_NULL_VALUE__";

class EditExpressionStaticPlaceholderTag extends Component {
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
    const { styles, value, paramKey, placeholder, onChange, appConfig, table, column } = this.props;

    if (placeholder != null) {
      
      if (placeholder.inputType === "FOREIGN_TABLE") {
        const tableLabelById = {};
        const tableOptions = appConfig.tables.map((wTable) => {
          tableLabelById[wTable.id] = `${wTable.schema}.${wTable.name}`;
          return {
            value: wTable.id,
            label: tableLabelById[wTable.id]
          };
        });

        return <PropertyBox label={ "Foreign table" } value={ (value != null && tableLabelById[value] != null) ? tableLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 235, 0)" color="#000000" />;
      }
      if (placeholder.inputType === "FOREIGN_COLUMN") {
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

        return <PropertyBox label={ "Foreign column" } value={ (value != null && columnLabelById[value] != null) ? columnLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(255, 144, 0)" color="#ffffff" />;
      }
      if (placeholder.inputType === "LOCAL_COLUMN") {
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

        return <PropertyBox label={ "Local column" } value={ (value != null && columnLabelById[value] != null) ? columnLabelById[value] : "__PLEASE SELECT__" } backgroundColor="rgb(207, 247, 0)" color="#000000" />;
      }
      if (placeholder.inputType === "STRING") {
        return <PropertyBox label={ paramKey } value={ (value != null && value.length > 0) ? value : "--EMPTY--" } backgroundColor="#4711AE" color="#ffffff" />;
      }
    }

    return <PropertyBox label={ paramKey } value={ JSON.stringify(value) } backgroundColor="#ff0000" />
  }
  renderPopup() {
    const { styles, value, paramKey, onChange, appConfig, table, expression, placeholder } = this.props;

    const headers = [{key: "Static placeholder", value: placeholder.key}];

    if (placeholder != null) {
      if (placeholder.inputType === "FOREIGN_TABLE") {
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

        return <PropertyPopup backgroundColor="rgb(255, 235, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) }>
          <Select options={tableOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (placeholder.inputType === "FOREIGN_COLUMN") {
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

        return <PropertyPopup backgroundColor="rgb(255, 144, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) }>
          <Select options={columnOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (placeholder.inputType === "LOCAL_COLUMN") {
        const columnLabelById = {};
        const columnOptions = [{value: UNUSED_NULL_VALUE, label: "Please select a column...", disabled: true}];

        table.columns.forEach((wColumn) => {
          columnLabelById[wColumn.id] = `${table.schema}.${table.name}.${wColumn.name}`;
          columnOptions.push({
            value: wColumn.id,
            label: columnLabelById[wColumn.id]
          });
        });

        return <PropertyPopup backgroundColor="rgb(207, 247, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) }>
          <Select options={columnOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (placeholder.inputType === "STRING") {
        return <PropertyPopup backgroundColor="#4711AE" color="#ffffff" headers={headers} onFinish={ this.togglePopup.bind(this) }>
          <Input value={ value != null ? value : "" } onChange={(newValue) => {
            onChange(newValue);
          }} />
        </PropertyPopup>
      }
    }

    return <PropertyPopup backgroundColor="#ff0000" headers={headers} onFinish={ this.togglePopup.bind(this) }>
      <Input value={JSON.stringify(value)} onChange={(newValue) => {
        onChange(JSON.parse(newValue));
      }} />
    </PropertyPopup>
  }
  render() {
    const { styles, value, propertyKey } = this.props;

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

export default connect(style)(EditExpressionStaticPlaceholderTag);