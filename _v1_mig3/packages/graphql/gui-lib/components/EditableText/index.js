import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class EditableText extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false
    };

    this.input = React.createRef();
  }
  onEdit(editMode) {
    this.setState({
      ...this.state,
      editMode
    });
    if (editMode === true) {
      setTimeout(() => {
        this.input.current.focus();
      }, 100);
    }
  }
  onKeyDown(evt) {
    if (evt.key === 'Enter') {
      this.onEdit(false);
    }
  }
  render() {
    const { styles } = this.props;

    if (this.state.editMode !== true) {
      return <div onClick={ this.onEdit.bind(this, true) } className={ styles.text }>{this.props.value}</div>
    }

    return (
      <div>
        <div className={ styles.wrapper }>
          <input type="text" className={ styles.input } value={this.props.value} ref={ this.input } onChange={ (evt) => {
            this.props.onChange(evt.target.value);
          } } onBlur={ this.onEdit.bind(this, false) } onKeyDown={ this.onKeyDown.bind(this) } />
        </div>
      </div>
    );
  }
}// onBlur={ this.onEdit.bind(this, false) } 

export default connect(style)(EditableText);