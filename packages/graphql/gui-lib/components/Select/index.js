import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Select extends Component {
  render() {
    const { styles } = this.props;
    const options = this.props.options || [];

    return (
      <div className={ styles.wrapper }>
        <select className={ styles.input } value={ this.props.value } onChange={ this.props.onChange }>
          {options.map((option) => {
            return <option key={ option.value } value={ option.value } disabled={ option.disabled === true }>{option.label}</option>
          })}
        </select>
      </div>
    );
  }
}

export default connect(style)(Select);