// Modified version of ini by Isaac Z. Schlueter and Contributors
// https://github.com/npm/ini

const util = require('util');

export default {
  deserialize,
  serialize,
  deleteSection,
  addSection,
  addInclude,
  removeInclude,
  getSectionConfigFile,
  activateSection,
  deactivateSection,
  isActiveExtractor
};

function deserialize(obj, opt) {
  if (typeof opt === 'string') {
    opt = {
      source: opt
    }
  } else {
    opt = opt || {}
  }
  opt.source = opt.source || '.'
  opt.virtual = opt.virtual || false
  opt.section = opt.section || null
  var out = "";

  // Find the root
  var rootLine;
  if (obj['.'] && obj['.'].values) {
    rootLine = obj['.'].values.find((val) => {
      return val.prevline === null && val.source === opt.source
    });
  }
  if (!rootLine) {
    console.log("Couldn't find root for " + opt.source)
    return;
  }

  var currObject = rootLine.nextline;

  // Virtual vs. Real rendering
  while(currObject) {
    // Weird EOF condition, we don't want to add a newline if this is the last line?
    if(!currObject.nextline){
      out += renderValue(currObject.content, (opt.virtual ? currObject.virtualvalue : currObject.value));
    }
    else {
      out += renderValue(currObject.content, (opt.virtual ? currObject.virtualvalue : currObject.value)) + '\n';
    }
    currObject = currObject.nextline;
  }

  // Find the start and stop for the section in this file
  if(opt.section) {
    const section = obj[opt.section];
    if(section && section.children) {
      const accumulator = Object.keys(section.children).reduce((ranges, attrKey) => {
        // Find the lowest starting line
        var lineCount = 0;
        var prevObject = section.children[attrKey].values[0].prevline;
        while (prevObject) {
          prevObject = prevObject.prevline
          lineCount = lineCount + 1;
        }
        if (!ranges[section.children[attrKey].values[0].source]){
          ranges[section.children[attrKey].values[0].source] = []
        }
        ranges[section.children[attrKey].values[0].source].push(lineCount);
        return ranges;
      }, {});
      return { data: out, ranges: accumulator };
    }
  }
  return { data: out }
}

function renderValue (key, val, opts) {
  var delimiter = ',';
  var literal = false;
  if (opts) {
    delimiter = opts.delimiter || delimiter;
    literal = opts.literal || literal;
  }
  if(Array.isArray(val)) {
    return key + val.join(delimiter)
  }
  if(literal) {
    if(val === undefined) {
      return key + "undefined";
    }
    if(val === null) {
      return key + "null";
    }
  }
  if(val) {
    return key + val;
  }
  return key
}

function emptyCallback(someval) {
  return { include_body: null, source: null};
}

function addFirstLine(obj, source) {
  var firstLine = obj['.'].values.find((value) => value.source === source && value.prevline === null);
  if (! firstLine) {
    firstLine = {};
    firstLine.prevline = null;
    firstLine.nextline = null;
    firstLine.value = null;
    firstLine.content = null;
    firstLine.source = source;
    obj['.'].values.push(firstLine);
  }
  return firstLine;
}

function addSection(obj, sectionkey, sectionvals, source, lineObj=null, environment={}) {
  if(obj[sectionkey]) {
    throw new Error(sectionkey + " already exists inside INI object");
  }
  return new Promise((resolve) =>{
    var prevLine = lineObj || findSourceEndLineObject(obj, source);
    obj[sectionkey] = {};
    obj[sectionkey].values = [];
    obj[sectionkey].type = "section";
    obj[sectionkey].children = {};
    Object.keys(sectionvals).forEach((sectionvalkey) => {
        const val = {};
        val.content = sectionkey + "." + sectionvalkey + " = "; // Assume it's not an array?
        const lit = literalize(sectionvals[sectionvalkey])
        val.value = lit.value;
        val.literal = lit.literal;
        val.source = source;
        obj[sectionkey].children[sectionvalkey] = {type: 'attributes', values: [val]};
        insertValue(obj, val, prevLine);
        substituteValue(obj, val, { environment: environment}) // This needs to be generalized
        prevLine = val;
    });
    resolve(obj);
  });
}

function getSectionConfigFile(obj, sectionkey) {
  if(obj[sectionkey].type === 'section' && obj[sectionkey].children && obj[sectionkey].children['configFile']) {
    return obj[sectionkey].children['configFile'].values[0].virtualvalue;
  }
}

