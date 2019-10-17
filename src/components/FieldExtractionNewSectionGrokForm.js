import React from 'react';
import { InputGroup, Form } from 'react-bootstrap';

class FieldExtractionNewSectionGrokForm extends React.Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.setGrokPattern = this.setGrokPattern.bind(this);
    this.state = { text: "" }
  }

  onChange(event) {
    this.setState({ text: event.target.value });
  }

  setGrokPattern() {
      const { setGrokPattern } = this.props;
      const { text } = this.state;
      if(setGrokPattern && text) {
        setGrokPattern(text);
      }
  }

  render() {
    const { section } = this.props;
    const { text } = this.state;
    if (section.type === 'Grok') {
      return (
        <InputGroup size="sm">
          <InputGroup.Prepend>
            <InputGroup.Text id="extractorName" >Grok Pattern: </InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            placeholder="Grok Pattern..."
            aria-label="grokPattern"
            aria-describedby="grokPatternName"
            autoComplete="off"
            value={ text }
            onBlur={ this.setGrokPattern }
            onChange={ this.onChange }
          />
        </InputGroup>
      )
    }
    return <></>;
  }
}

export default FieldExtractionNewSectionGrokForm;
