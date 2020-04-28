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
};