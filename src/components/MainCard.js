import React from 'react';
import util from 'util';
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
    const { data } = this.state;
    console.log(util.inspect(data, {depth:null}));
    return (
        <div>
          <FieldExtractionNavigationTree
          />
        </div>
    );
  }

}

export default MainCard;
