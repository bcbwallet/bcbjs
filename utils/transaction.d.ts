import { Arrayish } from './bytes';
import { Provider } from '../providers/abstract-provider';
export declare type UnsignedTransaction = {
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
};
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
export declare function serialize(transaction: UnsignedTransaction): string;
export declare function encodeTransaction(chainId: string, version: number, unsignedTransaction: string, signature: Arrayish, pubkey: Arrayish): string;
export declare function parse(rawTransaction: Arrayish): Transaction;
export declare function populateTransaction(transaction: any, provider: Provider, from: string | Promise<string>): Promise<Transaction>;
