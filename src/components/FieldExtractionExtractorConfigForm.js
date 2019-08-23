import React from 'react'
import { Form, InputGroup, Button} from 'react-bootstrap';
import { ControlledEditor } from '@monaco-editor/react';

import FieldExtractionCommitModal from './FieldExtractionCommitModal';
import util from 'util'

class FieldExtractionExtractorConfigForm extends React.Component {
  constructor(props) {
    super(props);
    this.loadConfig = this.loadConfig.bind(this);
    this.loadConfigFirst = this.loadConfigFirst.bind(this);
    this.receiveConfig = this.receiveConfig.bind(this);
    this.receiveConfigFirst = this.receiveConfigFirst.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.onShowCommitModal = this.onShowCommitModal.bind(this);
    this.onSubmitCommitModal = this.onSubmitCommitModal.bind(this);
    this.onCancelCommitModal = this.onCancelCommitModal.bind(this);
    this.state = {
      config: null,
      changed: false,
      path: null,
      loadMorphline: false,
      showCommitModal: false
    }
  }

  componentDidMount() {
    this.loadConfigFirst();
  }

  componentDidUpdate(prevProps) {
    const { path } = this.state;
    const newConfigFile = this.props.section.children.configFile;
    const oldConfigFile = prevProps.section.children.configFile;
    if (path && newConfigFile === oldConfigFile) {
      return;
    }
    this.loadConfig();
  }

  receiveConfig(newconfig, path, changed) {
    this.setState({config: newconfig, path: path, changed: changed, loadMorphline: true});
  }

  receiveConfigFirst(newconfig, path, changed) {
    this.setState({config: newconfig, path: path, changed: changed, loadMorphline: false});
  }


  loadConfig() {
    const { section, loadMorphline } = this.props;
    if (section.children.configFile) {
      const confFile = section.children.configFile.values[0];
      return loadMorphline(confFile.virtualvalue, this.receiveConfig);
    }
  }

  loadConfigFirst() {
    const { section, loadMorphline } = this.props;
    if (section.children.configFile) {
      const confFile = section.children.configFile.values[0];
      return loadMorphline(confFile.virtualvalue, this.receiveConfigFirst);
    }
  }


  handleEditorChange (ev, value) {
    console.log("Handling editor change");
    const { loadMorphline, path } = this.state;
    const { updateMorphline } = this.props;
    // When we toggle the editor, we end up with
    // an automatic change because we're changing the
    // contents of the editor, this is to stop this.
    if ( loadMorphline ) {
      console.log("loadMorphline is set to true, so skip out and reset to false")
      return this.setState({loadMorphline: false})
    }
    this.setState({ changed: true });
    updateMorphline(value, path);
  }

  onShowCommitModal(files, message) {
    this.setState({showCommitModal: true});
  }

  onSubmitCommitModal(files, message) {
    const { commitMorphline } = this.props;
    console.log("Commiting " + util.inspect(files));
    console.log("Message: " + message);
    this.setState({path: null, config: null, changed: false, showCommitModal: false});
    commitMorphline(files, message, this.loadConfig);
  }

  onCancelCommitModal() {
    this.setState({showCommitModal: false});
  }

  render() {
    const { section } = this.props;
    const { config, changed, showCommitModal, path } = this.state;

    // Global Extractor properties
    const name = section.children.name ? section.children.name.values[0].value : null;
    const version = section.children.version ? section.children.version.values[0].value : null;
    const type = section.children.type ? section.children.type.values[0].value : null;

    const configFile= section.children.configFile ? section.children.configFile.values[0].value : null;
    const grokPattern= section.children.grokPattern ? section.children.grokPattern.values[0].value : null;
    // const grokPatternFiles= section.children.grokPatternFiles ? section.children.grokPatternFiles.values[0].value : null;

    var typeFormGroup;
    if (type === 'morphlines') {
      typeFormGroup =
          <Form.Row>
              <InputGroup size="sm">
                <InputGroup.Prepend>
                <InputGroup.Text id="extractorMorphline" >configFile: </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Config File:" aria-describedby="extractorMorphline" autoComplete="off" value={configFile}/>
              </InputGroup>
        </Form.Row>
    }
    else if (type === 'grok') {
      typeFormGroup =
        <Form.Row>
            <InputGroup size="sm">
              <InputGroup.Prepend>
              <InputGroup.Text id="extractorGrokPattern" >Grok Pattern: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Grok Pattern:" aria-describedby="extractorGrokPattern" autoComplete="off" value={grokPattern}/>
            </InputGroup>
        </Form.Row>
    }

    return (
      <>
      <div className="morphlineMenuBarTop">
        <Form inline autoComplete="off" className="morphlineMenuBarForm">
          <InputGroup size="sm" className="morphlineMenuBarName">
              <InputGroup.Prepend>
              <InputGroup.Text id="extractorName" >Name: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Name:" aria-describedby="extractorName" autoComplete="off" value={name}/>
            </InputGroup>
          <InputGroup size="sm">
            <InputGroup.Prepend>
            <InputGroup.Text id="extractorType" >Type: </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Type:" aria-describedby="extractorType" autoComplete="off" value={type}/>
          </InputGroup>
          <InputGroup size="sm">
            <InputGroup.Prepend>
            <InputGroup.Text id="extractorVersion" >Version: </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Version:" aria-describedby="extractorVersion" autoComplete="off" value={version}/>
          </InputGroup>
          <Button size="sm" variant="dark" disabled={!changed} onClick={this.onShowCommitModal}>Commit</Button>
        </Form>
      </div>
      <Form>
        {typeFormGroup}
      </Form>
      { config ? ( <ControlledEditor height="100%" value={config} onChange={this.handleEditorChange} editorDidMount={this.handleEditorDidMount}/>) : ('')}
      <FieldExtractionCommitModal show={showCommitModal} onSubmit={this.onSubmitCommitModal} onCancel={this.onCancelCommitModal} files={[path]}/>
      </>
    );
  }
}
export default FieldExtractionExtractorConfigForm;
