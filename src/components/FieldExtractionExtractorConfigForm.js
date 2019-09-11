import React from 'react'
import { Form, InputGroup, Button} from 'react-bootstrap';
import { ControlledEditor } from '@monaco-editor/react';
// import util from 'util'

import FieldExtractionConfigEditor from './FieldExtractionConfigEditor'


class FieldExtractionExtractorConfigForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleEditorDidMount = this.handleEditorDidMount.bind(this);
    this.onShowCommitModal = this.onShowCommitModal.bind(this);
    this.state = {
      config: null,
    }
  }

  handleEditorDidMount(_, editor) {
    // const { selectLines, path } = this.props;
    // console.log("Selecting lines for " + path +": " + util.inspect(selectLines));
    // editor.setSelections(
    //   { startLineNumber: 1, endLineNumber: 2, startColumn: 1, endColumn:1}
    // );
  }

  handleEditorChange (ev, value) {
    const { updateMorphline, path } = this.props;
    updateMorphline(value, path);
  }

  onShowCommitModal(files, message) {
    const { commitMorphline, path } = this.props;
    commitMorphline(path);
  }

  render() {
    const { config, section, changed, lines } = this.props;
    // Global Extractor properties
    const name = section.children.name ? section.children.name.values[0].value : null;
    const version = section.children.version ? section.children.version.values[0].value : null;
    const type = section.children.type ? section.children.type.values[0].value : null;

    const configFile= section.children.configFile ? section.children.configFile.values[0].value : null;
    const grokPattern= section.children.grokPattern ? section.children.grokPattern.values[0].value : null;
    // const grokPatternFiles= section.children.grokPatternFiles ? section.children.grokPatternFiles.values[0].value : null;

    var typeFormGroup;
    var editor;
    if (type === 'morphlines') {
      typeFormGroup =
              (<InputGroup size="sm" className="morphlineMenuBarName">
                <InputGroup.Prepend>
                <InputGroup.Text id="extractorMorphline" >configFile: </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Config File:" aria-describedby="extractorMorphline" autoComplete="off" value={configFile}/>
              </InputGroup>);
      editor =   config ? (
                  <ControlledEditor
                    height="100vh"
                    value={config}
                    onChange={this.handleEditorChange}
                    editorDidMount={this.handleEditorDidMount}
                  />
                ) : ('')
    }
    else if (type === 'grok') {
      typeFormGroup =
            <InputGroup size="sm" className="morphlineMenuBarName">
              <InputGroup.Prepend>
              <InputGroup.Text id="extractorGrokPattern" >Grok Pattern: </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="Grok Pattern:" aria-describedby="extractorGrokPattern" autoComplete="off" value={grokPattern}/>
            </InputGroup>
      editor = config ? (
            <FieldExtractionConfigEditor
              data={ config }
              lines={ lines }
              style={ {flex: 1} }/> ): ''
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
        </Form>

      <Form inline autoComplete="off" className="morphlineMenuBarForm">
        {typeFormGroup}
        <Button size="sm" variant="dark" disabled={!changed} onClick={this.onShowCommitModal}>Commit</Button>
      </Form>
      </div>
      { editor }
      </>
    );
  }
}
export default FieldExtractionExtractorConfigForm;
