import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";

class PropertyEdit extends Component {
  constructor() {
    super();

    this.state = {
      removeOpen: false
    };

    this.removeTimer = null;
  }
  toggleRemove() {
    if (this.removeTimer != null) {
      try {
        clearTimeout(this.removeTimer);
      } catch(e) {}
      this.removeTimer = null;
    }
    if (this.state.removeOpen === false) {
      this.removeTimer = setTimeout(() => {
        this.removeTimer = null;
        this.setState({
          ...this.state,
          // removeOpen: false
        });
      }, 2000);
    }
    this.setState({
      ...this.state,
      removeOpen: !this.state.removeOpen
    });
  }
  onRemove() {
    if (this.removeTimer != null) {
      try {
        clearTimeout(this.removeTimer);
      } catch(e) {}
      this.removeTimer = null;
    }
    this.setState({
      ...this.state,
      removeOpen: false
    });
  }
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper }>
        <div className={ styles.box } onClick={ this.toggleRemove.bind(this) }>{this.props.label}</div>
        <div className={ styles.editBox } style={{ top: this.state.removeOpen ? 35 : 0, display: this.state.removeOpen ? "inline-block" : "none" }} onClick={this.onRemove.bind(this)}>
          <div>{this.children}</div>
          {this.props.onRemove != null ? <div onClick={ this.props.onRemove }>Remove</div> : null}
          <div className={ styles.triangle } style={{ top: this.state.removeOpen ? -13 : 0 }}></div>
        </div>
      </div>
    );
  }
}

export default connect(style)(PropertyEdit);