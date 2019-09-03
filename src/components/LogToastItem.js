import React from 'react';
import { Toast } from 'react-bootstrap';
import {FaCheckCircle} from 'react-icons/fa';
//import util from 'util';
class LogToastItem extends React.Component {

  constructor(props) {
    super(props);
    this.state = { hideToast: false }
  }

  clickToast() {
    const { logkey, onClick, disabled} = this.props;
    if(disabled) {
      return;
    }
    onClick(logkey);
  }

  removeToast() {
    const { logkey, onClose, disabled } = this.props
    if(disabled) {
      return;
    }
    this.setState({hideToast: true});
    onClose(logkey);
  }

  render() {
    const { hideToast } = this.state;
    const { logkey, selected, disabled } = this.props;
    return (
    <Toast
      key={'toast' + logkey}
      animation="true"
      show={!hideToast}
      onClose={() => this.removeToast()}
      disabled={disabled}
      style= {
        {
          position: 'relative',
          float: hideToast ? 'right' : 'left',
          margin: '2px',
          top: 0,
          left: 0
        }
      }>

      <Toast.Header>
        <div onClick={() => this.clickToast()}>
          {selected ? <FaCheckCircle style={{color: "green"}}/> : ''} {logkey}
        </div>
      </Toast.Header>
    </Toast>
  )}
}

export default LogToastItem;
