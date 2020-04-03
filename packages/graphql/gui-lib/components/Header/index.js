import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import HeaderButton from "../HeaderButton";

class Header extends Component {
  render() {
    const { styles } = this.props;
    return (
      <div className={ styles.wrapper } onClick={ this.props.onClick }>
        <HeaderButton label="Schema" active={true} />
        <span className={ styles.envConfig } >Environment-Config:</span>
        <HeaderButton label="DEV" active={false} color={"#44B32D"} />
        <HeaderButton label="STAGE" active={false} color={"#FFC800"} />
        <HeaderButton label="PROD" active={false} color={"#FF0000"} />
      </div>
    );
  }
}

export default connect(style)(Header);