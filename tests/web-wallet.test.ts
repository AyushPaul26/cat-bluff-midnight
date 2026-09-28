import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { discoverWallets, WalletSession } from '../src/web/wallet.ts';

function wallet(api: ConnectedAPI, overrides: Partial<InitialAPI> = {}): InitialAPI {
  return { rdns: 'io.example.wallet', name: 'Example', icon: 'https://example.test/icon.svg', apiVersion: '4.0.1', connect: async () => api, ...overrides };
}

function connected(): ConnectedAPI {
  return {
    getShieldedBalances: async () => ({}), getUnshieldedBalances: async () => ({}),
    getDustBalance: async () => ({ cap: 0n, balance: 0n }),
    getShieldedAddresses: async () => ({ shieldedAddress: 'shielded-A', shieldedCoinPublicKey: 'coin-A', shieldedEncryptionPublicKey: 'encryption-A' }),
    getUnshieldedAddress: async () => ({ unshieldedAddress: 'unshielded-A' }), getDustAddress: async () => ({ dustAddress: 'dust-A' }),
    getTxHistory: async () => [], balanceUnsealedTransaction: async () => ({ tx: '' }), balanceSealedTransaction: async () => ({ tx: '' }),
    makeTransfer: async () => ({ tx: '' }), makeIntent: async () => ({ tx: '' }),
    signData: async () => ({ data: '', signature: '', verifyingKey: '' }), submitTransaction: async () => {},
    getProvingProvider: async () => ({ check: async () => [], prove: async () => new Uint8Array() }),
    getConfiguration: async () => ({ indexerUri: 'https://indexer.example', indexerWsUri: 'wss://indexer.example', substrateNodeUri: 'wss://node.example', proverServerUri: 'https://prover.example', networkId: 'preprod' }),
    getConnectionStatus: async () => ({ status: 'connected', networkId: 'preprod' }), hintUsage: async () => {},
  };
}

test('discovers every structurally valid injected wallet and marks incompatible versions', () => {
  const api = connected();
  const choices = discoverWallets({ unexpected: wallet(api), next: wallet(api, { apiVersion: '5.0.0' }), broken: { name: 'Broken' } });
  assert.deepEqual(choices.map(({ id, compatible }) => [id, compatible]), [['unexpected', true], ['next', false]]);
  assert.equal(choices[0]?.name, 'Example');
  assert.deepEqual(discoverWallets(undefined), []);
});

test('connect requires Preprod status, configuration, and shielded identity', async () => {
  const api = connected();
  const session = new WalletSession();
  await session.connect({ id: 'example', name: 'Example', apiVersion: '4.0.1', api: wallet(api), compatible: true });
  assert.deepEqual(session.snapshot, { status: 'connected', name: 'Example', address: 'shielded-A' });
  const capture = session.capture();
  assert.equal(capture.api, api);
  assert.equal(capture.coinPublicKey, 'coin-A');
  assert.equal(capture.encryptionPublicKey, 'encryption-A');
  assert.equal(capture.configuration.networkId, 'preprod');
});

test('rejected permission is sanitized and leaves no connected API', async () => {
  const session = new WalletSession();
  const choice = { id: 'reject', name: 'Reject', apiVersion: '4.0.1', compatible: true, api: wallet(connected(), { connect: async () => { throw new Error('SECRET_SENTINEL'); } }) };
  await session.connect(choice);
  assert.equal(session.snapshot.status, 'error');
  assert.doesNotMatch(JSON.stringify(session.snapshot), /SECRET_SENTINEL/);
  assert.throws(() => session.capture());
});