function findSourceEndLineObject(obj, source) {
  // The last line might not be in the general '.' section,
  // so go looking for any line in that section and dig down from there
  var  referenceLine = obj['.'].values.find((value) => value.source === source);
  while(referenceLine.nextline) {
    referenceLine = referenceLine.nextline;
  }
  return referenceLine;
}

// Adds an include directive in the top-level config
function addInclude(obj, path, environment = {}) {
  return new Promise((resolve) => {
    if(obj['include']){
      const prevInclude = obj['include'].values[obj['include'].values.length - 1];
      const newInclude = {}
      newInclude.value = path;
      newInclude.content = "include = ";
      newInclude.source = 'fieldextraction.properties.allextractors.web'
      insertValue(obj, newInclude, prevInclude);
      substitute(obj, { environment: environment })
      obj['include'].values.push(newInclude);
      addFirstLine(obj, newInclude.virtualvalue) // We want the substituted path
      resolve(newInclude);
    }
    resolve(null)
  });
}

function removeInclude(obj, path, environment = {}) {
  return new Promise((resolve) => {
    if(obj['include'] && Array.isArray(obj['include'].values)) {
      var includeVal = obj['include'].values.find((item) => item.virtualvalue === path);
      if(includeVal) {
        // Hard part, remove all sections and attributes in the tree, which means
        // we need to traverse the whole tree!
        Object.keys(obj).forEach((sectionKey) => {
          if(sectionKey !== '.' && sectionKey !== 'include'){
            deleteSection(obj, sectionKey, path);
          }
        });

        // Remove the include value
        deleteValue(obj, includeVal);
        obj['include'].values = obj['include'].values.filter((item) => item.virtualvalue !== path);

        // Remove any comment lines at beginning lines from the '.' section
        obj['.'].values = obj['.'].values.filter((item) => item.source !== path)
      }
    }
    resolve(obj);
  })
}

function insertValue(obj, val, prev) {
  if(val.source === prev.source) {
    val.nextline = prev.nextline;
    if(val.nextline) {
      val.nextline.prevline = val;
    }
    val.prevline = prev;
    if(prev) {
      prev.nextline = val;
    }
  }
}

function deleteValue(obj, val) {
    if (val && val.prevline) {
      val.prevline.nextline = val.nextline;
    }

    if(val && val.nextline) {
      val.nextline.prevline = val.prevline;
    }
}

function closerToEnd(val1, val2) {
  // Make sure the sources are the same, if not, return val1
  if(val1.source !== val2.source) {
    return val1;
  }
  // if val2 is val1's nextline, then it comes after, then we're done
  if(val1.nextline === val2) {
    return val2;
  }
  // if val1's nextline is null, then it's the last line in the file
  if (val1.nextline === null) {
    return val1;
  }

  // The two values aren't linked to each other
  // check val1's next line until we either reach val2, or
  // we hit the end.
  const towardsEnd = closerToEnd(val1.nextline, val2);
  if (towardsEnd === val1.nextline) {
    return val1;
  }
  return val2;
}

function deactivateSection(obj, section) {
  if(obj[section] && isActiveExtractor(obj, section)) {
    const extractor = obj['activeExtractors'].values.find((val) => val.virtualvalue === section)
    deleteValue(obj, extractor);
    obj['activeExtractors'].values = obj['activeExtractors'].values.filter((val) => val.virtualvalue !== section);
  }
}

function isActiveExtractor(obj, section) {
  var isActiveObject;
  if(obj[section] && obj['activeExtractors'] && obj['activeExtractors'].values){
    isActiveObject =
     obj['activeExtractors'].values.find((activeExtractor) => activeExtractor.virtualvalue === section);
  }
  return isActiveObject ? true : false;
}

function activateSection(obj, section) {
  // Find the last line of a section
  if(obj[section] && obj[section].children && !isActiveExtractor(obj, section)) {
    var lastValue;
    Object.keys(obj[section].children).forEach((childkey) => {
      if(lastValue) {
        lastValue = closerToEnd(lastValue, obj[section].children[childkey].values[0])
      }
      else {
        lastValue = obj[section].children[childkey].values[0];
      }
    })
    const newVal = {};
    newVal.content = "activeExtractors = ";
    newVal.value = section;
    newVal.virtualvalue = section;
    newVal.prevline = null;
    newVal.nextline = null;
    newVal.literal = false;
    newVal.source = lastValue.source;
    insertValue(obj, newVal, lastValue);
    obj['activeExtractors'].values.push(newVal);
  }
}

