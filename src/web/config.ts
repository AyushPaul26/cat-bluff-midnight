export interface BrowserConfig {
  network: 'preprod';
  contractAddress: string;
  indexer: string;
  indexerWS: string;
  substrateNode: string;
  proverServer: string;
}

function secureEndpoint(value: string, protocol: string, label: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== protocol || url.username || url.password || url.hash || url.search) throw new Error();
    return url.href;
  } catch { throw new Error(`Invalid ${label} configuration.`); }
}

export function browserConfiguration(input: {network?: string; contractAddress?: string; indexer?: string; indexerWS?: string; substrateNode?:string; proverServer?:string}): BrowserConfig {
  if ((input.network ?? 'preprod') !== 'preprod') throw new Error('This demo supports Preprod only.');
  if (!input.contractAddress || !/^[0-9a-f]{64}$/i.test(input.contractAddress)) throw new Error('A verified Preprod contract address is required.');
  const proverServer = localProverUrl(input.proverServer ?? 'http://127.0.0.1:6300');
  if (!proverServer) throw new Error('A user-local prover endpoint is required.');
  return {
    network: 'preprod',
    contractAddress: input.contractAddress.toLowerCase(),
    indexer: secureEndpoint(input.indexer ?? 'https://indexer.preprod.midnight.network/api/v4/graphql', 'https:', 'indexer'),
    indexerWS: secureEndpoint(input.indexerWS ?? 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws', 'wss:', 'indexer WebSocket'),
    substrateNode: secureEndpoint(input.substrateNode ?? 'https://rpc.preprod.midnight.network', 'https:', 'node'),
    proverServer,
  };
}

export function localProverUrl(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  try {
    const url = new URL(uri);
    if (!['http:', 'https:'].includes(url.protocol) || !['localhost','127.0.0.1','[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash) return undefined;
    return url.href.replace(/\/$/, '');
  } catch { return undefined; }
}

export function contractExplorer(address: string) {
  if (!/^[0-9a-f]{64}$/.test(address)) throw new Error('Invalid contract address.');
  return `https://preprod.midnightexplorer.com/contracts/0x${address}`;
}
export function transactionExplorer(hash: string) {
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error('Invalid transaction hash.');
  return `https://preprod.midnightexplorer.com/transactions/0x${hash}`;
}
