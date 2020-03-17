import { Arrayish, Signature } from './bytes';
export declare class EdKeyPair {
    readonly privateKey: string;
    readonly privateKeyBytes: Uint8Array;
    readonly publicKey: string;
    readonly publicKeyBytes: Uint8Array;
    constructor(privateKey: Arrayish | string);
    sign(message: Arrayish | string): string;
    computeSharedSecret(otherKey: Arrayish | string): string;
    _addPoint(other: Arrayish | string): string;
}
export declare function computePublicKey(key: Arrayish | string, compressed?: boolean): string;
export declare function computeAddress(chainId: string, pubkey: Arrayish | string): string;
export declare function recoverPublicKey(digest: Arrayish | string, signature: Signature | string): string;
export declare function recoverAddress(chainId: string, digest: Arrayish | string, signature: Signature | string): string;
export declare function verifyMessage(chainId: string, message: Arrayish | string, signature: Signature | string): string;
