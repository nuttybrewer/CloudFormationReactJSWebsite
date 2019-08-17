import React from 'react'
import { Form, Col, InputGroup} from 'react-bootstrap';
import Editor from '@monaco-editor/react';
// import util from 'util'

class FieldExtractionExtractorConfigForm extends React.Component {
  constructor(props) {
    super(props);
    this.loadConfig = this.loadConfig.bind(this);
    this.receiveConfig = this.receiveConfig.bind(this);
    this.state = {
      config: null
    }
  }
  componentDidMount() {
    this.loadConfig();
  }
  componentDidUpdate(prevProps) {
    console.log("ConfigForm Update");
    const newConfigFile = this.props.section.children.configFile;
    const oldConfigFile = prevProps.section.children.configFile;
    if (newConfigFile === oldConfigFile) {
      return;
    }
    this.loadConfig();
  }

  receiveConfig(config) {
    console.log("Received config: " + config);
    this.setState({config: config});
  }

  loadConfig() {
    const { section, loadMorphline } = this.props;
    if (section.children.configFile) {
      const confFile = section.children.configFile.values[0];
      console.log("Requesting to load confFile: " + confFile.virtualvalue);
      loadMorphline(confFile.virtualvalue, this.receiveConfig);
    }
  }

  render() {
    const { section } = this.props;
    const { config } = this.state;

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
            <Col>
              <InputGroup>
                <InputGroup.Prepend>
                <InputGroup.Text id="extractorMorphline" >configFile: </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Config File:" aria-describedby="extractorMorphline" autoComplete="off" value={configFile}/>
              </InputGroup>
            </Col>
        </Form.Row>
    }
    else if (type === 'grok') {
      typeFormGroup =
        <Form.Row>
          <Col>
            <InputGroup>
              <InputGroup.Prepend>
              <InputGroup.Text id="extractorGrokPattern" >Grok Pattern: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Grok Pattern:" aria-describedby="extractorGrokPattern" autoComplete="off" value={grokPattern}/>
            </InputGroup>
          </Col>
        </Form.Row>
    }

    return (
      <>
      <Form autoComplete="off">
        <Form.Row>
          <Col>
            <InputGroup>
              <InputGroup.Prepend>
              <InputGroup.Text id="extractorName" >Name: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Name:" aria-describedby="extractorName" autoComplete="off" value={name}/>
            </InputGroup>
          </Col>
          <Col>
          <InputGroup>
            <InputGroup.Prepend>
            <InputGroup.Text id="extractorType" >Type: </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Type:" aria-describedby="extractorType" autoComplete="off" value={type}/>
          </InputGroup>
          </Col>
          <Col>
          <InputGroup>
            <InputGroup.Prepend>
            <InputGroup.Text id="extractorVersion" >Version: </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Version:" aria-describedby="extractorVersion" autoComplete="off" value={version}/>
          </InputGroup>
          </Col>
        </Form.Row>
        {typeFormGroup}
      </Form>
      { config ? ( <Editor height="100%" value={config}/>) : '<h1>No Config</h1>'}
      </>
    );
  }
}
export default FieldExtractionExtractorConfigForm;
