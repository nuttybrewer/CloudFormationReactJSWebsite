// Modified version of ini by Isaac Z. Schlueter and Contributors
// https://github.com/npm/ini

// const util = require('util');
exports.serialize = serialize;
exports.deserialize = deserialize
exports.safe = safe
exports.unsafe = unsafe


function deserialize(obj, opt) {
  if (typeof opt === 'string') {
    opt = {
      whitespace: false
    }
  } else {
    opt = opt || {}
    opt.whitespace = opt.whitespace === true
  }
  var out = "";

  // Find the root
  var rootLine;
  if (obj['.'] && obj['.'].values) {
    rootLine = obj['.'].values.find((val) => val.prevline === null);
  }
  if (!rootLine) {
    return;
  }

  var currObject = rootLine.nextline;

  // Virtual vs. Real rendering
  while(currObject) {
    // Weird EOF condition, we don't want to add a newline if this is the last line?
    if(!currObject.nextline){
      out += renderValue(currObject.content, opt.virtual ? currObject.virtualvalue : currObject.value);
    }
    else {
      out += renderValue(currObject.content, opt.virtual ? currObject.virtualvalue : currObject.value) + '\n';
    }
    currObject = currObject.nextline;
  }
  return out
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

function serialize (str, opt) {
  if (typeof opt === 'string') {
    opt = {
      delimiter: opt
    }
  } else {
    opt = opt || {}
    opt.delimiter = opt.delimiter || ','
  }

  var startingPoint = { value: null, content: null, prevline: null, nextline: null}
  var out = {
    '.': {
      type: 'section',
      values: [startingPoint]
    }
  }
  var p = out
  var commentKey = p['.'].values
  var currObject = commentKey[0]; // startingPoint above
  var section = null
  var insideDotSection = false


  //          section     |key      = value
  var re = /^\s*\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
  var lines = str.split(/[\r\n]/g, -1)

  lines.forEach(function (line, _, __) {
    if (!line || line.match(/^\s*[;#]/)){
      // Assign our value and manage the linked list
      const val = { value: null, content: line, prevline: currObject, nextline: null}
      currObject.nextline = val;
      currObject = val;
      // Push our value into the decoded object
      commentKey.push(val);
      return
    }
    var match = line.match(re)
    if (!match) {
      // Assign our value and manage the linked list
      const val = { value: null, content: line, prevline: currObject, nextline: null}
      currObject.nextline = val;
      currObject = val;
      // Push our value into the decoded object
      commentKey.push(val);
      return
    }

    // Match Sections in square brackets
    if (match[1] !== undefined) {
      section = unsafe(match[1])
      const val = { value: null, content: line, prevline: currObject, nextline: null}
      currObject.nextline = val;
      currObject = val;
      p = out[section] = out[section] || { type: 'section', values: [val], children: {}};
      return
    }
    var literal = false;
    var key = unsafe(match[2])
    var value = match[3] ? unsafe(match[4]) : true
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
    while ((varMatchGroups = substitutionRegex.exec(virtualValue)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (varMatchGroups.index === substitutionRegex.lastIndex) {
          substitutionRegex.lastIndex++;
      }
      const subKey = varMatchGroups[1];
      const subValue = out[subKey];
      var replaceValue;
      if (subValue) {
        replaceValue = subValue.values.map((obj) => {
          if(Array.isArray(obj.value)){
            return obj.value.join(',')
          }
          return obj.value
        }).join(',');


        if (replaceValue) {
          const term = '${' + subKey + '}'
          virtualValue = virtualValue.replace(term, replaceValue);
        }
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

    const val = { value: value, content: keycontent[1], prevline: currObject, nextline: null, literal: literal, virtualvalue: virtualValue }
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
      // Treat our "special" keys such as "include"
      if (key === 'include' && opt.include_callback) {
        opt.include_callback(out, val)
      }
      if (p[key]){
        p[key].values.push(val)
      }
      else {
        p[key] = { type: 'attribute', values: [val] }
      }
    }
  });
  return out
}

function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

function safe (val) {
  return (typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 &&
     isQuoted(val)) ||
    val !== val.trim())
      ? JSON.stringify(val)
      : val.replace(/;/g, '\\;').replace(/#/g, '\\#')
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
