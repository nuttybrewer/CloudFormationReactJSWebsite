// Modified version of ini by Isaac Z. Schlueter and Contributors
// https://github.com/npm/ini

const util = require('util');

export default { deserialize, serialize };

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
      console.log(Object.keys(section.children));
      const accumulator = Object.keys(section.children).reduce((ranges, attrKey) => {
        // Find the lowest starting line
        var lineCount = 0;
        console.log("Counting: " + util.inspect(attrKey));
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
    switch (value) {
      case 'true':
      case 'false':
      case 'null':
      case 'undefined':
        value = JSON.parse(value);
        literal = true
        break;
      default:
    }

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

function substitute(tree, opt) {
  // Find all the roots
  tree['.'].values.filter((val) => val.prevline === null).forEach((startLine) => {
    var currObject = startLine;
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
      }
      currObject = currObject.nextline
    }
  })
}
