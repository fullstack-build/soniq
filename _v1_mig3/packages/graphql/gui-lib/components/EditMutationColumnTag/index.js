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

class EditMutationColumnTag extends Component {
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
    const { muColumn, mutation } = this.props;
    const sure = confirm(`Do you really want to remove the column ${muColumn.name} from mutation ${mutation.name}?`);
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
  renderPopup() {
    const { styles, value, onChange, table, index, mutationColumn, muColumn, mutation } = this.props;

    const headers = [{key: "Mutation", value: mutation.name}, {key: "Column", value: muColumn.name}];

    return <PropertyPopup backgroundColor="rgb(255, 235, 0)" color="#000000" headers={headers} onFinish={ this.togglePopup.bind(this) } onRemove={ this.onRemove.bind(this) }>
      <div>Required:</div>
      <Select options={[{value: 'TRUE', label: "TRUE"}, {value: 'FALSE', label: "FALSE"}]} value={mutationColumn.isRequired ? "TRUE" : "FALSE"} onChange={(event) => {
        onChange(event.target.value.toUpperCase() === 'TRUE');
      }} />
    </PropertyPopup>
  }
  renderTag() {
    const { styles, muColumn, mutationColumn } = this.props;

    return <div className={ styles.column } style={{paddingRight: mutationColumn.isRequired === true ? 20 : null}}>
      <div className={ styles.label }>{muColumn.name}</div>
      {mutationColumn.isRequired === true ? <div className={ styles.required }>!</div> : null}
    </div>;
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

export default connect(style)(EditMutationColumnTag);