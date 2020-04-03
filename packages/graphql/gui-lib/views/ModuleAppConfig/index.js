import React, { Component } from "react";
import { connect } from "react-fela";
import { style } from "./style";
import PathList from "../../components/PathList";
import GeneralAppConfig from "../GeneralAppConfig";
import TableAppConfig from "../TableAppConfig";
import ExpressionAppConfig from "../ExpressionAppConfig";

class ModuleAppConfig extends Component {
  constructor() {
    super();

    this.state = {
      currentRoute: "GENERAL", // "GENERAL" || "TABLE" || "EXPRESSION"
      routeEntityId: null
    }
  }
  openTable(tableId) {
    this.setState({
      ...this.state,
      currentRoute: "TABLE",
      routeEntityId: tableId
    });
  }
  openExpression(expressionId) {
    this.setState({
      ...this.state,
      currentRoute: "EXPRESSION",
      routeEntityId: expressionId
    });
  }
  openGeneral() {
    this.setState({
      ...this.state,
      currentRoute: "GENERAL",
      routeEntityId: null
    });
  }
  renderMain() {
    const { appConfig, updateAppConfig } = this.props;

    switch (this.state.currentRoute) {
      case "GENERAL":
        return <GeneralAppConfig appConfig={appConfig} updateAppConfig={updateAppConfig} openTable={this.openTable.bind(this)} openExpression={this.openExpression.bind(this)} openGeneral={this.openGeneral.bind(this)} />
      case "TABLE":
        return <TableAppConfig appConfig={appConfig} updateAppConfig={updateAppConfig} openTable={this.openTable.bind(this)} openExpression={this.openExpression.bind(this)} openGeneral={this.openGeneral.bind(this)} tableId={this.state.routeEntityId} />
      case "EXPRESSION":
        return <ExpressionAppConfig appConfig={appConfig} updateAppConfig={updateAppConfig} openTable={this.openTable.bind(this)} openExpression={this.openExpression.bind(this)} openGeneral={this.openGeneral.bind(this)} expressionId={this.state.routeEntityId} />
      default:
        return <GeneralAppConfig appConfig={appConfig} updateAppConfig={updateAppConfig} openTable={this.openTable.bind(this)} openExpression={this.openExpression.bind(this)} openGeneral={this.openGeneral.bind(this)} />
    }
  }
  render() {
    const { styles } = this.props;
    return (
      <div>
        <PathList onClick={ this.openGeneral.bind(this) } ></PathList>
        <div className={ styles.main }>
          {this.renderMain()}
        </div>
      </div>
    );
  }
}

export default connect(style)(ModuleAppConfig);