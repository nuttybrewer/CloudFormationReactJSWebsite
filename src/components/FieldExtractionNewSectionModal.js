import React from 'react';
import { Modal, Button, InputGroup, Form } from 'react-bootstrap';
import FieldExtractionNewSectionGrokForm from './FieldExtractionNewSectionGrokForm.js';
import { FaBars, FaWindowClose } from 'react-icons/fa';
class FieldExtractionNewSectionModal extends React.Component {
  constructor(props) {
    super(props);
    this.onSectionNameChange = this.onSectionNameChange.bind(this);
    this.changeType = this.changeType.bind(this);
    this.setGrokPattern = this.setGrokPattern.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.state = { vendor: "", section: {} };
  }

  onSectionNameChange(event) {
    const { section } = this.state;
    section.name = event.target.value;
    this.setState({ section: Object.assign({}, section) });
  }

  changeType(event) {
    const { section } = this.state;
    section.type = event.target.value;
    this.setState({ section: Object.assign({}, section) });
  }

  setGrokPattern(pattern) {
    const { section } = this.state;
    if (section.type === 'Grok') {
      console.log(`Setting grok pattern of ${pattern}`)
      section.grokPattern = pattern;
      this.setState({ section: Object.assign({}, section)});
    }
  }

  onCancel() {
    const { onClose } = this.props;
    this.setState({vendor: "", section: {}});
    onClose(null);
  }

  onClose() {
    const { section } = this.state;
    const { onClose } = this.props;
    onClose( section );
    this.setState({vendor: "", section: {}});
  }

  render(){
    const { show} = this.props;
    const { section } = this.state;
    return (
      <Modal show={show} >
        <Modal.Header >
          <Modal.Title><FaBars/> New Section</Modal.Title>
        </Modal.Header>
          <Modal.Body>
            <InputGroup size="sm">
              <InputGroup.Prepend>
                <InputGroup.Text id="extractorName" >Name: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="text"
                placeholder="Extractor name..."
                aria-label="extractorName"
                aria-describedby="extractorName"
                autoComplete="off"
                onChange={ this.onSectionNameChange }
              />
            </InputGroup>
            <InputGroup size="sm">
              <InputGroup.Prepend>
                <InputGroup.Text id="extractorType" >Type: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control as="select"
                aria-label="extractorType"
                aria-describedby="extractorType"
                autoComplete="off"
                selected={section.type}
                onChange={this.changeType}
              >
                <option></option>
                <option>Morphline</option>
                <option>Grok</option>
              </Form.Control>
            </InputGroup>
            <FieldExtractionNewSectionGrokForm
              section={ section }
              setGrokPattern= { this.setGrokPattern }
            />
          </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={this.onCancel}>
            Cancel <FaWindowClose/>
          </Button>
          <Button variant="dark" onClick={this.onClose}>
            Create <FaBars/>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default FieldExtractionNewSectionModal;
