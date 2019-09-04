import React, { Component } from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import util from 'util';
import SplitPane from 'react-split-pane';
import axios from 'axios';

import ini from '../utils/ini';
import './FieldExtractionTopConfig.css';

import FieldExtractionConfigEditor from './FieldExtractionConfigEditor';
import FieldExtractionNavigationTree from './FieldExtractionNavigationTree';
import FieldExtractionExtractorConfigForm from './FieldExtractionExtractorConfigForm';
import FieldExtractionCommitModal from './FieldExtractionCommitModal';
import FieldExtractionTestPanel from './FieldExtractionTestPanel';

import LoadingSpinner from './LoadingSpinner'



// data: {
//   decoded: <decoded content for getContents() below>
//   path: <path in Github repository>
//   sha: <sha value pulled from Github blob>
//   changed: <true | false></true> if there's been a local change
// }
class FieldExtractionTopConfig extends Component {
  constructor(props) {
    super(props);
    this.getContents = this.getContents.bind(this);
    this.getExtractorTopConfig = this.getExtractorTopConfig.bind(this);
    this.getIncludes = this.getIncludes.bind(this);
    this.onNavigatorSelect = this.onNavigatorSelect.bind(this);
    this.loadMorphline = this.loadMorphline.bind(this);
    this.updateData = this.updateData.bind(this);
    this.validateMorphline = this.validateMorphline.bind(this);
    this.commitMorphline = this.commitMorphline.bind(this);
    this.onCloseCommitModal = this.onCloseCommitModal.bind(this);
    this.showCommitModal = this.showCommitModal.bind(this);
    this.state = {
      data: {},
      iniConfig: null,
      fetchingData: false,
      selectedSource: null,
      selectedData: null,
      selectedSection: null,
      changesPending: false,
      reloadAll: false,
      showCommitModal: false,
      commitFiles: []
    }
  }

  componentDidUpdate(prevProps) {
    const { reloadAll, fetchingData } = this.state;
    const { reponame, owner, branch } = this.props;
    if (
      prevProps.reponame !== reponame
      || prevProps.owner !== owner
      || prevProps.branch !== branch
      || (reloadAll && !fetchingData)) {
      this.getExtractorTopConfig();
    }
  }

  getIncludes(val)  {
    return new Promise((resolve, reject) => {
      return this.getContents(val.virtualvalue, "ini")
      .then(includeContent => {
          resolve({source:val.virtualvalue, include_body: includeContent.decoded});
        });
    });
  }

