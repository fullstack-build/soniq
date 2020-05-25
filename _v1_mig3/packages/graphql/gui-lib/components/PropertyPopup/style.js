import { ONE_WHITE } from "../../constants/colors";

const WIDTH = 400;
const HEIGHT = 450;

export const style = {
  wrapper: {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  box: {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: ONE_WHITE,
    zIndex: 101,
    boxShadow: '0 0 10px 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: (props) => {
    return {
      width: WIDTH,
      backgroundColor: props.backgroundColor || '#00B945',
      color: props.color || '#ffffff',
      display: 'flex',
      justifyContent: 'flex-start',
      paddingRight: 30,
      paddingTop: 15,
      paddingBottom: 15,
      boxSizing: 'border-box'
    }
  },
  headerElementTop: {
    fontSize: 11
  },
  headerElementBottom: {
    fontSize: 18
  },
  headerElement: {
    marginLeft: 30
  },
  body: {
    flex: 1,
    overflow: 'scroll',
    paddingRight: 30,
    paddingLeft: 30,
    paddingTop: 15,
    paddingBottom: 15,
  },
  footer: {
    width: WIDTH,
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: 30,
    paddingLeft: 30,
    paddingTop: 15,
    paddingBottom: 15,
    boxSizing: 'border-box'
  }
};