import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import util from 'util';
class FieldExtractionCommitModal extends React.Component {

  constructor(props) {
    super(props);
    this.onCommit = this.onCommit.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
    this.onChangedCheckBoxChange = this.onChangedCheckBoxChange.bind(this);
    this.onDeletedCheckBoxChange = this.onDeletedCheckBoxChange.bind(this);
    this.state = {
      changedfiles: [],
      deletedfiles: [],
      message: null
    }
  }

  onCommit(e) {
    const { onSubmit } = this.props;
    const {changedfiles, deletedfiles, message } = this.state;
    onSubmit(changedfiles, deletedfiles, message);
  }

  onChangedCheckBoxChange(e) {
    console.log("onCheckBoxChange: " + util.inspect(e.target.id));
    const { changedfiles } = this.state;
    var newChangedFiles = [];

    if(changedfiles.find((file) => file === e.target.id)) {
      newChangedFiles = changedfiles.filter((file) => file !== e.target.id);
      if (newChangedFiles) {
        return this.setState({changedfiles: newChangedFiles});
      }
      return this.setState({
        changedfiles: []
      })
    }
    changedfiles.push(e.target.id);
    return this.setState({changedfiles: changedfiles});
  }

  onDeletedCheckBoxChange(e) {
    console.log("onDeletedCheckBoxChange: " + util.inspect(e.target.id));
    const { deletedfiles } = this.state;
    var newDeletedFiles = [];

    if(deletedfiles.find((file) => file === e.target.id)) {
      newDeletedFiles = deletedfiles.filter((file) => file !== e.target.id);
      if (newDeletedFiles) {
        return this.setState({deletedfiles: newDeletedFiles});
      }
      return this.setState({
        deletedfiles: []
      })
    }
    deletedfiles.push(e.target.id);
    return this.setState({deletedfiles: deletedfiles});
  }

  onMessageChange(e) {
    return this.setState({message: e.target.value});
  }

  render() {
    const { changedfiles, deletedfiles, onCancel, show } = this.props;
    const changeditems = changedfiles ? changedfiles : [];
    const deleteditems = deletedfiles ? deletedfiles : [];
    const changedCheckBoxes = changeditems.map((file) =>
      <Form.Check
        type="checkbox"
        key={file}
        id={file}
        label={file}
        onChange={this.onChangedCheckBoxChange}
      />
    );
    const deletedCheckBoxes = deleteditems.map((file) =>
      <Form.Check
        type="checkbox"
        key={file}
        id={file}
        label={file}
        onChange={this.onDeletedCheckBoxChange}
      />
    );


    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaGithub/> Confirm commit to Github</Modal.Title>
        </Modal.Header>
          <Modal.Body>
              <Form>
                <fieldset className="fieldSet">
                  <legend className="legend">Changed/Added files</legend>
                  {changedCheckBoxes}
                </fieldset>
                <fieldset className="fieldSet">
                  <legend className="legend">Deleted Files</legend>
                  {deletedCheckBoxes}
                </fieldset>
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
