'use strict';

import { AbiCoder, defaultAbiCoder, formatSignature, formatParamType, parseSignature, parseParamType } from './abi-coder';
import { getAddress, getContractAddress, getIcapAddress, getEthAddressByAddress, getAddressByEthAddress } from './address';
import * as base64 from './base64';
import { BigNumber, bigNumberify } from './bignumber';
import { arrayify, concat, hexDataSlice, hexDataLength, hexlify, hexStripZeros, hexZeroPad, isHexString, padZeros, stripZeros } from './bytes';
import { hashMessage, id, namehash } from './hash';
import * as HDNode from './hdnode';
import { Interface } from './interface';
import { getJsonWalletAddress } from './json-wallet';
import { keccak256 } from './keccak256';
import { sha256 } from './sha2';
// import { keccak256 as solidityKeccak256, pack as solidityPack, sha256 as soliditySha256 } from './contract-types';
import { randomBytes } from './random-bytes';
import { getNetwork } from './networks';
import { checkProperties, deepCopy, defineReadOnly, resolveProperties, shallowCopy } from './properties';
import * as RLP from './rlp';
import { computeAddress, computePublicKey, recoverAddress, recoverPublicKey, verifyMessage } from './ed25519';
import { SigningKey } from './signing-key';
import { populateTransaction } from './transaction';
import { parse as parseTransaction, serialize as serializeTransaction } from './transaction';
import { formatBytes32String, parseBytes32String, toUtf8Bytes, toUtf8String } from './utf8';
import { commify, formatEther, parseEther, formatUnits, parseUnits } from './units';
import { fetchJson, poll } from './web';


////////////////////////
// Enums

import { SupportedAlgorithms } from './hmac';
import { UnicodeNormalizationForm } from './utf8';


////////////////////////
// Types

import { CoerceFunc, EventFragment, FunctionFragment, ParamType } from './abi-coder';
import { BigNumberish } from './bignumber';
import { Arrayish, Hexable, Signature } from './bytes';
import { Indexed, DeployDescription, EventDescription, FunctionDescription, LogDescription, TransactionDescription } from './interface';
import { Network, Networkish } from './networks';
import { Transaction, UnsignedTransaction } from './transaction';
import { ConnectionInfo, OnceBlockable, PollOptions } from './web';
import { EncryptOptions, ProgressCallback } from './secret-storage';
import { Wordlist } from './wordlist';

////////////////////////
// Exports

export {
    AbiCoder,
    defaultAbiCoder,
    formatSignature,
    formatParamType,
    parseSignature,
    parseParamType,

    RLP,

    fetchJson,
    getNetwork,

    checkProperties,
    deepCopy,
    defineReadOnly,
    resolveProperties,
    shallowCopy,

    arrayify,

    concat,
    padZeros,
    stripZeros,

    HDNode,
    SigningKey,

    Interface,

    base64,

    BigNumber,
    bigNumberify,

    hexlify,
    isHexString,
    hexStripZeros,
    hexZeroPad,
    hexDataLength,
    hexDataSlice,

    toUtf8Bytes,
    toUtf8String,

    formatBytes32String,
    parseBytes32String,

    hashMessage,
    namehash,
    id,

    getAddress,
    getIcapAddress,
    getContractAddress,

    formatEther,
    parseEther,

    formatUnits,
    parseUnits,

    commify,

    keccak256,
    sha256,

    randomBytes,

    // solidityPack,
    // solidityKeccak256,
    // soliditySha256,

    // splitSignature,
    // joinSignature,

    parseTransaction,
    populateTransaction,
    serializeTransaction,

    getJsonWalletAddress,

    computeAddress,
    computePublicKey,
    recoverAddress,
    recoverPublicKey,
    verifyMessage,
    getEthAddressByAddress,
    getAddressByEthAddress,

    poll,


    ////////////////////////
    // Enums

    SupportedAlgorithms,
    UnicodeNormalizationForm,


    ////////////////////////
    // Types

    CoerceFunc,
    EventFragment,
    FunctionFragment,
    ParamType,

    BigNumberish,

    Arrayish,
    Hexable,
    Signature,

    Indexed,

    DeployDescription,
    EventDescription,
    FunctionDescription,
    LogDescription,
    TransactionDescription,

    Network,
    Networkish,

    Transaction,
    UnsignedTransaction,

    ConnectionInfo,
    OnceBlockable,
    PollOptions,

    EncryptOptions,
    ProgressCallback,

    Wordlist,

}

