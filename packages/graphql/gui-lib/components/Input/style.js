import { ONE_WHITE, ONE_TEXT_GRAY, ONE_GRAY, ONE_FOCUS } from "../../constants/colors";

export const style = {
  wrapper: {
    color: "#ff0000",
    display: "inline-block"
  },
  input: (props) => {
    return {
      outline: "none",
      border: `1px solid ${ONE_GRAY}`,
      padding: 11,
      fontSize: 12,
      backgroundColor: ONE_WHITE,
      color: ONE_TEXT_GRAY,
      width: props.width || 300,
      height: 13,
      onFocus: {
        border: `1px solid ${ONE_FOCUS}`,
      }
    }
  }
};