function deleteSection(obj, sectionkey, source = null) {
  const section = obj[sectionkey];
  console.log(`Deleting section ${sectionkey} for source ${source}`);
  return new Promise((resolve) => {
    if (section.values) {
      section.values.forEach((value) => {
        if(value) {
          if( value.source === source || source === null) {
            deleteValue(value)
            section.values.splice(section.values.indexOf(value), 1);
            value = null;
          }
        }
      });
      if (section.values.length === 0) {
        section.values = null // Re-assign the vals will dereference them???
      }
    }

    // We need to delete the section's valueObjects first to get rid of the serialization
    if (section.children) {
      Object.keys(section.children).forEach((childkey) => {
        // Remove each line from the file
        if(section.children[childkey].values) {
          section.children[childkey].values.forEach((valueItem) => {
            console.log(`Child item source is ${valueItem.source} and source is ${source}`);
            if(valueItem.source === source || source === null) {
              deleteValue(obj, valueItem)
              console.log("Item at " + section.children[childkey].values.indexOf(valueItem));
              section.children[childkey].values = section.children[childkey].values.filter((item) => item !== valueItem);
              console.log(util.inspect(section.children[childkey].values));
              valueItem = null;
            }
          })

          if(section.children[childkey].values.length === 0) {
            console.log(`setting ${childkey} to null`)
            section.children[childkey] = null;
            delete section.children[childkey];
          }
        }
      });
      if(Object.keys(section.children).length === 0){
        console.log("Section has no keys, deleting it")
        section.children = null;
      }
    }

    if (!section.values && !section.children) {
      section.type = null; // Re-assign the vals will dereference them???
      obj[sectionkey] = null;
      delete obj[sectionkey];
    }
    resolve(obj);
  });
}
// properties = {
//   key: {
//     type: "attribute | section | include",
//     children: ['properties'],
//     values: ['valueObjects']
//   }
// }
//
// valueObjects = {
//   value: 'string or array of strings',
//   content: 'string with the original content pulled, optionally removed the value portion',
//   virtualcontent: 'value containing variable substitutions',
//   literal: 'boolean - if the content of value is null, true, false then we convert to their string counterpart',
//   nextline: 'valueObject',
//   prevline: 'valueObject',
//   source:  'valueObject.value of the root object (so the file path) from which this valueObject was parsed'
// }
function serialize (str, opt) {
  if (typeof opt === 'string') {
    opt = {
      source: '.',
    }
  } else {
    opt = opt || {}
  }
  opt.include_callback = opt.include_callback || emptyCallback
  opt.source = opt.source || '.'
  opt.environment = opt.environment || {}

  var startingPoint;
  var out;
  if (opt.out) {
    out = opt.out;
    startingPoint =  out['.'].values.find((obj) => {
      return obj.source === opt.source && obj.prevline === null
    });
    if(!startingPoint) {
      startingPoint = { value: null, content: null, prevline: null, nextline: null, source: opt.source}
      out['.'].values.push(startingPoint);
    }
  }
  else {
    startingPoint = { value: null, content: null, prevline: null, nextline: null, source: opt.source}
    out = {
      '.': {
        type: 'section',
        values: [startingPoint]
      }
    }
  }
  var p = out
  var commentKey = p['.'].values
  var currObject = startingPoint; // startingPoint above
  var section = null
  var insideDotSection = false


  //          section     |key      = value
  var re = /^\s*\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
  var lines = str.split(/[\r\n]/g, -1)

   lines.forEach( function (line, _, __) {
    if (!line || line.match(/^\s*[;#]/)){
      // Assign our value and manage the linked list
      const val = { value: null, content: line, prevline: currObject, nextline: null, source: opt.source }
      currObject.nextline = val;
      currObject = val;
      // Push our value into the decoded object
      commentKey.push(val);
      return
    }
    var match = line.match(re)
    if (!match) {
      // Assign our value and manage the linked list
      const val = { value: null, content: line, prevline: currObject, nextline: null, source: opt.source }
      currObject.nextline = val;
      currObject = val;
      // Push our value into the decoded object
      commentKey.push(val);
      return
    }

    // Match Sections in square brackets
    if (match[1] !== undefined) {
      section = unsafe(match[1])
      const val = { value: null, content: line, prevline: currObject, nextline: null, source: opt.source }
      currObject.nextline = val;
      currObject = val;
      p = out[section] = out[section] || { type: 'section', values: [val], children: {}};
      return
    }
    var literal = false;
    var key = unsafe(match[2])
    var value = match[3] ? unsafe(match[4]) : true

    // Handle dot(.) sections here
      var dotSection = key.split('.', 2);
      if (dotSection.length > 1) {
        p = out[dotSection[0]] = out[dotSection[0]] || { type: 'section', values: [], children: {}};
        key = dotSection[1];
        insideDotSection = true;
      }
    //

    // Deal with variable substitution.
    // Note the variables need to be "EARLIER" in the file
    // or they won't be resolved
    const substitutionRegex = /\${([^}]*)/gm;
    let varMatchGroups;
    let virtualValue = value.repeat(1);
    while ((varMatchGroups =  substitutionRegex.exec(virtualValue)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (varMatchGroups.index === substitutionRegex.lastIndex) {
          substitutionRegex.lastIndex++;
      }
      const subKey = varMatchGroups[1];
      var replaceValue;
      if (opt.environment[subKey]) {
        replaceValue = opt.environment[subKey]
      }
      else {
        const subValue = out[subKey];

        if (subValue) {
          replaceValue =  subValue.values.map( (obj) => {
            if(Array.isArray(obj.value)){
              return obj.value.join(',')
            }
            return obj.value
          }).join(',');
        }
      }
      if (replaceValue) {
        const term = '${' + subKey + '}'
        virtualValue = virtualValue.replace(term, replaceValue);
      }
    }

    // strip out [] in the keys
    // We also 'split' the array here
    // TODO: Replicate the original whitespace
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2)
      value = value.split(opt.delimiter, -1);
      virtualValue = virtualValue.split(opt.delimiter, -1);
    }

    // To avoid playing around with whitespace around the assignment operator
    // Grab everything on the line until our value and keep for rendering
    const keywithassignmentandwhitespace = /^(.*=\s*).*$/
    const keycontent = line.match(keywithassignmentandwhitespace);

    // Convert value to native JSON types
    const literalized = literalize(value);
    value = literalized.value;
    literal = literalized.literal;


    const val = {
      value: value,
      content: keycontent[1],
      prevline: currObject,
      nextline: null,
      literal: literal,
      virtualvalue: virtualValue,
      source: opt.source
    }
    currObject.nextline = val;
    currObject = val;

    // Check if this is a "section"
    if (p.children) {
      if (p.children[key]) {
        p.children[key].values.push(val);
      }
      else {
        p.children[key] = { type: 'attribute', values: [val]}
      }
      if(insideDotSection) {
        p = out;
      }
    }
    else {
      if (p[key]){
        p[key].values.push(val)
      }
      else {
        p[key] = { type: 'attribute', values: [val] }
      }
    }
  });
  return new Promise((resolve, reject) => {
    // Sequentially process includes
    if (out.include) {
      if (Array.isArray(out.include.values)) {
        const new_includes = out.include.values.filter((v) => {
          return v.source === opt.source
        })
        if (new_includes) {
          return Promise.all(new_includes.map(v => opt.include_callback(v))).then(resp_array => {
            return Promise.all(resp_array.map(r => serialize(r.include_body, {source: r.source})))
              .then(outs => {
                return mergeOuts(outs, out).then((ret) => {
                  substitute(ret, opt);
                  return resolve(ret)
                });
              })
          });
        }
        // this shouldn't happen, it needs to be replaced with a catch/reject from the
        // condition above
        substitute(out, opt);
        return resolve(out);
      }
      else {
        if (opt.include_callback) {
           return opt.include_callback(out.include.values)
            .then((resp) => {
              opt.source = resp.source;
              opt.out = out;
              return serialize(resp.include_body, opt).then(o => {
                substitute(o, opt)
                return resolve(o);
              });
            })
        }
      }
    }
    else {
      substitute(out, opt);
      return resolve(out);
    }
  });
}

function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

// function safe (val) {
//   return (typeof val !== 'string' ||
//     val.match(/[=\r\n]/) ||
//     val.match(/^\[/) ||
//     (val.length > 1 &&
//      isQuoted(val)) ||
//     val !== val.trim())
//       ? JSON.stringify(val)
//       : val.replace(/;/g, '\\;').replace(/#/g, '\\#')
// }

function literalize(value) {
  const ret = {};
  // Convert value to native JSON types
  switch (value) {
    case 'true':
    case 'false':
    case 'null':
    case 'undefined':
      ret.value = JSON.parse(value);
      ret.literal = true;
      break;
    default:
      ret.value = value;
      ret.literal = false;
  }
  return ret;
}

function unsafe (val, doUnesc) {
  val = (val || '').trim()
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2)
    }
    try { val = JSON.parse(val) } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false
    var unesc = ''
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i)
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c
        } else {
          unesc += '\\' + c
        }
        esc = false
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true
      } else {
        unesc += c
      }
    }
    if (esc) {
      unesc += '\\'
    }
    return unesc.trim()
  }
  return val
}

