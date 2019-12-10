import React, { Component } from 'react';
import Github from 'github-api';
import Octokit from '@octokit/rest';
import { Navbar, Nav, Modal, Button, Dropdown } from 'react-bootstrap';
import util from 'util';
import { FaGithub } from 'react-icons/fa';
import FieldExtractionBranchList from './FieldExtractionBranchList'
import FieldExtractionVersionList from './FieldExtractionVersionList'
import FieldExtractionTopConfig from './FieldExtractionTopConfig'
import FieldExtractionForkDialog from './FieldExtractionForkDialog'
import FieldExtractionGithubModal from './FieldExtractionGithubModal'
import LoadingSpinner from './LoadingSpinner'
import './FieldExtractionPanel.css';

Octokit.plugin([require('octokit-create-pull-request')]);

class FieldExtractionPanel extends Component {
  constructor(props) {
    super();
    this.onGithubError = this.onGithubError.bind(this);
    this.loadRepo = this.loadRepo.bind(this);
    this.onBranchChange = this.onBranchChange.bind(this);
    this.onLibVersionChange = this.onLibVersionChange.bind(this);
    this.showGithubTokenModal = this.showGithubTokenModal.bind(this);
    this.hideGithubTokenModal = this.hideGithubTokenModal.bind(this);
    this.signout = this.signout.bind(this);
    this.enableCommit = this.enableCommit.bind(this);
    this.disableCommit = this.disableCommit.bind(this);

    var client;
    if(props.githubtoken) {
      client = new Octokit({ auth: props.githubtoken});
    }

    this.state = {
      fetchingData: false,
      client: client,
      owner: null,
      name: null,
      email: null,
      fieldExtractionRepo: null,
      repoBranch: null,
      libVersion: null,
      error: null,
      showtoken: false,
      commitEnabled: false,
      commitCallback: null
    };
  }

  componentDidUpdate(prevProps) {
    const { githubtoken } = this.props;
    if (githubtoken && !githubtoken === prevProps.githubtoken) {
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
    this.setState({repoBranch: branchName});
  }

  onLibVersionChange(libVersion) {
    this.setState({libVersion: libVersion})
  }

  showGithubTokenModal() {
    this.setState({showtoken: true} );
  }

  hideGithubTokenModal() {
    this.setState({showtoken: false} );
  }

  signout() {
    const { logoutGithub } = this.props;
    // Reset everything to the original state in case we get an update.
    this.setState({client: null, owner: null, fieldExtractionRepo: null, repoBranch: null, libVersion: null })
    logoutGithub();
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

  enableCommit(cb) {
    this.setState({ commitEnabled: true, commitCallback: cb });
  }

  disableCommit() {
    this.setState({ commitEnabled: false, commitCallback: null });
  }
  //
  //                          <Dropdown.Item onClick={logoutGithub()}>Log out <FaGithub/></Dropdown.Item>
  //                 {showtoken ? (<FieldExtractionGithubModal token={githubtoken} onClose={this.hideGithubTokenModal} />) : ''}
  render() {
    const { client, fieldExtractionRepo, owner, fetchingData, repoBranch, libVersion, error, showtoken, commitEnabled, commitCallback } = this.state;
    const { githubtoken } = this.props;
    const showCommitAll = false; // Hack to disable CommitAll due to bug.
    if (!fetchingData) {
      if(owner) {
        if (githubtoken && fieldExtractionRepo) {
          return (
            <div>
              <div>
              <Navbar className="bg-light justify-content-between" expand="lg">
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                  { showCommitAll ?
                  <Nav className="mr-auto">
                    <Nav.Item>
                      <Nav.Link disabled={!commitEnabled} onClick={() => commitCallback(this.disableCommit)}>Commit All</Nav.Link>
                    </Nav.Item>
                  </Nav> : ('')}
                  <Nav fill className="ml-auto">
                    <Nav.Item className="barItem">
                      <FieldExtractionBranchList client={client} reponame={fieldExtractionRepo} repoBranch={repoBranch} owner={owner} onBranchChange={this.onBranchChange} onGithubError={this.onGithubError} />
                    </Nav.Item>
                    <Nav.Item className="barItem">
                      <FieldExtractionVersionList client={client} reponame={fieldExtractionRepo} owner={owner} branch={repoBranch} libVersion={libVersion} onLibVersionChange={this.onLibVersionChange} onGithubError={this.onGithubError} />
                    </Nav.Item>
                    <Nav.Item className="barItem">
                      <Dropdown as={Nav.Item} alignRight>
                        <Dropdown.Toggle as={Button} variant="light"><FaGithub/></Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={this.showGithubTokenModal}>Show Github token</Dropdown.Item>
                          <Dropdown.Item onClick={this.signout}>Log out <FaGithub/></Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Nav.Item>
                </Nav>
                </Navbar.Collapse>
              </Navbar>
              </div>
              <div className="FEMainPanel">
                <FieldExtractionTopConfig key="topConfig" client={client} reponame={fieldExtractionRepo} owner={owner} branch={repoBranch} libVersion={libVersion} onGithubError={this.onGithubError} enableCommit={this.enableCommit}/>
              </div>
              <FieldExtractionGithubModal token={githubtoken} onClose={this.hideGithubTokenModal} show={showtoken}/>
            </div>
          )
        }
        else {
          return (
            <FieldExtractionForkDialog client={client} onGithubError={this.onGithubError} onSuccess={this.loadRepo} onCancel={this.signout} show={true}/>
          )
        }
      }
      else {
        return (
        <Modal show={true} >
          <Modal.Header >
            <Modal.Title><FaGithub/> Field Extraction</Modal.Title>
          </Modal.Header>
            <Modal.Body>
              <h3 className="loginPrompt">This App requires a Github account</h3>
                <div className="modalText"> Please log in to Github,
                  we will need to fork a public repository
                  to hold the contents of this application</div>
              {error ? (<h6>{error}</h6>):''}

            </Modal.Body>
          <Modal.Footer>
            <Button variant="dark" href="/">
              Cancel
            </Button>
            <Button variant="dark" href="/oauth/github/authorize">
              Login <FaGithub/>
            </Button>
          </Modal.Footer>
        </Modal>
        )
      }
    }
    else {
      return (
        <LoadingSpinner />
      );
    }
  }
}
export default FieldExtractionPanel;
