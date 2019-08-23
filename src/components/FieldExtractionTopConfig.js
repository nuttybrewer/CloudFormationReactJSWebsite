import React, { Component } from 'react';
import ini from '../utils/ini';
import util from 'util';
import SplitPane from 'react-split-pane';
import './FieldExtractionTopConfig.css';

import FieldExtractionConfigEditor from './FieldExtractionConfigEditor';
import FieldExtractionNavigationTree from './FieldExtractionNavigationTree';
import FieldExtractionExtractorConfigForm from './FieldExtractionExtractorConfigForm';
import FieldExtractionCommitModal from './FieldExtractionCommitModal';
import LoadingSpinner from './LoadingSpinner'
// CSS, this might need to be modified if not using Webpack



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
    this.updateMorphline = this.updateMorphline.bind(this);
    this.commitMorphline = this.commitMorphline.bind(this);
    this.onCloseCommitModal = this.onCloseCommitModal.bind(this);
    this.showCommitModal = this.showCommitModal.bind(this);
    this.state = {
      data: {},
      iniConfig: null,
      fetchingData: false,
      selectedSource: '.',
      selectedSection: null,
      changesPending: false,
      reloadAll: false,
      showCommitModal: false,
      disableCommit: null
    }
  }

  componentDidMount() {
    // const { reponame, owner, branch} = this.props;
    // if (reponame && owner && branch) {
    //   this.getExtractorTopConfig();
    // }
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
      return this.getContents(val.virtualvalue)
      .then(includeContent => {
          resolve({source:val.virtualvalue, include_body: includeContent.decoded});
        });
    });
  }

  getExtractorTopConfig() {
    const { reponame, branch, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      this.getContents('fieldextraction.properties.allextractors.web')
      .then((inicontent) => {
        ini.serialize(inicontent.decoded, {include_callback: this.getIncludes, environment: {basepath: 'versions/1.5'} })
        .then(iniConfig => {
          this.setState({iniConfig: iniConfig, fetchingData: false, reloadAll: false});
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

  loadMorphline(morphline, callback) {
    const { data } = this.state;
    const { onGithubError } = this.props;

    if (data[morphline]) {
      return callback(data[morphline].decoded, morphline, data[morphline].changed);
    }
    this.getContents(morphline)
    .then(( content ) => {
      // Data received from Github is always in not changed form.
      callback(content.decoded, content.path, false);
    }).catch(error => {
      onGithubError(error);
    });
  }

  updateMorphline(newcontents, path) {
    const { data, changesPending } = this.state;
    const { enableCommit } = this.props;
    if(newcontents !== data[path].decoded) {
      data[path].decoded = newcontents;
      data[path].changed = true;

      if (changesPending) {
        return this.setState({data: data});
      }
      enableCommit(this.showCommitModal);
      this.setState({data: data, changesPending: true});
    }
  }

  reload(disableCommit) {
    this.setState({changesPending: false, iniConfig: null, data: {}, fetchingData: false, selectedSource: '.', selectedSection: null, reloadAll: true});
    disableCommit();
  }

  commitMorphline(files, message, callback) {
    const { data, disableCommit } = this.state;
    // Remove the contents from the data to force it to get reloaded
    // since SHA hash will have changed
    console.log("Commiting morphlines: " + files);
    this.commitContents(files, message).then(() => {
      files.forEach((path) =>{
        console.log("Deleting from the cache: " + path)
        delete data[path]
      })
      this.setState({data: data});
      callback();
    })
    .catch((error) => console.log("commitMorphline failed: " + error.message));
    if(disableCommit) {
      disableCommit();
      this.setState({disableCommit: null, showCommitModal: false});
    }
  }

  commitContents(files, message) {
    const { client, reponame, owner, branch } = this.props;
    const { data } = this.state;
    return new Promise((resolve, reject) => {
      return Promise.all(
        files.map((path) => {
          return new Promise((resolveCommit, rejectCommit) => {
            console.log("Running commitContents for " + path);
            if( data[path] && !data[path].changed) {
              console.log("Not updating, data hasn't changed");
              return resolveCommit();
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
                  return resolveCommit(ret);
                }).catch(error => {
                  return rejectCommit(error);
                }); //createOrUpdateFile
              })
              .catch((error) => rejectCommit(error));
            } // If
          })
        }) // Promise.all
      ).then(() => resolve())
      .catch((err) => reject(err)) // Promise
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
          data[path] = { raw: content, decoded: decodedContent, sha: raw.data.sha, changed: false}
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
    this.setState({ selectedSource: selected.source, selectedSection: selected.section });
  }

  onCloseCommitModal() {
    this.setState({showCommitModal: false, disableCommit: false});
  }

  showCommitModal(disableCommit) {
    const { data } = this.state;
    console.log("ShowCommitModal: " + util.inspect(Object.keys(data).filter((itemKey) => {return data[itemKey].changed;})))
    this.setState({
      showCommitModal: true,
      disableCommit: disableCommit
    });
  }

  //
  render() {
    const { fetchingData, iniConfig, selectedSource, selectedSection, showCommitModal, data } = this.state;

    if (!fetchingData && iniConfig) {
      return (
        <>
          <SplitPane defaultSize="20%" split="vertical">
            <div className="extractorNavPanel"><FieldExtractionNavigationTree data={iniConfig} onSelect={this.onNavigatorSelect}/></div>
            { selectedSection ? (
              <SplitPane split="horizontal" defaultSize="75%">
                <div className="FEConfigForm"><FieldExtractionExtractorConfigForm section={iniConfig[selectedSection]} loadMorphline={this.loadMorphline} updateMorphline={this.updateMorphline} commitMorphline={this.commitMorphline}/></div>
                <div className="bottomPane">
                  <FieldExtractionConfigEditor enableCommit={this.props.enableCommit} data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/>
                </div>
              </SplitPane>

            ) : (
              <div ><FieldExtractionConfigEditor data={ini.deserialize(iniConfig, { source: selectedSource})} style={{flex: 1}}/></div>
            )}
          </SplitPane>
          <FieldExtractionCommitModal
            files={Object.keys(data).filter((itemKey) => {
              return data[itemKey].changed;
            })}
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
