import React from 'react';
// import util from 'util';
import './MainCard.css';

import FieldExtractionNavigationTree from './FieldExtractionNavigationTree';

class MainCard extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      data: null
    }
  }
  componentDidMount(){

  }
  render() {
    return (
        <div>
          <FieldExtractionNavigationTree
          />
        </div>
    );
  }

}

export default MainCard;
