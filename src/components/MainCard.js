import React from 'react';

class MainCard extends React.Component{

  render() {
    const { sessiontoken } = this.props;
    return (
        <div>
        { sessiontoken ? ( <div><p>Hello</p></div> ) : (<a href="/oauth/cognito/authorize">Please login to main app</a>)}
        </div>
    );
  }

}

export default MainCard;
