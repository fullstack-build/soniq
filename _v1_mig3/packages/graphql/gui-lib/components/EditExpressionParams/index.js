import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import EditProperty from "../EditProperty";
import EditPropertyTag from "../EditPropertyTag";
import AddProperty from "../AddProperty";
import EditExpressionParamTag from "../EditExpressionParamTag";

class EditExpressionParams extends Component {
  componentDidUpdate() {
    this.updateSchemaAndData();
  }
  componentDidMount() {
    this.updateSchemaAndData();
  }
  updateSchemaAndData() {
    const { expression, onChange } = this.props;

    const value = this.props.value || {};
    let valueChanged = false;

    expression.placeholders.forEach((placeholder) => {
      if (placeholder.type === "INPUT") {
        if (Object.keys(value).indexOf(placeholder.key) < 0) {
          value[placeholder.key] = null;
          valueChanged = true;
        }
      }
    });

    if (valueChanged === true) {
      onChange(value);
    }
  }
  getError() {
    const { schema, value } = this.props;

    const errors = [];

    Object.keys(value).forEach((key) => {
      if (value[key] == null) {
        errors.push(`Please set the '${key}' parameter.`);
      }
    });

    if (errors.length > 0) {
      return errors[0];
    }
    return null;
  }
  getPlaceholder(key) {
    const { expression } = this.props;
    for (let i in expression.placeholders) {
      const placeholder = expression.placeholders[i];
      if (placeholder.key === key) {
        return placeholder;
      }
    }
    return null;
  }
  render() {
    const { styles, value, expression, onChange, appConfig, table, appliedExpression } = this.props;

    const error = this.getError();

    return (
      <div className={ styles.demo }>
        {/* JSON.stringify(value) */}
        {Object.keys(value || {}).sort().map((key) => {
          const placeholder = this.getPlaceholder(key);

          if (placeholder == null) {
            return null;
          }

          return <EditExpressionParamTag key={key} paramKey={key} value={value[key]} appliedExpression={appliedExpression}  expression={expression} placeholder={placeholder} appConfig={appConfig} table={table} onChange={(newPropertyValue) => {
            const newValue = JSON.parse(JSON.stringify(value));
            newValue[key] = newPropertyValue;
            onChange(newValue);
          }} />
        }).filter((val) => { return val != null; })}
        {error != null ? <div style={{color: "red"}}>{error}</div> : null}
      </div>
    );
  }
}

export default connect(style)(EditExpressionParams);