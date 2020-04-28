import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import getFelaRenderer from './getFelaRenderer'
import { Provider } from 'react-fela'

const clientRenderer = getFelaRenderer();


var mountNode = document.getElementById("app");
ReactDOM.render(<Provider renderer={clientRenderer}><App name="Jane" /></Provider>, mountNode);