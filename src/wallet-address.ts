import { mkdir, writeFile } from 'node:fs/promises';
import { buildWallet, loadSecrets } from './wallet.ts';

const { wallet, address, env } = await buildWallet(await loadSecrets());
const info = { network: env.networkId, unshieldedAddress: address, faucet: env.faucet };
await mkdir('docs/evidence', { recursive: true });
await writeFile('docs/evidence/wallet.json', JSON.stringify(info, null, 2) + '\n');
console.log(JSON.stringify(info, null, 2));
await wallet.stop();
