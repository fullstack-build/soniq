import { ONE_PRIMARY, ONE_WHITE, ONE_GRAY, ONE_BLACK, ONE_RED } from "../../constants/colors";

export const style = {
  wrapper: {
    position: "relative",
    display: "inline-block",
    margin: 3
  },
  box: (props) => {
    const st = {
      position: "relative",
      color: ONE_BLACK,
      backgroundColor: ONE_WHITE,
      fontWeight: 300,
      border: `1px solid ${ONE_GRAY}`,
      borderRadius: 4,
      display: "inline-block",
      boxSizing: "border-box",
      paddingTop: 7,
      paddingLeft: 6,
      paddingRight: 6,
      paddingBottom: 6,
      cursor: "pointer",
      outline: "none",
      fontSize: 12,
      zIndex: 3
    };

    /* if (props.active === true) {
      st.fontWeight = 600;
      st.borderBottom = `2px solid ${ONE_PRIMARY}`;
    }*/

    return st
  },
  editBox: {
    position: "absolute",
    top: 0,
    width: 400,
    height: 400,
    left: "calc(-200px + 50%)",
    textAlign: "center",
    zIndex: 2,
    color: ONE_BLACK,
    backgroundColor: ONE_WHITE,
    fontWeight: 300,
    border: `1px solid ${ONE_GRAY}`,
    borderRadius: 4,
    display: "block",
    boxSizing: "border-box",
    paddingTop: 7,
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 6,
    cursor: "pointer",
    outline: "none",
    fontSize: 12,
    transition: "ease-in-out 0.1s"
  },
  triangle: {
    position: "absolute",
    top: 28,
    zIndex: 1,
    left: "calc(50% - 6px)",
    width: 0,
    height: 0,
    borderTop: `6px solid transparent`,
    borderLeft: `6px solid transparent`,
    borderRight: `6px solid transparent`,
    borderBottom: `6px solid ${ONE_GRAY}`,
    transition: "ease-in-out 0.1s"
  }
};