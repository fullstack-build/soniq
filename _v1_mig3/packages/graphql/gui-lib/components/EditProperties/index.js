import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Ajv from "ajv";
import ReactSelect from 'react-select';
import EditProperty from "../EditProperty";
import EditPropertyTag from "../EditPropertyTag";
import AddProperty from "../AddProperty";

class EditProperties extends Component {
  componentDidUpdate() {
    this.updateSchemaAndData();
  }
  componentDidMount() {
    this.updateSchemaAndData();
  }
  updateSchemaAndData() {
    const { schema, value, onChange } = this.props;

    const ajv = new Ajv({ removeAdditional: true });

    const validate = ajv.compile(schema);

    const data = JSON.parse(JSON.stringify(value || {}));

    // console.log(data);

    if (validate(data)) {
      if (JSON.stringify(data) !== JSON.stringify(value)){
        // console.log("Change", data);
        onChange(data);
      }
    } else {
      // console.log("Change B", validate.errors);
      //onChange({});
    }
  }
  getError() {
    const { schema, value } = this.props;

    const ajv = new Ajv({ removeAdditional: true });

    const validate = ajv.compile(schema);

    const data = JSON.parse(JSON.stringify(value || {}));

    // console.log(data);

    if (validate(data) !== true) {
      return ajv.errorsText(validate.errors);
    }
    return null;
  }
  getMissingProperties() {
    const { schema, value } = this.props;

    return Object.keys(schema.properties || {}).filter((key) => {
      return value == null || Object.keys(value || {}).indexOf(key) < 0;
    }).map((key) => {
      return {
        value: key,
        label: key
      }
    });
  }
  handleChange(selectedOption) {
    const { schema, value, onChange } = this.props;

    if (schema.properties[selectedOption] != null) {
      const propSchema = schema.properties[selectedOption];

      if (propSchema.default != null) {
        const newValue = JSON.parse(JSON.stringify(value));
        newValue[selectedOption] = propSchema.default;
        onChange(newValue);
      } else if (propSchema.examples != null && propSchema.examples[0] != null) {
        const newValue = JSON.parse(JSON.stringify(value));
        newValue[selectedOption] = propSchema.examples[0];
        onChange(newValue);
      } else if (propSchema.type === "string" && propSchema.enum != null && Array.isArray(propSchema.enum) && propSchema.enum[0] != null) {
        const newValue = JSON.parse(JSON.stringify(value));
        newValue[selectedOption] = propSchema.enum[0];
        onChange(newValue);
      } else if (propSchema.type === "array" && propSchema.title === "ENUM_VALUES") {
        const newValue = JSON.parse(JSON.stringify(value));
        newValue[selectedOption] = [];
        onChange(newValue);
      }else {
        const newValue = JSON.parse(JSON.stringify(value));
        newValue[selectedOption] = null;
        onChange(newValue);
      }
    }
  }
  render() {
    const { styles, value, schema, onChange, appConfig, table, column } = this.props;
    const missingPropertyOptions = this.getMissingProperties();

    const error = this.getError();

    return (
      <div className={ styles.demo }>
        {/* JSON.stringify(value) */}
        {Object.keys(value || {}).sort().map((key) => {
          return <EditPropertyTag key={key} propertyKey={key} value={value[key]} schema={schema.properties[key]} appConfig={appConfig} table={table} column={column} required={schema.required.indexOf(key) >= 0} onChange={(newPropertyValue) => {
            const newValue = JSON.parse(JSON.stringify(value));
            newValue[key] = newPropertyValue;
            onChange(newValue);
          }} onRemove={() => {
            const newValue = JSON.parse(JSON.stringify(value));
            newValue[key] = null;
            delete newValue[key];
            onChange(newValue);
          }} />
        })}
        {/* missingPropertyOptions.length > 0 ? <div style={{marginTop: 10}}><ReactSelect options={missingPropertyOptions} value={null}
        onChange={this.handleChange.bind(this)} placeholder={"Add new property"} /></div> : null*/}
        {missingPropertyOptions.length > 0 ? <AddProperty options={missingPropertyOptions} onSelect={ this.handleChange.bind(this) } /> : null}
        {error != null ? <div style={{color: "red"}}>{error}</div> : null}
      </div>
    );
  }
}

export default connect(style)(EditProperties);