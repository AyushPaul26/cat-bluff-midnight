import assert from 'node:assert/strict';
import test from 'node:test';
import { pureCircuits, Phase, type Ledger } from '../managed/cat-bluff/contract/index.js';
import { createMemoryPrivateStateProvider, playerWitnesses, type PrivateState } from '../src/web/private-state.ts';
import { decryptPackage, encryptPackage, validatePackageState } from '../src/web/private-package.ts';
import { exportDemoPackage, parseExistingPrivateRecord } from '../src/export-demo-package.ts';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

const password = 'correct horse battery staple';
const context = 'ab'.repeat(32);
const scope = { network: 'preprod' as const, contractAddress: 'contract_fixture_1', context, round: '1' as const };
const state: PrivateState = { secret: Uint8Array.from({ length: 32 }, (_, i) => i + 1), rank: 7n, salt: Uint8Array.from({ length: 32 }, (_, i) => 200 + i) };
const hex = (bytes: Uint8Array) => Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
const ledger = (phase: Phase): Ledger => {
  const gameContext = Uint8Array.from({ length: 32 }, () => 0xab);
  const player = pureCircuits.deriveRole(gameContext, 1n, state.secret);
  return {
    gameContext, round: 1n, phase, player,
    challenger: pureCircuits.deriveRole(gameContext, 2n, Uint8Array.from({ length: 32 }, () => 99)),
    commitment: phase === Phase.Empty ? new Uint8Array(32) : pureCircuits.deriveCard(gameContext, 1n, player, state.rank, state.salt),
    claimedRank: phase === Phase.Empty ? 0n : 8n,
    revealedRank: phase === Phase.Resolved ? state.rank : 0n,
    truthful: false,
  };
};

test('encrypted package round trips only card witnesses and binds scope', async () => {
  const encrypted = await encryptPackage(scope, state, password);
  assert.equal(encrypted.includes(hex(state.secret)), false);
  assert.equal(encrypted.includes(hex(state.salt)), false);
  const opened = await decryptPackage(encrypted, password);
  assert.deepEqual(opened.scope, scope);
  assert.deepEqual(opened.state, state);
  validatePackageState(opened, scope.contractAddress, ledger(Phase.Empty));
});

test('wrong password and altered authenticated scope fail closed', async () => {
  const encrypted = await encryptPackage(scope, state, password);
  await assert.rejects(decryptPackage(encrypted, 'wrong password long enough'));
  const changed = JSON.parse(encrypted);
  changed.scope.contractAddress = 'contract_attacker';
  await assert.rejects(decryptPackage(JSON.stringify(changed), password));
});

test('ciphertext tampering fails authentication', async () => {
  const changed = JSON.parse(await encryptPackage(scope, state, password));
  changed.ciphertext = (changed.ciphertext[0] === 'A' ? 'B' : 'A') + changed.ciphertext.slice(1);
  await assert.rejects(decryptPackage(JSON.stringify(changed), password), /could not be opened/i);
});

test('oversized envelope is refused before parsing', async () => {
  const oversized = `${await encryptPackage(scope, state, password)}${' '.repeat(65_536)}`;
  await assert.rejects(decryptPackage(oversized, password), /Invalid package/);
});

test('invalid KDF and IV parameters are refused', async () => {
  const original = JSON.parse(await encryptPackage(scope, state, password));
  await assert.rejects(decryptPackage(JSON.stringify({ ...original, iterations: 1 }), password));
  await assert.rejects(decryptPackage(JSON.stringify({ ...original, kdf: 'PBKDF2-SHA1' }), password));
  await assert.rejects(decryptPackage(JSON.stringify({ ...original, kdfSalt: 'AA==' }), password));
  await assert.rejects(decryptPackage(JSON.stringify({ ...original, iv: 'AA==' }), password));
});

