"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var base_provider_1 = require("./base-provider");
var bytes_1 = require("../utils/bytes");
var properties_1 = require("../utils/properties");
var web_1 = require("../utils/web");
var errors = __importStar(require("../errors"));
///////////////////////////////
// The transaction has already been sanitized by the calls in Provider
function getTransactionString(transaction) {
    var result = [];
    for (var key in transaction) {
        if (transaction[key] == null) {
            continue;
        }
        var value = bytes_1.hexlify(transaction[key]);
        if ({ gasLimit: true, gasPrice: true, nonce: true, value: true }[key]) {
            value = bytes_1.hexStripZeros(value);
        }
        result.push(key + '=' + value);
    }
    return result.join('&');
}
function getTransCountResult(result) {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }
    if (result.code != 0) {
        // @TODO: not any
        var error = new Error(result.message);
        error.result = JSON.stringify(result);
        throw error;
    }
    return result.result.transCount;
}
function getTxHashResult(result) {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }
    // throw new Error('test error')
    if (result.code != 0) {
        // @TODO: not any
        var error = new Error(result.message);
        error.result = JSON.stringify(result);
        throw error;
    }
    return result.result.txHash;
}
function checkTxResult(result) {
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
function getResult(result) {
    // getLogs, getHistory have weird success responses
    // if (result.code == 0 && (result.message === 'No records found' || result.message === 'No transactions found')) {
    //     return result.result;
    // }
    if (result.code != 0) {
        // @TODO: not any
        var error = new Error('invalid response');
        error.result = JSON.stringify(result);
        throw error;
    }
    return result.result;
}
function getJsonResult(result) {
    if (result.jsonrpc != '2.0') {
        // @TODO: not any
        var error = new Error('invalid response');
        error.result = JSON.stringify(result);
        throw error;
    }
    if (result.error) {
        // @TODO: not any
        var error = new Error(result.error.message || 'unknown error');
        if (result.error.code) {
            error.code = result.error.code;
        }
        if (result.error.data) {
            error.data = result.error.data;
        }
        throw error;
    }
    return result.result;
}
// The blockTag was normalized as a string by the Provider pre-perform operations
function checkLogTag(blockTag) {
    if (blockTag === 'pending') {
        throw new Error('pending not supported');
    }
    if (blockTag === 'latest') {
        return blockTag;
    }
    return parseInt(blockTag.substring(2), 16);
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
var BcbWalletProvider = /** @class */ (function (_super) {
    __extends(BcbWalletProvider, _super);
    function BcbWalletProvider(network, apiKey) {
        var _this = _super.call(this, network) || this;
        errors.checkNew(_this, BcbWalletProvider);
        var name = 'invalid';
        if (_this.network) {
            name = _this.network.name;
        }
        var baseUrl = null;
        switch (name) {
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
        properties_1.defineReadOnly(_this, 'baseUrl', baseUrl);
        properties_1.defineReadOnly(_this, 'apiKey', apiKey);
        return _this;
    }
    BcbWalletProvider.prototype.perform = function (method, params) {
        return __awaiter(this, void 0, void 0, function () {
            var url, apiKey, cointype, get, post, self, transaction, transaction, topic0, self;
            var _this = this;
            return __generator(this, function (_a) {
                url = this.baseUrl;
                apiKey = '';
                if (this.apiKey) {
                    apiKey += '&apikey=' + this.apiKey;
                }
                cointype = '';
                if (this.network.name === 'devtest')
                    cointype = '0x1000';
                if (this.network.name === 'bcbtest')
                    cointype = '0x1001';
                else if (this.network.name === 'bcb')
                    cointype = '0x1002';
                get = function (url, json, procFunc) {
                    return web_1.fetchJson(url, json, procFunc || getJsonResult).then(function (result) {
                        _this.emit('debug', {
                            action: 'perform',
                            request: url,
                            response: result,
                            provider: _this
                        });
                        return result;
                    });
                };
                switch (method) {
                    case 'getBlockNumber':
                        url += '/api?module=proxy&action=bcb_blockNumber' + apiKey;
                        return [2 /*return*/, get(url)];
                    case 'getGasPrice':
                        url += '/api?module=proxy&action=bcb_gasPrice' + apiKey;
                        return [2 /*return*/, get(url)];
                    case 'getBalance':
                        // Returns base-10 result
                        url += '/api?module=account&action=balance&address=' + params.address;
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getResult)];
                    case 'getTransactionCount':
                        url += '/api/v1/addrs/trans_count/';
                        url += cointype;
                        url += '/' + params.address;
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getTransCountResult)];
                    case 'getCode':
                        url += '/api?module=proxy&action=bcb_getCode&address=' + params.address;
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getJsonResult)];
                    case 'getStorageAt':
                        url += '/api?module=proxy&action=bcb_getStorageAt&address=' + params.address;
                        url += '&position=' + params.position;
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getJsonResult)];
                    case 'sendTransaction':
                        url += '/api/v1/txs/';
                        url += cointype;
                        url += '/broadcast_raw_data';
                        post = { rawTransData: params.signedTransaction };
                        url += apiKey;
                        self = this;
                        return [2 /*return*/, get(url, JSON.stringify(post), getTxHashResult).catch(function (error) {
                                // console.log(error)
                                throw (error);
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
                            })];
                    case 'getBlock':
                        if (params.blockTag) {
                            url += '/api?module=proxy&action=bcb_getBlockByNumber&tag=' + params.blockTag;
                            if (params.includeTransactions) {
                                url += '&boolean=true';
                            }
                            else {
                                url += '&boolean=false';
                            }
                            url += apiKey;
                            return [2 /*return*/, get(url)];
                        }
                        throw new Error('getBlock by blockHash not implmeneted');
                    case 'getTransaction':
                        url += '/api?module=proxy&action=bcb_getTransactionByHash&txhash=' + params.transactionHash;
                        url += apiKey;
                        return [2 /*return*/, get(url)];
                    case 'getTransactionReceipt':
                        url += '/api?module=proxy&action=bcb_getTransactionReceipt&txhash=' + params.transactionHash;
                        url += apiKey;
                        return [2 /*return*/, get(url)];
                    case 'checkTransactionResult':
                        url += '/api/v1/txs/status/';
                        url += cointype;
                        url += '/' + params.transactionHash;
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getResult)];
                    case 'call': {
                        transaction = getTransactionString(params.transaction);
                        if (transaction) {
                            transaction = '&' + transaction;
                        }
                        url += '/api?module=proxy&action=bcb_call' + transaction;
                        //url += '&tag=' + params.blockTag + apiKey;
                        if (params.blockTag !== 'latest') {
                            throw new Error('BcbWalletProvider does not support blockTag for call');
                        }
                        url += apiKey;
                        return [2 /*return*/, get(url)];
                    }
                    case 'estimateGas': {
                        transaction = getTransactionString(params.transaction);
                        if (transaction) {
                            transaction = '&' + transaction;
                        }
                        url += '/api?module=proxy&action=bcb_estimateGas&' + transaction;
                        url += apiKey;
                        return [2 /*return*/, get(url)];
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
                                }
                                catch (error) {
                                    return [2 /*return*/, Promise.reject(error)];
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
                                topic0 = params.filter.topics[0];
                                if (typeof (topic0) !== 'string' || topic0.length !== 66) {
                                    throw new Error('unsupported topic0 format');
                                }
                                url += '&topic0=' + topic0;
                            }
                        }
                        catch (error) {
                            return [2 /*return*/, Promise.reject(error)];
                        }
                        url += apiKey;
                        self = this;
                        return [2 /*return*/, get(url, null, getResult).then(function (logs) {
                                var txs = {};
                                var seq = Promise.resolve();
                                logs.forEach(function (log) {
                                    seq = seq.then(function () {
                                        if (log.blockHash != null) {
                                            return null;
                                        }
                                        log.blockHash = txs[log.transactionHash];
                                        if (log.blockHash == null) {
                                            return self.getTransaction(log.transactionHash).then(function (tx) {
                                                txs[log.transactionHash] = tx.blockHash;
                                                log.blockHash = tx.blockHash;
                                                return null;
                                            });
                                        }
                                        return null;
                                    });
                                });
                                return seq.then(function () {
                                    return logs;
                                });
                            })];
                    case 'getBcbPrice':
                        if (this.network.name !== 'homestead') {
                            return [2 /*return*/, Promise.resolve(0.0)];
                        }
                        url += '/api?module=stats&action=ethprice';
                        url += apiKey;
                        return [2 /*return*/, get(url, null, getResult).then(function (result) {
                                return parseFloat(result.ethusd);
                            })];
                    default:
                        break;
                }
                return [2 /*return*/, _super.prototype.perform.call(this, method, params)];
            });
        });
    };
    // @TODO: Allow startBlock and endBlock to be Promises
    BcbWalletProvider.prototype.getHistory = function (addressOrName, startBlock, endBlock) {
        var _this = this;
        var url = this.baseUrl;
        var apiKey = '';
        if (this.apiKey) {
            apiKey += '&apikey=' + this.apiKey;
        }
        if (startBlock == null) {
            startBlock = 0;
        }
        if (endBlock == null) {
            endBlock = 99999999;
        }
        return this.resolveName(addressOrName).then(function (address) {
            url += '/api?module=account&action=txlist&address=' + address;
            url += '&startblock=' + startBlock;
            url += '&endblock=' + endBlock;
            url += '&sort=asc' + apiKey;
            return web_1.fetchJson(url, null, getResult).then(function (result) {
                _this.emit('debug', {
                    action: 'getHistory',
                    request: url,
                    response: result,
                    provider: _this
                });
                var output = [];
                result.forEach(function (tx) {
                    ['contractAddress', 'to'].forEach(function (key) {
                        if (tx[key] == '') {
                            delete tx[key];
                        }
                    });
                    if (tx.creates == null && tx.contractAddress != null) {
                        tx.creates = tx.contractAddress;
                    }
                    var item = base_provider_1.BaseProvider.checkTransactionResponse(tx);
                    if (tx.timeStamp) {
                        item.timestamp = parseInt(tx.timeStamp);
                    }
                    output.push(item);
                });
                return output;
            });
        });
    };
    return BcbWalletProvider;
}(base_provider_1.BaseProvider));
exports.BcbWalletProvider = BcbWalletProvider;
