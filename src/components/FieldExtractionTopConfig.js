import React, { Component } from 'react';
import ini from '../utils/ini';
import util from 'util';
import Editor from '@monaco-editor/react';

class FieldExtractionTopConfig extends Component {
  constructor(props) {
    super(props);
    this.getExtractorTopConfig = this.getExtractorTopConfig.bind(this);
    this.state = {
      rawData: null,
      decodedData: null,
      ini: null,
      fetchingData: false
    }
  }

  componentDidMount() {
    const { reponame, owner, branch} = this.props;
    if (reponame && owner && branch) {
      this.getExtractorTopConfig();
    }
  }

  componentDidUpdate(prevProps) {
    const { reponame, owner, branch } = this.props;
    if (prevProps.reponame !== reponame || prevProps.owner !== owner || prevProps.branch !== branch) {
      this.getExtractorTopConfig();
    }
  }

  getExtractorTopConfig() {
    const { client, reponame, owner, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: 'fieldextraction.properties.allextractors.web'})
      .then(raw => {
        const decodedData = new Buffer(raw.data.content, 'base64').toString('ascii');
        const iniConfig = ini.decode(decodedData);
        this.setState({rawData: raw.data.content, decodedData: decodedData, ini: iniConfig, fetchingData: false});
      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  onchange(newData, e) {
    console.log("Editor save new data: " + util.inspect(newData));
  }

  onEditorDidMount(editor, monaco) {
    console.log("editorDidMount", editor);
    editor.focus();
  }

  render() {
    const { decodedData, fetchingData } = this.state;
    if (!fetchingData && decodedData) {
      return (
        <Editor height="80vh" language="ini" value={decodedData}/>
      );
    }
    return ( <i>Loading...</i> );
  }
}
export default FieldExtractionTopConfig;