test('package validation rejects contract, player, and commitment mismatch', async () => {
  const opened = await decryptPackage(await encryptPackage(scope, state, password), password);
  assert.throws(() => validatePackageState(opened, 'other_contract', ledger(Phase.Empty)));
  const badPlayer = { ...ledger(Phase.Empty), player: new Uint8Array(32) };
  assert.throws(() => validatePackageState(opened, scope.contractAddress, badPlayer));
  validatePackageState(opened, scope.contractAddress, ledger(Phase.Committed));
  const badOpening = { ...ledger(Phase.Challenged), commitment: new Uint8Array(32) };
  assert.throws(() => validatePackageState(opened, scope.contractAddress, badOpening));
});

test('package validation rejects context and round mismatch', async () => {
  const opened = await decryptPackage(await encryptPackage(scope, state, password), password);
  const wrongContext = { ...ledger(Phase.Empty), gameContext: new Uint8Array(32) };
  assert.throws(() => validatePackageState(opened, scope.contractAddress, wrongContext));
  const wrongRound = { ...ledger(Phase.Empty), round: 2n };
  assert.throws(() => validatePackageState(opened, scope.contractAddress, wrongRound));
});

test('rank and byte lengths are rejected before encryption', async () => {
  await assert.rejects(encryptPackage(scope, { ...state, rank: 0n }, password));
  await assert.rejects(encryptPackage(scope, { ...state, rank: 14n }, password));
  await assert.rejects(encryptPackage(scope, { ...state, salt: new Uint8Array(31) }, password));
  await assert.rejects(encryptPackage(scope, state, 'short'));
});

test('memory provider isolates instances, returns copies, and disposes', async () => {
  const a = createMemoryPrivateStateProvider(state, scope.contractAddress);
  const b = createMemoryPrivateStateProvider(state, scope.contractAddress);
  const first = await a.provider.get('cat-bluff');
  assert.deepEqual(first, state);
  first!.secret[0] = 0;
  assert.equal((await a.provider.get('cat-bluff'))!.secret[0], 1);
  await a.provider.set('cat-bluff', { ...state, rank: 9n });
  assert.equal((await b.provider.get('cat-bluff'))!.rank, 7n);
  a.dispose();
  await assert.rejects(a.provider.get('cat-bluff'));
  assert.equal((await b.provider.get('cat-bluff'))!.rank, 7n);
  b.dispose();
});

test('memory provider satisfies SDK state and signing-key lifecycle', async () => {
  const held = createMemoryPrivateStateProvider(state, scope.contractAddress);
  const sdkProvider: PrivateStateProvider<string, PrivateState> = held.provider;
  sdkProvider.setContractAddress(scope.contractAddress);
  await sdkProvider.setSigningKey(scope.contractAddress, 'fixture-signing-key');
  assert.equal(await sdkProvider.getSigningKey(scope.contractAddress), 'fixture-signing-key');
  await sdkProvider.removeSigningKey(scope.contractAddress);
  assert.equal(await sdkProvider.getSigningKey(scope.contractAddress), null);
  await sdkProvider.clear();
  assert.equal(await sdkProvider.get('cat-bluff'), null);
  await sdkProvider.clearSigningKeys();
  await assert.rejects(sdkProvider.exportPrivateStates(), /unsupported/i);
  held.dispose();
  await assert.rejects(sdkProvider.getSigningKey(scope.contractAddress));
});

test('generated witness interface reads private state without mutation', () => {
  const contextArg = { privateState: state } as Parameters<typeof playerWitnesses.secret>[0];
  assert.equal(playerWitnesses.rank(contextArg)[1], 7n);
  assert.deepEqual(playerWitnesses.secret(contextArg)[1], state.secret);
  assert.deepEqual(playerWitnesses.salt(contextArg)[1], state.salt);
});

test('human export refuses noninteractive input before reading secrets', async () => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    await assert.rejects(exportDemoPackage(), /interactive terminal/i);
  }
});

test('malformed private source reports a fixed error without source fragments', () => {
  const sourceFragment = 'synthetic-secret-fragment';
  assert.throws(
    () => parseExistingPrivateRecord(`{"playerSecret":"${sourceFragment}",`),
    (error: unknown) => error instanceof Error && error.message === 'Invalid existing private card record' &&
      !error.message.includes(sourceFragment),
  );
});
