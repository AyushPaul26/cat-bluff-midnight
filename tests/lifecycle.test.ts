import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closeWallet } from '../src/wallet-lifecycle.ts';

test('wallet shutdown still runs when checkpoint persistence fails', async () => {
  let stopped = false;
  const result = await closeWallet({
    saveState: async () => { throw new Error('private-material-must-not-escape'); },
    wallet: { stop: async () => { stopped = true; } },
  });
  assert.equal(stopped, true);
  assert.equal(result, false);
});

test('clean wallet shutdown saves state before stopping', async () => {
  const actions: string[] = [];
  const result = await closeWallet({
    saveState: async () => { actions.push('save'); },
    wallet: { stop: async () => { actions.push('stop'); } },
  });
  assert.deepEqual(actions, ['save', 'stop']);
  assert.equal(result, true);
});
