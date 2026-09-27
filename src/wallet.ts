// Provider flow adapted from midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation. SPDX-License-Identifier: Apache-2.0.
// Cat Bluff adaptation: dedicated saved seed; no seed/witness logging; Preprod only.
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HDWallet, Roles, createKeystore, PublicKey, ShieldedWallet, UnshieldedWallet, DustWallet,
  WalletFacade, InMemoryTransactionHistoryStorage, WalletEntrySchema, mergeWalletEntries } from '@midnight-ntwrk/wallet-sdk';
import { DustSecretKey, ZswapSecretKeys, LedgerParameters } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { firstValueFrom, timeout } from 'rxjs';
import { configuration } from './config.ts';
import { validatePassword } from '@midnight-ntwrk/midnight-js-utils';
import WebSocket from 'ws';
import { freshCard } from './witnesses.ts';
import { readCheckpoint, writeCheckpoint } from './wallet-checkpoint.ts';

globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

function storagePassword(): string {
  for (;;) {
    const value = randomBytes(32).toString('base64') + '!Aa7';
    try { validatePassword(value); return value; } catch { /* Sample another strong random value. */ }
  }
}

export type LocalSecrets = {
  network: 'preprod'; seed: string; storagePassword: string;
  context: string; playerSecret: string; challengerSecret: string; salt: string; rank: string;
};
export async function loadSecrets(): Promise<LocalSecrets> {
  configuration(process.env.CAT_BLUFF_NETWORK ?? 'preprod');
  const file = resolve('.private/local.json');
  try {
    const saved = JSON.parse(await readFile(file, 'utf8')) as LocalSecrets;
    if (saved.network !== 'preprod') throw new Error('Private wallet network mismatch');
    for (const key of ['seed', 'context', 'playerSecret', 'challengerSecret', 'salt'] as const) {
      if (!/^[0-9a-f]{64}$/.test(saved[key])) throw new Error('Invalid private configuration');
    }
    if (!saved.storagePassword || !/^(?:[1-9]|1[0-3])$/.test(saved.rank)) throw new Error('Invalid private configuration');
    validatePassword(saved.storagePassword);
    return saved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const hex = () => randomBytes(32).toString('hex');
  const card = freshCard();
  const saved: LocalSecrets = {
    network: 'preprod', seed: hex(), storagePassword: storagePassword(), context: hex(),
    playerSecret: hex(), challengerSecret: hex(), salt: Buffer.from(card.salt).toString('hex'), rank: card.rank.toString(),
  };
  await mkdir('.private', { recursive: true, mode: 0o700 });
  await writeFile(file, JSON.stringify(saved), { flag: 'wx', mode: 0o600 });
  return saved;
}

export async function buildWallet(saved: LocalSecrets) {
  const env = configuration(process.env.CAT_BLUFF_NETWORK ?? 'preprod');
  setNetworkId(env.networkId);
  const hd = HDWallet.fromSeed(new Uint8Array(Buffer.from(saved.seed, 'hex')));
  if (hd.type !== 'seedOk') throw new Error('Invalid wallet seed');
  const derive = (role: typeof Roles[keyof typeof Roles]) => {
    const result = hd.hdWallet.selectAccount(0).selectRole(role).deriveKeyAt(0);
    if (result.type !== 'keyDerived') throw new Error('Wallet key derivation failed');
    return result.key;
  };
  const seeds = { shielded: derive(Roles.Zswap), unshielded: derive(Roles.NightExternal), dust: derive(Roles.Dust) };
  const keystore = createKeystore(seeds.unshielded, env.walletNetworkId);
  const expectedAddress = keystore.getBech32Address().toString();
  const checkpointFile = resolve('.private/wallet-checkpoint.json');
  const checkpoint = await readCheckpoint(checkpointFile, expectedAddress);
  const config = {
    networkId: env.walletNetworkId,
    indexerClientConnection: { indexerHttpUrl: env.indexer, indexerWsUrl: env.indexerWS },
    provingServerUrl: new URL(env.proofServer), relayURL: new URL(env.nodeWS),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
    costParameters: { ledgerParams: LedgerParameters.initialParameters(), additionalFeeOverhead: 1000n, feeBlocksMargin: 5 },
    // Supported SDK batching changes throughput only: every event is applied.
    batchUpdates: { size: 1000, timeout: 10, spacing: 0 },
  };
  const Shielded = ShieldedWallet(config), Unshielded = UnshieldedWallet(config), Dust = DustWallet(config);
  const wallet = await WalletFacade.init({
    configuration: config,
    shielded: () => checkpoint ? Shielded.restore(checkpoint.shielded) : Shielded.startWithSeed(seeds.shielded),
    unshielded: () => checkpoint ? Unshielded.restore(checkpoint.unshielded) : Unshielded.startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: () => checkpoint ? Dust.restore(checkpoint.dust) : Dust.startWithSeed(seeds.dust, LedgerParameters.initialParameters().dust),
  });
  if (checkpoint) console.log('Resuming the dedicated wallet from its local private checkpoint.');
  const shieldedSecretKeys = ZswapSecretKeys.fromSeed(seeds.shielded);
  const dustSecretKey = DustSecretKey.fromSeed(seeds.dust);
  const provider: WalletProvider & MidnightProvider = {
    getCoinPublicKey: () => shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => shieldedSecretKeys.encryptionPublicKey,
    balanceTx: async (tx, ttl = new Date(Date.now() + 3_600_000)) => {
      const recipe = await wallet.balanceUnboundTransaction(tx, { shieldedSecretKeys, dustSecretKey }, { ttl });
      const signed = await wallet.signRecipe(recipe, payload => keystore.signData(payload));
      return wallet.finalizeRecipe(signed);
    },
    submitTx: tx => wallet.submitTransaction(tx),
  };
  const initial = await firstValueFrom(wallet.unshielded.state.pipe(timeout(30_000)));
  const address = UnshieldedAddress.codec.encode('preprod', initial.address).toString();
  if (address !== expectedAddress) throw new Error('Derived wallet address mismatch');
  const saveState = async () => {
    const [shielded, dust, unshielded] = await Promise.all([
      wallet.shielded.serializeState(), wallet.dust.serializeState(), wallet.unshielded.serializeState(),
    ]);
    await writeCheckpoint(checkpointFile, { network: 'preprod', address, shielded, dust, unshielded });
  };
  return { wallet, provider, address, keystore, shieldedSecretKeys, dustSecretKey, env, saveState };
}
