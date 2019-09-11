import React, { Component } from 'react';
import { Form, InputGroup, Button} from 'react-bootstrap';
import ReactJson from 'react-json-view';
import util from 'util';

import './FieldExtractionTestPanel.css';

import LoadingSpinner from './LoadingSpinner';
import LogSelector from './LogSelector';

class FieldExtractionTestPanel extends Component {

  constructor(props) {
    super(props);
    this.testApi = this.testApi.bind(this);
    this.addLog = this.addLog.bind(this);
    this.addCachedLog = this.addCachedLog.bind(this);
    this.removeLog = this.removeLog.bind(this);
    this.removeCachedLog = this.removeCachedLog.bind(this);
    this.state = {
      results: null,
      logs: {},
      cachedLogs: {},
      disableTest: false
    }
  }

  // On first load get the cache
  componentDidMount(props) {
    this.getCachedLogs();
  }

  testApi() {
    const { logs } = this.state;
    const { path, testApi } = this.props;
    this.setState({disableTest: true})
    return testApi(path, logs)
      .then((res) => {
        this.setState({results: res.data, disableTest: false})
      })
      .catch((error) => {
        if (error.response) {
          return this.setState({results: { message: error.response.data, statusCode: error.response.statusCode || error.statusCode || 503}, disabledTest: false});
        }
        else if (error.request) {
          return this.setState({results: { message: "HTTPS request went wrong", request: error.request, statusCode: 503}, disableTest: false})
        }
        this.setState({results: { message:"Error sending request, no details provided", statusCode: 503 }, disableTest: false})
      });
  }

  getCachedLogs() {
    this.setState({ cachedLogs: JSON.parse(localStorage.getItem("feCachedLogs")) || {}});
  }

  addCachedLog(logkey, logvalue) {
    const { cachedLogs } = this.state;
    cachedLogs[logkey] = logvalue;
    localStorage.setItem("feCachedLogs", JSON.stringify(cachedLogs));
    // this.setState({ cachedLogs: cachedLogs})
    this.getCachedLogs();
  }

  removeCachedLog(logkey) {
    const { cachedLogs } = this.state;
    if (cachedLogs && logkey) {
      delete cachedLogs[logkey];
      if(Object.keys(cachedLogs).length > 0) {
        localStorage.setItem("feCachedLogs", JSON.stringify(cachedLogs));
      }
      else {
        localStorage.removeItem("feCachedLogs");
      }
      // this.setState({ cachedLogs: cachedLogs})
      this.getCachedLogs();
    }
  }

  addLog(logkey, logvalue) {
    const { logs } = this.state;
    if(logkey && logvalue) {
      logs[logkey] = logvalue;
      return this.setState({ logs: logs })
    }
  }

  removeLog(logkey) {
    const { logs } = this.state;
    if (logs && logkey) {
      delete logs[logkey];
      this.setState({ logs: logs});
    }
  }

  render() {
    const { path } = this.props;
    const { results, logs, cachedLogs, disableTest } = this.state;
    var jsonResults;
    
    if(results) {
      if(results.extracted) {
        jsonResults =
          <fieldset className="jsonResults">
            <legend className="resultLabel">Results</legend>
            <ReactJson
              src={results.extracted}
              collapseStringsAfterLength="80"
              displayDataTypes="false"
              collapsed="2"
              className="jsonResults"
            />
          </fieldset>
      }
      else {
        console.log("API Response: ", util.inspect(results));
        jsonResults =
          <fieldset className="jsonResults">
            <legend className="errorLabel">Error</legend>
            <ReactJson
              src={{message: results.message, statusCode: results.statusCode}}
              className="jsonResults"/>
          </fieldset>
      }
    }
    else {
      if(disableTest) {
        jsonResults = <LoadingSpinner />
      }
    }
    return (
      <>
        <Form inline autoComplete="off" className="morphlineMenuBarForm testBar">
          <InputGroup size="sm" className="morphlineMenuBarName">
            <InputGroup.Prepend>
            <InputGroup.Text id="extractorFileName" >File: </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control type="text" readOnly placeholder="Extractor name..." aria-label="File:" aria-describedby="extractorFileName" autoComplete="off" value={path}/>
          </InputGroup>
          <Button onClick={this.testApi} variant="dark" size="sm" disabled={ disableTest }>Test</Button>
        </Form>
        <LogSelector
          logs={logs}
          cachedlogs={cachedLogs}
          addCachedLog={this.addCachedLog}
          removeCachedLog={this.removeCachedLog}
          addLog={this.addLog}
          removeLog={this.removeLog}
          disabled={disableTest}
        />
        {jsonResults}
      </>
    );
  }
}

export default FieldExtractionTestPanel;
