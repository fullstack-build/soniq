import { ONE_BLACK, ONE_WHITE, ONE_GRAY } from "../../constants/colors";

export const style = {
  wrapper: {
    display: 'inline-block'
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