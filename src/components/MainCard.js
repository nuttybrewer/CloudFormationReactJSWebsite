import React from 'react';
import { Card } from 'react-bootstrap';
import axios from 'axios';
import util from 'util';
import './MainCard.css';
class MainCard extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      data: null
    }
  }
  componentDidMount(){
    axios.post('/api/hcon')
    .then(res => {
      this.setState({data: res.data});
    })
  }
  render() {
    const { data } = this.state;
    console.log(util.inspect(data, {depth:null}));
    return (
      <Card className="text-center">
        <Card.Header>Welcome</Card.Header>
        <Card.Body>
          <Card.Title>Not Implemented</Card.Title>
          <Card.Text className="mainAppBody">
            {JSON.stringify(data)}
          </Card.Text>
      </Card.Body>
      <Card.Footer className="text-muted">2 days ago</Card.Footer>
    </Card>
    );
  }

}

export default MainCard;
