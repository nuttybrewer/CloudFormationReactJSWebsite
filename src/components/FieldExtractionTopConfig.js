import React, { Component } from 'react';
import ini from '../utils/ini';
import util from 'util';
import SplitPane from 'react-split-pane';

import FieldExtractionConfigEditor from './FieldExtractionConfigEditor';
import FieldExtractionNavigationTree from './FieldExtractionNavigationTree';
import FieldExtractionExtractorConfigForm from './FieldExtractionExtractorConfigForm';
import LoadingSpinner from './LoadingSpinner'
// CSS, this might need to be modified if not using Webpack
import './FieldExtractionTopConfig.css';

class FieldExtractionTopConfig extends Component {
  constructor(props) {
    super(props);
    this.getContents = this.getContents.bind(this);
    this.getExtractorTopConfig = this.getExtractorTopConfig.bind(this);
    this.getIncludes = this.getIncludes.bind(this);
    this.onNavigatorSelect = this.onNavigatorSelect.bind(this);
    this.loadMorphline = this.loadMorphline.bind(this);
    this.state = {
      data: {},
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
    const { reponame, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      this.getContents('fieldextraction.properties.allextractors.web')
      .then((decoded, raw, sha) => {
        ini.serialize(decoded, {include_callback: this.getIncludes, environment: {basepath: 'versions/1.5'} })
        .then(iniConfig => {
          this.setState({iniConfig: iniConfig, fetchingData: false});
        })
        .catch((error) => {
          console.log("Unable to parse: " + decoded);
          this.setState({ iniConfig: null, fetchingData: false});
        });

      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  loadMorphline(morphline, callback) {
    const { onGithubError } = this.props;
    this.getContents(morphline)
    .then((decoded, raw, sha ) => {
      callback(decoded);
    }).catch(error => {
      onGithubError(error);
    });
  }

  getContents(path) {
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;
    return new Promise((resolve, reject) => {
      if(reponame && branch) {
        client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: path})
        .then(raw => {
          var content = null;
          var decodedContent = null;
          if (raw.data.size < 100000 && raw.data.encoding === 'base64'){
            content = raw.data.content;
            decodedContent = new Buffer(raw.data.content, 'base64').toString('ascii');
          }
          else {
            console.log("Not decoding, size too big: " + raw.data.size );
          }
          data[raw.data.path] = { raw: content, decoded: decodedContent, sha: raw.data.sha}
          this.setState({data: data});
          console.log("Retrieved content: " + decodedContent);
          return resolve(decodedContent, raw.data.content, raw.data.path);
        }).catch(error => {
          return reject(error);
        });
      }
    });
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
                <div className="bottomPane">
                  <FieldExtractionConfigEditor data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/>
                </div>
              </SplitPane>

            ) : (
              <div ><FieldExtractionConfigEditor data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/></div>
            )}

          </SplitPane>
      );
    }
    return (
            <LoadingSpinner />
   );
  }
}
export default FieldExtractionTopConfig;
