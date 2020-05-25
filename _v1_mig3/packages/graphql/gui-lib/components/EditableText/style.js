import { ONE_WHITE, ONE_TEXT_GRAY, ONE_GRAY, ONE_FOCUS } from "../../constants/colors";

export const style = {
  wrapper: {
    color: "#ff0000",
    display: "inline-block",
    overflow: "hidden",
    height: 31,
    marginBottom: 5
  },
  input: (props) => {
    return {
      outline: "none",
      border: `1px solid ${ONE_GRAY}`,
      padding: 8,
      fontSize: 12,
      backgroundColor: ONE_WHITE,
      color: ONE_TEXT_GRAY,
      width: props.width || 300,
      height: 13,
      onFocus: {
        border: `1px solid ${ONE_FOCUS}`,
      }
    }
  },
  text: {
    position: "relative",
    color: '#333333',
    fontWeight: 300,
    border: `2px solid transparent`,
    display: "inline-block",
    boxSizing: "border-box",
    cursor: "pointer",
    outline: "none",
    fontSize: 12,
    overflow: "hidden",
    paddingTop: 7,
    paddingBottom: 6,
    fontWeight: 400,
    marginRight: 5,
    marginBottom: 5
  }
};