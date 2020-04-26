'use strict';

import BN from 'bn.js';
import { bigNumberify } from './bignumber';
import { stringToByte, arrayify, concat, hexlify, padZeros} from './bytes';
import { toUtf8Bytes } from './utf8';

// import { keccak256 as hashKeccak256 } from './keccak256';
// import { sha256 as hashSha256 } from './sha2';
import { RLP } from '.';
import { types } from 'util';

var regexBytes = new RegExp("^bytes([0-9]+)$");
var regexNumber = new RegExp("^(u?int)([0-9]*)$");
var regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");

var Zeros = '0000000000000000000000000000000000000000000000000000000000000000';

function _pack(version: number, type: string, value: any, isArray?: boolean): Uint8Array {
    if (type.endsWith('-decimal')) {
        let num = (parseFloat(value) * 1000000000).toFixed();
        let big = new BN.BN(num);
        return arrayify(big.toString(16));
    }
    if (type.startsWith('int') || type.startsWith('uint')) {
        let num = parseInt(value);
        if (version === 1) {
            let str = num.toString(16);
            if (str.length < 16) {
                str = str.padStart(16, '0');
            }
            return arrayify(str);
        } else {
            return arrayify(num.toString(16));
        }
    }
    switch(type) {
        case 'bn.Number':
        case 'Number':
        case 'big.Int':
            let v = bigNumberify(value);
            return arrayify('0x00' + v.toHexString().substr(2));
        case 'types.Address':
        case 'types.PubKey':
        case 'types.Hash':
        case 'types.Chromo':
        case 'smc.Address':
        case 'smc.PubKey':
        case 'smc.Hash':
        case 'smc.Chromo':
            return Uint8Array.from(stringToByte(value));
        case 'string':
            return toUtf8Bytes(value);
        case '[]byte':
            return arrayify(value);
        case 'bool':
            if (version === 1) {
                let val = (value === 'true' ? '1' : '0');
                return Uint8Array.from(stringToByte(val));
            } else {
                let val = (value === 'true' ? 1 : 0);
                return new Uint8Array(1).fill(val);
            }
    }

    var match =  type.match(regexNumber);
    if (match) {
        //var signed = (match[1] === 'int')
        let size = parseInt(match[2] || "256")
        if ((size % 8 != 0) || size === 0 || size > 256) {
            throw new Error('invalid number type - ' + type);
        }

        if (isArray) { size = 256; }

        value = bigNumberify(value).toTwos(size);

        return padZeros(value, size / 8);
    }

    match = type.match(regexBytes);
    if (match) {
        let size = parseInt(match[1]);
        if (String(size) != match[1] || size === 0 || size > 32) {
            throw new Error('invalid number type - ' + type);
        }
        if (arrayify(value).byteLength !== size) { throw new Error('invalid value for ' + type); }
        if (isArray) { return arrayify((value + Zeros).substring(0, 66)); }
        return value;
    }

    match = type.match(regexArray);
    if (match && Array.isArray(value)) {
        var baseType = match[1];
        var count = parseInt(match[2] || String(value.length));
        if (count != value.length) { throw new Error('invalid value for ' + type); }
        var result: Array<Uint8Array> = [];
        value.forEach(function(value) {
            result.push(_pack(version, baseType, value, true));
        });
        return concat(result);
    }

    throw new Error('unknown type - ' + type);
}

// @TODO: Array Enum

export function packParams(version: number, types: Array<string>, values: Array<any>) {
    if (types.length != values.length) { throw new Error('type/value count mismatch'); }
    var tight: Array<Uint8Array> = [];
    types.forEach(function(type, index) {
        if (version === 1) {
            tight.push(_pack(version, type, values[index]));
        } else {
            if (type.startsWith('[]') && ! type.startsWith('[]byte')) {
                let array: Array<any>;
                values[index].forEach(function(e: any) {
                    array.push(_pack(version, type, e));
                });
                tight.push(arrayify(RLP.encode(array)));
            } else {
                let pack = _pack(version, type, values[index]);
                tight.push(arrayify(RLP.encode(hexlify(pack))));
            }
        }
    });
    if (version === 1) {
        return RLP.encode(RLP.encode(tight));
    } else {
        return tight;
    }
}

export function packBytesParam(version: number, value: Uint8Array) {
    var tight: Array<Uint8Array> = [];
    if (version === 1) {
        tight.push(value);
        return RLP.encode(RLP.encode(tight));
    } else {
        tight.push(arrayify(RLP.encode(hexlify(value))));
        return tight;
    }
}

// export function keccak256(types: Array<string>, values: Array<any>) {
//     return hashKeccak256(pack(types, values));
// }

// export function sha256(types: Array<string>, values: Array<any>) {
//     return hashSha256(pack(types, values));
// }
