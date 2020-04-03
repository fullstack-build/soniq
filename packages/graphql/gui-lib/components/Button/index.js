import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Button extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper } onClick={ this.props.onClick }>{this.props.label}</div>
    );
  }
}

export default connect(style)(Button);