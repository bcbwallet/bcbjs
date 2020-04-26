import { BigNumber } from './bignumber';
import { Arrayish } from './bytes';
export declare function getAddress(address: string): string;
export declare function getIcapAddress(address: string): string;
export declare function getContractAddress(transaction: {
    from: string;
    nonce: Arrayish | BigNumber | number;
}): string;
export declare function getAddressByEthAddress(chainId: string, ethAddress: Arrayish | string): string;
export declare function getEthAddressByAddress(chainId: string, address: string): string;
