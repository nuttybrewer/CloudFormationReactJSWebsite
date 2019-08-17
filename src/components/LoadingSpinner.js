import React from 'react'
import { Spinner } from 'react-bootstrap';

import './LoadingSpinner.css';
class LoadingSpinner extends React.Component {
  render() {
    return (
      <div className="loadingSpinner">
        <div className="innerSpinner">
        <Spinner  animation="border" role="status" variant="dark">
          <span className="sr-only">Loading...</span>
        </Spinner>
        </div>
      </div>
    );
  }
}

export default LoadingSpinner
