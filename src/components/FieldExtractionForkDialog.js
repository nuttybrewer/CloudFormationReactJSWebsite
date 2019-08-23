import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';

class FieldExtractionForkDialog extends Component {
  constructor(props) {
    super(props)
    this.fork =this.fork.bind(this);
  }

  fork() {
    console.log("Forking...");
    const { client, onGithubError, onSuccess } = this.props;
    return client.repos.createFork({owner: 'SecureOps', repo: 'fieldextraction-rules'})
    .then( (forkedRepo) => {
      console.log("Achieved a fork!");
      onSuccess();
    }).catch( (error) => {
      console.log("Forking didn't work")
      onGithubError(error);
    });
  }

  render() {
    const {show, onCancel} = this.props;
    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaGithub/> API Token</Modal.Title>
        </Modal.Header>
          <Modal.Body>
              <div className="modalText">A fork of github.com/secureops/fieldextraction-rules will be created in your personal repository</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="dark" onClick={this.fork}>
              Fork <FaGithub/>
            </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default FieldExtractionForkDialog;
