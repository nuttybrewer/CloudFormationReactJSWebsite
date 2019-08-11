import React, { Component } from 'react';
import Github from 'github-api';
import Octokit from '@octokit/rest';
import { Navbar, Nav } from 'react-bootstrap';

import util from 'util';

import FieldExtractionBranchList from './FieldExtractionBranchList'
import FieldExtractionVersionList from './FieldExtractionVersionList'
import FieldExtractionTopConfig from './FieldExtractionTopConfig'
import FieldExtractionForkDialog from './FieldExtractionForkDialog'

class FieldExtractionPanel extends Component {
  constructor(props) {
    super();
    this.onGithubError = this.onGithubError.bind(this);
    this.loadRepo = this.loadRepo.bind(this);
    this.onBranchChange = this.onBranchChange.bind(this);
    this.onLibVersionChange = this.onLibVersionChange.bind(this);
    var client;
    if(props.githubtoken) {
      client = new Octokit({ auth: props.githubtoken});
    }

    this.state = {
      fetchingData: false,
      client: client,
      owner: null,
      fieldExtractionRepo: null,
      repoBranch: null,
      libVersion: null,
      error: null
    };
  }

  componentDidUpdate(prevProps) {
    const { githubtoken } = this.props;
    if (!githubtoken === prevProps.githubtoken) {
      // Send a new client to update
      this.loadRepo(new Github({ token: githubtoken}));
    }
  }

  componentDidMount() {
    this.loadRepo();
  }

  // Functions below handle changes to the github environment.
  onGithubError(error) {
    if(error) {
      console.log("Children objects detected error: " + util.inspect(error, {
        showHidden: false,
        depth: null
      }));
      this.setState({fieldExtractionRepo: null, profile: null, fetchingData: false, error: error.message });
    }
  }

  onBranchChange(branchName) {
    console.log("OnBranchChange: " + branchName)
    this.setState({repoBranch: branchName});
  }

  onLibVersionChange(libVersion) {
    this.setState({libVersion: libVersion})
  }

  loadRepo(newClient) {
    const { client } = this.state;
    var ghClient = client;
    if(newClient) {
      ghClient = newClient;
    }

    if(ghClient) {
      this.setState({fetchingData: true});
      return ghClient.users.getAuthenticated()
      .then((user) =>{
        return ghClient.repos.get({owner: user.data.login, repo: 'fieldextraction-rules'})
        .then((repo) => {
          // Check that this is a fork
          const contents = repo.data;
          if (contents) {
            if(contents.fork && contents.parent && contents.parent.owner.login === 'SecureOps') {
              return this.setState({fieldExtractionRepo: contents.name, owner: contents.owner.login, fetchingData: false, error:null});
            }
            else {
              return this.onGithubError(new Error("User already has a repository called fieldextraction-rules that isn't a fork of the main project"));
            }
          }
          return this.setState({client: ghClient, owner: user.data.login, fetchingData: false, error: null});
        })
        .catch((error) => {
          console.log("Not found error: " + util.inspect(error));
            if (error.status === 404 && error.name ==='HttpError') {
              return this.setState({client: ghClient, owner: user.data.login, fetchingData: false});
            }
          this.onGithubError(error);
        });
      })
      .catch((error) => {
        this.onGithubError(error);
      });
    }
    this.onGithubError(new Error("Github client not initialized"));
  }

  //

  render() {
    const { client, fieldExtractionRepo, owner, fetchingData, repoBranch, libVersion, error } = this.state;
    if (!fetchingData) {
      return (
        <div className="gitHubContainer">
        {
          owner ? (
            fieldExtractionRepo ?
            (
              <div>
                <div>
                <Navbar className="bg-light justify-content-between">
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                  <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="ml-auto">
                      <FieldExtractionBranchList client={client} reponame={fieldExtractionRepo} repoBranch={repoBranch} owner={owner} onBranchChange={this.onBranchChange} onGithubError={this.onGithubError} />
                      <FieldExtractionVersionList client={client} reponame={fieldExtractionRepo} owner={owner} branch={repoBranch} libVersion={libVersion} onLibVersionChange={this.onLibVersionChange} onGithubError={this.onGithubError} />
                    </Nav>
                  </Navbar.Collapse>
                </Navbar>
                </div>
                <div>
                  <FieldExtractionTopConfig client={client} reponame={fieldExtractionRepo} owner={owner} branch={repoBranch} libVersion={libVersion} onGithubError={this.onGithubError} />
                </div>
              </div>
            ) :
            (
              <FieldExtractionForkDialog client={client} onGithubError={this.onGithubError} onSuccess={this.update}/>
            )
          ) :
          (
            error ?
            (
              <div>
                <p><b>{error}</b></p>
                <a href="/oauth/github/authorize"> Please fix it and log back into github</a>
              </div>
            ):(
              <a href="/oauth/github/authorize"> Please log into github</a>
            )
          )
        }
        </div>
      );
    }
    else {
      return ( <div><i>Loading...</i></div> );
    }
  }
}
export default FieldExtractionPanel;
