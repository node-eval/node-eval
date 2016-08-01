var chai = require('chai');
var expect = chai.expect;

var nodeEval = require('../');

function coco(content, context) {
    var path;
    if(typeof content === 'string') {
        path = 'file.js';
    } else {
        path = 'file.json';
        content = JSON.stringify(content);
    }
    return expect(nodeEval(content, path, context)).to;
}

it('should eval simple expression', () => coco('42 / 42').eql(1));

it('should eval expression', () => coco('({42:42})').eql({42: 42}));

it('should not eval simple object', () => coco('{}').not.to.exist);

it('should eval module.exports', () => coco('module.exports = {42:42}').eql({42: 42}));

it('should eval exports', () => coco('exports.block = 42').eql({block: 42}));

it('should eval exports replace', () => coco('exports = {42:42}').eql({42: 42}));

it('should eval exports = module.exports', () => coco('exports = module.exports = {42:42}').eql({42: 42}));

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

var answer = 42;

it('should provide global objects', () => coco('answer + answer', {answer}).to.eql(84));

it('should provide global objects to module syntax', () => coco('module.exports = typeof it + typeof chai', {it, chai}).to.eql('functionobject'));

it('should eval json', () => coco({42: 42}).eql({42: 42}));

it('should work without filename argument', () => expect(nodeEval('42')).to.eql(42));

it('should throw on bad json', function() {
    var path = 'file.json',
        content = '{"block":"page",}';

    expect(() => nodeEval(content, path)).to.throw(Error);
});

it('should throw on bad js', function() {
    var path = 'file.js',
        content = 'throw new Error("Hello")';

    expect(() => nodeEval(content, path)).to.throw('Hello');
});

it('should not throw on touching `module` in expression statements', function() {
    expect(() => nodeEval('module.zxqfox = {42:42}')).not.to.throw(Error);
});

it('should not polute global.module obj', function() {
    global.module = {42: 42};
    nodeEval('module.zxqfox = {42:42}');
    expect(global.module).to.eql({42: 42});
});

it('should return empty object if you touch `module` object but didn\'t export anything', function() {
    expect(nodeEval('module.zxqfox = {42:42}')).to.eql({});
});
