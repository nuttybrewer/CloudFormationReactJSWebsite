import React, { Component } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
// import util from 'util';

class FieldExtractionVersionList extends Component {
  constructor(props) {
    super(props);
    this.getVersions = this.getVersions.bind(this);
    this.findVersion = this.findVersion.bind(this);
    this.state = {
      versions: [],
      fetchingData: false
    }
  }

  componentDidMount() {
    const { reponame, owner, branch} = this.props;
    if (reponame && owner && branch) {
      this.getVersions();
    }
  }

  componentDidUpdate(prevProps) {
    const { reponame, owner, branch } = this.props;
    if (prevProps.reponame !== reponame || prevProps.owner !== owner || prevProps.branch !== branch) {
      this.getVersions();
    }
  }

  getVersions() {
    const { client, reponame, owner, branch, libVersion, onLibVersionChange, onGithubError } = this.props;
    if(reponame && branch) {
      this.setState({fetchingData: true})
      client.repos.getContents({owner: owner, repo: reponame, ref: branch, path: 'versions'})
      .then(versions => {
        // Cover the case on first mount
        if (!libVersion) {
          onLibVersionChange(versions.data[0]);
        }
        this.setState({versions: versions.data, fetchingData: false});
      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  selectVersion(e) {
    const version = this.inputEl.value;
    // Avoid reloading data from the currently selected version
    const { libVersion, onLibVersionChange } = this.props;
    if (libVersion.name !== version) {
      const foundVersion = this.findVersion(version);
      if (foundVersion) {
        onLibVersionChange(version);
      }
    }
  }

  findVersion(version) {
    const { versions } = this.state;
    return versions.find((obj) => {
      return obj.name === version;
    });
  }

  render() {
    const { versions, fetchingData } = this.state;
    const { libVersion } = this.props;
    const versionItems = versions.map((version) => {
      return <option key={version.name} value={version.name} >{version.name}</option>
    });
    if (!fetchingData && libVersion) {
      return (
        <Form inline>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text id="libVersion">Version</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control as="select" onChange={this.selectVersion.bind(this)} ref={ el => this.inputEl=el } defaultValue={libVersion.name}>
              {versionItems}
            </Form.Control>
          </InputGroup>
        </Form>
      );
    }
    return ( <i>Loading...</i> );
  }
}
export default FieldExtractionVersionList;
