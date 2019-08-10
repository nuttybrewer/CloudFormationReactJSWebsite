import React, { Component } from 'react';
import Github from 'github-api';

import GhRepoDetails from './GithubRepoDetails';
import GhRepoList from './GithubRepoList';

class GithubPanel extends Component {
  constructor(props) {
    super();
    this.updateRepo = this.updateRepo.bind(this);
    this.onGithubError = this.onGithubError.bind(this);
    var client;
    // On first load we need to ensure proper initiation of the Github environment
    // 1) Check if the user has a "fork" of the secureops/fieldextraction-rules repository
    if(props.githubtoken) {
      client = new Github({ token: props.githubtoken});
    }
    // 2) If not, offer the user the ability to fork
    // 3) Pull updates
    // 3.1) Edit files with conflicts
    // 4) Retrieve list of pattern files available to edit and "resume operation"

    this.state = {
      client: client,
      selectedRepo: null
    };
  }

  componentDidMount() {

  }

  updateRepo(repo) {
    console.log("Selecting " + repo.name)
    this.setState({selectedRepo: repo});
  }

  onGithubError(err) {
    if(err) {
      console.log("Children objects detected error: " + err.message);
      this.setState({ client: null, selectedRepo: null, repos: {} });
    }
  }

  render() {
    const { client, selectedRepo } = this.state;
    return (
      <div className="gitHubContainer">
      {
        client ? (
          <div>
            <GhRepoList ghClient={client} onUpdate={this.updateRepo} onGithubError={this.onGithubError} />
            <GhRepoDetails ghClient={client} repo={selectedRepo} onGithubError={this.onGithubError} />
          </div>
        ) :
        (
          <a href="/oauth/github/authorize"> Please log into github</a>
        )
      }
      </div>
    );
  }
}
export default GithubPanel;
