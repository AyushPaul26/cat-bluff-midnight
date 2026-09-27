import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../src/config.ts';

test('deployment permits only the documented free Preprod network', () => {
  assert.equal(configuration('preprod').walletNetworkId, 'preprod');
  for (const network of ['mainnet', 'preview', '', 'PREPROD']) {
    assert.throws(() => configuration(network), /Preprod only/);
  }
});
