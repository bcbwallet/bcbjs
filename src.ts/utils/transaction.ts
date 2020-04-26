
import { Zero } from '../constants';

import * as errors from '../errors';

import { recoverAddress } from './ed25519';

import { getAddress } from './address';
import BN from 'bn.js';
import { BigNumber, bigNumberify } from './bignumber';
import { arrayify, hexlify, hexZeroPad, stripZeros, padZeros, } from './bytes';
import { packParams, packBytesParam } from './datatypes';

import { keccak256 } from './keccak256';
import { checkProperties, resolveProperties, shallowCopy } from './properties';

import * as RLP from './rlp';
import { Base58 } from './basex';
import * as Base64 from './base64';

import { sha3_256, keccak_256 } from 'js-sha3';

import { defaultAbiCoder, encodeSignature } from './abi-coder';

///////////////////////////////
// Imported Types

import { stringToByte, concat, Arrayish, Signature } from './bytes';
import { BigNumberish } from './bignumber';

import { Provider } from '../providers/abstract-provider';
import { ParamType } from '.';
import { type } from 'os';

///////////////////////////////
// Exported Types

export type UnsignedTransaction = {
    version?: number;
    to?: string;
    nonce?: string;

    gasLimit?: string;
    gasPrice?: string;

    data?: Arrayish;
    value?: string;
    chainId?: string;
    note?: string;
    calls?: Array<any>;
    contractCall?: Array<any>;
}

export interface Transaction {
    version?: number;

    hash?: string;

    to?: string;
    from?: string;
    nonce: string;

    gasLimit: string;
    gasPrice: string;

    data: string;
    value: string;
    chainId: string;
    note: string;
    calls?: any;
    contractCall?: any;
}

///////////////////////////////

function handleAddress(value: string): string {
    if (value === '0x') { return null; }
    return getAddress(value);
}

function handleNumber(value: string): BigNumber {
    if (value === '0x') { return Zero; }
    return bigNumberify(value);
}

// const transactionFields = [
//     { name: 'nonce',    maxLength: 32 },
//     { name: 'gasPrice', maxLength: 32 },
//     { name: 'gasLimit', maxLength: 32 },
//     { name: 'to',       maxLength: 40 },
//     { name: 'value',    maxLength: 32 },
//     { name: 'note',     maxLength: 256 },
//     { name: 'data' },
// ];

const allowedTransactionKeys: { [ key: string ]: boolean } = {
    chainId: true, data: true, gasLimit: true, gasPrice:true, nonce: true, to: true, value: true, note: true
}

function encodeFunctionSignature(method: string): string {
    let hash = sha3_256.update(method).digest();
    return hexlify(hash.slice(0, 4));
}

function splitParamTypes(method: string): Array<string> {
    let start = method.indexOf('(');
    let end = method.indexOf(')');
    let typeStr = method.substr(start + 1, end - start -1);
    if (typeStr.length > 0) {
        return typeStr.split(',');
    } else {
        return [];
    }
}

export function serialize(transaction: UnsignedTransaction): string {
    // checkProperties(transaction, allowedTransactionKeys);

    let raw: Array<string | Uint8Array | Array<any> > = [];

    // transactionFields.forEach(function(fieldInfo) {
    //     let value = (<any>transaction)[fieldInfo.name] || ([]);
    //     value = arrayify(hexlify(value));

    //     // Fixed-width field
    //     if (fieldInfo.length && value.length !== fieldInfo.length && value.length > 0) {
    //         errors.throwError('invalid length for ' + fieldInfo.name, errors.INVALID_ARGUMENT, { arg: ('transaction' + fieldInfo.name), value: value });
    //     }

    //     // Variable-width (with a maximum)
    //     if (fieldInfo.maxLength) {
    //         value = stripZeros(value);
    //         if (value.length > fieldInfo.maxLength) {
    //             errors.throwError('invalid length for ' + fieldInfo.name, errors.INVALID_ARGUMENT, { arg: ('transaction' + fieldInfo.name), value: value });
    //         }
    //     }

    //     raw.push(hexlify(value));
    // });

    // nonce
    let v = bigNumberify(transaction.nonce);
    raw.push(v.toHexString());
    // gasLimit
    v = bigNumberify(transaction.gasLimit);
    raw.push(v.toHexString());
    // note
    raw.push(hexlify(stringToByte(transaction.note)));

    // convert deprecated transaction call format to new
    if (Array.isArray(transaction.contractCall)) {
        let calls: Array<any> = [];
        transaction.contractCall.forEach(function (call) {
            let newCallMethod: any;
            let newCallParams: Array<any> = [];
            let newCallContract: any = call.contractAddr;
            newCallMethod = call.methodName + '(';
            for (var i = 0; i < call.methodParams.length; i++) {
                newCallMethod += call.methodParams[i].type;
                if (i < call.methodParams.length - 1)
                    newCallMethod += ',';
                newCallParams.push(call.methodParams[i].value);
            }
            newCallMethod += ')';
            if (call.methodRet !== undefined) {
                newCallMethod += call.methodRet;
            }
            calls.push({ contract: newCallContract, method: newCallMethod, params: newCallParams});
        });
        transaction.calls = calls;
        delete transaction.contractCall;
    }

    if (!Array.isArray(transaction.calls)) {
        errors.throwError('invalid calls', errors.INVALID_ARGUMENT, { arg: ('calls'), value: transaction.calls });
    }

    if (transaction.version === 1 && transaction.calls.length > 1) {
        errors.throwError('too many calls', errors.INVALID_ARGUMENT, { arg: ('calls'), value: transaction.calls });
    }

    let methodCalls: Array<string | Uint8Array | Array<any> > = [];

    transaction.calls.forEach(function(call, index) {
        let methodId;
        // default to standard call
        if (call.type === undefined) {
            call.type = 'standard';
        }
        if (call.type === 'bvm') {
            methodId = '0xffffffff';
        } else if (call.type === 'standard') {
            methodId = encodeFunctionSignature(call.method);
        } else {
            errors.throwError('invalid type', errors.INVALID_ARGUMENT, { arg: ('calls[' + index + '].type'), value: call.type });
        }

        let items: Array<string | Uint8Array | Array<any> > = [];
        if (transaction.version === 1) {
            items.push(hexlify(RLP.encode(methodId)));
        } else {
            items.push(hexlify(stringToByte(call.contract)));
            items.push(methodId);
        }

        let types = splitParamTypes(call.method);
        let params = call.params;
        if (call.type === 'standard') {
            let result = packParams(transaction.version, types, params);
            items.push(result);
        } else if (call.type === 'bvm') {
            let result = packBytesParam(transaction.version,
                concat([ encodeSignature(call.method), defaultAbiCoder.encode(types, params) ]));
            items.push(result);
        }
        if (transaction.version === 1) {
            raw.push(hexlify(stringToByte(call.contract)));
            raw.push(hexlify(RLP.encodeAsList(items)));
        } else {
            methodCalls.push(items);
        }
    });

    if (transaction.version !== 1) {
        raw.push(methodCalls);
    }

    return RLP.encode(raw);
}

