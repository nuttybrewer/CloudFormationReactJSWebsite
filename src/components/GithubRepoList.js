import React, { Component } from 'react';

class GithubRepoList extends Component {
  constructor(props) {
    super();
    this.state = {
      repos: {},
      selectedRepo: null
    };
  }

  componentDidMount() {
    const { ghClient, onGithubError } = this.props;
    if (ghClient) {
      const me = ghClient.getUser();
      me.listRepos().then(ghrepos => {
        ghrepos.data.forEach((repo) => {
          this.setState(oldState => ({
            repos: {
              ...oldState.repos,
              [repo.name]: {name: repo.name, owner: repo.owner.login }
            }
          }));
        });
      }).catch(error => {
        console.log("Error retrieving Github repository " + error.message)
        onGithubError(error);
      });
    }
  }

  selectRepo(repo) {
    const { onUpdate } = this.props;
    const { repos } = this.state;
    this.setState({selectedRepo: repos[repo]});
    onUpdate(repos[repo]);
  }

  render() {
    const { repos, selectedRepo } = this.state;
    const repoItems = Object.keys(repos).map((key) => {
      if (selectedRepo && repos[key].name === selectedRepo.name) {
        return <li key={repos[key].name} onClick={() => this.selectRepo(key)}><b>{repos[key]['owner']}/{repos[key]['name']}</b></li>;
      }
      return <li key={repos[key].name} onClick={() => this.selectRepo(key)}>{repos[key]['owner']}/{repos[key]['name']}</li>;
    });
    return (
      <div className="gitHubContainer">
        <div>
          <ul>
            {repoItems}
          </ul>
        </div>
      </div>
    );
  }
}
export default GithubRepoList;
