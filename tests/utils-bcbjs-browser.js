var assert = require('assert');

function getEthers(filename) {
    var bcbjs = global.bcbjs
    if (!bcbjs) { return undefined; }
    console.log('Using global bcbjs; ' + filename);
    assert.equal(bcbjs.platform, 'browser', 'platform: ' + bcbjs.platform + ' != "browser"');
    return bcbjs;
}

module.exports = getEthers;
