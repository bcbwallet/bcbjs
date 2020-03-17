export declare type Network = {
    name: string;
    chain: string;
    _defaultProvider?: (providers: any) => any;
};
export declare type Networkish = Network | string;
/**
 *  getNetwork
 *
 *  Converts a named common networks or chain ID (network ID) to a Network
 *  and verifies a network is a valid Network..
 */
export declare function getNetwork(network: Networkish): Network;
