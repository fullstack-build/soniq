import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import Button from "../Button";

class PropertyPopup extends Component {
  render() {
    const { styles, children } = this.props;

    const headers = this.props.headers || []; 
    return (
      <div className={ styles.wrapper }>
        <div className={ styles.box }>
          <div className={ styles.header }>
            {headers.map((header, index) => {
              return (
                <div className={ styles.headerElement } key={index}>
                  <div className={ styles.headerElementTop }>{header.key}</div>
                  <div className={ styles.headerElementBottom }>{header.value}</div>
                </div>
              );
            })}
            {/* <div className={ styles.headerElement }>
              <div className={ styles.headerElementTop }>Column</div>
              <div className={ styles.headerElementBottom }>foobar</div>
            </div>
            <div className={ styles.headerElement }>
              <div className={ styles.headerElementTop }>Property</div>
              <div className={ styles.headerElementBottom }>defaultExpression</div>
            </div>*/}
          </div>
          <div className={ styles.body }>
            {children}
          </div>
          <div className={ styles.footer }>
            <div className={ styles.footerLeft }>
              {this.props.onRemove != null ? <Button label="Remove" onClick={ this.props.onRemove } /> : null}
            </div>
            <div className={ styles.footerRight }>
              <Button label="Finish" onClick={ this.props.onFinish || (() => {}) } />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(style)(PropertyPopup);