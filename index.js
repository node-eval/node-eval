var vm = require('vm');
var path = require('path');
var Module = require('module');

var isAbsolutePath = require('path-is-absolute');

/**
 * Eval expressions, JSON files or require commonJS modules
 *
 * @param {String} content
 * @param {String} [filename] path to file which content we execute
 * @param {Object} [context] objects to provide into execute method
 * @returns {*}
 */
module.exports = function(content, filename, context) {
    var ext = filename && path.extname(filename);

    content = stripBOM(content);

    if(ext === '.json') {
        return tryCatch(JSON.parse.bind(null, content), function(err) {
            err.message = filename + ': ' + err.message;
            throw err;
        });
    }

    if(filename && !isAbsolutePath(filename)) {
        filename = path.resolve(path.dirname(_getCalleeFilename()), filename);
    }

    var sandbox;
    // Skip commonjs evaluation if there are no `exports` or `module` occurrencies
    if(/\b(exports|module)\b/.test(content)) {
        sandbox = _commonjsEval(content, filename, context);
    }

    var result;
    if(sandbox && !sandbox.__result) {
        result = sandbox.module.exports;
    } else {
        result = context ? vm.runInNewContext(content, context) : vm.runInThisContext(content);
    }
    return result;
};

function _commonjsEval(content, filename, context) {
    var dirname = filename && path.dirname(filename);
    var sandbox = {};
    var exports = {};
    var contextKeys;

    sandbox.module = new Module(filename || '<anonymous>', module.parent);
    sandbox.module.exports = exports;

    if(filename) {
        sandbox.module.filename = filename;
        sandbox.module.paths = Module._nodeModulePaths(dirname);
        // See: https://github.com/nodejs/node/blob/master/lib/internal/module.js#L13-L40
        sandbox.require = function(id) { return sandbox.module.require(id); };
        sandbox.require.resolve = function(req) { return Module._resolveFilename(req, sandbox.module); };
    } else {
        filename = '<anonymous>';
        sandbox.require = filenameRequired;
    }

    var args = [sandbox.module.exports, sandbox.require, sandbox.module, filename, dirname];
    context && (contextKeys = Object.keys(context).map(function(key) {
        args.push(context[key]);
        return key;
    }));

    var wrapper = wrap(content, contextKeys);
    var options = {filename: filename, lineOffset: 0, displayErrors: true};
    var compiledWrapper = vm.runInThisContext(wrapper, options);

    var moduleKeysCount = Object.keys(sandbox.module).length;
    var exportKeysCount = Object.keys(sandbox.module.exports).length;
    compiledWrapper.apply(sandbox.module.exports, args);

    sandbox.__result = sandbox.module.exports === exports &&
        Object.keys(sandbox.module.exports).length === exportKeysCount &&
        Object.keys(sandbox.module).length === moduleKeysCount;

    return sandbox;
}
/**
 * Wrap code with function expression
 * Use nodejs style default wrapper
 *
 * @param {String} body
 * @param {String[]} [extKeys] keys to extend function args
 * @returns {String}
 */
function wrap(body, extKeys) {
    var wrapper = [
        '(function (exports, require, module, __filename, __dirname',
        ') { ',
        '\n});'
    ];

    extKeys = extKeys ? ', ' + extKeys : '';

    return wrapper[0] + extKeys + wrapper[1] + body + wrapper[2];
}

/**
 * Execute function inside try-catch
 * function with try-catch is not optimized so we made this helper
 */
function tryCatch(fn, cb) {
    try {
        return fn();
    } catch(e) {
        cb(e);
    }
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 * because the buffer-to-string conversion in `fs.readFileSync()`
 * translates it to FEFF, the UTF-16 BOM.
 */
/* istanbul ignore next: don't care */
function stripBOM(content) {
    if(content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

/**
 * Get callee filename
 * @param {Number} [calls] - number of additional inner calls
 * @returns {String} - filename of a file that call
 */
function _getCalleeFilename(calls) {
    calls = (calls|0) + 3; // 3 is a number of inner calls
    var e = {};
    Error.captureStackTrace(e);
    return parseStackLine(e.stack.split(/\n/)[calls]).filename;
}

/**
 * Partial implementation from https://github.com/stacktracejs/error-stack-parser/
 *
 * @param {String} line - v8 formatted stack line
 * @returns {{filename: String, line: ?Number, column: ?Number}}
 */
function parseStackLine(line) {
    var urlLike = line
        // Sanitize string
        .replace(/^\s+/, '').replace(/\(eval code/g, '(')
        // Split with spaces: 'at someFn (/path/to.js:1:2)' or 'at /path/to.js:1:2'
        .split(/\s+/)
        // Take the last piece
        .pop();
    // Fetch parts: '(/path/to.js:1:2)' → [..., '/path/to.js', 1, 2]
    var parts = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/.exec(urlLike.replace(/[\(\)]/g, ''));
    var filename = ['eval', '<anonymous>'].indexOf(parts[1]) > -1 ? undefined : parts[1];

    return {filename: filename, line: parts[2], column: parts[3]};
}

function filenameRequired() {
    throw new Error('Please pass in filename to use require');
}
filenameRequired.resolve = filenameRequired;
