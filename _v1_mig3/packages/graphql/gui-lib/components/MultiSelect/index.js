import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

import TagsInput from "react-tagsinput";
import "react-tagsinput/react-tagsinput.css";

class MultiSelect extends Component {
  render() {
    const { styles } = this.props;

    return (
      <div className={ styles.wrapper }>
        <TagsInput value={this.props.value} onChange={this.props.onChange.bind(this)} onlyUnique={true} inputProps={{placeholder: this.props.placeholder || "Add a schema", style: {width: 120}}} />
      </div>
    );
  }
}

export default connect(style)(MultiSelect);