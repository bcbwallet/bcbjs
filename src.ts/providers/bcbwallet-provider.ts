
import { BaseProvider } from './base-provider';
import { sha3_256 } from 'js-sha3';
import { hexlify, hexStripZeros } from '../utils/bytes';
import { defineReadOnly } from '../utils/properties';
import { fetchJson } from '../utils/web';

import * as errors from '../errors';

///////////////////////////////
// Imported Types

import { BlockTag, TransactionRequest, TransactionResponse } from './abstract-provider';

import { Networkish } from '../utils/networks';

///////////////////////////////

// The transaction has already been sanitized by the calls in Provider
function getTransactionString(transaction: TransactionRequest): string {
    var result = [];
    for (var key in transaction) {
        if ((<any>transaction)[key] == null) { continue; }
        var value = hexlify((<any>transaction)[key]);
        if ((<any>{ gasLimit: true, gasPrice: true, nonce: true, value: true })[key]) {
            value = hexStripZeros(value);
        }
        result.push(key + '=' + value);
    }
    return result.join('&');
}

function getTransCountResult(result: { code?: number, message?: string, result?: any }): any {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }
    if (result.code != 0) {
        // @TODO: not any
        var error: any = new Error(result.message);
        error.result = JSON.stringify(result);
        throw error;
    }
    return result.result.transCount;
}

function getTxHashResult(result: { code?: number, message?: string, result?: any }): any {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }
// throw new Error('test error')
    if (result.code != 0) {
        // @TODO: not any
        var error: any = new Error(result.message);
        error.result = JSON.stringify(result);
        throw error;
    }
    return result.result.txHash;
}

function checkTxResult(result: { code?: number, message?: string, result?: any }): any {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }

    if (result.code != 0 || result.result.status !== '0x1') {
        return false;
        // @TODO: not any
        // var error: any = new Error(result.message);
        // error.result = JSON.stringify(result);
        // throw error;
    }
    
    return true;
}

function getResult(result: { code?: number, message?: string, result?: any }): any {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }

    if (result.code != 0) {
        // @TODO: not any
        var error: any = new Error('invalid response');
        error.result = JSON.stringify(result);
        throw error;
    }

    return result.result;
}

function getJsonResult(result: { jsonrpc: string, result?: any, error?: { code?: number, data?: any, message?: string} } ): any {
    if (result.jsonrpc != '2.0') {
        // @TODO: not any
        let error: any = new Error('invalid response');
        error.result = JSON.stringify(result);
        throw error;
    }

    if (result.error) {
        // @TODO: not any
        let error: any = new Error(result.error.message || 'unknown error');
        if (result.error.code) { error.code = result.error.code; }
        if (result.error.data) { error.data = result.error.data; }
        throw error;
    }

    return result.result;
}

