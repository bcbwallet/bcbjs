'use strict';

import * as errors from '../errors';


export type Network = {
    name: string,
    chain: string,
    _defaultProvider?: (providers: any) => any
}

export type Networkish = Network | string;

function bcbDefaultProvider(network: string): (providers: any) => any {
    return function(providers: any): any {
        let providerList: Array<any> = [];
        if (providers.BcbWalletProvider) {
            providerList.push(new providers.BcbWalletProvider(network));
        }
        if (providerList.length === 0) { return null; }

        if (providers.FallbackProvider) {
            return new providers.FallbackProvider(providerList);;
        }
        return providerList[0];
    }
}

const bcb: Network = {
    chain: "bcb",
    name: "bcb",
    _defaultProvider: bcbDefaultProvider('bcb')
};
const bcbtest: Network = {
    chain: "bcbtest",
    name: "bcbtest",
    _defaultProvider: bcbDefaultProvider('bcbtest')
};
const devtest: Network = {
    chain: "devtest",
    name: "devtest",
    _defaultProvider: bcbDefaultProvider('devtest')
};

const networks: { [name: string]: Network } = {
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

}

/**
 *  getNetwork
 *
 *  Converts a named common networks or chain ID (network ID) to a Network
 *  and verifies a network is a valid Network..
 */
export function getNetwork(network: Networkish): Network {
    // No network (null)
    if (network == null) { return null; }

    if (typeof(network) === 'string') {
        let n = networks[network];
        if (n == null) { return null; }
        return {
            name: n.name,
            chain: n.chain,
            _defaultProvider: (n._defaultProvider || null)
        };
    }

    let n  = networks[network.name];

    // Not a standard network; check that it is a valid network in general
    if (!n) {
        if (typeof(network.chain) !== 'string') {
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
