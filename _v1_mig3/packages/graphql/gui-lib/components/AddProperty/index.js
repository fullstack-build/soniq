import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

const UNUSED_DEFAULT_VALUE = "__UNUSED_DEFAULT_VALUE__";

class AddProperty extends Component {
  constructor(props) {
    super(props);
    this.select = React.createRef();
  }
  handleClick() {
    // debugger;
  }
  handleSelect(evt) {
    if (this.props.onSelect) {
      this.props.onSelect(evt.target.value);
    }
  }
  render() {
    const { styles } = this.props;

    const options = this.props.options || [];

    return (
      <div className={ styles.wrapper } onClick={() => {
        if (options.length < 1) {
          this.props.onSelect(true);
        }
      }}>
        <div className={ styles.box }>
          <div className={ styles.label }>+</div>
          {options.length > 0 ? <select className={ styles.select } value={UNUSED_DEFAULT_VALUE} onChange={ this.handleSelect.bind(this) }>
            <option disabled value={UNUSED_DEFAULT_VALUE}>+</option>
            {options.map((option) => {
              return <option value={option.value} key={option.value}>{option.label}</option>
            })}
          </select> : null}
        </div>
      </div>
    );

    return (
      <div className={ styles.wrapper }>
        <div className={ styles.box }>
          <div className={ styles.label }>+</div>
          <select className={ styles.select } ref={this.select}>
            <option>+</option>
            <option>Remove</option>
            <option>Create</option>
            <option>Edit</option>
          </select>
        </div>
      </div>
    );
  }
}

export default connect(style)(AddProperty);