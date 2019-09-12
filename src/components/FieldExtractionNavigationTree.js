import React, { Component } from 'react';
import {Treebeard, decorators } from 'react-treebeard';
// import util from 'util'

import Header from './TreeItemDecorator';
import theme from '../themes/default';
// import { findNode, defaultMatcher } from '../utils/filterTree';

class FieldExtractionNavigationTree extends Component {

  constructor(props) {
    super(props);
    this.convertIni = this.convertIni.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.state = {
      treedata: {},
      selectedNode: null
    }
  }

  componentDidMount() {
    this.convertIni();
  }


  convertIni(){
    const { selectedSource, selectedSection, data } = this.props;
    const vendors = {}

    return new Promise((resolve) => {
      // Find all the extractors, their source and their vendor
      if (data) {
        Object.keys(data).filter((iniObjKey) => {
          return iniObjKey !== '.' && data[iniObjKey].type === 'section'
        }).forEach((section) => {
          // This is every section that isn't '.' since
          // everything else will be an attribute
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
            sources.forEach((source) => {
              if(vendors[source]) {
                vendors[source].children.push({
                  name: section,
                  key: section,
                  toggled: false,
                  source: source,
                  extractor_key: section,
                  active: section === selectedSection,
                  decorators: {...decorators, Header}
                });
              }
              else {
                vendors[source] = { key: source, source: source};
                vendors[source].name = source.substring(source.lastIndexOf('/') + 1, source.lastIndexOf('.'));
                vendors[source].toggled = selectedSource === source;
                vendors[source].active = selectedSource === source && !selectedSection;
                vendors[source].children = [{
                  name: section,
                  key: section,
                  toggled: false,
                  source: source,
                  extractor_key: section,
                  active: selectedSection === section,
                  decorators: {...decorators, Header}
                }];
                vendors[source].decorators = {...decorators, Header}
              }
            });
          }
        });
        // Go through the source section ['.'] and find any sources that don't have any sections defined to make sure we don't orphan anything
        const emptySections = data['.'].values.filter((val) => {
          if(val.source === 'fieldextraction.properties.allextractors.web') {
            return false;
          }
          return Object.keys(vendors).filter((vendor) => {
            return val.source === vendors[vendor].source
          }).length === 0;
        });
        emptySections.forEach((sectionVal) => {
          vendors[sectionVal.source] = {
            key: sectionVal.source,
            source: sectionVal.source,
            name: sectionVal.source.substring(sectionVal.source.lastIndexOf('/') + 1, sectionVal.source.lastIndexOf('.')),
            active: sectionVal.source === selectedSource && !selectedSection,
            decorators: {...decorators, Header}
          };
        });
      }

      this.setState( {
        treedata: Object.assign({},{
          name: "vendors",
          source: 'fieldextraction.properties.allextractors.web',
          key: '.',
          toggled: true,
          active: (!selectedSection && selectedSource === 'fieldextraction.properties.allextractors.web'),
          children: Object.keys(vendors).map((entryKey) => vendors[entryKey]),
          decorators: {...decorators, Header}
        }),
        selectedNodeName: 'vendors'
      });
      resolve();
    });
  }


  componentDidUpdate(prevProps) {
    const { data } = this.props;
    if( data !== prevProps.data) {
      console.log("Refreshing tree");
      this.convertIni();
    }
  }

  unselectNode(node) {
    if(node.children) {
      node.children.forEach((child) => {
        this.unselectNode(child);
      });
    }
    node.active = false;
  }

  onToggle(node, toggled){
      const { selectedNodeName, treedata } = this.state;
      const { onSelect } = this.props;
      if (selectedNodeName) {
        this.unselectNode(treedata);
      }

      node.active = true;
      if (node.children) {
          node.toggled = toggled;
      }
      this.setState(() => ({selectedNodeName: node.name, treedata: Object.assign({}, treedata)}));
      onSelect({source: node.source, section: node.extractor_key, item: node.key});
  }
        //  decorators={{...decorators, Header}}

  render() {
    const { treedata } = this.state;
    return (
      <div className="beardTree">
        <Treebeard
          data={treedata}
          onToggle={this.onToggle}
          style={theme}
        />
      </div>
    );
  }
}
export default FieldExtractionNavigationTree;
