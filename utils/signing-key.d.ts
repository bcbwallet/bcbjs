/**
 *  SigningKey
 *
 *
 */
import { HDNode } from './hdnode';
import { Arrayish } from './bytes';
export declare class SigningKey {
    readonly privateKey: string;
    readonly publicKey: string;
    readonly network: string;
    readonly address: string;
    readonly mnemonic: string;
    readonly path: string;
    private readonly keyPair;
    constructor(privateKey: Arrayish | HDNode, network: string);
    sign(message: Arrayish): string;
    computeSharedSecret(key: Arrayish | string): string;
    static isSigningKey(value: any): value is SigningKey;
}
