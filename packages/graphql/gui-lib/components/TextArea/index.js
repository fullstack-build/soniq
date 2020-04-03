import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class TextArea extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>
        <textarea type="text" className={ styles.input }/>
      </div>
    );
  }
}

export default connect(style)(TextArea);