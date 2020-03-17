'use strict';

import { arrayify, concat, hexlify } from './utils/bytes';
import { BigNumber } from './utils/bignumber';
import { hashMessage } from './utils/hash';
import { defaultPath, HDNode, entropyToMnemonic, fromMnemonic } from './utils/hdnode';
import { isSecretStorageWallet } from './utils/json-wallet';
import { keccak256 } from './utils/keccak256';
import { defineReadOnly, resolveProperties, shallowCopy } from './utils/properties';
import { randomBytes } from './utils/random-bytes';
import * as secretStorage from './utils/secret-storage';
import { SigningKey } from './utils/signing-key';
import { serialize as serializeTransaction, encodeTransaction } from './utils/transaction';
import { Wordlist } from './utils/wordlist';

// Imported Abstracts
import { Signer as AbstractSigner } from './abstract-signer';
import { Provider } from './providers/abstract-provider';

// Imported Types
import { encryptSecret, decryptSecret, ProgressCallback } from './utils/secret-storage';
import { Arrayish } from './utils/bytes';
import { BlockTag, TransactionRequest, TransactionResponse } from './providers/abstract-provider';

import * as errors from './errors';
import { computeAddress } from './utils';

export class Wallet extends AbstractSigner {

    provider: Provider;

    readonly network: string;
    private readonly signingKey: SigningKey;

    constructor(privateKey: SigningKey | HDNode | Arrayish, network?: string, provider?: Provider) {
        super();
        errors.checkNew(this, Wallet);

        // Make sure we have a valid signing key
        if (SigningKey.isSigningKey(privateKey)) {
            defineReadOnly(this, "network", privateKey.network);
            defineReadOnly(this, 'signingKey', privateKey);
        } else {
            if (network) {
                defineReadOnly(this, "network", network);
                defineReadOnly(this, 'signingKey', new SigningKey(privateKey, network));
            } else {
                errors.throwError('invalid argument', errors.INVALID_ARGUMENT, { argument: 'network', value: network });
            }
        }

        defineReadOnly(this, 'provider', provider);
    }

    get address(): string { 
        return computeAddress(this.network, this.signingKey.publicKey); }

    get mnemonic(): string { return this.signingKey.mnemonic; }
    get path(): string { return this.signingKey.path; }

    get privateKey(): string { return this.signingKey.privateKey; }

    get publicKey(): string { return this.signingKey.publicKey; }

    /**
     *  Create a new instance of this Wallet connected to provider.
     */
    connect(network: string, provider: Provider): Wallet {
        if (!(Provider.isProvider(provider))) {
            errors.throwError('invalid provider', errors.INVALID_ARGUMENT, { argument: 'provider', value: provider });
        }
        return new Wallet(this.signingKey, network, provider);
    }

    setProvider(provider: Provider): Wallet {
        if (!(Provider.isProvider(provider))) {
            errors.throwError('invalid provider', errors.INVALID_ARGUMENT, { argument: 'provider', value: provider });
        }
        this.provider = provider;
        return this;
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    getEncryptedPrivateKey(password: Arrayish | string): string {

        var enc = encryptSecret(arrayify(this.signingKey.privateKey), password);
        return hexlify(enc);
    }

    getEncryptedMnemonic(password: Arrayish | string): string {
        var mnem = this.signingKey.mnemonic;
        var mnemBytes = new Uint8Array(mnem.length);
        for (let i = 0; i < mnem.length; i++) {
            mnemBytes[i] = mnem.charCodeAt(i);
        }
        var enc = encryptSecret(mnemBytes, password);
        return hexlify(enc);
    }

    sign(transaction: TransactionRequest): Promise<string> {
        return resolveProperties(transaction).then((tx) => {
            let rawTx = serializeTransaction(tx);
            let signature = this.signingKey.sign((rawTx));
            let chainId = transaction.network;
            if (transaction.chain && transaction.chain != transaction.network) {
                chainId += '[' + transaction.chain + ']';
            }
            let version = transaction.version;
            return encodeTransaction(chainId, version, rawTx, signature, this.signingKey.publicKey);
        });
    }

    signMessage(message: Arrayish | string): Promise<string> {
        return Promise.resolve(this.signingKey.sign(message));
    }

    getBalance(blockTag?: BlockTag): Promise<BigNumber> {
        if (!this.provider) { throw new Error('missing provider'); }
        return this.provider.getBalance(this.address, blockTag);
    }

    getTransactionCount(blockTag?: BlockTag): Promise<number> {
        if (!this.provider) { throw new Error('missing provider'); }
        return this.provider.getTransactionCount(this.address, blockTag);
    }

    sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        if (!this.provider) { throw new Error('missing provider'); }

        if (transaction.nonce == null) {
            transaction = shallowCopy(transaction);
            transaction.nonce = this.getTransactionCount("pending");
        }
        // return populateTransaction(transaction, this.provider, this.address).then((tx) => {
             return this.sign(transaction).then((signedTransaction) => {
                 return this.provider.sendTransaction(signedTransaction);
             });
        // });
    }

    encrypt(password: Arrayish | string, options?: any, progressCallback?: ProgressCallback): Promise<string> {
        if (typeof options === 'function' && !progressCallback) {
            progressCallback = options;
            options = {};
        }

        if (progressCallback && typeof progressCallback !== 'function') {
            throw new Error('invalid callback');
        }

        if (!options) { options = {}; }

        if (this.signingKey.mnemonic) {
            // Make sure we don't accidentally bubble the mnemonic up the call-stack
            options = shallowCopy(options);

            // Set the mnemonic and path
            options.mnemonic = this.signingKey.mnemonic;
            options.path = this.path
        }

        return secretStorage.encrypt(this.signingKey.privateKey, this.network, password, options, progressCallback);
    }

    /**
     *  Static methods to create Wallet instances.
     */
    static createRandom(network: string, options?: any): Wallet {
        var entropy: Uint8Array = randomBytes(16);
        if (!options) { options = { }; }

        if (options.extraEntropy) {
            entropy = arrayify(keccak256(concat([entropy, options.extraEntropy])).substring(0, 34));
        }

        var mnemonic = entropyToMnemonic(entropy, options.locale);
        return Wallet.fromMnemonic(network, mnemonic, options.path, options.locale);
    }

    static createWallet(network: string, password: string, options?: any): Wallet {
        var entropy: Uint8Array = randomBytes(16);
        if (!options) { options = { }; }

        if (options.extraEntropy) {
            entropy = arrayify(keccak256(concat([entropy, options.extraEntropy])).substring(0, 34));
        }

        var mnemonic = entropyToMnemonic(entropy, options.locale);
        var wallet = Wallet.fromMnemonic(network, mnemonic, options.path, options.locale);

        return wallet;
    }

    static fromEncryptedJson(json: string, password: Arrayish, progressCallback?: ProgressCallback): Promise<Wallet> {
        if (isSecretStorageWallet(json)) {
            return secretStorage.decrypt(json, password, progressCallback).then(function(signingKey) {
                return new Wallet(signingKey);
            });
        }

        return Promise.reject('invalid wallet JSON');
    }

    static fromMnemonic(network: string, mnemonic: string, path?: string, wordlist?: Wordlist): Wallet {
        if (!path) { path = defaultPath; }
        return new Wallet(fromMnemonic(mnemonic, wordlist).derivePath(path), network);
    }

}
