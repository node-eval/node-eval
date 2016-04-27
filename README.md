# node-eval

Eval JS-expression or require CommonJS modules and JSON files with ease.

[![NPM version](http://img.shields.io/npm/v/node-eval.svg?style=flat)](http://www.npmjs.org/package/node-eval)
[![Build Status](http://img.shields.io/travis/gulp-bem/node-eval/master.svg?style=flat&label=tests)](https://travis-ci.org/gulp-bem/node-eval)
[![Coverage Status](https://img.shields.io/coveralls/gulp-bem/node-eval.svg?branch=master&style=flat)](https://coveralls.io/r/gulp-bem/node-eval)
[![Dependency Status](http://img.shields.io/david/gulp-bem/node-eval.svg?style=flat)](https://david-dm.org/gulp-bem/node-eval)


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

## Context
You can provide some like-a-global variables into node-eval

```js
var safeEval = require('node-eval');

var secretKey = '^___^';
var content = 'module.exports = secretKey;';

var res = safeEval(content, 'file.js', {secretKey: secretKey});
console.log(res); // '^___^'
```
