import { ONE_PRIMARY, ONE_WHITE, ONE_GRAY, ONE_BLACK, ONE_RED } from "../../constants/colors";

export const style = {
  wrapper: {
    position: "relative",
    display: "inline-block",
    marginRight: 5,
    marginBottom: 5,
    height: 31,
    overflow: "hidden"
  },
  box: (props) => {
    const st = {
      position: "relative",
      color: '#333333',
      backgroundColor: props.backgroundColor || '#ffff00',
      fontWeight: 300,
      border: `2px solid ${props.backgroundColor || '#ffff00'}`,
      borderRadius: 8,
      display: "inline-block",
      boxSizing: "border-box",
      cursor: "pointer",
      outline: "none",
      fontSize: 12,
      overflow: "hidden"
    };

    /* if (props.active === true) {
      st.fontWeight = 600;
      st.borderBottom = `2px solid ${ONE_PRIMARY}`;
    }*/

    return st
  },
  label: (props) => {
    return {
      display: 'inline-block',
      paddingTop: 7,
      paddingLeft: 6,
      paddingRight: 6,
      paddingBottom: 6,
      backgroundColor: props.backgroundColor || '#ffff00',
      color: props.color || ONE_BLACK,
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
  }
};