// The blockTag was normalized as a string by the Provider pre-perform operations
function checkLogTag(blockTag: string): number | "latest" {
    if (blockTag === 'pending') { throw new Error('pending not supported'); }
    if (blockTag === 'latest') { return blockTag; }

    return parseInt(blockTag.substring(2), 16);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class BcbWalletProvider extends BaseProvider{
    readonly baseUrl: string;
    readonly apiKey: string;
    constructor(network?: Networkish, apiKey?: string) {
        super(network);
        errors.checkNew(this, BcbWalletProvider);

        let name = 'invalid';
        if (this.network) { name = this.network.name; }

        let baseUrl = null;
        switch(name) {
            case 'bcb':
                baseUrl = 'https://wallet.bcbchain.io';
                break;
            case 'bcbtest':
                baseUrl = 'https://testwallet.bcbchain.io';
                break;
            case 'devtest':
                baseUrl = 'https://dwallet.bcbchain.io';
                break;
            default:
                throw new Error('unsupported network');
        }

        defineReadOnly(this, 'baseUrl', baseUrl);
        defineReadOnly(this, 'apiKey', apiKey);
    }


    async perform(method: string, params: any) {
        let url = this.baseUrl;
        let apiKey = '';
        if (this.apiKey) { apiKey += '&apikey=' + this.apiKey; }
    
        let cointype = '';
        if (this.network.name === 'devtest')
            cointype = '0x1000';
        if (this.network.name === 'bcbtest')
            cointype = '0x1001';
        else if (this.network.name === 'bcb')
            cointype = '0x1002';

        let get = (url: string, json?: string, procFunc?: (value: any) => any) => {
            return fetchJson(url, json, procFunc || getJsonResult).then((result) => {
                this.emit('debug', {
                    action: 'perform',
                    request: url,
                    response: result,
                    provider: this
                });
                return result;
            });
        };

        switch (method) {
            case 'getBlockNumber':
                url += '/api?module=proxy&action=bcb_blockNumber' + apiKey;
                return get(url);

            case 'getGasPrice':
                url += '/api?module=proxy&action=bcb_gasPrice' + apiKey;
                return get(url);

            case 'getBalance':
                // Returns base-10 result
                url += '/api?module=account&action=balance&address=' + params.address;
                url += apiKey;
                return get(url, null, getResult);

            case 'getTransactionCount':
                url += '/api/v1/addrs/trans_count/';
                url += cointype;
                url += '/' + params.address;
                url +=  apiKey;
                return get(url, null, getTransCountResult);

            case 'getCode':
                url += '/api?module=proxy&action=bcb_getCode&address=' + params.address;
                url += apiKey;
                return get(url, null, getJsonResult);

            case 'getStorageAt':
                url += '/api?module=proxy&action=bcb_getStorageAt&address=' + params.address;
                url += '&position=' + params.position;
                url += apiKey;
                return get(url, null, getJsonResult);


            case 'sendTransaction':
                url += '/api/v1/txs/';
                url += cointype;
                url += '/broadcast_raw_data';
                let post = { rawTransData: params.signedTransaction };
                url += apiKey;
                var self = this;
                return get(url, JSON.stringify(post), getTxHashResult).catch((error) => {
                // console.log(error)
                    throw(error)
                    // let txHash = hexlify(sha3_256.update(params.signedTransaction).digest());
                    // url = this.baseUrl + '/api/v1/txs/status/' + cointype + '/' + txHash;
                    // function check() {
                    //     var promise = new Promise(function(resolve, reject) {
                    //         setTimeout(function() {
                    //             let promise = get(url, null, checkTxResult);
                    //             promise.then(function(result) {
                    //                 if (result) {
                    //                     resolve(txHash);
                    //                 } else {
                    //                     throw new Error('Transaction failed');
                    //                 }
                    //             });
                    //         }, 5000);
                    //     });
                    //     return promise;
                    // }
                    // check().then(function(result) {
                    //     return result;
                    // })
                    // setTimeout(function() {
                    //     let promise = get(url, null, checkTxResult);
                    //     promise.then(function(result) {
                    //         if (result) {
                    //             console.log(txHash)
                    //             return txHash;
                    //         } else {
                    //             throw new Error('Transaction failed');
                    //         }
                    //     });
                    // }, 5000);
                    // if (error.responseText) {
                    //     // "Insufficient funds. The account you tried to send transaction from does not have enough funds. Required 21464000000000 and got: 0"
                    //     if (error.responseText.toLowerCase().indexOf('insufficient funds') >= 0) {
                    //         errors.throwError('insufficient funds', errors.INSUFFICIENT_FUNDS, { });
                    //     }
                    //     // "Transaction with the same hash was already imported."
                    //     if (error.responseText.indexOf('same hash was already imported') >= 0) {
                    //         errors.throwError('nonce has already been used', errors.NONCE_EXPIRED, { });
                    //     }
                    //     // "Transaction gas price is too low. There is another transaction with same nonce in the queue. Try increasing the gas price or incrementing the nonce."
                    //     if (error.responseText.indexOf('another transaction with same nonce') >= 0) {
                    //         errors.throwError('replacement fee too low', errors.REPLACEMENT_UNDERPRICED, { });
                    //     }
                    // }
                    // throw error;
                });

            case 'getBlock':
                if (params.blockTag) {
                    url += '/api?module=proxy&action=bcb_getBlockByNumber&tag=' + params.blockTag;
                    if (params.includeTransactions) {
                        url += '&boolean=true';
                    } else {
                        url += '&boolean=false';
                    }
                    url += apiKey;
                    return get(url);
                }
                throw new Error('getBlock by blockHash not implmeneted');

            case 'getTransaction':
                url += '/api?module=proxy&action=bcb_getTransactionByHash&txhash=' + params.transactionHash;
                url += apiKey;
                return get(url);

            case 'getTransactionReceipt':
                url += '/api?module=proxy&action=bcb_getTransactionReceipt&txhash=' + params.transactionHash;
                url += apiKey;
                return get(url);

            case 'checkTransactionResult':
                url += '/api/v1/txs/status/';
                url += cointype;
                url += '/' + params.transactionHash;
                url +=  apiKey;
                return get(url, null, getResult);

            case 'call': {
                let transaction = getTransactionString(params.transaction);
                if (transaction) { transaction = '&' + transaction; }
                url += '/api?module=proxy&action=bcb_call' + transaction;
                //url += '&tag=' + params.blockTag + apiKey;
                if (params.blockTag !== 'latest') {
                    throw new Error('BcbWalletProvider does not support blockTag for call');
                }
                url += apiKey;
                return get(url);
            }

            case 'estimateGas': {
                let transaction = getTransactionString(params.transaction);
                if (transaction) { transaction = '&' + transaction; }
                url += '/api?module=proxy&action=bcb_estimateGas&' + transaction;
                url += apiKey;
                return get(url);
            }

            case 'getLogs':
                url += '/api?module=logs&action=getLogs';
                try {
                    if (params.filter.fromBlock) {
                        url += '&fromBlock=' + checkLogTag(params.filter.fromBlock);
                    }

                    if (params.filter.toBlock) {
                        url += '&toBlock=' + checkLogTag(params.filter.toBlock);
                    }

                    if (params.filter.blockHash) {
                        try {
                            errors.throwError("Bcbscan does not support blockHash filters", errors.UNSUPPORTED_OPERATION, {
                                operation: "getLogs(blockHash)"
                            });
                        } catch (error) {
                            return Promise.reject(error);
                        }
                    }

                    if (params.filter.address) {
                        url += '&address=' + params.filter.address;
                    }

                    // @TODO: We can handle slightly more complicated logs using the logs API
                    if (params.filter.topics && params.filter.topics.length > 0) {
                        if (params.filter.topics.length > 1) {
                            throw new Error('unsupported topic format');
                        }
                        let topic0 = params.filter.topics[0];
                        if (typeof(topic0) !== 'string' || topic0.length !== 66) {
                            throw new Error('unsupported topic0 format');
                        }
                        url += '&topic0=' + topic0;
                    }
                } catch (error) {
                    return Promise.reject(error);
                }

                url += apiKey;

                var self = this;
                return get(url, null, getResult).then(function(logs: Array<any>) {
                    var txs: { [hash: string]: string } = {};

                    var seq = Promise.resolve();
                    logs.forEach(function(log) {
                        seq = seq.then(function() {
                            if (log.blockHash != null) { return null; }
                            log.blockHash = txs[log.transactionHash];
                            if (log.blockHash == null) {
                                return self.getTransaction(log.transactionHash).then(function(tx) {
                                    txs[log.transactionHash] = tx.blockHash;
                                    log.blockHash = tx.blockHash;
                                    return null;
                                });
                            }
                            return null;
                        });
                    });

                    return seq.then(function() {
                        return logs;
                    });
                });

            case 'getBcbPrice':
                if (this.network.name !== 'homestead') { return Promise.resolve(0.0); }
                url += '/api?module=stats&action=ethprice';
                url += apiKey;
                return get(url, null, getResult).then(function(result) {
                    return parseFloat(result.ethusd);
                });

            default:
                break;
         }

        return super.perform(method, params);
    }

    // @TODO: Allow startBlock and endBlock to be Promises
    getHistory(addressOrName: string | Promise<string>, startBlock?: BlockTag, endBlock?: BlockTag): Promise<Array<TransactionResponse>> {

        let url = this.baseUrl;

        let apiKey = '';
        if (this.apiKey) { apiKey += '&apikey=' + this.apiKey; }

        if (startBlock == null) { startBlock = 0; }
        if (endBlock == null) { endBlock = 99999999; }

        return this.resolveName(addressOrName).then((address) => {
            url += '/api?module=account&action=txlist&address=' + address;
            url += '&startblock=' + startBlock;
            url += '&endblock=' + endBlock;
            url += '&sort=asc' + apiKey;

            return fetchJson(url, null, getResult).then((result: Array<any>) => {
                this.emit('debug', {
                    action: 'getHistory',
                    request: url,
                    response: result,
                    provider: this
                });
                var output: Array<TransactionResponse> = [];
                result.forEach((tx) => {
                    ['contractAddress', 'to'].forEach(function(key) {
                        if (tx[key] == '') { delete tx[key]; }
                    });
                    if (tx.creates == null && tx.contractAddress != null) {
                        tx.creates = tx.contractAddress;
                    }
                    let item = BaseProvider.checkTransactionResponse(tx);
                    if (tx.timeStamp) { item.timestamp = parseInt(tx.timeStamp); }
                    output.push(item);
                });
                return output;
            });
        });
    }
}