test('a wallet reporting another network is refused', async () => {
  const api = connected();
  api.getConnectionStatus = async () => ({ status: 'connected', networkId: 'mainnet' });
  const session = new WalletSession();
  await session.connect({ id: 'wrong', name: 'Wrong', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  assert.equal(session.snapshot.status, 'error');
});

test('disconnect during delayed authorization prevents stale connect result', async () => {
  let resolveConnect!: (api: ConnectedAPI) => void;
  const delayed = new Promise<ConnectedAPI>(resolve => { resolveConnect = resolve; });
  const session = new WalletSession();
  const pending = session.connect({ id: 'slow', name: 'Slow', apiVersion: '4.0.1', compatible: true, api: wallet(connected(), { connect: async () => delayed }) });
  assert.equal(session.snapshot.status, 'connecting');
  session.disconnect();
  resolveConnect(connected());
  await pending;
  assert.deepEqual(session.snapshot, { status: 'disconnected' });
});

test('account change invalidates capture and cached session', async () => {
  const api = connected();
  const session = new WalletSession();
  await session.connect({ id: 'account', name: 'Account', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  const capture = session.capture();
  api.getShieldedAddresses = async () => ({ shieldedAddress: 'shielded-B', shieldedCoinPublicKey: 'coin-B', shieldedEncryptionPublicKey: 'encryption-B' });
  await assert.rejects(capture.guard());
  assert.equal(capture.isCurrent(), false);
  assert.equal(session.snapshot.status, 'error');
});

test('older revalidation cannot disconnect a newly connected wallet', async () => {
  const old = connected();
  let resolveStatus!: (value: Awaited<ReturnType<ConnectedAPI['getConnectionStatus']>>) => void;
  old.getConnectionStatus = async () => new Promise(resolve => { resolveStatus = resolve; });
  const session = new WalletSession();
  // Connect with a normal status, then delay only the subsequent poll.
  const firstStatus = old.getConnectionStatus;
  old.getConnectionStatus = async () => ({ status: 'connected', networkId: 'preprod' });
  await session.connect({ id: 'old', name: 'Old', apiVersion: '4.0.1', compatible: true, api: wallet(old) });
  old.getConnectionStatus = firstStatus;
  const stalePoll = session.revalidate();
  session.disconnect();
  await session.connect({ id: 'new', name: 'New', apiVersion: '4.0.1', compatible: true, api: wallet(connected()) });
  resolveStatus({ status: 'disconnected' });
  await stalePoll;
  assert.deepEqual(session.snapshot, { status: 'connected', name: 'New', address: 'shielded-A' });
});

test('duplicate connect while authorization is pending does not prompt twice', async () => {
  let calls = 0;
  let resolveConnect!: (api: ConnectedAPI) => void;
  const api = wallet(connected(), { connect: async () => { calls++; return new Promise(resolve => { resolveConnect = resolve; }); } });
  const session = new WalletSession();
  const choice = { id: 'duplicate', name: 'Duplicate', apiVersion: '4.0.1', compatible: true, api };
  const first = session.connect(choice);
  const second = session.connect(choice);
  assert.equal(calls, 1);
  resolveConnect(connected());
  await Promise.all([first, second]);
});

test('a superseded guard cannot authorize side effects', async () => {
  const api = connected();
  const session = new WalletSession();
  await session.connect({ id: 'guard', name: 'Guard', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  let resolveStatus!: (value: Awaited<ReturnType<ConnectedAPI['getConnectionStatus']>>) => void;
  api.getConnectionStatus = async () => new Promise(resolve => { resolveStatus = resolve; });
  const guard = session.capture().guard();
  api.getConnectionStatus = async () => ({ status: 'connected', networkId: 'preprod' });
  await session.revalidate();
  resolveStatus({ status: 'connected', networkId: 'preprod' });
  await assert.rejects(guard);
});

test('late wallet injection is found by a fresh discovery call', () => {
  const injected: Record<string, unknown> = {};
  assert.deepEqual(discoverWallets(injected), []);
  injected.late = wallet(connected());
  assert.equal(discoverWallets(injected)[0]?.id, 'late');
});

test('unsupported API version never invokes wallet authorization', async () => {
  let invoked = false;
  const api = wallet(connected(), { apiVersion: '5.0.0', connect: async () => { invoked = true; return connected(); } });
  const session = new WalletSession();
  await session.connect({ id: 'future', name: 'Future', apiVersion: '5.0.0', compatible: false, api });
  assert.equal(invoked, false);
  assert.equal(session.snapshot.status, 'error');
});

test('missing connected methods or shielded keys never yield a capture', async () => {
  const incomplete = connected();
  delete (incomplete as Partial<ConnectedAPI>).getConfiguration;
  const session = new WalletSession();
  await session.connect({ id: 'incomplete', name: 'Incomplete', apiVersion: '4.0.1', compatible: true, api: wallet(incomplete) });
  assert.equal(session.snapshot.status, 'error');
  const malformed = connected();
  malformed.getShieldedAddresses = async () => ({ shieldedAddress: '', shieldedCoinPublicKey: '', shieldedEncryptionPublicKey: '' });
  await session.connect({ id: 'malformed', name: 'Malformed', apiVersion: '4.0.1', compatible: true, api: wallet(malformed) });
  assert.throws(() => session.capture());
});

test('changed prover and indexer configuration invalidates an existing capture', async () => {
  const api = connected();
  const session = new WalletSession();
  await session.connect({ id: 'config', name: 'Config', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  const capture = session.capture();
  api.getConfiguration = async () => ({ indexerUri: 'https://other-indexer.example', indexerWsUri: 'wss://indexer.example', substrateNodeUri: 'wss://node.example', proverServerUri: 'https://other-prover.example', networkId: 'preprod' });
  await assert.rejects(capture.guard());
  assert.equal(capture.isCurrent(), false);
});
