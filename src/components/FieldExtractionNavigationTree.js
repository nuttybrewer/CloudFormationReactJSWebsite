import React, { Component } from 'react';
import TreeView from 'deni-react-treeview';
// import util from 'util'
class FieldExtractionNavigationTree extends Component {

  constructor(props) {
    super(props);
    this.convertIni = this.convertIni.bind(this);
    this.state = {
      vendors: []
    }
  }

  componentDidMount() {
      this.convertIni();
  }

  convertIni(){
    const { data } = this.props;
    var vendors = {};
    // Find all the extractors, their source and their vendor
    Object.keys(data).filter((iniObjKey) => {
      return data[iniObjKey].type === 'section' && iniObjKey !== '.'
    }).forEach((section, sectionIndex) => {
      if (data[section].children) {
        var sources = [];
        Object.keys(data[section].children)
          .forEach((childKey) => {
            data[section].children[childKey].values.map((val) => {
              return val.source;
            }).forEach((source) => {
              if(!sources.includes(source)) {
                sources.push(source);
              }
            });
          });
        sources.forEach((source, sourceIndex) => {
          if(vendors[source]) {
            vendors[source].children.push({ text: section, isLeaf: true, id: sectionIndex + 1000, source: source, extractor_key: section });
          }
          else {
            vendors[source] = { id: source, source: source};
            vendors[source].children = [{ text: section, isLeaf: true, id: sectionIndex + 1000, source: source, extractor_key: section }];
            vendors[source].text = source.substring(source.lastIndexOf('/') + 1, source.lastIndexOf('.'));
          }
        });
      }
    });
    // console.log("Vendors: " + util.inspect(Object.keys(vendors).map((entryKey) => vendors[entryKey]),{depth:3}))

    this.setState({vendors: Object.keys(vendors).map((entryKey) => vendors[entryKey]) });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.updateIni();
    }
  }

  onSelectItem(item) {
    const { onSelect } = this.props;
    onSelect({ source: item.source, section: item.extractor_key});
  }


  render() {
    const { vendors } = this.state;
    if (vendors) {
      return (
        <TreeView items={vendors} onSelectItem={ this.onSelectItem.bind(this) } />
      )
    }
    else {
      return (
        <div></div>
      )
    }
  }
}
export default FieldExtractionNavigationTree;
