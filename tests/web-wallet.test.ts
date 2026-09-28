import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  DustAddress, MidnightBech32m, ShieldedAddress, ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey, UnshieldedAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';
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

test('Lace authorization connects and revalidates without the unused hintUsage extension', async () => {
  // Lace 2.4's transport does not register hintUsage. Its connect result
  // exposes undefined for that property despite the broader InitialAPI type.
  const api = connected();
  Reflect.deleteProperty(api, 'hintUsage');
  const session = new WalletSession();
  await session.connect({ id: 'lace', name: 'Lace', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  assert.deepEqual(session.snapshot, { status: 'connected', name: 'Lace', address: 'shielded-A' });
  const capture = session.capture();
  await capture.guard();
  assert.equal(capture.isCurrent(), true);
  session.disconnect();
  assert.equal(capture.isCurrent(), false);
  assert.throws(() => session.capture());
});

test('a connected wallet missing its proving method remains rejected', async () => {
  const api = connected();
  Reflect.deleteProperty(api, 'getProvingProvider');
  const session = new WalletSession();
  await session.connect({ id: 'incomplete', name: 'Incomplete', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  assert.equal(session.snapshot.status, 'error');
  assert.throws(() => session.capture());
});

test('rejected permission is sanitized and leaves no connected API', async () => {
  const session = new WalletSession();
  const choice = { id: 'reject', name: 'Reject', apiVersion: '4.0.1', compatible: true, api: wallet(connected(), { connect: async () => { throw new Error('SECRET_SENTINEL'); } }) };
  await session.connect(choice);
  assert.equal(session.snapshot.status, 'error');
  assert.doesNotMatch(JSON.stringify(session.snapshot), /SECRET_SENTINEL/);
  assert.throws(() => session.capture());
});

function connectorFailure(code: unknown = 'InternalError', type: unknown = 'DAppConnectorAPIError'): object {
  return { type, code, message: 'PRIVATE_MESSAGE_SENTINEL', reason: 'PRIVATE_REASON_SENTINEL',
    cause: 'https://private.example/?project_id=PRIVATE_QUERY_SENTINEL', stack: 'PRIVATE_STACK_SENTINEL' };
}

function diagnostic(session: WalletSession): unknown {
  const snapshot = session.snapshot;
  assert.equal(snapshot.status, 'error');
  return 'diagnostic' in snapshot ? snapshot.diagnostic : undefined;
}

test('connection failure identifies the exact failing operation without calling later operations', async () => {
  for (const stage of ['authorize', 'api', 'status', 'configuration', 'address'] as const) {
    const api = connected();
    const calls: string[] = [];
    const methods = ['getConnectionStatus', 'getConfiguration', 'getShieldedAddresses'] as const;
    const stages = ['status', 'configuration', 'address'] as const;
    for (const [index, method] of methods.entries()) {
      const original = api[method];
      Object.assign(api, { [method]: async () => {
        calls.push(stages[index]!);
        if (stages[index] === stage) throw connectorFailure();
        return original();
      } });
    }
    if (stage === 'api') Reflect.deleteProperty(api, 'getProvingProvider');
    const session = new WalletSession();
    await session.connect({ id: 'diagnostic', name: 'Lace', apiVersion: '4.0.1', compatible: true,
      api: wallet(api, { connect: async () => { calls.push('authorize'); if (stage === 'authorize') throw connectorFailure(); return api; } }) });
    assert.equal(diagnostic(session), `connect.${stage}/${stage === 'api' ? 'Unknown' : 'InternalError'}`);
    const expected = stage === 'api' ? ['authorize'] : ['authorize', ...stages.slice(0, stages.indexOf(stage as typeof stages[number]) + 1)];
    assert.deepEqual(calls, expected);
    assert.throws(() => session.capture());
  }
});

test('revalidation failures identify status, configuration or address and invalidate the capture', async () => {
  for (const [stage, method] of [
    ['status', 'getConnectionStatus'], ['configuration', 'getConfiguration'], ['address', 'getShieldedAddresses'],
  ] as const) {
    const api = connected();
    const session = new WalletSession();
    await session.connect({ id: 'diagnostic', name: 'Lace', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
    const capture = session.capture();
    api[method] = async () => { throw connectorFailure('Disconnected'); };
    await assert.rejects(capture.guard());
    assert.equal(diagnostic(session), `revalidate.${stage}/Disconnected`);
    assert.equal(capture.isCurrent(), false);
  }
});

test('diagnostics preserve only the five declared connector API error codes', async () => {
  for (const code of ['InternalError', 'Rejected', 'InvalidRequest', 'PermissionRejected', 'Disconnected']) {
    const session = new WalletSession();
    await session.connect({ id: 'codes', name: 'Lace', apiVersion: '4.0.1', compatible: true,
      api: wallet(connected(), { connect: async () => { throw connectorFailure(code); } }) });
    assert.deepEqual(session.snapshot, { status: 'error', reason: 'Wallet connection failed', diagnostic: `connect.authorize/${code}` });
  }
});

test('diagnostics never reflect unknown codes, untrusted fields or hostile property getters', async () => {
  const hostile = { get type(): never { throw new Error('PRIVATE_GETTER_SENTINEL'); } };
  for (const error of [
    connectorFailure('PRIVATE_CODE_SENTINEL'), connectorFailure('InternalError', 'PRIVATE_TYPE_SENTINEL'),
    connectorFailure({ toString: () => 'PRIVATE_OBJECT_SENTINEL' }),
    new Error('PRIVATE_ERROR_SENTINEL'), 'PRIVATE_STRING_SENTINEL', null, hostile,
  ]) {
    const published: unknown[] = [];
    const session = new WalletSession(snapshot => { published.push(snapshot); });
    await session.connect({ id: 'privacy', name: 'Lace', apiVersion: '4.0.1', compatible: true,
      api: wallet(connected(), { connect: async () => { throw error; } }) });
    assert.deepEqual(session.snapshot, { status: 'error', reason: 'Wallet connection failed', diagnostic: 'connect.authorize/Unknown' });
    assert.doesNotMatch(JSON.stringify(published), /PRIVATE_|private\.example|project_id/);
  }
});

test('a retry clears the previous diagnostic while pending, after success and after disconnect', async () => {
  const session = new WalletSession();
  await session.connect({ id: 'retry', name: 'Lace', apiVersion: '4.0.1', compatible: true,
    api: wallet(connected(), { connect: async () => { throw connectorFailure('Rejected'); } }) });
  assert.equal(diagnostic(session), 'connect.authorize/Rejected');
  let finish!: (api: ConnectedAPI) => void;
  let calls = 0;
  const choice = { id: 'retry', name: 'Lace', apiVersion: '4.0.1', compatible: true,
    api: wallet(connected(), { connect: async () => { calls++; return new Promise<ConnectedAPI>(resolve => { finish = resolve; }); } }) };
  const first = session.connect(choice);
  const duplicate = session.connect(choice);
  assert.equal(first, duplicate);
  assert.equal(calls, 1);
  assert.deepEqual(session.snapshot, { status: 'connecting', name: 'Lace' });
  finish(connected());
  await first;
  assert.deepEqual(session.snapshot, { status: 'connected', name: 'Lace', address: 'shielded-A' });
  session.disconnect();
  assert.deepEqual(session.snapshot, { status: 'disconnected' });
});

test('late authorization errors cannot publish diagnostics after disconnect or replacement', async () => {
  for (const replace of [false, true]) {
    let fail!: (error: unknown) => void;
    const session = new WalletSession();
    const pending = session.connect({ id: 'old', name: 'Old', apiVersion: '4.0.1', compatible: true,
      api: wallet(connected(), { connect: () => new Promise<ConnectedAPI>((_resolve, reject) => { fail = reject; }) }) });
    session.disconnect();
    if (replace) await session.connect({ id: 'new', name: 'New', apiVersion: '4.0.1', compatible: true, api: wallet(connected()) });
    fail(connectorFailure('Disconnected'));
    await pending;
    assert.deepEqual(session.snapshot, replace ? { status: 'connected', name: 'New', address: 'shielded-A' } : { status: 'disconnected' });
  }
});

test('superseded revalidation errors cannot publish stale diagnostics', async () => {
  for (const replace of [false, true]) {
    const api = connected();
    const session = new WalletSession();
    await session.connect({ id: 'old', name: 'Old', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
    let fail!: (error: unknown) => void;
    api.getConnectionStatus = () => new Promise((_resolve, reject) => { fail = reject; });
    const pending = session.revalidate();
    if (replace) {
      session.disconnect();
      await session.connect({ id: 'new', name: 'New', apiVersion: '4.0.1', compatible: true, api: wallet(connected()) });
    } else {
      api.getConnectionStatus = async () => ({ status: 'connected', networkId: 'preprod' });
      await session.revalidate();
    }
    fail(connectorFailure('Disconnected'));
    await pending;
    assert.deepEqual(session.snapshot, { status: 'connected', name: replace ? 'New' : 'Old', address: 'shielded-A' });
  }
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

// These are throwaway public test addresses, not funded wallets or signing keys.
function faucetAddress(network = 'preprod'): string {
  return UnshieldedAddress.codec.encode(network, new UnshieldedAddress(Buffer.alloc(32, 1))).asString();
}

async function faucetSession(api: ConnectedAPI): Promise<WalletSession> {
  const session = new WalletSession();
  await session.connect({ id: 'faucet', name: 'Faucet', apiVersion: '4.0.1', compatible: true, api: wallet(api) });
  assert.equal(session.snapshot.status, 'connected');
  return session;
}

test('faucet address reads a validated Preprod unshielded address without wallet mutations or caching', async () => {
  const api = connected();
  const expected = faucetAddress();
  let reads = 0;
  let mutations = 0;
  api.getUnshieldedAddress = async () => { reads++; return { unshieldedAddress: expected }; };
  const unexpectedMutation = async () => { mutations++; throw new Error('Unexpected wallet mutation'); };
  api.balanceUnsealedTransaction = unexpectedMutation;
  api.balanceSealedTransaction = unexpectedMutation;
  api.submitTransaction = unexpectedMutation;
  api.makeIntent = unexpectedMutation;
  api.makeTransfer = unexpectedMutation;
  api.signData = unexpectedMutation;
  const session = await faucetSession(api);
  assert.equal(typeof session.getFaucetAddress, 'function');
  assert.equal(await session.getFaucetAddress(), expected);
  assert.equal(await session.getFaucetAddress(), expected);
  assert.equal(reads, 2);
  assert.equal(mutations, 0);
  assert.deepEqual(session.snapshot, { status: 'connected', name: 'Faucet', address: 'shielded-A' });
});

test('faucet address rejects other address types, networks, bad checksums and invalid payload lengths', async () => {
  const invalid = [
    ShieldedAddress.codec.encode('preprod', new ShieldedAddress(
      new ShieldedCoinPublicKey(Buffer.alloc(32, 2)),
      new ShieldedEncryptionPublicKey(Buffer.alloc(32, 3)),
    )).asString(),
    DustAddress.codec.encode('preprod', new DustAddress(1n)).asString(),
    faucetAddress('preview'), faucetAddress('mainnet'),
    'mn_addr_preprod1malformed', '',
    new MidnightBech32m('addr', 'preprod', Buffer.alloc(31)).asString(),
  ];
  for (const address of invalid) {
    const api = connected();
    api.getUnshieldedAddress = async () => ({ unshieldedAddress: address });
    const session = await faucetSession(api);
    assert.equal(typeof session.getFaucetAddress, 'function');
    await assert.rejects(session.getFaucetAddress());
  }
});

test('faucet address refuses a disconnected session before reading the wallet', async () => {
  const api = connected();
  let reads = 0;
  api.getUnshieldedAddress = async () => { reads++; return { unshieldedAddress: faucetAddress() }; };
  const session = await faucetSession(api);
  session.disconnect();
  assert.equal(typeof session.getFaucetAddress, 'function');
  await assert.rejects(session.getFaucetAddress());
  assert.equal(reads, 0);
});

test('faucet address checks account identity before requesting an address', async () => {
  const api = connected();
  let reads = 0;
  api.getUnshieldedAddress = async () => { reads++; return { unshieldedAddress: faucetAddress() }; };
  const session = await faucetSession(api);
  api.getShieldedAddresses = async () => ({ shieldedAddress: 'shielded-B', shieldedCoinPublicKey: 'coin-B', shieldedEncryptionPublicKey: 'encryption-B' });
  assert.equal(typeof session.getFaucetAddress, 'function');
  await assert.rejects(session.getFaucetAddress());
  assert.equal(reads, 0);
  assert.equal(session.snapshot.status, 'error');
});

for (const change of ['disconnect', 'reconnect', 'account'] as const) {
  test(`faucet address discards an in-flight result after ${change}`, async () => {
    const api = connected();
    let started!: () => void;
    let complete!: (value: { unshieldedAddress: string }) => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    const delayed = new Promise<{ unshieldedAddress: string }>(resolve => { complete = resolve; });
    api.getUnshieldedAddress = async () => { started(); return delayed; };
    const session = await faucetSession(api);
    assert.equal(typeof session.getFaucetAddress, 'function');
    const pending = session.getFaucetAddress();
    const rejected = assert.rejects(pending);
    await entered;
    if (change === 'account') {
      api.getShieldedAddresses = async () => ({ shieldedAddress: 'shielded-B', shieldedCoinPublicKey: 'coin-B', shieldedEncryptionPublicKey: 'encryption-B' });
    } else {
      session.disconnect();
      if (change === 'reconnect') {
        await session.connect({ id: 'new', name: 'New', apiVersion: '4.0.1', compatible: true, api: wallet(connected()) });
      }
    }
    complete({ unshieldedAddress: faucetAddress() });
    await rejected;
    assert.equal(session.snapshot.status, change === 'account' ? 'error' : change === 'reconnect' ? 'connected' : 'disconnected');
    if (change === 'reconnect') assert.deepEqual(session.snapshot, { status: 'connected', name: 'New', address: 'shielded-A' });
  });
}

test('faucet address sanitizes wallet rejection and malformed response errors', async () => {
  const api = connected();
  const session = await faucetSession(api);
  api.getUnshieldedAddress = async () => { throw new Error('SDK_PRIVATE_SENTINEL'); };
  assert.equal(typeof session.getFaucetAddress, 'function');
  await assert.rejects(session.getFaucetAddress(), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.doesNotMatch(error.message, /SDK_PRIVATE_SENTINEL/);
    assert.equal(error.cause, undefined);
    return true;
  });
  api.getUnshieldedAddress = async () => ({ unshieldedAddress: 'SDK_PRIVATE_SENTINEL' });
  await assert.rejects(session.getFaucetAddress(), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.doesNotMatch(error.message, /SDK_PRIVATE_SENTINEL/);
    assert.equal(error.cause, undefined);
    return true;
  });
});
