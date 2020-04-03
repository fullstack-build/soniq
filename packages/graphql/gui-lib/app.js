import React, { Component } from "react";
import { connect } from "react-fela";
import ModuleConfig from "./views/ModuleConfig";

const style = {
  foobar: {
    color: "#ff0000"
  },
  main: {
    padding: 30
  }
};

class App extends Component {
  render() {
    const { styles } = this.props;
    return (
      <ModuleConfig></ModuleConfig>
    );
  }
}

export default connect(style)(App);