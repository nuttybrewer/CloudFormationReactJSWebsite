import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
class FieldExtractionGithubModal extends React.Component {
  render(){
    const { token, onClose, show} = this.props;
    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaGithub/> API Token</Modal.Title>
        </Modal.Header>
          <Modal.Body>
              <div className="modalText">{token}</div>
          </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={onClose}>
            Close <FaGithub/>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default FieldExtractionGithubModal;
