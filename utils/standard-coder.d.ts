export declare type StandardFunction = {
    type: string;
    name: string;
    inputs: Array<string>;
};
export declare function formatStandardSignature(fragment: StandardFunction): string;
export declare function packStandardParams(version: number, types: Array<string>, values: Array<any>): string | Uint8Array[];
export declare function packStandardBytesParam(version: number, value: Uint8Array): string | Uint8Array[];
export declare function encodeStandardSignature(fragment: StandardFunction): string;
export declare function parseStandardFunction(method: string): StandardFunction;
