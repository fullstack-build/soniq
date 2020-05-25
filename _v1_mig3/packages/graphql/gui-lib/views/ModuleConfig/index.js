import React, { Component } from "react";
import { connect } from "react-fela";
import Header from "../../components/Header";
import { style } from "./style";
import ModuleAppConfig from "../ModuleAppConfig";
import { testModuleConfig } from "../../testModuleConfig";

class ModuleConfig extends Component {
  constructor() {
    super();

    let savedModuleConfig = null;

    try {
      const localData = localStorage.getItem("F1-GUI");

      const localJsonData = JSON.parse(localData);

      savedModuleConfig = localJsonData;
    } catch(e) {}

    this.state = {
      moduleConfig: savedModuleConfig != null ? savedModuleConfig : JSON.parse(JSON.stringify(testModuleConfig))
    };
  }
  updateAppConfig(appConfig) {
    const moduleConfig = {
      ...this.state.moduleConfig,
      appConfig
    };
    this.setState({
      moduleConfig
    });
    localStorage.setItem("F1-GUI", JSON.stringify(moduleConfig));
  }
  render() {
    const { styles } = this.props;
    return (
      <div>
        <Header/>
        <ModuleAppConfig appConfig={ this.state.moduleConfig.appConfig } updateAppConfig={this.updateAppConfig.bind(this)} ></ModuleAppConfig>
      </div>
    );
  }
}

export default connect(style)(ModuleConfig);