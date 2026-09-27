import { resolve } from 'node:path';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import type { ContractProviders } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from '../managed/cat-bluff/contract/index.js';
import { witnesses, type PrivateState } from './witnesses.ts';
import type { buildWallet, LocalSecrets } from './wallet.ts';

export const compiledContract = CompiledContract.make<Contract<PrivateState>>('CatBluff', Contract<PrivateState>).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(resolve('managed/cat-bluff')),
);

export function providersFor(client: Awaited<ReturnType<typeof buildWallet>>, saved: LocalSecrets) {
  const zkConfigProvider = new NodeZkConfigProvider<'commit' | 'challenge' | 'resolve'>(resolve('managed/cat-bluff'));
  const providers: ContractProviders<Contract<PrivateState>> = {
    zkConfigProvider,
    proofProvider: httpClientProofProvider(client.env.proofServer, zkConfigProvider),
    publicDataProvider: indexerPublicDataProvider(client.env.indexer, client.env.indexerWS),
    privateStateProvider: levelPrivateStateProvider<string, PrivateState>({
      midnightDbName: resolve('.private/midnight-db'),
      privateStateStoreName: 'cat-bluff-state', signingKeyStoreName: 'cat-bluff-signing',
      privateStoragePasswordProvider: () => saved.storagePassword,
      accountId: client.address,
    }),
    walletProvider: client.provider,
    midnightProvider: client.provider,
  };
  return providers;
}
