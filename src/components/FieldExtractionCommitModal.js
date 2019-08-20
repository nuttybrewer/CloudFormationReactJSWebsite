import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import util from 'util';
class FieldExtractionCommitModal extends React.Component {

  constructor(props) {
    super(props);
    this.onCommit = this.onCommit.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
    this.onCheckBoxChange = this.onCheckBoxChange.bind(this);
    this.state = {
      files: [],
      message: null
    }
  }

  onCommit(e) {
    const { onSubmit } = this.props;
    const {files, message } = this.state;
    onSubmit(files, message);
  }

  onCheckBoxChange(e) {
    console.log("onCheckBoxChange: " + util.inspect(e.target.id));
    const { files } = this.state;
    var newFiles = [];
    console.log("Files: " + util.inspect(files));
    if(files.find((file) => file === e.target.id)) {
      newFiles = files.filter((file) => file !== e.target.id);
      console.log("newFiles: " + util.inspect(newFiles));
      if (newFiles) {
        return this.setState({files: newFiles});
      }
      return this.setState({
        files: []
      })
    }
    files.push(e.target.id);
    return this.setState({files: files});
  }

  onMessageChange(e) {
    return this.setState({message: e.target.value});
  }

  render() {
    const { files, onCancel, show } = this.props;
    const items = files ? files : [];
    const checkBoxes = items.map((file) =>
      <Form.Check
        type="checkbox"
        key={file}
        id={file}
        label={file}
        onChange={this.onCheckBoxChange}
      />
    );


    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaGithub/> Confirm commit to Github</Modal.Title>
        </Modal.Header>
          <Modal.Body>
              <Form>
                {checkBoxes}
                <Form.Group controlId="textArea">
                  <Form.Label>Commit Message</Form.Label>
                  <Form.Control as="textarea" rows="3" onChange={this.onMessageChange}/>
                  </Form.Group>
              </Form>
          </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="dark" onClick={this.onCommit}>
            Commit <FaGithub/>
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
export default FieldExtractionCommitModal;
