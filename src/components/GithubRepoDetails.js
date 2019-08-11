import React, { Component } from 'react';
class GithubPanel extends Component {
  constructor(props) {
    super(props);
    this.getBranches = this.getBranches.bind(this);
    this.state = {
      branches: []
    }
  }

  componentDidMount() {
    const { ghClient, repo, onGithubError} = this.props;
    this.getBranches(ghClient, repo, onGithubError);
  }


  componentDidUpdate(prevProps) {
    const { repo } = this.props;
    const { ghClient, onGithubError} = prevProps;
    if (prevProps.repo !== repo) {
      this.getBranches(ghClient, repo, onGithubError);
    }
  }

  getBranches(ghClient, repo, onGithubError) {
    if (ghClient) {
      if(repo) {
        const r = ghClient.getRepo(repo.owner, repo.name)
        r.listBranches().then(branches => {
          this.setState({branches: branches.data});
        }).catch(error => {
          onGithubError(error);
        });
      }
    }
  }

  render() {
    const { branches } = this.state
    const branchItems = branches.map((branch) =>
      <li key={branch.name}>{branch.name}</li>
    );
    return ( <ul>{branchItems}</ul>);
  }
}
export default GithubPanel;
