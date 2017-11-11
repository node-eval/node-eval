# node-eval

Eval JS-expression or require CommonJS modules and JSON files with ease.

[![NPM Status][npm-img]][npm]
[![Travis Status][test-img]][travis]
[![Coverage Status][coveralls-img]][coveralls]
[![Dependency Status][david-img]][david]

[npm]:           http://www.npmjs.org/package/node-eval
[npm-img]:       https://img.shields.io/npm/v/node-eval.svg

[travis]:        https://travis-ci.org/node-eval/node-eval
[test-img]:      https://img.shields.io/travis/node-eval/node-eval/master.svg?label=tests

[coveralls]:     https://coveralls.io/r/node-eval/node-eval
[coveralls-img]: https://img.shields.io/coveralls/node-eval/node-eval/master.svg

[david]:         https://david-dm.org/node-eval/node-evalenb/enb
[david-img]:     https://img.shields.io/david/node-eval/node-eval/master.svg

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

## JSON5
For parsing `json5` files use [file-eval](https://github.com/node-eval/file-eval#json5)

