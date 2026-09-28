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
// Deliberately fake credential. Real wallet project IDs never belong in tests/logs.
const testProjectId = 'cat-bluff-test-project-not-a-real-credential';
const blockfrostPreprod: Configuration = {
  networkId: 'preprod',
  indexerUri: `https://midnight-preprod.blockfrost.io/api/v0?project_id=${testProjectId}`,
  indexerWsUri: `wss://midnight-preprod.blockfrost.io/api/v0/ws?project_id=${testProjectId}`,
  substrateNodeUri: `https://rpc.midnight-preprod.blockfrost.io?project_id=${testProjectId}`,
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

test('current Blockfrost Preprod tuple accepts one matching project credential without wallet side effects', async () => {
  await assert.rejects(check(blockfrostPreprod), /Web Locks/);
});

test('current Blockfrost tuple rejects mismatched credentials and unsupported URL components', async () => {
  const invalid: Partial<Configuration>[] = [
    { networkId: 'preview' },
    { indexerUri: 'not a URL' },
    { indexerUri: blockfrostPreprod.indexerUri.replace('midnight-preprod.', 'midnight-preview.') },
    { indexerUri: blockfrostPreprod.indexerUri.replace('blockfrost.io/', 'blockfrost.io.evil.test/') },
    { indexerUri: blockfrostPreprod.indexerUri.replace('https://', 'http://') },
    { indexerWsUri: blockfrostPreprod.indexerWsUri.replace('wss://', 'ws://') },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri.replace('https://', 'wss://') },
    { indexerUri: blockfrostPreprod.indexerUri.replace('https://', 'https://user:password@') },
    { indexerWsUri: blockfrostPreprod.indexerWsUri.replace('wss://', 'wss://user:password@') },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri.replace('https://', 'https://user:password@') },
    { indexerUri: blockfrostPreprod.indexerUri.replace('/api/v0?', '/api/v0/extra?') },
    { indexerWsUri: blockfrostPreprod.indexerWsUri.replace('/api/v0/ws?', '/api/v0?') },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri.replace('.io?', '.io/extra?') },
    { indexerUri: blockfrostPreprod.indexerUri.replace('.io/', '.io:8443/') },
    { indexerUri: blockfrostPreprod.indexerUri + '#fragment' },
    { indexerWsUri: blockfrostPreprod.indexerWsUri + '#fragment' },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri + '#fragment' },
    { indexerUri: 'https://midnight-preprod.blockfrost.io/api/v0' },
    { indexerUri: 'https://midnight-preprod.blockfrost.io/api/v0?project_id=' },
    { indexerUri: blockfrostPreprod.indexerUri.replace('project_id=', 'other=') },
    { indexerUri: blockfrostPreprod.indexerUri + '&extra=value' },
    { indexerWsUri: blockfrostPreprod.indexerWsUri + '&project_id=another-fake-project' },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri + `&project_id=${testProjectId}` },
    { indexerUri: blockfrostPreprod.indexerUri.replace(testProjectId, 'another-fake-project') },
    { indexerWsUri: blockfrostPreprod.indexerWsUri.replace(testProjectId, 'another-fake-project') },
    { substrateNodeUri: blockfrostPreprod.substrateNodeUri.replace(testProjectId, 'another-fake-project') },
    { indexerWsUri: config.indexerWS },
    { substrateNodeUri: lacePreprod.substrateNodeUri },
  ];
  for (const override of invalid) {
    await assert.rejects(check({ ...blockfrostPreprod, ...override }), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Wallet endpoints/);
      assert.doesNotMatch(error.message, new RegExp(testProjectId));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('current Blockfrost endpoints still require the configured local prover', async () => {
  for (const proverServerUri of [undefined, 'https://shared.example/prover', 'http://localhost:6301', 'http://localhost:6300/another', 'http://localhost.evil.test:6300']) {
    await assert.rejects(check({ ...blockfrostPreprod, proverServerUri }), /local proof server/);
  }
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
