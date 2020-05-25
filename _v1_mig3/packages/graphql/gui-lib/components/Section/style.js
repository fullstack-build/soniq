import { ONE_TEXT_GRAY, ONE_PRIMARY } from "../../constants/colors";

export const style = {
  wrapper: (props) => {
    return {
      color: ONE_TEXT_GRAY,
      fontSize: 12,
      fontWeight: 300,
      marginTop: 16,
      marginBottom: 50,
      borderLeft: `5px solid ${props.color != null ? props.color : ONE_PRIMARY}`,
      paddingLeft: 10
    }
  },
  title: {
    color: ONE_TEXT_GRAY,
    fontSize: 16,
    fontWeight: 300
  }
};