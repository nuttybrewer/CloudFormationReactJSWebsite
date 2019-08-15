import React, { Component } from 'react';
import ini from '../utils/ini';
import util from 'util';
import SplitPane from 'react-split-pane';

import FieldExtractionConfigEditor from './FieldExtractionConfigEditor';
import FieldExtractionNavigationTree from './FieldExtractionNavigationTree';
import FieldExtractionExtractorConfigForm from './FieldExtractionExtractorConfigForm';

import { Spinner } from 'react-bootstrap';
// CSS, this might need to be modified if not using Webpack
import './FieldExtractionTopConfig.css';

class FieldExtractionTopConfig extends Component {
  constructor(props) {
    super(props);
    this.getExtractorTopConfig = this.getExtractorTopConfig.bind(this);
    this.getIncludes = this.getIncludes.bind(this);
    this.onNavigatorSelect = this.onNavigatorSelect.bind(this);
    this.loadMorphline = this.loadMorphline.bind(this);
    this.state = {
      rawData: null,
      decodedData: null,
      iniConfig: null,
      fetchingData: false,
      selectedSource: '.',
      selectedSection: null
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

  getIncludes(val)  {
    const { client, reponame, owner, branch } = this.props;
    return new Promise((resolve, reject) => {
      return client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: val.virtualvalue})
      .then(raw => {
        const decodedData = new Buffer(raw.data.content, 'base64').toString('ascii');
          resolve({source:val.virtualvalue, include_body: decodedData});
        });
    });
  }

  getExtractorTopConfig() {
    const { client, reponame, owner, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: 'fieldextraction.properties.allextractors.web'})
      .then(raw => {
        const decodedData = new Buffer(raw.data.content, 'base64').toString('ascii');
        ini.serialize(decodedData, {include_callback: this.getIncludes, environment: {basepath: 'versions/1.5'} })
        .then(iniConfig => {
          this.setState({rawData: raw.data.content, decodedData: decodedData, iniConfig: iniConfig, fetchingData: false});
        })
        .catch((error) => {
          console.log("Unable to parse: " + decodedData);
          console.log("Error: " + error.message);
          this.setState({rawData: raw.data.content, decodedData: decodedData, iniConfig: null, fetchingData: false});
        });

      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  loadMorphline(morphline, callback) {
    const { client, reponame, owner, branch, onGithubError } = this.props;
    if(reponame && branch) {
      client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: morphline})
      .then(raw => {
        callback(new Buffer(raw.data.content, 'base64').toString('ascii'));
      }).catch(error => {
        onGithubError(error);
      });
    }
  }
  onEditorChange(newData, e) {
    console.log("Editor save new data: " + util.inspect(newData));
  }

  onNavigatorSelect(selected) {
    console.log("Selected Source: " + selected.source);
    console.log("Selected Section: " + selected.section);
    this.setState({ selectedSource: selected.source, selectedSection: selected.section });
  }

  //
  render() {
    const { fetchingData, iniConfig, selectedSource, selectedSection } = this.state;
    if (!fetchingData && iniConfig) {
      return (
          <SplitPane defaultSize="20%" split="vertical">
            <div className="extractorNavPanel"><span><FieldExtractionNavigationTree data={iniConfig} onSelect={this.onNavigatorSelect}/></span></div>
            { selectedSection ? (
              <SplitPane split="horizontal" defaultSize="75%">
                <div className="FEConfigForm"><FieldExtractionExtractorConfigForm section={iniConfig[selectedSection]} loadMorphline={this.loadMorphline}/></div>
                <div><FieldExtractionConfigEditor data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/></div>
              </SplitPane>

            ) : (
              <div><FieldExtractionConfigEditor data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/></div>
            )}

          </SplitPane>
      );
    }
    return ( <Spinner animation="border" role="status" variant="dark">
                <span className="sr-only">Loading...</span>
             </Spinner>
   );
  }
}
export default FieldExtractionTopConfig;
