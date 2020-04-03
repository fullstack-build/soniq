import { ONE_PRIMARY, ONE_BLACK } from "../../constants/colors";

export const style = {
  wrapper: (props) => {
    const st = {
      color: props.color != null ? props.color : ONE_BLACK,
      fontWeight: 300,
      borderBottom: "2px solid transparent",
      display: "inline-block",
      boxSizing: "border-box",
      paddingTop: 4,
      paddingLeft: 12,
      paddingRight: 12,
      cursor: "pointer"
    };

    if (props.active === true) {
      st.fontWeight = 600;
      st.borderBottom = `2px solid ${ONE_PRIMARY}`;
    }

    return st
  }
};