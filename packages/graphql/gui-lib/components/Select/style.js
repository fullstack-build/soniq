import { ONE_WHITE, ONE_TEXT_GRAY, ONE_GRAY, ONE_FOCUS } from "../../constants/colors";
import arrowDown from "../../img/arrow_down.svg";

export const style = {
  wrapper: {
    color: "#ff0000",
    display: "inline-block"
  },
  input: {
    outline: "none",
    border: `1px solid ${ONE_GRAY}`,
    borderRadius: 0,
    padding: 11,
    fontSize: 12,
    backgroundColor: ONE_WHITE,
    color: ONE_TEXT_GRAY,
    width: 300,
    height: 13,
    appearance: "none",
    boxSizing: "content-box",
    onFocus: {
      border: `1px solid ${ONE_FOCUS}`,
    },
    background: `url(${arrowDown}) 96% center / 5% no-repeat ${ONE_WHITE}`
  }
};