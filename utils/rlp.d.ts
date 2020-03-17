import { Arrayish } from './bytes';
export declare function encodeAsItem(object: Array<any> | Uint8Array | string): Array<number>;
export declare function encodeAsList(object: Array<any>): Array<number>;
export declare function encode(object: any): string;
export declare function decode(data: Arrayish): any;
