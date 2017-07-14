# node-eval

Eval JS-expression or require CommonJS modules and JSON files with ease.

[![NPM version](http://img.shields.io/npm/v/node-eval.svg?style=flat)](http://www.npmjs.org/package/node-eval)
[![Build Status](http://img.shields.io/travis/node-eval/node-eval/master.svg?style=flat&label=tests)](https://travis-ci.org/node-eval/node-eval)
[![Coverage Status](https://img.shields.io/coveralls/node-eval/node-eval.svg?branch=master&style=flat)](https://coveralls.io/r/node-eval/node-eval)
[![Dependency Status](http://img.shields.io/david/node-eval/node-eval.svg?style=flat)](https://david-dm.org/node-eval/node-eval)


## Usage example:

### Simple

```js
var nodeEval = require('node-eval');

console.log(nodeEval('42 * 42')); // 1764
```

### CommonJS
```js
var safeEval = require('node-eval');

var requireContent =
`
    var p = require('../package.json');
    module.exports = {
        name: p.name
    };
`;

var package = safeEval(requireContent);
console.log(package.name); // 'node-eval'
```

--
**NB** Internally `node-eval` will resolve passed relative paths using the place
it's called (like `require` do).
It may spend additional processor's time on it, so better to pass in absolute path.

```js
// /repos/open-source-project/lib/file.js:
const evaluatingFile = '../files/another.js';
nodeEval(fs.readFileSync(evaluatingFile, 'utf-8'), evaluatingFile);
// '../files/another.js' will be resolved to '/repos/open-source-project/files/another.js'
```

## Context
You can provide some like-a-global variables into node-eval

```js
var safeEval = require('node-eval');

var secretKey = '^___^';
var content = 'module.exports = secretKey;';

var res = safeEval(content, 'file.js', {secretKey: secretKey});
console.log(res); // '^___^'
```
