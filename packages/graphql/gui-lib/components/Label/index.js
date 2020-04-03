import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Label extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>{this.props.label}</div>
    );
  }
}

export default connect(style)(Label);