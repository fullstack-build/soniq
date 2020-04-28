import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class Input extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>
        <input type="text" className={ styles.input } value={this.props.value} onChange={ (evt) => {
          this.props.onChange(evt.target.value);
        } } />
      </div>
    );
  }
}

export default connect(style)(Input);