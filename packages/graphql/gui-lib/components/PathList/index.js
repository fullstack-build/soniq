import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import arrow from "../../img/arrow.svg";

class PathList extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper } onClick={ this.props.onClick }>
        <span className={ styles.element }>Schema</span>
        <img src={arrow} className={ styles.arrow } />
        <span className={ styles.element }>Tables</span>
        <img src={arrow} className={ styles.arrow } />
        <span className={ styles.element }>Post</span>
      </div>
    );
  }
}

export default connect(style)(PathList);