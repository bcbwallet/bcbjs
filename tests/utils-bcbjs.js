var assert = require('assert');

function getEthers(filename) {
    let bcbjs = require('../index');
    console.log('Loaded local bcbjs: ' + filename);
    assert.equal(bcbjs.platform, 'node', 'platform: ' + bcbjs.platform + ' != "node"');
    return bcbjs;
}

module.exports = getEthers;
