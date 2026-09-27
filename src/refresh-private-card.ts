import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { ledger } from '../managed/cat-bluff/contract/index.js';
import { freshCard } from './witnesses.ts';
import { buildWallet, loadSecrets } from './wallet.ts';
import { providersFor } from './providers.ts';

// Local private-state repair only. Never alter an opening after commitment.
async function main() {
  const receipt = JSON.parse(await readFile('docs/evidence/deployment.json', 'utf8'));
  assert.equal(receipt.network, 'preprod');
  const saved = await loadSecrets();
  const client = await buildWallet(saved);
  try {
    const providers = providersFor(client, saved);
    const chain = await providers.publicDataProvider.queryContractState(receipt.contractAddress);
    assert.ok(chain);
    assert.equal(ledger(chain.data).phase, 0, 'Only an uncommitted Empty round can receive a fresh local card');
    assert.deepEqual(ledger(chain.data).gameContext, new Uint8Array(Buffer.from(saved.context, 'hex')));
    const card = freshCard();
    providers.privateStateProvider.setContractAddress(receipt.contractAddress);
    await providers.privateStateProvider.set('cat-bluff-player', {
      secret: new Uint8Array(Buffer.from(saved.playerSecret, 'hex')), ...card,
    });
    await writeFile('.private/local.json', JSON.stringify({
      ...saved, rank: card.rank.toString(), salt: Buffer.from(card.salt).toString('hex'),
    }), { mode: 0o600 });
    console.log('Fresh private card saved before the first commitment; no rank or salt disclosed.');
  } finally {
    await Promise.race([client.wallet.stop(), new Promise(resolve => setTimeout(resolve, 15_000))]);
  }
}
main().then(() => process.exit(0)).catch(error => {
  console.error(`Private card refresh failed (${error instanceof Error ? error.name : 'UnknownError'}).`);
  process.exit(1);
});
