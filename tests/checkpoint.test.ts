import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { readCheckpoint, writeCheckpoint } from '../src/wallet-checkpoint.ts';

test('checkpoint round-trip preserves all wallet states and rejects the wrong account', async () => {
  await mkdir('.tools', { recursive: true });
  const dir = await mkdtemp('.tools/checkpoint-test-');
  const file = `${dir}/wallet.json`;
  assert.equal(await readCheckpoint(file, 'test-address'), undefined);
  const checkpoint = { network: 'preprod' as const, address: 'test-address', shielded: 'shielded-state', dust: 'dust-state', unshielded: 'unshielded-state' };
  await writeCheckpoint(file, checkpoint);
  assert.deepEqual(await readCheckpoint(file, 'test-address'), checkpoint);
  await assert.rejects(readCheckpoint(file, 'other-address'), /account or network mismatch/);
  await writeFile(file, JSON.stringify({ ...checkpoint, network: 'mainnet' }));
  await assert.rejects(readCheckpoint(file, 'test-address'), /account or network mismatch/);
});

test('malformed checkpoint errors do not echo private data', async () => {
  await mkdir('.tools', { recursive: true });
  const dir = await mkdtemp('.tools/checkpoint-test-');
  const file = `${dir}/wallet.json`;
  await writeFile(file, '{private-sensitive-broken-data');
  await assert.rejects(readCheckpoint(file, 'test-address'), error =>
    error instanceof Error && !error.message.includes('private-sensitive') && /Invalid wallet checkpoint/.test(error.message));
});
