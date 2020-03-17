'use strict';

import { eddsa as EdDSA } from 'elliptic';

import hash from 'hash.js';
import { sha3_256, keccak_256 } from 'js-sha3';
import { Base58 } from './basex';
// import { getAddress } from './address';

import { concat, arrayify, hexlify, hexZeroPad } from './bytes';
import { hashMessage } from './hash';
// import { keccak256 } from './keccak256';
import { defineReadOnly } from './properties';

import * as errors from '../errors';

///////////////////////////////
// Imported Types

import { Arrayish, Signature } from './bytes';
import { check } from './wordlist';
// import { check } from './wordlist';

///////////////////////////////

let _curve: EdDSA = null
function getCurve() {
    if (!_curve) {
        _curve = new EdDSA('ed25519');
    }
    return _curve;
}

export class EdKeyPair {
    readonly privateKey: string;
    readonly privateKeyBytes: Uint8Array;

    readonly publicKey: string;
    readonly publicKeyBytes: Uint8Array;

    constructor(privateKey: Arrayish | string) {
        let keyPair = getCurve().keyFromSecret(arrayify(privateKey));

        defineReadOnly(this, 'privateKeyBytes', keyPair.getSecret());
        defineReadOnly(this, 'privateKey', hexlify(this.privateKeyBytes));
        defineReadOnly(this, 'publicKey', '0x' + keyPair.getPublic('hex'));
        defineReadOnly(this, 'publicKeyBytes', arrayify(this.publicKey));
    }

    sign(message: Arrayish | string): string {
        let keyPair = getCurve().keyFromSecret(this.privateKeyBytes);
        let signature = keyPair.sign(arrayify(message)).toHex();
        return '0x' + signature;
    }

    computeSharedSecret(otherKey: Arrayish | string): string {
        let keyPair = getCurve().keyFromSecret(this.privateKeyBytes);
        let otherKeyPair = getCurve().keyFromPublic(arrayify(computePublicKey(otherKey)));
        // return hexZeroPad('0x' + keyPair.derive(otherKeyPair.getPublic()).toString(16), 32);
        return '';
    }

    _addPoint(other: Arrayish | string): string {
        let p0 =  getCurve().keyFromPublic(this.publicKeyBytes);
        let p1 =  getCurve().keyFromPublic(arrayify(other));
        return "0x" + p0.pub.add(p1.pub).encodeCompressed("hex");
    }
}

export function computePublicKey(key: Arrayish | string, compressed?: boolean): string {

    let bytes = arrayify(key);

    if (bytes.length === 32) {
        let keyPair: EdKeyPair = new EdKeyPair(bytes);
        if (compressed) {
            // return keyPair.compressedPublicKey;
        }
        return keyPair.publicKey;

    } else if (bytes.length === 33) {
        if (compressed) { return hexlify(bytes); }
        return '0x' + getCurve().keyFromPublic(bytes).getPublic('hex');

    } else if (bytes.length === 65) {
        if (!compressed) { return hexlify(bytes); }
        return '0x' + getCurve().keyFromPublic(bytes).getPublic('hex');
    }

    errors.throwError('invalid public or private key', errors.INVALID_ARGUMENT, { arg: 'key', value: '[REDACTED]' });
    return null;
}

// function bufferToHex(buffer: any) { // buffer is an ArrayBuffer
//     return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
//   }

// function bufferToHex (buffer: any) {
//     return Array
//         .from (new Uint8Array (buffer))
//         .map (b => b.toString (16).padStart (2, "0"))
//         .join ("");
// }

export function computeAddress(chainId: string, pubkey: Arrayish | string): string {
    let pubkeyBytes = arrayify(pubkey);

    let chId = new Uint8Array(chainId.length);
    for (let i = 0; i < chainId.length; i++) {
        chId[i] = chainId.charCodeAt(i);
    }
    let tmp = new Uint8Array(chId.length + pubkeyBytes.length);
    tmp.set(chId);
    tmp.set(pubkeyBytes, chId.length);
    let sha3 = sha3_256.update(tmp).digest();
    let t = hash.ripemd160().update(sha3).digest();
    let hash160 = arrayify(hash.utils.toHex(t));
    t = hash.ripemd160().update(hash160).digest();
    let checksum = arrayify(hash.utils.toHex(t));
    let comb = concat([hash160, checksum.slice(0, 4)]);
    let b58 = Base58.encode(comb);
    return chainId + b58;
}

export function recoverPublicKey(digest: Arrayish | string, signature: Signature | string): string {
    // let sig = splitSignature(signature);
    // let rs = { r: arrayify(sig.r), s: arrayify(sig.s) };
    return '0x';
}

export function recoverAddress(chainId: string, digest: Arrayish | string, signature: Signature | string): string {
    return computeAddress(chainId, recoverPublicKey(arrayify(digest), signature));
}

export function verifyMessage(chainId: string, message: Arrayish | string, signature: Signature | string): string {
    return recoverAddress(chainId, hashMessage(message), signature);
}
