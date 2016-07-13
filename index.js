
var vm = require('vm');
var path = require('path');
var Module = require('module');

/**
 * Eval expressions, JSON files or require commonJS modules
 *
 * @param {String} content
 * @param {String} [filename] path to file which content we execute
 * @param {Object} [context] objects to provide into execute method
 * @returns {*}
 */
module.exports = function(content, filename, context) {
    var dirname = filename && path.dirname(filename);
    var ext = filename && path.extname(filename);

    content = stripBOM(content);

    if(ext === '.json') {
        return tryCatch(JSON.parse.bind(null, content), function(err) {
            err.message = filename + ': ' + err.message;
            throw err;
        });
    }

    var sandbox = {};
    var contextKeys;

    sandbox.module = new Module(filename, module.parent);
    sandbox.exports = sandbox.module.exports = {'__42__': '__42__'};
    sandbox.require = sandbox.module.require;

    var args = [sandbox.exports, sandbox.require, sandbox.module, filename, dirname];
    context && (contextKeys = Object.keys(context).map(function(key) {
        args.push(context[key]);
        return key;
    }));

    var wrapper = wrap(content, contextKeys);
    var options = {filename: filename, lineOffset: 0, displayErrors: true};
    var compiledWrapper = vm.runInThisContext(wrapper, options);

    compiledWrapper.apply(sandbox.exports, args);

    var result;
    if(sandbox.module.exports['__42__'] && Object.keys(sandbox.module.exports).length === 1) {
        result = context ? vm.runInNewContext(content, context) : vm.runInThisContext(content);
    } else {
        delete sandbox.module.exports['__42__'];
        result = sandbox.module.exports;
    }
    return result;
};

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
