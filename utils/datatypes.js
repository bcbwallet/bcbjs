'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bn_js_1 = __importDefault(require("bn.js"));
var bignumber_1 = require("./bignumber");
var bytes_1 = require("./bytes");
var utf8_1 = require("./utf8");
// import { keccak256 as hashKeccak256 } from './keccak256';
// import { sha256 as hashSha256 } from './sha2';
var _1 = require(".");
var regexBytes = new RegExp("^bytes([0-9]+)$");
var regexNumber = new RegExp("^(u?int)([0-9]*)$");
var regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");
var Zeros = '0000000000000000000000000000000000000000000000000000000000000000';
function _pack(version, type, value, isArray) {
    if (value == null) {
        return new Uint8Array(0);
    }
    if (type.endsWith('-decimal')) {
        var num = (parseFloat(value) * 1000000000).toFixed();
        var big = new bn_js_1.default.BN(num);
        return bytes_1.arrayify(big.toString(16));
    }
    if (type.startsWith('int') || type.startsWith('uint')) {
        var num = parseInt(value);
        if (version === 1) {
            var str = num.toString(16);
            if (str.length < 16) {
                str = str.padStart(16, '0');
            }
            return bytes_1.arrayify(str);
        }
        else {
            return bytes_1.arrayify(num.toString(16));
        }
    }
    switch (type) {
        case 'bn.Number':
        case 'Number':
        case 'big.Int':
            var v = bignumber_1.bigNumberify(value);
            return bytes_1.arrayify('0x00' + v.toHexString().substr(2));
        case 'types.Address':
        case 'types.PubKey':
        case 'types.Hash':
        case 'types.Chromo':
        case 'smc.Address':
        case 'smc.PubKey':
        case 'smc.Hash':
        case 'smc.Chromo':
            return Uint8Array.from(bytes_1.stringToByte(value));
        case 'string':
            return utf8_1.toUtf8Bytes(value);
        case '[]byte':
            return bytes_1.arrayify(value);
        case 'bool':
            if (version === 1) {
                var val = (value === 'true' ? '1' : '0');
                return Uint8Array.from(bytes_1.stringToByte(val));
            }
            else {
                var val = (value === 'true' ? 1 : 0);
                return new Uint8Array(1).fill(val);
            }
    }
    var match = type.match(regexNumber);
    if (match) {
        //var signed = (match[1] === 'int')
        var size = parseInt(match[2] || "256");
        if ((size % 8 != 0) || size === 0 || size > 256) {
            throw new Error('invalid number type - ' + type);
        }
        if (isArray) {
            size = 256;
        }
        value = bignumber_1.bigNumberify(value).toTwos(size);
        return bytes_1.padZeros(value, size / 8);
    }
    match = type.match(regexBytes);
    if (match) {
        var size = parseInt(match[1]);
        if (String(size) != match[1] || size === 0 || size > 32) {
            throw new Error('invalid number type - ' + type);
        }
        if (bytes_1.arrayify(value).byteLength !== size) {
            throw new Error('invalid value for ' + type);
        }
        if (isArray) {
            return bytes_1.arrayify((value + Zeros).substring(0, 66));
        }
        return value;
    }
    match = type.match(regexArray);
    if (match && Array.isArray(value)) {
        var baseType = match[1];
        var count = parseInt(match[2] || String(value.length));
        if (count != value.length) {
            throw new Error('invalid value for ' + type);
        }
        var result = [];
        value.forEach(function (value) {
            result.push(_pack(version, baseType, value, true));
        });
        return bytes_1.concat(result);
    }
    throw new Error('unknown type - ' + type);
}
// @TODO: Array Enum
function packParams(version, types, values) {
    if (types.length != values.length) {
        throw new Error('type/value count mismatch');
    }
    var tight = [];
    types.forEach(function (type, index) {
        if (version === 1) {
            tight.push(_pack(version, type, values[index]));
        }
        else {
            if (type.startsWith('[]') && !type.startsWith('[]byte')) {
                var array_1;
                values[index].forEach(function (e) {
                    array_1.push(_pack(version, type, e));
                });
                tight.push(bytes_1.arrayify(_1.RLP.encode(array_1)));
            }
            else {
                var pack = _pack(version, type, values[index]);
                tight.push(bytes_1.arrayify(_1.RLP.encode(bytes_1.hexlify(pack))));
            }
        }
    });
    if (version === 1) {
        return _1.RLP.encode(_1.RLP.encode(tight));
    }
    else {
        return tight;
    }
}
exports.packParams = packParams;
function packBytesParam(version, value) {
    var tight = [];
    if (version === 1) {
        tight.push(value);
        return _1.RLP.encode(_1.RLP.encode(tight));
    }
    else {
        tight.push(bytes_1.arrayify(_1.RLP.encode(bytes_1.hexlify(value))));
        return tight;
    }
}
exports.packBytesParam = packBytesParam;
