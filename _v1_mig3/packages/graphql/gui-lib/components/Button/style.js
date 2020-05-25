import { ONE_PRIMARY, ONE_WHITE } from "../../constants/colors";

export const style = {
  wrapper: (props) => {
    const st = {
      color: ONE_WHITE,
      backgroundColor: ONE_PRIMARY,
      fontWeight: 300,
      border: `2px solid ${ONE_PRIMARY}`,
      display: "inline-block",
      boxSizing: "border-box",
      padding: 11,
      cursor: "pointer",
      outline: "none",
      fontSize: 12,
      marginRight: 5,
      marginBottom: 5,
      padding: 7,
      height: 31,
      overflow: "hidden"
    };

    /* if (props.active === true) {
      st.fontWeight = 600;
      st.borderBottom = `2px solid ${ONE_PRIMARY}`;
    }*/

    return st
  }
};