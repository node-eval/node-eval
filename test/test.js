var chai = require('chai');
var expect = chai.expect;

var nodeEval = require('../');

function coco(content, context) {
    return expect(nodeEval(content, 'file.js', context)).to;
}

describe('expression', () => {
    it('should eval simple expression', () => coco('42 / 42').eql(1));

    it('should eval expression', () => coco('({42:42})').eql({42: 42}));

    it('should not eval simple object', () => coco('{}').to.undefined);
});

describe('commonJS modules', () => {
    it('should eval exports', () => coco('exports.block = 42; ({1:1, 2:2});').eql({block: 42}));

    it('should eval module.exports', () => coco('module.exports = {42:42}; ({1:1, 2:2});').eql({42: 42}));

    it('should eval module.exports number', () => coco('module.exports = 42; ({1:1, 2:2});').eql(42));

    it('should eval module.exports bool', () => coco('module.exports = true; ({1:1, 2:2});').eql(true));

    it('should eval module.exports bool', () => coco('module.exports = false; ({1:1, 2:2});').eql(false));

    it('should eval module.exports string', () => coco('module.exports = \'42\'; ({1:1, 2:2});').eql('42'));

    it('should eval module.exports undefined', () => coco('module.exports = undefined; ({1:1, 2:2});').eql(undefined));

    it('should eval module.exports replace', () => coco('module.exports = {42:42, 24:24, 1:1}; ({1:1, 2:2});').eql({42: 42, 24: 24, 1: 1}));

    it('should eval module.exports {}', () => coco('module.exports = {}; ({1:1, 2:2});').eql({}));

    it('should eval exports = module.exports', () => coco('exports = module.exports = {42:42}; ({1:1, 2:2});').eql({42: 42}));

    it('should return empty object if you touch `module` object but didn\'t export anything', () => {
        expect(nodeEval('module.zxqfox = {42:42}; ({1:1, 2:2});')).to.eql({});
    });

    it('should eval module with require', () => {
        var requireContent =
        `
            var p = require('../package.json');
            module.exports = {
                block: p.name,
            };
        `;
        coco(requireContent).eql({block: 'node-eval'});
    });
});

describe('JSON', () => {
    it('should eval json', () => {
        var path = 'file.json',
            content = '{"42":42}';

        expect(nodeEval(content, path)).to.eql({42: 42});
    });

    it('should throw on bad json', () => {
        var path = 'file.json',
            content = '{"block":"page",}';

        expect(() => nodeEval(content, path)).to.throw(Error);
    });
});

describe('context', () => {
    var answer = 42;

    it('should provide context objects', () => coco('answer + answer', {answer}).to.eql(84));

    it('should provide context objects to module syntax', () => coco('module.exports = typeof it + typeof chai', {it, chai}).to.eql('functionobject'));
});

describe('common', () => {
    it('should work without filename argument', () => expect(nodeEval('42')).to.eql(42));

    it('should not polute global.module obj', function() {
        global.module = {42: 42};
        nodeEval('module.zxqfox = {42:42}');
        expect(global.module).to.eql({42: 42});
    });
});

describe('errors', () => {
    xit('should throw on bad js', function() {
        var path = 'file.js',
            content = 'throw new Error("Hello")';

        expect(() => nodeEval(content, path)).to.throw('Hello');
    });
});
