'use strict';

import { Contract, ContractFactory, VoidSigner } from './contract';

import { Signer } from './abstract-signer';
import { Wallet } from './wallet';

import * as constants from './constants';
import * as errors from './errors';

import * as providers from './providers';
import * as utils from './utils';
import * as wordlists from './wordlists';


////////////////////////
// Compile-Time Constants

// This is empty in node, and used by browserify to inject extra goodies
import { platform } from './utils/shims';

// This is generated by "npm run dist"
import { version } from './_version';


////////////////////////
// Types

import { ContractFunction, ContractTransaction, Event, EventFilter } from './contract';


////////////////////////
// Helper Functions

function getDefaultProvider(network?: utils.Network | string): providers.BaseProvider {
    if (network == null) { network = 'bcb'; }
    let n = utils.getNetwork(network);
    if (!n || !n._defaultProvider) {
        errors.throwError('unsupported getDefaultProvider network', errors.UNSUPPORTED_OPERATION, {
            operation: 'getDefaultProvider',
            network: network
        });
    }
    return n._defaultProvider(providers);
}


////////////////////////
// Exports

export {
    Signer,

    Wallet,
    VoidSigner,

    getDefaultProvider,
    providers,

    Contract,
    ContractFactory,

    constants,
    errors,

    utils,

    wordlists,

    ////////////////////////
    // Compile-Time Constants

    platform,
    version,

    ////////////////////////
    // Types

    ContractFunction,
    ContractTransaction,
    Event,
    EventFilter
};