  getExtractorTopConfig() {
    const { reponame, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      this.getContents('fieldextraction.properties.allextractors.web', "ini")
      .then((inicontent) => {
        ini.serialize(inicontent.decoded, {include_callback: this.getIncludes, environment: {basepath: 'versions/1.5'} })
        .then(iniConfig => {
          this.setState({
            iniConfig: iniConfig,
            fetchingData: false,
            reloadAll: false,
            selectedSection: '.',
            selectedSource: 'fieldextraction.properties.allextractors.web'
          });
        })
        .catch((error) => {
          console.log("Unable to parse: " + inicontent.decoded);
          this.setState({ iniConfig: null, fetchingData: false, reloadAll: false});
        });

      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  loadMorphline(morphline) {
    const { data } = this.state;
    const { onGithubError } = this.props;

    return new Promise((resolve, reject) => {
      if (data[morphline]) {
        return resolve({
          data:data[morphline].decoded,
          path: morphline,
          changed: data[morphline].changed
        });
      }
      this.getContents(morphline, "morphline")
      .then(( content ) => {
        resolve({
          data: content.decoded,
          path: content.path,
          changed: false
        });
      }).catch(error => {
        reject(error);
        onGithubError(error);
      });
    });
  }

  updateData(newcontents, path) {
    const { data, changesPending } = this.state;
    if(newcontents !== data[path].decoded) {
      data[path].decoded = newcontents;
      data[path].changed = true;

      if (changesPending) {
        return this.setState({data: data});
      }
      this.setState({data: data, changesPending: true});
    }
  }

  reload() {
    this.setState({changesPending: false, iniConfig: null, data: {}, fetchingData: false, selectedSource: 'fieldextraction.properties.allextractors.web', selectedSection: '.', reloadAll: true});
  }

  validateMorphline(path, logs) {
    const { data } = this.state;
    if (data[path].type !== "morphline") {
      return new Promise((resolve) => resolve({data: "Validate didn't receive a morphline"}));
    }
    // We need to base64 encode the morphline
    const postMorphline = {
      morphline: Buffer.from(data[path].decoded).toString('base64'),
      logs: logs
    }
    console.log("Axios: Submitting " + JSON.stringify(postMorphline));
    return axios.post('/api/hcon', postMorphline);
  }

  commitMorphline(files, message, callback) {
    // Remove the contents from the data to force it to get reloaded
    // since SHA hash will have changed
    return new Promise((resolve, reject) => {
      console.log("Commiting morphlines: " + files);
      this.commitContents(files, message)
        .then(() => {
          this.setState({showCommitModal: false});
          resolve();
        })
        .catch((error) => {
          console.log("commitMorphline failed: " + error.message);
          reject(error);
        });
    });

  }

  commitContents(files, message) {
    this.setState({showCommitModal: false});
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;
    return new Promise((resolve, reject) => {
      return Promise.all(
        files.map((path) => {
          return new Promise((resolveCommit, rejectCommit) => {
            this.validateMorphline(path)
              .then(res => {
                if( data[path] && !data[path].changed) {
                  return resolveCommit({});
                }
                if(reponame && branch) {
                  client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: path})
                  .then(orig => {
                    client.repos.createOrUpdateFile({
                      owner: owner,
                      repo: reponame,
                      branch: branch,
                      path: path,
                      content: Buffer.from(data[path].decoded).toString('base64'),
                      sha: orig.data.sha,
                      author: { name: "None", email:"example@the.net"},
                      commiter: { name: "None", email: "example@the.net"},
                      message: message
                    })
                    .then(ret => {
                      const type = data.type;
                      console.log("Deleting from the cache: " + path)
                      delete data[path];
                      this.getContents(path, type).then((content) => resolveCommit(content)).catch((error) => rejectCommit(error));
                    }).catch(error => {
                      return rejectCommit(error);
                    }); //createOrUpdateFile
                  })
                  .catch((error) => rejectCommit(error));
                } // If
              }).catch((validateError) => {
                console.log("Morphline validation failed " + util.inspect(validateError));
                rejectCommit(validateError)
              })
          })
        }) // Promise.all
      ).then(() => resolve())
      .catch((err) => reject(err)) // Promise
    });
  }

  getContents(path, type) {
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
          data[path] = { raw: content, decoded: decodedContent, sha: raw.data.sha, type: type, changed: false}
          this.setState({data: data});
          return resolve({ decoded: decodedContent, raw: raw.data.content, path: path});
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
    const { iniConfig, data } = this.state;
    console.log("NavSelect, selected.section: " + selected.section);
    if (selected.section) {
      const section = iniConfig[selected.section];
      if(section && section.children) {
        if (section.children.type.values[0].value === "morphlines") {
          const confPath = section.children.configFile.values[0].virtualvalue;
          if (data[confPath]) {
            return this.setState({
              selectedSource: selected.source,
              selectedData: confPath,
              selectedSection: selected.section
            })
          }
          else {
            // Load up the
            return this.loadMorphline(confPath)
              .then((res) => {
                this.setState({
                  selectedSource: selected.source,
                  selectedData: confPath,
                  selectedSection: selected.section
                })
              });
          }
        }
      }
    }
    else {
      this.setState({
        selectedSource: selected.source,
        selectedSection: selected.section
      });
    }
  }

  onCloseCommitModal() {
    this.setState({showCommitModal: false, disableCommit: false});
  }

  showCommitModal(path) {
    const { data } = this.state;
    this.setState({
      showCommitModal: true,
      commitFiles: ([path] || Object.keys(data).filter((itemKey) => { return data[itemKey].changed }))
    });
  }

  // <SplitPane split="horizontal" defaultSize="75%">
  //   <div className="FEConfigForm"><FieldExtractionExtractorConfigForm section={iniConfig[selectedSection]} config={ data[selectedData]? data[selectedData].decoded : null } changed={data[selectedData]? data[selectedData].changed : null} path={ selectedData } updateMorphline={this.updateMorphline} commitMorphline={this.showCommitModal}/></div>
  //   <div className="bottomPane">
  //     <FieldExtractionConfigEditor enableCommit={this.props.enableCommit} data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/>
  //   </div>
  // </SplitPane>
  // {ini.deserialize(iniConfig, { source: selectedSource})}
  render() {
    const { fetchingData, iniConfig, selectedSource, selectedSection, selectedData, showCommitModal, data, commitFiles } = this.state;



    var configDisplay;
    if(data) {
      if (selectedSection && selectedSection !== '.' && data[selectedSource]) {
        console.log("selectedSource " + selectedSource + ", selectedSection " + selectedSection + " selectedData " + selectedData);
        const sourceSelectedLines = ini.deserialize(iniConfig, {section: selectedSection}).ranges[selectedSource];

        configDisplay =
          <Tabs defaultActiveKey="config" id="uncontrolled-tab-example">
            <Tab eventKey="config" title="Config" className="configEditorTab">
              <div className="FEConfigForm">
                <FieldExtractionExtractorConfigForm
                  section={iniConfig[selectedSection]}
                  config={ data[selectedData]? data[selectedData].decoded : null }
                  changed={data[selectedData]? data[selectedData].changed : null}
                  path={ selectedData }
                  updateMorphline={this.updateData}
                  commitMorphline={this.showCommitModal}/>
              </div>
            </Tab>
            <Tab eventKey="ini" title="Ini">
              <FieldExtractionConfigEditor
                data={data[selectedSource].decoded}
                onChange={this.updateData}
                style={{flex: 1}}
                lines={sourceSelectedLines}
              />
            </Tab>
            <Tab eventKey="test" title="Test" className="configEditorTab">
              <FieldExtractionTestPanel
                path={selectedData}
                testApi={this.validateMorphline}
              />
            </Tab>
          </Tabs>
      }
      else if(data[selectedSource]){
        console.log("selectedSource " + selectedSource + ", selectedSection " + selectedSection );
        configDisplay =
          <div ><FieldExtractionConfigEditor data={data[selectedSource].decoded} path={selectedSource} style={{flex: 1}}/></div>
      }
    }

    if (!fetchingData && iniConfig) {
      return (
        <>
          <SplitPane defaultSize="20%" split="vertical">
            <div className="extractorNavPanel"><FieldExtractionNavigationTree data={iniConfig} onSelect={this.onNavigatorSelect}/></div>
            {configDisplay}
          </SplitPane>
          <FieldExtractionCommitModal
            files={commitFiles}
            show={showCommitModal}
            onCancel={this.onCloseCommitModal}
            onSubmit= {this.commitMorphline}/>
        </>
      );
    }
    return (
            <LoadingSpinner />
   );
  }
}
export default FieldExtractionTopConfig;
