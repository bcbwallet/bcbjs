var fs = require('fs');
var bcbjs = require('../../');

var words = fs.readFileSync('./lang-fr.txt').toString();
console.log(bcbjs.utils.id(words));

words = words.split('\x0a');

var chars = {};
var charsByte = {};

var data = words.map((word) => {
    if (!word) { return ''; }
    word =  word[0].toUpperCase() + word.substring(1);
    return word;
}).join('');

data = bcbjs.utils.toUtf8Bytes(data);

var output= []

for (var i = 0; i < data.length; i++) {
    var c = data[i];
    chars[data[i]] = (chars[data[i]] || 0) + 1;
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 123)) {
        output.push(c);
    } else if (c === 128) {
        output.push(0x31);
    } else if (c === 129) {
        output.push(0x30);
    } else if (c === 204) {
        output.push(0x32);
    } else {
        console.log(c);
    }
}

//console.log(chars);

output = bcbjs.utils.toUtf8String(output);
output = output.replace(/21/g, '-').replace(/20/g, '/')

console.log('Output:', output);
