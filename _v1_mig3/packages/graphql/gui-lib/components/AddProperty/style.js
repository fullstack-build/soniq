import { ONE_PRIMARY, ONE_WHITE, ONE_GRAY, ONE_BLACK, ONE_RED } from "../../constants/colors";

export const style = {
  wrapper: {
    position: "relative",
    display: "inline-block",
    marginRight: 5,
    marginBottom: 5,
    height: 31,
    width: 31,
    overflow: "hidden",
  },
  box: (props) => {
    const st = {
      position: "relative",
      color: '#7b7b7b',
      backgroundColor: props.backgroundColor || '#ececec',
      border: `2px solid ${props.backgroundColor || '#7b7b7b'}`,
      borderRadius: 8,
      display: "inline-block",
      boxSizing: "border-box",
      cursor: "pointer",
      outline: "none",
      fontSize: 21,
      overflow: "hidden",
      fontWeight: 600,
      appearance: "none",
      width: 31,
      height: 31,
      paddingLeft: 7,
      paddingTop: 2,
      lineHeight: "20px"
    };

    /* if (props.active === true) {
      st.fontWeight = 600;
      st.borderBottom = `2px solid ${ONE_PRIMARY}`;
    }*/

    return st
  },
  label: (props) => {
    return {
      fontWeight: 400
    }
  },
  value: {
    display: 'inline-block',
    paddingTop: 7,
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 6,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    // borderLeft: `1px solid ${ONE_GRAY}`,
    color: ONE_BLACK
  },
  select: {
    appearance: 'none',
    fontSize: 14,
    position: "absolute",
    left: -2,
    top: -2,
    height: 31,
    width: 31,
    opacity: 0,
    cursor: "pointer"
  }
};