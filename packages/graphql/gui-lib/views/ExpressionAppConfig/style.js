import { ONE_TABLE_STYLE } from "../../styles";

export const style = {
  foobar: {
    color: "#ff0000"
  },
  main: {
    padding: 30
  },
  table: ONE_TABLE_STYLE,
  type: {
    position: "relative",
    color: '#ffffff',
    backgroundColor: '#34C6CD',
    border: `2px solid ${'#34C6CD'}`,
    borderRadius: 8,
    display: "inline-block",
    boxSizing: "border-box",
    outline: "none",
    fontSize: 12,
    overflow: "hidden",
    paddingTop: 7,
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 6,
    fontWeight: 400,
    height: 31,
    marginRight: 5,
    marginBottom: 5
  },
  name: {
    position: "relative",
    color: '#333333',
    fontWeight: 300,
    border: `2px solid transparent`,
    display: "inline-block",
    boxSizing: "border-box",
    outline: "none",
    fontSize: 12,
    overflow: "hidden",
    paddingTop: 7,
    paddingBottom: 6,
    fontWeight: 400,
    marginRight: 5,
    marginBottom: 5
  },
  expression: {
    position: "relative",
    color: '#ffffff',
    backgroundColor: '#FF2894',
    border: `2px solid ${'#FF2894'}`,
    borderRadius: 8,
    display: "inline-block",
    boxSizing: "border-box",
    cursor: "pointer",
    outline: "none",
    fontSize: 12,
    overflow: "hidden",
    paddingTop: 7,
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 6,
    fontWeight: 400,
    marginRight: 5,
    marginBottom: 5
  },
  column: {
    position: "relative",
    color: '#000000',
    backgroundColor: 'rgb(255, 235, 0)',
    border: `2px solid ${'rgb(255, 235, 0)'}`,
    borderRadius: 8,
    display: "inline-block",
    boxSizing: "border-box",
    cursor: "pointer",
    outline: "none",
    fontSize: 12,
    overflow: "hidden",
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 6,
    paddingTop: 7,
    fontWeight: 400,
    marginRight: 5,
    marginBottom: 5,
    height: 31,
    lineHeight: "16px"
  },
  label: {
    display: "inline-block",
    boxSizing: "border-box",
  },
  required: {
    position:  "absolute",
    display: "inline-block",
    boxSizing: "border-box",
    fontSize: 26,
    fontWeight: 600,
    color: "#ff0000",
    top: 6,
    right: 6
  }
};