import React, { Component } from 'react';

class FieldExtractionForkDialog extends Component {
  constructor(props) {
    super(props)
    this.fork =this.fork.bind(this);
  }

  fork() {
    console.log("Forking...");
    const { client, onGithubError, onSuccess } = this.props;
    return client.repos.createFork({owner: 'SecureOps', repo: 'fieldextraction-rules'})
    .then( (forkedRepo) => {
      console.log("Achieved a fork!");
      onSuccess();
    }).catch( (error) => {
      console.log("Forking didn't work")
      onGithubError(error);
    });
  }

  render() {
    return (
      <div onClick={() => this.fork()}>Fork</div>
    );
  }
}
export default FieldExtractionForkDialog;
