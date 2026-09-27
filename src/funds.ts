// Dust registration flow adapted from example-bboard; Copyright (C) Midnight
// Foundation. SPDX-License-Identifier: Apache-2.0. See THIRD-PARTY-NOTICES.md.
import { firstValueFrom, filter, tap, timeout } from 'rxjs';
import type { buildWallet } from './wallet.ts';

export async function prepareFunds(client: Awaited<ReturnType<typeof buildWallet>>) {
  const { wallet, shieldedSecretKeys, dustSecretKey, keystore } = client;
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  console.log('Synchronizing dedicated Preprod wallet.');
  let lastProgress = 0;
  const state = await firstValueFrom(wallet.state().pipe(
    tap(s => {
      if (Date.now() - lastProgress < 10_000) return;
      lastProgress = Date.now();
      console.log(JSON.stringify({
        shieldedIndex: s.shielded.state.progress.appliedIndex.toString(),
        shieldedHead: s.shielded.state.progress.highestRelevantWalletIndex.toString(),
        dustIndex: s.dust.state.progress.appliedIndex.toString(),
        dustHead: s.dust.state.progress.highestRelevantWalletIndex.toString(),
        unshieldedSynced: s.unshielded.progress.isStrictlyComplete(),
      }));
    }),
    filter(s => s.shielded.state.progress.isStrictlyComplete()
      && s.unshielded.progress.isStrictlyComplete() && s.dust.state.progress.isStrictlyComplete()),
    // A fresh Preprod wallet replays the complete dust event history.
    timeout(3_600_000),
  ));
  await client.saveState();
  if (state.dust.balance(new Date()) > 0n) return;
  if (!state.unshielded.availableCoins.length) {
    throw new Error(`Free faucet funding required for ${client.address}. Complete the faucet UI before deploying.`);
  }
  const coins = state.unshielded.availableCoins.filter(coin => !coin.meta.registeredForDustGeneration);
  if (coins.length) {
    const dust = await wallet.dust.waitForSyncedState();
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      coins, keystore.getPublicKey(), payload => keystore.signData(payload), dust.address,
    );
    const txId = await wallet.submitTransaction(await wallet.finalizeRecipe(recipe));
    console.log(`Preprod dust registration submitted: ${txId}`);
  }
  console.log('Waiting for usable test-network dust.');
  await firstValueFrom(wallet.state().pipe(filter(s => s.dust.balance(new Date()) > 0n), timeout(600_000)));
}
