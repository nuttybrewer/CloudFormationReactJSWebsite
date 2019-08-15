import React, { Component } from 'react';
import Editor from '@monaco-editor/react';

class FieldExtractionConfigEditor extends Component {

  onEditorDidMount(editor, monaco) {
    console.log("editorDidMount", editor);
    editor.focus();
  }
  render() {
    const {  data } = this.props;
      return (
        <div><Editor height="75vh" language="ini" value={data}/></div>
      );
  }
}
export default FieldExtractionConfigEditor
