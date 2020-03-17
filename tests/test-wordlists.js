'use strict';

var assert = require('assert');

var utils = require('./utils');
var bcbjs = utils.getEthers(__filename);


function checkWordlist(filename, wordlist) {
    var words = utils.loadText(filename).split('\n');
    it('matches wordlists for ' + wordlist.locale, function() {
        for (var i = 0; i < 2048; i++) {
            var actual = wordlist.getWord(i);
            var expected = words[i];
            assert.equal(actual, expected, 'failed to match word ' + i + ': ' + words[i] + ' !=' + wordlist.getWord(i));
        }
    });
}

describe('Check Wordlists', function() {
    checkWordlist('./wordlist-generation/lang-en.txt', bcbjs.wordlists.en);
    checkWordlist('./wordlist-generation/lang-es.txt', bcbjs.wordlists.es);
    checkWordlist('./wordlist-generation/lang-fr.txt', bcbjs.wordlists.fr);
    checkWordlist('./wordlist-generation/lang-it.txt', bcbjs.wordlists.it);
    checkWordlist('./wordlist-generation/lang-ja.txt', bcbjs.wordlists.ja);
    checkWordlist('./wordlist-generation/lang-ko.txt', bcbjs.wordlists.ko);
    checkWordlist('./wordlist-generation/lang-zh_cn.txt', bcbjs.wordlists.zh);
    checkWordlist('./wordlist-generation/lang-zh_cn.txt', bcbjs.wordlists.zh_cn);
    checkWordlist('./wordlist-generation/lang-zh_tw.txt', bcbjs.wordlists.zh_tw);
});
