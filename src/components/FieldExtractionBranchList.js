import React, { Component } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
// import util from 'util';

class FieldExtractionBranchList extends Component {
  constructor(props) {
    super(props);
    this.getBranches = this.getBranches.bind(this);
    this.state = {
      branches: [],
      fetchingData: false
    }
  }

  componentDidMount() {
    const { reponame, owner} = this.props;
    if (reponame && owner) {
      this.getBranches();
    }
  }

  componentDidUpdate(prevProps) {
    const { reponame, owner } = this.props;
    if (prevProps.reponame !== reponame && prevProps.owner !== owner) {
      this.getBranches();
    }
  }

  getBranches() {
    const { client, reponame, owner, repoBranch, onBranchChange, onGithubError } = this.props;
    if(reponame) {
      this.setState({fetchingData: true})
      client.repos.listBranches({owner: owner, repo: reponame})
      .then(branches => {
        if(!repoBranch) {
          onBranchChange(branches.data[0].name);
        }
        this.setState({branches: branches.data, fetchingData: false});
      }).catch(error => {
        this.setState({fetchingData: false})
        onGithubError(error);
      });
    }
  }

  selectBranch(e) {
    const branch = this.inputEl.value;
    const { onBranchChange, repoBranch } = this.props;
    if (branch !== repoBranch) {
      onBranchChange(branch);
    }
  }

  render() {
    const { branches, fetchingData } = this.state;
    const { repoBranch } = this.props;
    const branchItems = branches.map((branch) => {
      return <option key={branch.name} value={branch.name} >{branch.name}</option>
    });
    if (!fetchingData) {
      return (
        <Form inline>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text id="libBranch">Branch</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control disabled as="select" onChange={this.selectBranch.bind(this)} ref={ el => this.inputEl=el } defaultValue={repoBranch}>
              {branchItems}
            </Form.Control>
          </InputGroup>
        </Form>
      );
    }
    return ( <i>Loading...</i> );
  }
}
export default FieldExtractionBranchList;
