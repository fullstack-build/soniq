import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Demo extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.demo }>Demo</div>
    );
  }
}

export default connect(style)(Demo);