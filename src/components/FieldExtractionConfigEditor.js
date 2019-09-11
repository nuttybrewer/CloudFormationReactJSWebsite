import React, { Component } from 'react';
import ControlledEditor from '@monaco-editor/react';
import { Selection, Position } from 'monaco-editor';
import util from 'util';

class FieldExtractionConfigEditor extends Component {
  constructor(props) {
    super(props);
    this.onEditorDidMount = this.onEditorDidMount.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
    this.state = {
      editor: null
    }
  }

  componentDidUpdate(prevProps) {
    const { editor } = this.state;
    const { lines } = this.props;
    if (lines) {
      const position = new Position(lines[0],1);
      const selections = lines.map((line) => {
        return new Selection(line, 1, line + 1, 1);
      });
      if(editor) {
        editor.setPosition(position);
        editor.setSelections(selections);
        editor.revealPosition(position);
      }
    }
  }
  onEditorDidMount(_, editor) {
    this.setState({editor: editor});
    // editor.focus();
  }

  onEditorChange (ev, value) {
    const { onChange, path } = this.props;
    if(onChange) {
      onChange(value, path);
    }
  }


  render() {
    const {  data } = this.props;
      return (
        <div><ControlledEditor height="100vh" language="ini" value={data} onChange={this.onEditorChange} editorDidMount={this.onEditorDidMount}/></div>
      );
  }
}
export default FieldExtractionConfigEditor
