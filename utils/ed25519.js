'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var elliptic_1 = require("elliptic");
var hash_js_1 = __importDefault(require("hash.js"));
var js_sha3_1 = require("js-sha3");
var basex_1 = require("./basex");
// import { getAddress } from './address';
var bytes_1 = require("./bytes");
var hash_1 = require("./hash");
// import { keccak256 } from './keccak256';
var properties_1 = require("./properties");
var errors = __importStar(require("../errors"));
// import { check } from './wordlist';
///////////////////////////////
var _curve = null;
function getCurve() {
    if (!_curve) {
        _curve = new elliptic_1.eddsa('ed25519');
    }
    return _curve;
}
var EdKeyPair = /** @class */ (function () {
    function EdKeyPair(privateKey) {
        var keyPair = getCurve().keyFromSecret(bytes_1.arrayify(privateKey));
        properties_1.defineReadOnly(this, 'privateKeyBytes', keyPair.getSecret());
        properties_1.defineReadOnly(this, 'privateKey', bytes_1.hexlify(this.privateKeyBytes));
        properties_1.defineReadOnly(this, 'publicKey', '0x' + keyPair.getPublic('hex'));
        properties_1.defineReadOnly(this, 'publicKeyBytes', bytes_1.arrayify(this.publicKey));
    }
    EdKeyPair.prototype.sign = function (message) {
        var keyPair = getCurve().keyFromSecret(this.privateKeyBytes);
        var signature = keyPair.sign(bytes_1.arrayify(message)).toHex();
        return '0x' + signature;
    };
    EdKeyPair.prototype.computeSharedSecret = function (otherKey) {
        var keyPair = getCurve().keyFromSecret(this.privateKeyBytes);
        var otherKeyPair = getCurve().keyFromPublic(bytes_1.arrayify(computePublicKey(otherKey)));
        // return hexZeroPad('0x' + keyPair.derive(otherKeyPair.getPublic()).toString(16), 32);
        return '';
    };
    EdKeyPair.prototype._addPoint = function (other) {
        var p0 = getCurve().keyFromPublic(this.publicKeyBytes);
        var p1 = getCurve().keyFromPublic(bytes_1.arrayify(other));
        return "0x" + p0.pub.add(p1.pub).encodeCompressed("hex");
    };
    return EdKeyPair;
}());
exports.EdKeyPair = EdKeyPair;
function computePublicKey(key, compressed) {
    var bytes = bytes_1.arrayify(key);
    if (bytes.length === 32) {
        var keyPair = new EdKeyPair(bytes);
        if (compressed) {
            // return keyPair.compressedPublicKey;
        }
        return keyPair.publicKey;
    }
    else if (bytes.length === 33) {
        if (compressed) {
            return bytes_1.hexlify(bytes);
        }
        return '0x' + getCurve().keyFromPublic(bytes).getPublic('hex');
    }
    else if (bytes.length === 65) {
        if (!compressed) {
            return bytes_1.hexlify(bytes);
        }
        return '0x' + getCurve().keyFromPublic(bytes).getPublic('hex');
    }
    errors.throwError('invalid public or private key', errors.INVALID_ARGUMENT, { arg: 'key', value: '[REDACTED]' });
    return null;
}
exports.computePublicKey = computePublicKey;
// function bufferToHex(buffer: any) { // buffer is an ArrayBuffer
//     return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
//   }
// function bufferToHex (buffer: any) {
//     return Array
//         .from (new Uint8Array (buffer))
//         .map (b => b.toString (16).padStart (2, "0"))
//         .join ("");
// }
function computeAddress(chainId, pubkey) {
    var pubkeyBytes = bytes_1.arrayify(pubkey);
    var chId = new Uint8Array(chainId.length);
    for (var i = 0; i < chainId.length; i++) {
        chId[i] = chainId.charCodeAt(i);
    }
    var tmp = new Uint8Array(chId.length + pubkeyBytes.length);
    tmp.set(chId);
    tmp.set(pubkeyBytes, chId.length);
    var sha3 = js_sha3_1.sha3_256.update(tmp).digest();
    var t = hash_js_1.default.ripemd160().update(sha3).digest();
    var hash160 = bytes_1.arrayify(hash_js_1.default.utils.toHex(t));
    t = hash_js_1.default.ripemd160().update(hash160).digest();
    var checksum = bytes_1.arrayify(hash_js_1.default.utils.toHex(t));
    var comb = bytes_1.concat([hash160, checksum.slice(0, 4)]);
    var b58 = basex_1.Base58.encode(comb);
    return chainId + b58;
}
exports.computeAddress = computeAddress;
function recoverPublicKey(digest, signature) {
    // let sig = splitSignature(signature);
    // let rs = { r: arrayify(sig.r), s: arrayify(sig.s) };
    return '0x';
}
exports.recoverPublicKey = recoverPublicKey;
function recoverAddress(chainId, digest, signature) {
    return computeAddress(chainId, recoverPublicKey(bytes_1.arrayify(digest), signature));
}
exports.recoverAddress = recoverAddress;
function verifyMessage(chainId, message, signature) {
    return recoverAddress(chainId, hash_1.hashMessage(message), signature);
}
exports.verifyMessage = verifyMessage;
