var chai = require('chai');
var expect = chai.expect;
chai.should();// WTF chaiAsPromised !??


var nodeEval = require('../');

function coco(content, context) {
    var path;
    if (typeof content === 'string') {
        path = 'file.js';
    } else {
        path = 'file.json';
        content = JSON.stringify(content);
    }
    return expect(nodeEval(content, path, context)).to;
}

it('should eval simple expression', () => coco('({42:42})').eql({42: 42}));

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

it('should provide global objects', () => coco('module.exports = typeof chai === "object"', {chai}).to.be.true);

it('should eval json', () => coco({42: 42}).eql({42: 42}));

it('should throw on bad json', function() {
    var path = 'file.json',
        content = '{"block":"page",}';

    expect(nodeEval(content, path)).to.throw(Error);
});
