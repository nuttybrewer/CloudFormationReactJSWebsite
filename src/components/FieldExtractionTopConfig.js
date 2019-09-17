import React, { Component } from 'react';
import {Tabs, Tab, Button} from 'react-bootstrap';
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

import LoadingSpinner from './LoadingSpinner';

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
    this.submitCommit = this.submitCommit.bind(this);
    this.onCloseCommitModal = this.onCloseCommitModal.bind(this);
    this.showCommitModal = this.showCommitModal.bind(this);
    this.removeSection = this.removeSection.bind(this);
    this.state = {
      data: {},
      iniConfig: null,
      fetchingData: false,
      selectedSource: null,
      selectedData: null,
      selectedSection: null,
      changesPending: false,
      reloadAll: false,
      showCommitModal: false
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

  // Loads files from Github into the data state variable
  getContents(path, type) {
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;
    return new Promise((resolve, reject) => {
      // Check if the ini file is already in the data structure
      if(data[path]) {
        return resolve({decoded: data[path].decoded, raw: data[path].raw, path: path})
      }
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
          data[path] = { raw: content, decoded: decodedContent, sha: raw.data.sha, type: type, changed: false, vcs: 'github'}
          this.setState({data: data});
          return resolve({ decoded: decodedContent, raw: raw.data.content, path: path});
        }).catch(error => {
          return reject(error);
        });
      }
    });
  }

  getIncludes(val)  {
    return new Promise((resolve, reject) => {
      return this.getContents(val.virtualvalue, "ini")
      .then(includeContent => {
          return resolve({source:val.virtualvalue, include_body: includeContent.decoded});
        });
    });
  }


  getExtractorTopConfig() {
    const { reponame, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      this.getContents('fieldextraction.properties.allextractors.web', "ini")
      .then((inicontent) => {
        ini.serialize(inicontent.decoded, {
          include_callback: this.getIncludes,
          environment: {basepath: 'versions/1.5'},
          source: 'fieldextraction.properties.allextractors.web' })
        .then(iniConfig => {
          this.setState({
            iniConfig: iniConfig,
            fetchingData: false,
            reloadAll: false,
            selectedSection: null,
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
    return axios.post('/api/hcon', postMorphline);
  }

  submitCommit(changedfiles = null, deletedfiles = null, message = null) {
    this.setState({showCommitModal: false});
    const { data } = this.state;
    return new Promise((resolve, reject) => {
      this.commitContents(changedfiles, message)
        .then(() => {
          this.deleteContents(deletedfiles, message)
          .then(() => {
            Object.keys(data).forEach((itemKey) => {
              if(data[itemKey].deleted) {
                delete data[itemKey]
              }
            })
            this.setState({
              data: Object.assign({}, data)
            })
            resolve()
          })
          .catch((e) => {console.log("deleteContents failed: " + e.message); reject(e)})
        })
        .catch((error) => {
          console.log("commitContents failed: " + error.message);
          reject(error);
        });
    });
  }

  deleteContents(files, message) {
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;

    if (! files || files.length === 0) {
      return new Promise((resolve) => resolve());
    }
    return new Promise((resolve, reject) => {
      const path = files.pop();
      client.repos.getContents({
        owner:owner,
        repo: reponame,
        path: path
      }).then((file) => {
          client.repos.deleteFile({
            owner: owner,
            repo: reponame,
            path: path,
            branch: branch,
            sha: data[path].sha,
            message: message,
            committer: { name: 'BobSquarePants', email: 'scooby@do.tv'}
          }).then(() => {
            if(files.length > 0) {
              this.deleteContents(files, message);
            }
            resolve();
          })
      })
    });
  }

  commitContents(files, message) {
    this.setState({showCommitModal: false});
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;

    const filesToCommit = [];
    if (! files || files.length === 0) {
      return new Promise((resolve) => resolve());
    }
    return new Promise((resolve, reject) => {
      client.git.getRef({
        owner:owner,
        repo: reponame,
        ref: `heads/${branch}`}
      ).then((ref) => {
          return Promise.all(
            files.map((path) => {
              return client.git.createBlob({
                owner: owner,
                repo: reponame,
                content: data[path].decoded
              })
              .then((blob) => {
                filesToCommit.push({
                  sha: blob.data.sha,
                  path: path,
                  mode: '100644',
                  type: 'blob'
                });
              })
            })
          ).then( () =>
            client.git.createTree({
              owner:owner,
              repo:reponame,
              tree: filesToCommit,
              base_tree: ref.data.object.sha
            }).then((tree) =>
              client.git.createCommit({
                owner: owner,
                repo:reponame,
                message: message,
                tree: tree.data.sha,
                parents: [ref.data.object.sha]
              }).then((commit) =>
                client.git.updateRef({
                  owner: owner,
                  repo: reponame,
                  ref: `heads/${branch}`,
                  sha: commit.data.sha
                }).then(() => {
                  files.forEach((item) => {
                    data[item].changed = false
                  })
                  this.setState({data: data});
                  resolve();
                })
              )
            )
          )
      })
      .catch((error) => {
        console.log(`Commit failed ${error.message}`);
        reject(error)
      })
    })
  }

  onEditorChange(newData, e) {
    console.log("Editor save new data: " + util.inspect(newData));
  }

  onNavigatorSelect(selected) {
    const { iniConfig, data } = this.state;
    if (selected.section) {
      const section = iniConfig[selected.section];
      if(section && section.children) {
        if (section.children.type.values[0].value === "morphlines") {
          const confPath = section.children.configFile.values[0].virtualvalue;
          if (data[confPath]) {
            return this.setState(() => ({
              selectedSource: selected.source,
              selectedData: confPath,
              selectedSection: selected.section,
            }))
          }
          else {
            // Load up the
            return this.loadMorphline(confPath)
              .then((res) => {
                this.setState(() => ({
                  selectedSource: selected.source,
                  selectedData: confPath,
                  selectedSection: selected.section,
                }))
              });
          }
        }
      }
    }
    this.setState(() => ({
      selectedSource: selected.source,
      selectedSection: selected.section,
      selectedData: null
    }));
  }

  onCloseCommitModal() {
    this.setState({
      showCommitModal: false,
      disableCommit: false,
    });
  }

  showCommitModal(path) {
    this.setState({
      showCommitModal: true
    });
  }

  onRemoveClicked() {
    const { selectedSection } = this.state;
    if(selectedSection && selectedSection !== ".") {
      this.removeSection();
    }
    else {
      this.removeSource();
    }
  }

  removeSource() {
    const { iniConfig, selectedSection, selectedSource, data } = this.state;
    if (selectedSection) {
      return;
    }
    ini.removeInclude(iniConfig, selectedSource).then((obj) => {
      data[selectedSource].decoded = null;
      data[selectedSource].raw = null;
      data[selectedSource].changed = false;
      data[selectedSource].deleted = true;

      // Re-render top level config
      data['fieldextraction.properties.allextractors.web'].decoded = ini.deserialize(iniConfig, {source: 'fieldextraction.properties.allextractors.web'}).data;
      data['fieldextraction.properties.allextractors.web'].changed = true;

      this.setState({
          data: Object.assign({}, data),
          iniConfig: Object.assign({}, obj),
          selectedSection: null,
          selectedSource: 'fieldextraction.properties.allextractors.web'
        });
    });

  }

  removeSection() {
    const {iniConfig, selectedSection, selectedSource, data } = this.state;
    if(selectedSection && selectedSection !== ".") {
      const configFile = ini.getSectionConfigFile(iniConfig, selectedSection);
      ini.deleteSection(iniConfig, selectedSection).then((newIniConfig) => {
        if(selectedSource) {
          data[selectedSource].decoded = ini.deserialize(newIniConfig, {source: selectedSource}).data;
          data[selectedSource].changed = true;
          if(configFile) {
            data[configFile].decoded = null;
            data[configFile].deleted = true;
          }
        }
        this.setState({
          iniConfig: Object.assign({}, newIniConfig),
          selectedSource: selectedSource,
          selectedSection: null,
          selectedData: null,
          data: Object.assign({},data)});
      });
    }
  }

  onAddClicked() {
    const { selectedSource } = this.state;
    if(selectedSource === 'fieldextraction.properties.allextractors.web') {
      return this.addVendor();
    }
    return this.addSection();
  }

  addVendor() {
    // Add include to the data structure first
    const { data, iniConfig } = this.state;
    /*eslint no-template-curly-in-string: "off"*/
    const path = "${basepath}/vendor/newvendor.properties"
    ini.addInclude(iniConfig, path, {
      basepath: 'versions/1.5'
    }).then((newInclude) => {
      data[newInclude.virtualvalue] = {};
      data[newInclude.virtualvalue].decoded = '';
      data[newInclude.virtualvalue].changed = true;
      data[newInclude.virtualvalue].type = 'ini';

      // Re-render top level config
      data['fieldextraction.properties.allextractors.web'].decoded =
        ini.deserialize(iniConfig, {
          source: 'fieldextraction.properties.allextractors.web'
        }).data;
      data['fieldextraction.properties.allextractors.web'].changed = true;
      this.setState({
        data: data,
        iniConfig: Object.assign({}, iniConfig),
        selectedSource: newInclude.virtualvalue
      })
    });

  }

  addSection() {
    const {iniConfig, selectedSource, data} = this.state;
    const sectionKey = 'bash_foobar';
    const sectionvals = {
      type: 'grok',
      name: 'patnewsection',
      version: 1,
      grokPattern: '^%{FOO:[^,]},%{BAR:[\\w+]}'
    }
    if(selectedSource) {
      ini.addSection(iniConfig, sectionKey, sectionvals, selectedSource).then((newIniConfig) => {
        data[selectedSource].decoded = ini.deserialize(newIniConfig, {source: selectedSource}).data;
        data[selectedSource].changed = true;
        this.setState({
          iniConfig: Object.assign({}, newIniConfig),
          selectedSource: selectedSource,
          selectedSection: sectionKey,
          data: Object.assign({}, data)
        });
      })
    }
  }

  render() {
    const {
      fetchingData,
      iniConfig,
      selectedSource,
      selectedSection,
      selectedData,
      showCommitModal,
      data
    } = this.state;

    var configDisplay;
    // data={ data[selectedSource].decoded }
    if(data) {
      if (selectedSection && selectedSection !== '.' && data[selectedSource]) {
        // const sourceSelectedLines = ini.deserialize(iniConfig, {section: selectedSection}).ranges[selectedSource];
        const sourceSelectedLines = ini.deserialize(iniConfig, {section: selectedSection, source: selectedSource}).ranges[selectedSource];
        if(iniConfig[selectedSection].children && iniConfig[selectedSection].children.configFile){
          configDisplay =
            <Tabs defaultActiveKey="config" id="uncontrolled-tab-example">
              <Tab eventKey="config" title="Config" className="configEditorTab">
                <div className="FEConfigForm">
                  <FieldExtractionExtractorConfigForm
                    section={iniConfig[selectedSection]}
                    config={ data[selectedData]? data[selectedData].decoded : null }
                    changed={ data[selectedData]? data[selectedData].changed : null }
                    path={ selectedData }
                    updateMorphline={ this.updateData }
                    commitMorphline={ this.showCommitModal }/>
                </div>
              </Tab>
              <Tab eventKey="ini" title="Ini">
                <FieldExtractionConfigEditor
                  data={ini.deserialize(iniConfig, {source: selectedSource}).data}
                  onChange={ this.updateData }
                  style={ {flex: 1} }
                  lines={ sourceSelectedLines }
                />
              </Tab>
              <Tab eventKey="test" title="Test" className="configEditorTab">
                <FieldExtractionTestPanel
                  path={ selectedData }
                  testApi={ this.validateMorphline }
                />
              </Tab>
            </Tabs>
        }
        else {
          configDisplay =
            <div className="FEConfigForm">
              <FieldExtractionExtractorConfigForm
                section={iniConfig[selectedSection]}
                config={ data[selectedSource]? data[selectedSource].decoded : null }
                changed={ data[selectedSource]? data[selectedSource].changed : null }
                path={ selectedSource }
                updateMorphline={ this.updateData }
                commitMorphline={ this.showCommitModal }
                lines={ sourceSelectedLines } />
            </div>
        }
      }
      else if(data[selectedSource]){
        configDisplay =
          <div >
            <FieldExtractionConfigEditor
              data={ ini.deserialize(iniConfig, {source: selectedSource}).data }
              path={ selectedSource }
              style={ {flex: 1} }/>
          </div>
      }
    }

    if (!fetchingData && iniConfig) {
      const addEnabled = selectedSource && !selectedSection
      const removeEnabled = selectedSource !== 'fieldextraction.properties.allextractors.web';
      return (
        <>
          <SplitPane defaultSize="20%" split="vertical">
            <div className="extractorNavPanel">
              <Button size="sm" disabled={!addEnabled} onClick={() => this.onAddClicked()}>Add</Button>
              <Button size="sm" disabled={!removeEnabled} onClick={() => this.onRemoveClicked()}>Remove</Button>
              <Button size="sm" variant="dark" onClick={() => this.showCommitModal()}> Commit </Button>
              <FieldExtractionNavigationTree
                data={iniConfig}
                selectedSource={selectedSource || '.'}
                selectedSection={selectedSection}
                onSelect={this.onNavigatorSelect}
              />
            </div>
            {configDisplay}
          </SplitPane>
          <FieldExtractionCommitModal
            changedfiles={Object.keys(data).filter((itemKey) => { return data[itemKey].changed })}
            deletedfiles={Object.keys(data).filter((itemKey) => data[itemKey].deleted)}
            show={showCommitModal}
            onCancel={this.onCloseCommitModal}
            onSubmit= {this.submitCommit}/>
        </>
      );
    }
    return (
            <LoadingSpinner />
   );
  }
}
export default FieldExtractionTopConfig;
