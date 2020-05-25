import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Section extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>
        <div className={ styles.title }>{this.props.title}</div>
        <div className={ styles.content }>{this.props.children}</div>
      </div>
    );
  }
}

export default connect(style)(Section);