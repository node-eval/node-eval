var chai = require('chai');
var expect = chai.expect;

var nodeEval = require('../');

function coco(content, context) {
    return expect(nodeEval(content, '/file.js', context)).to;
}

describe('expression', function() {
    it('should eval simple expression', function() {
        return coco('42 / 42').eql(1);
    });

    it('should eval expression', function() {
        return coco('({42:42})').eql({42: 42});
    });

    it('should eval arrayExpression', function() {
        return coco('[{42:42}]').eql([{42: 42}]);
    });

    it('should not eval simple object', function() {
        return coco('{}').to.undefined;
    });

    it('should eval expression with \'exports\' key', function() {
        return coco('[{exports:42}]').eql([{exports: 42}]);
    });

    it('should eval expression with \'module\' key', function() {
        return coco('[{module:42}]').eql([{module: 42}]);
    });
});

describe('commonJS modules', function() {
    it('should eval exports', function() {
        return coco('exports.block = 42; ({1:1, 2:2});').eql({block: 42});
    });

    it('should eval module.exports', function() {
        return coco('module.exports = {42:42}; ({1:1, 2:2});').eql({42: 42});
    });

    it('should eval module.exports number', function() {
        return coco('module.exports = 42; ({1:1, 2:2});').eql(42);
    });

    it('should eval module.exports bool', function() {
        return coco('module.exports = true; ({1:1, 2:2});').eql(true);
    });

    it('should eval module.exports bool', function() {
        return coco('module.exports = false; ({1:1, 2:2});').eql(false);
    });

    it('should eval module.exports string', function() {
        return coco('module.exports = \'42\'; ({1:1, 2:2});').eql('42');
    });

    it('should eval module.exports undefined', function() {
        return coco('module.exports = undefined; ({1:1, 2:2});').eql(undefined);
    });

    it('should eval module.exports replace', function() {
        return coco('module.exports = {42:42, 24:24, 1:1}; ({1:1, 2:2});').eql({42: 42, 24: 24, 1: 1});
    });

    it('should eval module.exports {}', function() {
        return coco('module.exports = {}; ({1:1, 2:2});').eql({});
    });

    it('should eval exports = module.exports', function() {
        return coco('exports = module.exports = {42:42}; ({1:1, 2:2});').eql({42: 42});
    });

    it('should return empty object if you touch `module` object but didn\'t export anything', function() {
        expect(nodeEval('module.zxqfox = {42:42}; ({1:1, 2:2});')).to.eql({});
    });

    it('should eval module with require', function() {
        var requireContent = [
            'var p = require("../package.json")',
            'module.exports = {',
            'block: p.name,',
            '};'
        ].join('\n');

        expect(nodeEval(requireContent, 'file.js')).to.eql({block: 'node-eval'});
    });

    it('should require relatively passed modules', function() {
        var path = './fixtures/file.js',
            content = 'module.exports = require("./d1");';

        expect(nodeEval(content, path)).to.eql('xxx42xxx');
    });

    it('should resolve paths of modules', function() {
        var path = './fixtures/d2/file.js',
            content = 'module.exports = require.resolve("../d1");';

        expect(nodeEval(content, path)).to.match(/\/fixtures\/d1\/index\.js$/);
    });
});

describe('JSON', function() {
    it('should eval json', function() {
        var path = 'file.json',
            content = '{"42":42}';

        expect(nodeEval(content, path)).to.eql({42: 42});
    });

    it('should throw on bad json', function() {
        var path = 'file.json',
            content = '{"block":"page",}';

        expect(function() { nodeEval(content, path); }).to.throw(/Unexpected token }/);
    });
});

describe('context', function() {
    var answer = 42;

    it('should provide context objects', function() {
        return coco('answer + answer', {answer: answer}).to.eql(84);
    });

    it('should provide context objects to module syntax', function() {
        return coco('module.exports = typeof it + typeof chai', {it: it, chai: chai}).to.eql('functionobject');
    });
});

describe('common', function() {
    it('should work without filename argument', function() {
        return expect(nodeEval('42')).to.eql(42);
    });

    it('should not polute global.module obj', function() {
        global.module = {42: 42};
        nodeEval('module.zxqfox = {42:42}');
        expect(global.module).to.eql({42: 42});
    });
});

describe('errors', function() {
    it('should throw on throwing bad js', function() {
        var path = 'file.js',
            content = 'throw new Error("Hello")';

        expect(function() { nodeEval(content, path); }).to.throw('Hello');
    });

    it('should throw on syntactically bad js', function() {
        var path = 'file.js',
            content = 'yoba ! rot';

        expect(function() { nodeEval(content, path); }).to.throw(/Unexpected token !/);
    });

    it('should throw error on require call without filename', function() {
        expect(function() { nodeEval('exports.path = require("path");'); })
            .to.throw(/pass in filename/);
    });

    it('should throw error on require call without filename', function() {
        expect(function() { nodeEval('exports.path = require.resolve("path");'); })
            .to.throw(/pass in filename/);
    });
});
