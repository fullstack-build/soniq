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

class EditIndexPropertyTag extends Component {
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
  renderTag() {
    const { styles, value, propertyKey, onChange, appConfig, table, column } = this.props;

    if (propertyKey != null) {
      
      if (propertyKey === "isUniqueIndex") {
        return <PropertyBox label={ propertyKey } value={ value ? "TRUE" : "FALSE" } backgroundColor="#52b7ff" />;
      }
      
      if (propertyKey === "accessMethod") {
        return <PropertyBox label={ propertyKey } value={ value != null ? value : "__PLEASE SELECT__" } backgroundColor="rgb(207, 247, 0)" />;
      }
      
      if (propertyKey === "condition") {
        return <PropertyBox label={ propertyKey } value={ (value != null && value.length > 0) ? value : "--EMPTY--" } backgroundColor="#4711AE" color="#ffffff" />;
      }
    }

    return <PropertyBox label={ propertyKey } value={ JSON.stringify(value) } backgroundColor="#ff0000" />
  }
  renderPopup() {
    const { styles, value, propertyKey, onChange, appConfig, table, index } = this.props;

    const headers = [{key: "Index", value: index.id}, {key: "Property", value: propertyKey}];

    if (propertyKey != null) {
      
      if (propertyKey === "isUniqueIndex") {
        return <PropertyPopup backgroundColor="#52b7ff" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ this.onRemove.bind(this) }>
          <Select options={[{value: 'TRUE', label: "TRUE"}, {value: 'FALSE', label: "FALSE"}]} value={value ? "TRUE" : "FALSE"} onChange={(event) => {
            onChange(event.target.value.toUpperCase() === 'TRUE');
          }} />
        </PropertyPopup>
      }
      
      if (propertyKey === "accessMethod") {
        const enumOptions = ["btree", "hash", "gist", "gin", "spgist", "brin"].map((val) => { return { value: val, label: val } });

        enumOptions.unshift({value: UNUSED_NULL_VALUE, label: "Please select an option...", disabled: true});

        return <PropertyPopup backgroundColor="rgb(207, 247, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ this.onRemove.bind(this) }>
          <Select options={enumOptions} value={value == null ? UNUSED_NULL_VALUE : value} onChange={(event) => {
            onChange(event.target.value);
          }} />
        </PropertyPopup>
      }

      if (propertyKey === "condition") {
        return <PropertyPopup backgroundColor="#4711AE" color="#ffffff" headers={headers} onFinish={ this.togglePopup.bind(this) }  onRemove={ this.onRemove.bind(this) }>
          <Input value={value} onChange={(newValue) => {
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

export default connect(style)(EditIndexPropertyTag);