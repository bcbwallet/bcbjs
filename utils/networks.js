'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors = __importStar(require("../errors"));
function bcbDefaultProvider(network) {
    return function (providers) {
        var providerList = [];
        if (providers.BcbWalletProvider) {
            providerList.push(new providers.BcbWalletProvider(network));
        }
        if (providerList.length === 0) {
            return null;
        }
        if (providers.FallbackProvider) {
            return new providers.FallbackProvider(providerList);
            ;
        }
        return providerList[0];
    };
}
var bcb = {
    chain: "bcb",
    name: "bcb",
    _defaultProvider: bcbDefaultProvider('bcb')
};
var bcbtest = {
    chain: "bcbtest",
    name: "bcbtest",
    _defaultProvider: bcbDefaultProvider('bcbtest')
};
var devtest = {
    chain: "devtest",
    name: "devtest",
    _defaultProvider: bcbDefaultProvider('devtest')
};
var networks = {
    unspecified: {
        chain: "",
        name: 'unspecified'
    },
    bcb: bcb,
    mainnet: bcb,
    bcbtest: bcbtest,
    testnet: bcbtest,
    devtest: devtest,
    devnet: devtest,
};
/**
 *  getNetwork
 *
 *  Converts a named common networks or chain ID (network ID) to a Network
 *  and verifies a network is a valid Network..
 */
function getNetwork(network) {
    // No network (null)
    if (network == null) {
        return null;
    }
    if (typeof (network) === 'string') {
        var n_1 = networks[network];
        if (n_1 == null) {
            return null;
        }
        return {
            name: n_1.name,
            chain: n_1.chain,
            _defaultProvider: (n_1._defaultProvider || null)
        };
    }
    var n = networks[network.name];
    // Not a standard network; check that it is a valid network in general
    if (!n) {
        if (typeof (network.chain) !== 'string') {
            errors.throwError('invalid network chain', errors.INVALID_ARGUMENT, { arg: 'network', value: network });
        }
        return network;
    }
    // Make sure the chain matches the expected network chain (or is 0; disable EIP-155)
    if (network.chain !== "" && network.chain !== n.chain) {
        errors.throwError('network chain mismatch', errors.INVALID_ARGUMENT, { arg: 'network', value: network });
    }
    // Standard Network
    return {
        name: network.name,
        chain: n.chain,
        _defaultProvider: (network._defaultProvider || n._defaultProvider || null)
    };
}
exports.getNetwork = getNetwork;