export function encodeTransaction(chainId: string, version: number, unsignedTransaction: string, signature: Arrayish, pubkey: Arrayish): string {
    let signedTransaction: string = chainId + '<tx>.v' + version.toString() + '.';
    let encoder = version >= 3 ? Base64 : Base58;
    signedTransaction += encoder.encode(unsignedTransaction);
    signedTransaction += '.<1>.';
    let sig: Array<any> = [];
    sig.push(hexlify(stringToByte('ed25519')));
    sig.push(pubkey);
    sig.push(signature);
    signedTransaction += encoder.encode(hexlify(RLP.encode(sig)));
    return signedTransaction;
}

export function parse(rawTransaction: Arrayish): Transaction {
    return null;
    // let transaction = RLP.decode(rawTransaction);
    // if (transaction.length !== 9 && transaction.length !== 6) {
    //     errors.throwError('invalid raw transaction', errors.INVALID_ARGUMENT, { arg: 'rawTransactin', value: rawTransaction });
    // }

    // let tx: Transaction = {
    //     // nonce:    handleNumber(transaction[0]).toNumber(),
    //     // gasPrice: handleNumber(transaction[1]),
    //     // gasLimit: handleNumber(transaction[2]),
    //     // to:       handleAddress(transaction[3]),
    //     // value:    handleNumber(transaction[4]),
    //     // data:     transaction[5],
    //     // chainId:  ''
    // };

    // // Legacy unsigned transaction
    // if (transaction.length === 6) { return tx; }

    // try {
    //     tx.v = bigNumberify(transaction[6]).toNumber();

    // } catch (error) {
    //     errors.info(error);
    //     return tx;
    // }

    // tx.r = hexZeroPad(transaction[7], 32);
    // tx.s = hexZeroPad(transaction[8], 32);

    // if (bigNumberify(tx.r).isZero() && bigNumberify(tx.s).isZero()) {
    //     // EIP-155 unsigned transaction
    //     // tx.chainId = tx.v;
    //     tx.v = 0;

    // } else {
    //     // Signed Tranasaction

    //     // tx.chainId = Math.floor((tx.v - 35) / 2);
    //     // if (tx.chainId < 0) { tx.chainId = 0; }

    //     let recoveryParam = tx.v - 27;

    //     let raw = transaction.slice(0, 6);

    //     // if (tx.chainId !== 0) {
    //     //     raw.push(hexlify(tx.chainId));
    //     //     raw.push('0x');
    //     //     raw.push('0x');
    //     //     recoveryParam -= tx.chainId * 2 + 8;
    //     // }

    //     let digest = keccak256(RLP.encode(raw));
    //     try {
    //         tx.from = recoverAddress(tx.chainId, digest, { r: hexlify(tx.r), s: hexlify(tx.s), recoveryParam: recoveryParam });
    //     } catch (error) {
    //         errors.info(error);
    //     }

    //     tx.hash = keccak256(rawTransaction);
    // }

    // return tx;
}

export function populateTransaction(transaction: any, provider: Provider, from: string | Promise<string>): Promise<Transaction> {

    if (!Provider.isProvider(provider)) {
        errors.throwError('missing provider', errors.INVALID_ARGUMENT, {
            argument: 'provider',
            value: provider
        });
    }

    checkProperties(transaction, allowedTransactionKeys);

    let tx = shallowCopy(transaction);

    if (tx.to != null) {
        tx.to = provider.resolveName(tx.to);
    }

    if (tx.gasPrice == null) {
        tx.gasPrice = provider.getGasPrice();
    }

    if (tx.nonce == null) {
        tx.nonce = provider.getTransactionCount(from).toString();
    }

    if (tx.gasLimit == null) {
        let estimate = shallowCopy(tx);
        estimate.from = from;
        tx.gasLimit = provider.estimateGas(estimate);
    }

    if (tx.chainId == null) {
        tx.chainId = provider.getNetwork().then((network) => network.chain);
    }

    return resolveProperties(tx);
}
