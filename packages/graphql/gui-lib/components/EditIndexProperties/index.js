import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import EditProperty from "../EditProperty";
import EditPropertyTag from "../EditPropertyTag";
import AddProperty from "../AddProperty";
import EditExpressionParamTag from "../EditExpressionParamTag";
import EditIndexPropertyTag from "../EditIndexPropertyTag";

const PROPERTY_KEYS = ["condition", "isUniqueIndex", "accessMethod"];

class EditIndexProperties extends Component {
  handleChange(selectedOption) {
    const { value, onChange } = this.props;

    if (selectedOption === "condition") {
      const newValue = JSON.parse(JSON.stringify(value));
      newValue[selectedOption] = "";
      onChange(newValue);
    }

    if (selectedOption === "isUniqueIndex") {
      const newValue = JSON.parse(JSON.stringify(value));
      newValue[selectedOption] = true;
      onChange(newValue);
    }

    if (selectedOption === "accessMethod") {
      const newValue = JSON.parse(JSON.stringify(value));
      newValue[selectedOption] = "btree";
      onChange(newValue);
    }
  }
  render() {
    const { styles, value, onChange, appConfig, table, index } = this.props;

    const missingPropertyOptions = PROPERTY_KEYS.filter((key) => {
      return value[key] == null;
    }).map((key) => {
      return {
        value: key,
        label: key
      };
    });

    return (
      <div className={ styles.demo }>
        {/* JSON.stringify(value) */}
        {PROPERTY_KEYS.map((key) => {
          if (value[key] == null) {
            return null;
          }

          return <EditIndexPropertyTag key={key} propertyKey={key} value={value[key]} index={index} appConfig={appConfig} table={table} onChange={(newPropertyValue) => {
            const newValue = JSON.parse(JSON.stringify(value));
            newValue[key] = newPropertyValue;
            onChange(newValue);
          }} onRemove={() => {
            const newValue = JSON.parse(JSON.stringify(value));
            newValue[key] = null;
            delete newValue[key];
            onChange(newValue);
          }} />
        }).filter((val) => { return val != null; })}
        {missingPropertyOptions.length > 0 ? <AddProperty options={missingPropertyOptions} onSelect={ this.handleChange.bind(this) } /> : null}
      </div>
    );
  }
}

export default connect(style)(EditIndexProperties);