import React from 'react';
import { Card } from 'react-bootstrap';

import './MainCard.css';
class MainCard extends React.Component{

  render() {
    return (
      <Card className="text-center">
        <Card.Header>Welcome</Card.Header>
        <Card.Body>
          <Card.Title>Not Implemented</Card.Title>
          <Card.Text className="mainAppBody">
            This portion of the application is not available yet, please click on another
            menu option above
          </Card.Text>
      </Card.Body>
      <Card.Footer className="text-muted">2 days ago</Card.Footer>
    </Card>

    );
  }

}

export default MainCard;
