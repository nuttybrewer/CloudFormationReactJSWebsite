import React from 'react';
import {Form, Button, Col, Row, Container, InputGroup} from 'react-bootstrap';
// import {Typeahead} from 'react-bootstrap-typeahead';
// import util from 'util';

import './LogSelector.css';

import LogToastItem from './LogToastItem';

class LogSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: {},
      cachedLogs: {},
      currLogValue: null,
      currLogKey: null,
      validated: false
    }
  }

  cacheCurrLog(event) {
    const { currLogKey, currLogValue} = this.state;
    const {addCachedLog} = this.props;
    if(currLogKey && currLogValue) {
      addCachedLog(currLogKey, currLogValue);
      return this.setState({ validated: false })
    }
    return this.setState({validated: true});
  }

  cacheRemoveToast(logkey) {
    const { removeCachedLog } = this.props;
    if (logkey) {
      removeCachedLog(logkey)
    }
  }

  cacheSelectLogToastItem(logkey) {
    const { cachedlogs } = this.props;
    this.setState({currLogKey: logkey, currLogValue: cachedlogs[logkey]})
  }

  addCurrLog() {
    const { currLogKey, currLogValue } = this.state;
    const { addLog } = this.props;
      if(currLogKey && currLogValue) {
        addLog(currLogKey, currLogValue);
        return this.setState({ validated: false })
      }
    return this.setState({validated: true});
  }

  removeToast(logkey) {
    const { removeLog } = this.props;
    if(logkey) {
      removeLog(logkey);
    }
  }

  selectLogToastItem(logkey) {
    const { logs } = this.props;
    this.setState({currLogKey: logkey, currLogValue: logs[logkey]})
  }

  updateCurrLogValue(event) {
    const { currLogKey} = this.state;
    const { updateLogValue } = this.props;
    if( currLogKey) {
      updateLogValue(currLogKey, event.target.value);
    }
    this.setState({ currLogValue: event.target.value});
  }

  updateCurrLogKey(event) {
    this.setState({ currLogKey: event.target.value});
  }


  render() {
    const { currLogKey, currLogValue, validated } = this.state;
    const { logs, cachedlogs, disabled} = this.props;

    const cachedToasts = Object.keys(cachedlogs).map((logKey) =>
      <LogToastItem
        key={'cache' + logKey}
        logkey={logKey}
        selected={currLogKey === logKey ? true : false}
        onClose={(logkey) => this.cacheRemoveToast(logkey)}
        onClick={(logkey) => this.cacheSelectLogToastItem(logkey)}
        disabled={disabled}
      />
    );
    const selectedToasts = Object.keys(logs).map((logKey) =>
      <LogToastItem key={'sel' + logKey}
        logkey={logKey}
        selected={currLogKey === logKey ? true : false}
        onClose={(logkey) => this.removeToast(logkey)}
        onClick={(logkey) => this.selectLogToastItem(logkey)}
        disabled={disabled}
      />
    );
    // <Form noValidate validated={validated} >
    //onClick={() => this.cacheCurrLog()}
    return (

      <Container className="logSelectorContainer">
        <fieldset className="fieldSet">
          <legend className="legend">Log Manager</legend>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="logCollectorSelectedLogs"
          >
            {cachedToasts}
          </div>
          <Form noValidate validated={validated} autoComplete="off">
            <Row style={{marginLeft: '0px', marginRight: '0px'}}>
              <Col sm="8" className="logSelectorPickerColumn">
                <Form.Group controlId="logKeyInput">
                  <InputGroup size="sm" >
                    <InputGroup.Prepend>
                    <InputGroup.Text id="logKey" >Key: </InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      type="text"
                      placeholder="Label..."
                      aria-label="Key:"
                      aria-describedby="logKey"
                      autoComplete="off"
                      onChange={(event) => this.updateCurrLogKey(event)}
                      value={currLogKey ? currLogKey : ''}
                      required
                      disabled={disabled}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide a Key/Label.
                      </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col className="logSelectorPickerColumn ml-auto">
                <Button
                  className="button"
                  size="sm"
                  onClick={(event) => this.addCurrLog(event)}
                  disabled={disabled}>
                    Add
                </Button>
                <Button
                  className="button"
                  size="sm"
                  onClick={(event) => this.cacheCurrLog(event)}
                  disabled={disabled}
                  >
                    Cache
                </Button>
              </Col>
            </Row>
            <Row style={{marginLeft: '0px', marginRight: '0px'}}>
                <Form.Group controlId="logValueInput" className="logTextArea">
                  <Form.Control
                    as="textarea"
                    onChange={event => this.updateCurrLogValue(event)}
                    value={currLogValue ? currLogValue : ''}
                    disabled={disabled}
                    placeholder="Log Entry, one per line..."
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Must contain a log entry.
                  </Form.Control.Feedback>
                </Form.Group>
            </Row>
          </Form>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="logCollectorSelectedLogs"
          >
            {selectedToasts}
          </div>
        </fieldset>
      </Container>

    );
  }
}
export default LogSelector;
