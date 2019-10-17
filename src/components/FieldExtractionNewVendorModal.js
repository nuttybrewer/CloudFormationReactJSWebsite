import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaFileCode,FaWindowClose } from 'react-icons/fa';
class FieldExtractionNewVendorModal extends React.Component {
  constructor(props) {
    super(props);
    this.updateVendor = this.updateVendor.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.state = { vendor: ""}
  }

  updateVendor(event) {
    this.setState({vendor: event.target.value});
  }

  onCancel() {
    const { onClose } = this.props;
    onClose(null);
  }

  onClose() {
    const { vendor } = this.state;
    const { onClose } = this.props;
    onClose(vendor);
  }

  render(){
    const { show} = this.props;
    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaFileCode/>Enter new vendor name</Modal.Title>
        </Modal.Header>
          <Modal.Body>
              <div>
                <input onChange={ this.updateVendor } />
              </div>
          </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" secondary onClick={this.onCancel}>Cancel <FaWindowClose/></Button>
          <Button variant="dark" onClick={this.onClose}>
            Create <FaFileCode/>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default FieldExtractionNewVendorModal;
