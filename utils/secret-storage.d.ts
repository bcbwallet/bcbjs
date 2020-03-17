import { SigningKey } from './signing-key';
import { Arrayish } from './bytes';
export declare type ProgressCallback = (percent: number) => void;
export declare type EncryptOptions = {
    iv?: Arrayish;
    entropy?: Arrayish;
    mnemonic?: string;
    path?: string;
    client?: string;
    salt?: Arrayish;
    uuid?: string;
    scrypt?: {
        N?: number;
        r?: number;
        p?: number;
    };
};
export declare function encryptSecret(plain: any, password: Arrayish | string): Uint8Array;
export declare function decryptSecret(cipher: any, password: Arrayish | string): Uint8Array;
export declare function decryptCrowdsale(json: string, password: Arrayish | string): SigningKey;
export declare function decrypt(json: string, password: Arrayish, progressCallback?: ProgressCallback): Promise<SigningKey>;
export declare function encrypt(privateKey: Arrayish | SigningKey, chainId: string, password: Arrayish | string, options?: EncryptOptions, progressCallback?: ProgressCallback): Promise<string>;
