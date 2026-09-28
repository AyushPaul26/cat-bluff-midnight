import assert from 'node:assert/strict';
import test from 'node:test';
import type { Configuration, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { browserConfiguration } from '../src/web/config.ts';
import { runCommit } from '../src/web/contract.ts';

const config = browserConfiguration({ contractAddress: 'ab'.repeat(32) });
const lacePreprod: Configuration = {
  networkId: 'preprod',
  indexerUri: 'https://blockfrost.lw.iog.io/midnight-preprod/',
  indexerWsUri: 'wss://blockfrost.lw.iog.io/midnight-preprod/ws',
  substrateNodeUri: 'https://blockfrost.lw.iog.io/midnight-preprod-rpc/',
  proverServerUri: 'http://localhost:6300',
};
const unused = async (): Promise<never> => { throw new Error('Unexpected wallet side effect'); };
const api: ConnectedAPI = {
  getShieldedBalances: unused, getUnshieldedBalances: unused, getDustBalance: unused,
  getShieldedAddresses: unused, getUnshieldedAddress: unused, getDustAddress: unused,
  getTxHistory: unused, balanceUnsealedTransaction: unused, balanceSealedTransaction: unused,
  makeTransfer: unused, makeIntent: unused, signData: unused, submitTransaction: unused,
  getProvingProvider: unused, getConfiguration: unused, getConnectionStatus: unused, hintUsage: unused,
};
function check(configuration: Configuration) {
  // Stop at the real controller's unsupported-Web-Locks boundary after endpoint
  // validation. This Node test never reads chain data, proves, or asks a wallet.
  assert.equal(globalThis.navigator?.locks, undefined);
  return runCommit({ config, session: {
    api, configuration, address: 'test-address', coinPublicKey: 'test-coin', encryptionPublicKey: 'test-key',
    guard: unused, isCurrent: () => true,
  }, opened: { scope: { network: 'preprod', contractAddress: config.contractAddress, context: '01'.repeat(32), round: '1' },
    state: { secret: new Uint8Array(32).fill(1), salt: new Uint8Array(32).fill(2), rank: 7n } },
  claim: 5n, store: { get: () => null, set: () => { throw new Error('Unexpected persistence'); } } });
}

test('Lace 2.4 exact Preprod endpoint tuple passes the commit configuration gate', async () => {
  await assert.rejects(check(lacePreprod), /Web Locks/);
});

test('official Preprod endpoints still pass the commit configuration gate', async () => {
  await assert.rejects(check({ ...lacePreprod, indexerUri: config.indexer, indexerWsUri: config.indexerWS, substrateNodeUri: config.substrateNode }), /Web Locks/);
});

test('Lace endpoint lookalikes, mixed tuples, other networks, and extra URL components are rejected', async () => {
  const invalid: Configuration[] = [
    { ...lacePreprod, networkId: 'preview' },
    { ...lacePreprod, indexerUri: 'https://blockfrost.lw.iog.io/midnight-preview/' },
    { ...lacePreprod, substrateNodeUri: config.substrateNode },
    { ...lacePreprod, indexerWsUri: config.indexerWS },
    { ...lacePreprod, indexerUri: 'https://blockfrost.lw.iog.io.evil.test/midnight-preprod/' },
    { ...lacePreprod, indexerUri: 'https://user:secret@blockfrost.lw.iog.io/midnight-preprod/' },
    { ...lacePreprod, indexerUri: lacePreprod.indexerUri + '?token=secret' },
    { ...lacePreprod, indexerWsUri: lacePreprod.indexerWsUri + '#extra' },
    { ...lacePreprod, substrateNodeUri: 'https://blockfrost.lw.iog.io/midnight-preprod-rpc/extra' },
  ];
  for (const configuration of invalid) await assert.rejects(check(configuration), /Wallet endpoints/);
});

test('Lace Preprod still requires the configured user-local prover', async () => {
  for (const proverServerUri of [undefined, 'https://shared.example/prover', 'http://localhost:6301', 'http://localhost:6300/another', 'http://localhost.evil.test:6300']) {
    await assert.rejects(check({ ...lacePreprod, proverServerUri }), /local proof server/);
  }
});