function processOutKeys(source, target) {
  if (source.type !== target.type) {
    throw new Error("Unable to merge, source object type: " + source.type + " target type: " + target.type);
  }
  target.values.push(...source.values);
  if(source.children) {
    Object.keys(source.children).forEach((skey) => {
      if(target.children[skey]) {
        processOutKeys(source.children[skey], target.children[skey]);
      }
      else {
        target.children[skey] = source.children[skey]
      }
    });
  }
}

function mergeOuts(outs, out) {
  return new Promise((resolve, reject) => {
    outs.forEach((o) => {
      Object.keys(o).forEach((key) => {
        if (out[key]) {
          processOutKeys(o[key], out[key])
        }
        else {
          out[key] = o[key]
        }
      });
      return resolve(out);
    });
  });
}

function substituteValue(tree, valueObj, opt) {
  console.log(valueObj.value)

  // We can only substitute strings
  if(typeof valueObj.value === 'string') {
    const substitutionRegex = /\${([^}]*)/gm;
    let varMatchGroups;
    let virtualValue = valueObj.value.repeat(1); // Copy our string over
    while ((varMatchGroups =  substitutionRegex.exec(virtualValue)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (varMatchGroups.index === substitutionRegex.lastIndex) {
          substitutionRegex.lastIndex++;
      }

      const subKey = varMatchGroups[1];
      var replaceValue;
      if (opt.environment[subKey]) {
        replaceValue = opt.environment[subKey]
      }
      else {
        const subValue = tree[subKey];

        if (subValue) {
          replaceValue =  subValue.values.map( (obj) => {
            if(Array.isArray(obj.virtualvalue)){
              return obj.virtualvalue.join(',')
            }
            return obj.virtualvalue
          }).join(',');
        }
      }
      if (replaceValue) {
        const term = '${' + subKey + '}'
        virtualValue = virtualValue.replace(term, replaceValue);
        valueObj.virtualvalue = virtualValue;
      }
    }

    if(!valueObj.virtualvalue) {
      valueObj.virtualvalue = valueObj.value;
    }
  }
}

function substitute(tree, opt) {
  // Find all the roots
  tree['.'].values.filter((val) => val.prevline === null).forEach((startLine) => {
    var currObject = startLine;
    currObject.virtualvalue = currObject.value; // Failsafe if there's not variables
    // Virtual vs. Real rendering
    while(currObject) {
      if(typeof currObject.value === 'string') { // Comments won't have values
        // Deal with variable substitution.
        // Note the variables need to be "EARLIER" in the file
        // or they won't be resolved
        const substitutionRegex = /\${([^}]*)/gm;
        let varMatchGroups;
        let virtualValue = currObject.value.repeat(1);
        while ((varMatchGroups =  substitutionRegex.exec(virtualValue)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (varMatchGroups.index === substitutionRegex.lastIndex) {
              substitutionRegex.lastIndex++;
          }
          const subKey = varMatchGroups[1];
          var replaceValue;
          if (opt.environment[subKey]) {
            replaceValue = opt.environment[subKey]
          }
          else {
            const subValue = tree[subKey];

            if (subValue) {
              replaceValue =  subValue.values.map( (obj) => {
                if(Array.isArray(obj.virtualvalue)){
                  return obj.virtualvalue.join(',')
                }
                return obj.virtualvalue
              }).join(',');
            }
          }
          if (replaceValue) {
            const term = '${' + subKey + '}'
            virtualValue = virtualValue.replace(term, replaceValue);
            currObject.virtualvalue = virtualValue;
          }
        }

        if(!currObject.virtualvalue) {
          currObject.virtualval = currObject.value;
        }
      }
      currObject = currObject.nextline
    }
  })
}
