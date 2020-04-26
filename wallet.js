'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var bytes_1 = require("./utils/bytes");
var hdnode_1 = require("./utils/hdnode");
var json_wallet_1 = require("./utils/json-wallet");
var keccak256_1 = require("./utils/keccak256");
var properties_1 = require("./utils/properties");
var random_bytes_1 = require("./utils/random-bytes");
var secretStorage = __importStar(require("./utils/secret-storage"));
var signing_key_1 = require("./utils/signing-key");
var transaction_1 = require("./utils/transaction");
// Imported Abstracts
var abstract_signer_1 = require("./abstract-signer");
var abstract_provider_1 = require("./providers/abstract-provider");
// Imported Types
var secret_storage_1 = require("./utils/secret-storage");
var errors = __importStar(require("./errors"));
var utils_1 = require("./utils");
var Wallet = /** @class */ (function (_super) {
    __extends(Wallet, _super);
    function Wallet(privateKey, network, provider) {
        var _this = _super.call(this) || this;
        errors.checkNew(_this, Wallet);
        // Make sure we have a valid signing key
        if (signing_key_1.SigningKey.isSigningKey(privateKey)) {
            properties_1.defineReadOnly(_this, "network", privateKey.network);
            properties_1.defineReadOnly(_this, 'signingKey', privateKey);
        }
        else {
            if (network) {
                properties_1.defineReadOnly(_this, "network", network);
                properties_1.defineReadOnly(_this, 'signingKey', new signing_key_1.SigningKey(privateKey, network));
            }
            else {
                errors.throwError('invalid argument', errors.INVALID_ARGUMENT, { argument: 'network', value: network });
            }
        }
        properties_1.defineReadOnly(_this, 'provider', provider);
        return _this;
    }
    Object.defineProperty(Wallet.prototype, "address", {
        get: function () {
            return utils_1.computeAddress(this.network, this.signingKey.publicKey);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "mnemonic", {
        get: function () { return this.signingKey.mnemonic; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "path", {
        get: function () { return this.signingKey.path; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "privateKey", {
        get: function () { return this.signingKey.privateKey; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "publicKey", {
        get: function () { return this.signingKey.publicKey; },
        enumerable: true,
        configurable: true
    });
    /**
     *  Create a new instance of this Wallet connected to provider.
     */
    Wallet.prototype.connect = function (network, provider) {
        if (!(abstract_provider_1.Provider.isProvider(provider))) {
            errors.throwError('invalid provider', errors.INVALID_ARGUMENT, { argument: 'provider', value: provider });
        }
        return new Wallet(this.signingKey, network, provider);
    };
    Wallet.prototype.setProvider = function (provider) {
        if (!(abstract_provider_1.Provider.isProvider(provider))) {
            errors.throwError('invalid provider', errors.INVALID_ARGUMENT, { argument: 'provider', value: provider });
        }
        this.provider = provider;
        return this;
    };
    Wallet.prototype.getAddress = function () {
        return Promise.resolve(this.address);
    };
    Wallet.prototype.getEncryptedPrivateKey = function (password) {
        var enc = secret_storage_1.encryptSecret(bytes_1.arrayify(this.signingKey.privateKey), password);
        return bytes_1.hexlify(enc);
    };
    Wallet.prototype.getEncryptedMnemonic = function (password) {
        var mnem = this.signingKey.mnemonic;
        var mnemBytes = new Uint8Array(mnem.length);
        for (var i = 0; i < mnem.length; i++) {
            mnemBytes[i] = mnem.charCodeAt(i);
        }
        var enc = secret_storage_1.encryptSecret(mnemBytes, password);
        return bytes_1.hexlify(enc);
    };
    Wallet.prototype.sign = function (transaction) {
        var _this = this;
        return properties_1.resolveProperties(transaction).then(function (tx) {
            var rawTx = transaction_1.serialize(tx);
            var signature = _this.signingKey.sign((rawTx));
            var chainId = transaction.network;
            if (transaction.chain && transaction.chain != transaction.network) {
                chainId += '[' + transaction.chain + ']';
            }
            var version = transaction.version;
            return transaction_1.encodeTransaction(chainId, version, rawTx, signature, _this.signingKey.publicKey);
        });
    };
    Wallet.prototype.signMessage = function (message) {
        return Promise.resolve(this.signingKey.sign(message));
    };
    Wallet.prototype.getBalance = function (blockTag) {
        if (!this.provider) {
            throw new Error('missing provider');
        }
        return this.provider.getBalance(this.address, blockTag);
    };
    Wallet.prototype.getTransactionCount = function (blockTag) {
        if (!this.provider) {
            throw new Error('missing provider');
        }
        return this.provider.getTransactionCount(this.address, blockTag);
    };
    Wallet.prototype.sendTransaction = function (transaction) {
        var _this = this;
        if (!this.provider) {
            throw new Error('missing provider');
        }
        if (transaction.nonce == null) {
            transaction = properties_1.shallowCopy(transaction);
            transaction.nonce = this.getTransactionCount("pending");
        }
        // return populateTransaction(transaction, this.provider, this.address).then((tx) => {
        return this.sign(transaction).then(function (signedTransaction) {
            return _this.provider.sendTransaction(signedTransaction);
        });
        // });
    };
    Wallet.prototype.encrypt = function (password, options, progressCallback) {
        if (typeof options === 'function' && !progressCallback) {
            progressCallback = options;
            options = {};
        }
        if (progressCallback && typeof progressCallback !== 'function') {
            throw new Error('invalid callback');
        }
        if (!options) {
            options = {};
        }
        if (this.signingKey.mnemonic) {
            // Make sure we don't accidentally bubble the mnemonic up the call-stack
            options = properties_1.shallowCopy(options);
            // Set the mnemonic and path
            options.mnemonic = this.signingKey.mnemonic;
            options.path = this.path;
        }
        return secretStorage.encrypt(this.signingKey.privateKey, this.network, password, options, progressCallback);
    };
    /**
     *  Static methods to create Wallet instances.
     */
    Wallet.createRandom = function (network, options) {
        var entropy = random_bytes_1.randomBytes(16);
        if (!options) {
            options = {};
        }
        if (options.extraEntropy) {
            entropy = bytes_1.arrayify(keccak256_1.keccak256(bytes_1.concat([entropy, options.extraEntropy])).substring(0, 34));
        }
        var mnemonic = hdnode_1.entropyToMnemonic(entropy, options.locale);
        return Wallet.fromMnemonic(network, mnemonic, options.path, options.locale);
    };
    Wallet.createWallet = function (network, password, options) {
        var entropy = random_bytes_1.randomBytes(16);
        if (!options) {
            options = {};
        }
        if (options.extraEntropy) {
            entropy = bytes_1.arrayify(keccak256_1.keccak256(bytes_1.concat([entropy, options.extraEntropy])).substring(0, 34));
        }
        var mnemonic = hdnode_1.entropyToMnemonic(entropy, options.locale);
        var wallet = Wallet.fromMnemonic(network, mnemonic, options.path, options.locale);
        return wallet;
    };
    Wallet.fromEncryptedJson = function (json, password, progressCallback) {
        if (json_wallet_1.isSecretStorageWallet(json)) {
            return secretStorage.decrypt(json, password, progressCallback).then(function (signingKey) {
                return new Wallet(signingKey);
            });
        }
        return Promise.reject('invalid wallet JSON');
    };
    Wallet.fromMnemonic = function (network, mnemonic, path, wordlist) {
        if (!path) {
            path = hdnode_1.defaultPath;
        }
        return new Wallet(hdnode_1.fromMnemonic(mnemonic, wordlist).derivePath(path), network);
    };
    return Wallet;
}(abstract_signer_1.Signer));
exports.Wallet = Wallet;
