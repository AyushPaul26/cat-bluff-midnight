import assert from 'node:assert/strict';
import test from 'node:test';
import { browserConfiguration, localProverUrl } from '../src/web/config.ts';

const address = 'ab'.repeat(32);
test('browser configuration requires an explicit valid Preprod address', () => {
  assert.equal(browserConfiguration({ network: 'preprod', contractAddress: address }).contractAddress, address);
  for (const value of ['', 'hello', 'ab'.repeat(31), 'https://private.example/secret']) {
    assert.throws(() => browserConfiguration({network:'preprod', contractAddress:value}), /contract address/i);
  }
  assert.throws(() => browserConfiguration({network:'mainnet', contractAddress:address}), /Preprod/i);
});

test('public endpoint configuration rejects insecure or credential-bearing services', () => {
  for (const indexer of ['http://indexer.example/api', 'https://user:password@indexer.example/api', 'javascript:alert(1)']) {
    assert.throws(() => browserConfiguration({network:'preprod',contractAddress:address,indexer}), /indexer/i);
  }
  const config = browserConfiguration({network:'preprod', contractAddress:address});
  assert.ok(config.indexer.startsWith('https://'));
  assert.ok(config.indexerWS.startsWith('wss://'));
  assert.equal(new URL(config.substrateNode).protocol,'https:');
  assert.equal(new URL(config.proverServer).hostname,'127.0.0.1');
  assert.throws(() => browserConfiguration({network:'preprod',contractAddress:address,proverServer:'https://shared.example'}), /local prover/i);
});

test('private proving configuration accepts only explicit loopback endpoints', () => {
  for (const uri of ['http://127.0.0.1:6300','http://localhost:6300','http://[::1]:6300']) assert.ok(localProverUrl(uri));
  for (const uri of [undefined,'https://prover.example','http://127.0.0.1.evil.test:6300','http://user:secret@localhost:6300','http://0.0.0.0:6300']) assert.equal(localProverUrl(uri), undefined);
});
