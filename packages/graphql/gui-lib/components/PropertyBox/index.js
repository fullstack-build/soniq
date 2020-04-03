import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class PropertyBox extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>
        <div className={ styles.box }>
          <div className={ styles.label }>{this.props.label}</div>
          <div className={ styles.value }>{this.props.value}</div>
        </div>
      </div>
    );
  }
}

export default connect(style)(PropertyBox);