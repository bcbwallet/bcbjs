"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../constants");
var errors = __importStar(require("../errors"));
var address_1 = require("./address");
var bignumber_1 = require("./bignumber");
var bytes_1 = require("./bytes");
var properties_1 = require("./properties");
var RLP = __importStar(require("./rlp"));
var basex_1 = require("./basex");
var Base64 = __importStar(require("./base64"));
var standard_coder_1 = require("./standard-coder");
var abi_coder_1 = require("./abi-coder");
///////////////////////////////
// Imported Types
var bytes_2 = require("./bytes");
var abstract_provider_1 = require("../providers/abstract-provider");
///////////////////////////////
function handleAddress(value) {
    if (value === '0x') {
        return null;
    }
    return address_1.getAddress(value);
}
function handleNumber(value) {
    if (value === '0x') {
        return constants_1.Zero;
    }
    return bignumber_1.bigNumberify(value);
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
var allowedTransactionKeys = {
    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true, note: true
};
function serialize(transaction) {
    // checkProperties(transaction, allowedTransactionKeys);
    var raw = [];
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
    var v = bignumber_1.bigNumberify(transaction.nonce);
    raw.push(v.toHexString());
    // gasLimit
    v = bignumber_1.bigNumberify(transaction.gasLimit);
    raw.push(v.toHexString());
    // note
    raw.push(bytes_1.hexlify(bytes_2.stringToByte(transaction.note)));
    // convert deprecated transaction call format to new
    if (Array.isArray(transaction.contractCall)) {
        var calls_1 = [];
        transaction.contractCall.forEach(function (call) {
            var newCallMethod;
            var newCallParams = [];
            var newCallContract = call.contractAddr;
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
            calls_1.push({ contract: newCallContract, method: newCallMethod, params: newCallParams });
        });
        transaction.calls = calls_1;
        delete transaction.contractCall;
    }
    if (!Array.isArray(transaction.calls)) {
        errors.throwError('invalid calls', errors.INVALID_ARGUMENT, { arg: ('calls'), value: transaction.calls });
    }
    if (transaction.version === 1 && transaction.calls.length > 1) {
        errors.throwError('too many calls', errors.INVALID_ARGUMENT, { arg: ('calls'), value: transaction.calls });
    }
    var methodCalls = [];
    transaction.calls.forEach(function (call, index) {
        var fragment;
        var methodId;
        // default to standard call
        if (call.type === undefined) {
            call.type = 'standard';
        }
        if (call.type === 'bvm') {
            // if method is missing, it's a new contract
            methodId = call.method === undefined ? '0x00000000' : '0xffffffff';
        }
        else if (call.type === 'standard') {
            fragment = standard_coder_1.parseStandardFunction(call.method);
            methodId = standard_coder_1.encodeStandardSignature(fragment);
        }
        else {
            errors.throwError('invalid type', errors.INVALID_ARGUMENT, { arg: ('calls[' + index + '].type'), value: call.type });
        }
        var items = [];
        if (transaction.version === 1) {
            items.push(bytes_1.hexlify(RLP.encode(methodId)));
        }
        else {
            items.push(bytes_1.hexlify(bytes_2.stringToByte(call.contract)));
            items.push(methodId);
        }
        if (call.type === 'standard') {
            var result = standard_coder_1.packStandardParams(transaction.version, fragment.inputs, call.params);
            items.push(result);
        }
        else if (call.type === 'bvm') {
            if (call.method === undefined) {
                // new contract
                var tight_1 = [];
                call.params.forEach(function (param) {
                    tight_1.push(bytes_1.arrayify(RLP.encode(param)));
                });
                items.push(tight_1);
            }
            else {
                var fragment_1 = abi_coder_1.parseSignature(call.method);
                var result = standard_coder_1.packStandardBytesParam(transaction.version, bytes_2.concat([abi_coder_1.encodeSignature(call.method), abi_coder_1.defaultAbiCoder.encode(fragment_1.inputs, call.params)]));
                items.push(result);
            }
        }
        if (transaction.version === 1) {
            raw.push(bytes_1.hexlify(bytes_2.stringToByte(call.contract)));
            raw.push(bytes_1.hexlify(RLP.encodeAsList(items)));
        }
        else {
            methodCalls.push(items);
        }
    });
    if (transaction.version !== 1) {
        raw.push(methodCalls);
    }
    return RLP.encode(raw);
}
exports.serialize = serialize;
function encodeTransaction(chainId, version, unsignedTransaction, signature, pubkey) {
    var signedTransaction = chainId + '<tx>.v' + version.toString() + '.';
    var encoder = version >= 3 ? Base64 : basex_1.Base58;
    signedTransaction += encoder.encode(unsignedTransaction);
    signedTransaction += '.<1>.';
    var sig = [];
    sig.push(bytes_1.hexlify(bytes_2.stringToByte('ed25519')));
    sig.push(pubkey);
    sig.push(signature);
    signedTransaction += encoder.encode(bytes_1.hexlify(RLP.encode(sig)));
    return signedTransaction;
}
exports.encodeTransaction = encodeTransaction;
function parse(rawTransaction) {
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
exports.parse = parse;
function populateTransaction(transaction, provider, from) {
    if (!abstract_provider_1.Provider.isProvider(provider)) {
        errors.throwError('missing provider', errors.INVALID_ARGUMENT, {
            argument: 'provider',
            value: provider
        });
    }
    properties_1.checkProperties(transaction, allowedTransactionKeys);
    var tx = properties_1.shallowCopy(transaction);
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
        var estimate = properties_1.shallowCopy(tx);
        estimate.from = from;
        tx.gasLimit = provider.estimateGas(estimate);
    }
    if (tx.chainId == null) {
        tx.chainId = provider.getNetwork().then(function (network) { return network.chain; });
    }
    return properties_1.resolveProperties(tx);
}
exports.populateTransaction = populateTransaction;
