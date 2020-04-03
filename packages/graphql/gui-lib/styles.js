import { ONE_GRAY, ONE_BLACK } from "./constants/colors"

export const ONE_TABLE_STYLE = {
    textAlign: 'left',
    color: ONE_BLACK,
    marginTop: 10,
    marginBottom: 30,
    borderSpacing: 0,
    borderCollapse: "collapse",
    minWidth: 800,
    "& td": {
      paddingTop: 10,
      paddingBottom: 2,
      paddingLeft: 10,
      paddingRight: 10,
      borderBottom: `1px solid ${ONE_GRAY}`,
      verticalAlign: "baseline"
    },
    "& th": {
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      paddingRight: 10,
      borderBottom: `1px solid ${ONE_GRAY}`
    },
    "& tr": {
    }
  }