export function configuration(network = 'preprod') {
  if (network !== 'preprod') throw new Error('Preprod only: this project never uses mainnet funds.');
  return {
    networkId: 'preprod' as const,
    walletNetworkId: 'preprod' as const,
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    nodeWS: 'wss://rpc.preprod.midnight.network',
    faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
    proofServer: 'http://127.0.0.1:6300',
  };
}
